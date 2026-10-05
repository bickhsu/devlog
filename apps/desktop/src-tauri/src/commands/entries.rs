//! Entry commands backing Core's `EntryRepository`. Each Tauri command is a
//! thin wrapper over a plain function so tests can call it with a temporary
//! `Database`.

use serde::Deserialize;
use tauri::{AppHandle, Runtime, State};

use super::capture::EntryDto;
use super::error::{CommandError, ErrorCode};
use crate::events::{self, Invalidation};
use crate::persistence::entries::{self, EntryError};
use crate::persistence::Database;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEntryInput {
    pub id: String,
    pub content: String,
    pub context_id: Option<String>,
}

impl From<EntryError> for CommandError {
    fn from(error: EntryError) -> Self {
        let code = match error {
            EntryError::NotFound => ErrorCode::EntryNotFound,
            EntryError::EmptyContent => ErrorCode::EmptyEntryContent,
            EntryError::ContextNotFound => ErrorCode::ContextNotFound,
            EntryError::ContextArchived => ErrorCode::ContextArchived,
            EntryError::Storage(error) => return error.into(),
        };
        Self::new(code)
    }
}

pub fn find(database: &Database, id: &str) -> Result<Option<EntryDto>, CommandError> {
    Ok(entries::find(database, id)?.map(EntryDto::from))
}

pub fn update(database: &Database, input: UpdateEntryInput) -> Result<EntryDto, CommandError> {
    let record = entries::update(
        database,
        &input.id,
        &input.content,
        input.context_id.as_deref(),
    )?;
    Ok(record.into())
}

/// `from` inclusive, `to` exclusive, both epoch milliseconds.
pub fn list_between(
    database: &Database,
    from: i64,
    to: i64,
) -> Result<Vec<EntryDto>, CommandError> {
    let records = entries::list_between(database, from, to)?;
    Ok(records.into_iter().map(EntryDto::from).collect())
}

pub fn list_by_context(
    database: &Database,
    context_id: &str,
    include_descendants: bool,
) -> Result<Vec<EntryDto>, CommandError> {
    let records = entries::list_by_context(database, context_id, include_descendants)?;
    Ok(records.into_iter().map(EntryDto::from).collect())
}

#[tauri::command]
pub fn get_entry(
    database: State<'_, Database>,
    id: String,
) -> Result<Option<EntryDto>, CommandError> {
    find(&database, &id)
}

#[tauri::command]
pub fn update_entry<R: Runtime>(
    app: AppHandle<R>,
    database: State<'_, Database>,
    input: UpdateEntryInput,
) -> Result<EntryDto, CommandError> {
    let entry = update(&database, input)?;
    events::emit(
        &app,
        &[Invalidation::Entries {
            entry_id: entry.id.clone(),
        }],
    );
    Ok(entry)
}

#[tauri::command]
pub fn list_entries_between(
    database: State<'_, Database>,
    from: i64,
    to: i64,
) -> Result<Vec<EntryDto>, CommandError> {
    list_between(&database, from, to)
}

#[tauri::command]
pub fn list_entries_by_context(
    database: State<'_, Database>,
    context_id: String,
    include_descendants: bool,
) -> Result<Vec<EntryDto>, CommandError> {
    list_by_context(&database, &context_id, include_descendants)
}
