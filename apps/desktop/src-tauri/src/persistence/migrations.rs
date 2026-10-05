use rusqlite::{Connection, TransactionBehavior};

use super::error::PersistenceError;

/// One forward-only schema step. `version` must equal its 1-based position.
#[derive(Debug, Clone, Copy)]
pub struct Migration {
    pub version: u32,
    pub sql: &'static str,
}

/// Append new migrations; never edit one that has shipped. No release has
/// shipped yet, so 0001 is still the editable initial schema.
pub const MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    sql: include_str!("migrations/0001_initial.sql"),
}];

pub fn latest_version(migrations: &[Migration]) -> u32 {
    migrations.last().map_or(0, |migration| migration.version)
}

pub fn schema_version(connection: &Connection) -> Result<u32, PersistenceError> {
    Ok(connection.pragma_query_value(None, "user_version", |row| row.get(0))?)
}

/// Applies pending migrations in order, each in its own transaction together
/// with its `user_version` bump, so a failure leaves the last complete schema.
pub fn migrate(
    connection: &mut Connection,
    migrations: &[Migration],
) -> Result<u32, PersistenceError> {
    debug_assert!(migrations
        .iter()
        .enumerate()
        .all(|(index, migration)| migration.version as usize == index + 1));

    let latest = latest_version(migrations);

    for migration in migrations {
        apply(connection, migration, latest)?;
    }

    // Also refuses a newer database when there is nothing left to apply.
    ensure_supported(schema_version(connection)?, latest)?;
    Ok(latest)
}

/// Takes the write lock before reading the version, so a second app instance
/// starting at the same time waits and then skips steps the first applied.
fn apply(
    connection: &mut Connection,
    migration: &Migration,
    latest: u32,
) -> Result<(), PersistenceError> {
    let failed = |source| PersistenceError::Migration {
        version: migration.version,
        source,
    };

    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(failed)?;
    let current = schema_version(&transaction)?;
    ensure_supported(current, latest)?;

    if current >= migration.version {
        return Ok(());
    }

    transaction.execute_batch(migration.sql).map_err(failed)?;
    transaction
        .pragma_update(None, "user_version", migration.version)
        .map_err(failed)?;
    transaction.commit().map_err(failed)
}

fn ensure_supported(found: u32, latest: u32) -> Result<(), PersistenceError> {
    if found > latest {
        return Err(PersistenceError::UnsupportedSchemaVersion { found, latest });
    }
    Ok(())
}
