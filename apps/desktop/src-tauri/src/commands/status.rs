use serde::Serialize;
use tauri::State;

use super::error::CommandError;
use crate::persistence::{migrations, Database};

/// Command DTOs serialize as camelCase and carry timestamps as epoch
/// milliseconds; the Desktop adapter converts them into Core models.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStatusDto {
    pub schema_version: u32,
}

/// Lets the webview confirm storage is ready without learning where it lives.
#[tauri::command]
pub fn get_database_status(
    database: State<'_, Database>,
) -> Result<DatabaseStatusDto, CommandError> {
    database_status(&database)
}

pub fn database_status(database: &Database) -> Result<DatabaseStatusDto, CommandError> {
    let schema_version =
        database.with_connection(|connection| migrations::schema_version(connection))?;

    Ok(DatabaseStatusDto { schema_version })
}
