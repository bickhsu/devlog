use std::path::Path;
use std::sync::{Mutex, MutexGuard, PoisonError};
use std::time::{Duration, Instant};

use rusqlite::{Connection, Transaction, TransactionBehavior};

use super::error::PersistenceError;
use super::migrations::{self, Migration};

pub const DATABASE_FILE_NAME: &str = "devlog.sqlite3";

/// Bounded wait for a competing writer before surfacing SQLITE_BUSY.
pub const BUSY_TIMEOUT: Duration = Duration::from_secs(5);

/// The single SQLite connection owned by the native side. A `Database` only
/// exists once every migration has succeeded, so holding one guarantees a
/// complete schema.
pub struct Database {
    connection: Mutex<Connection>,
    schema_version: u32,
}

impl Database {
    /// Opens `<data_dir>/devlog.sqlite3`, creating the directory if needed.
    pub fn open_in_dir(data_dir: &Path) -> Result<Self, PersistenceError> {
        std::fs::create_dir_all(data_dir)
            .map_err(|error| PersistenceError::DataDirectory(error.to_string()))?;
        Self::open(&data_dir.join(DATABASE_FILE_NAME))
    }

    pub fn open(path: &Path) -> Result<Self, PersistenceError> {
        Self::open_with_migrations(path, migrations::MIGRATIONS)
    }

    /// Exposed so tests can exercise migration failure with custom steps.
    pub fn open_with_migrations(
        path: &Path,
        migrations: &[Migration],
    ) -> Result<Self, PersistenceError> {
        let mut connection = Connection::open(path)?;
        configure(&connection)?;
        let schema_version = migrations::migrate(&mut connection, migrations)?;

        Ok(Self {
            connection: Mutex::new(connection),
            schema_version,
        })
    }

    pub fn schema_version(&self) -> u32 {
        self.schema_version
    }

    /// Runs `operation` with exclusive access to the connection. Use
    /// `connection.transaction()` inside for multi-statement atomic writes.
    pub fn with_connection<T>(
        &self,
        operation: impl FnOnce(&mut Connection) -> Result<T, PersistenceError>,
    ) -> Result<T, PersistenceError> {
        operation(&mut self.lock())
    }

    /// Runs `operation` in a `BEGIN IMMEDIATE` transaction that commits only
    /// when it returns `Ok`. Taking the write lock up front means checks made
    /// inside (e.g. sibling-name conflicts) still hold at commit, even against
    /// another app instance. Any `Err` drops the transaction and rolls back.
    pub fn with_transaction<T, E>(
        &self,
        operation: impl FnOnce(&Transaction<'_>) -> Result<T, E>,
    ) -> Result<T, E>
    where
        E: From<PersistenceError>,
    {
        let mut connection = self.lock();
        let transaction = connection
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(PersistenceError::from)?;
        let value = operation(&transaction)?;
        transaction.commit().map_err(PersistenceError::from)?;
        Ok(value)
    }

    fn lock(&self) -> MutexGuard<'_, Connection> {
        // A panic mid-operation drops any open transaction, which rolls it
        // back, so the connection is still consistent after poisoning.
        self.connection
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
    }
}

fn configure(connection: &Connection) -> Result<(), PersistenceError> {
    connection.busy_timeout(BUSY_TIMEOUT)?;
    // Must be set outside a transaction and per connection.
    connection.pragma_update(None, "foreign_keys", true)?;
    let journal_mode = enable_wal(connection)?;

    if !journal_mode.eq_ignore_ascii_case("wal") {
        return Err(PersistenceError::Configuration(format!(
            "journal_mode is {journal_mode}, expected wal"
        )));
    }

    Ok(())
}

/// Switching a fresh database to WAL needs an exclusive lock, and SQLite
/// reports SQLITE_BUSY at once (without the busy handler) when another
/// instance is opening the same file, so retry within BUSY_TIMEOUT.
fn enable_wal(connection: &Connection) -> Result<String, PersistenceError> {
    let started = Instant::now();
    loop {
        match connection.pragma_update_and_check(None, "journal_mode", "wal", |row| row.get(0)) {
            Err(rusqlite::Error::SqliteFailure(error, _))
                if error.code == rusqlite::ErrorCode::DatabaseBusy
                    && started.elapsed() < BUSY_TIMEOUT =>
            {
                std::thread::sleep(Duration::from_millis(10));
            }
            result => return Ok(result?),
        }
    }
}
