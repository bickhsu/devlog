use rusqlite::Connection;

use super::error::PersistenceError;

/// One forward-only schema step. `version` must equal its 1-based position.
#[derive(Debug, Clone, Copy)]
pub struct Migration {
    pub version: u32,
    pub sql: &'static str,
}

/// Append new migrations; never edit one that has shipped.
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
    let current = schema_version(connection)?;

    if current > latest {
        return Err(PersistenceError::UnsupportedSchemaVersion {
            found: current,
            latest,
        });
    }

    for migration in migrations.iter().filter(|m| m.version > current) {
        apply(connection, migration).map_err(|source| PersistenceError::Migration {
            version: migration.version,
            source,
        })?;
    }

    Ok(latest)
}

fn apply(connection: &mut Connection, migration: &Migration) -> rusqlite::Result<()> {
    let transaction = connection.transaction()?;
    transaction.execute_batch(migration.sql)?;
    transaction.pragma_update(None, "user_version", migration.version)?;
    transaction.commit()
}
