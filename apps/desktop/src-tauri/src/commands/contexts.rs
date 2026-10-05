//! Context commands backing Core's `ContextRepository`. Each Tauri command
//! is a thin wrapper over a plain function so tests can call it with a
//! temporary `Database`.

use serde::{Deserialize, Serialize};
use tauri::State;

use super::error::{CommandError, ErrorCode};
use crate::persistence::contexts::{self, ContextError, ContextRecord};
use crate::persistence::Database;

/// Mirrors `ContextDto` in `apps/desktop/src/adapters/tauri/dto.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextDto {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub archived_at: Option<i64>,
    pub deleted_at: Option<i64>,
}

impl From<ContextRecord> for ContextDto {
    fn from(record: ContextRecord) -> Self {
        Self {
            id: record.id,
            parent_id: record.parent_id,
            name: record.name,
            created_at: record.created_at,
            updated_at: record.updated_at,
            archived_at: record.archived_at,
            deleted_at: record.deleted_at,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateContextInput {
    pub parent_id: Option<String>,
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateContextPathInput {
    pub names: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameContextInput {
    pub id: String,
    pub name: String,
}

impl From<ContextError> for CommandError {
    fn from(error: ContextError) -> Self {
        let code = match error {
            ContextError::NotFound => ErrorCode::ContextNotFound,
            ContextError::Archived => ErrorCode::ContextArchived,
            ContextError::NameInvalid => ErrorCode::ContextNameInvalid,
            ContextError::NameConflict => ErrorCode::ContextNameConflict,
            ContextError::Storage(error) => return error.into(),
        };
        Self::new(code)
    }
}

pub fn find(database: &Database, id: &str) -> Result<Option<ContextDto>, CommandError> {
    Ok(contexts::find(database, id)?.map(ContextDto::from))
}

pub fn list(database: &Database, include_archived: bool) -> Result<Vec<ContextDto>, CommandError> {
    let records = contexts::list(database, include_archived)?;
    Ok(records.into_iter().map(ContextDto::from).collect())
}

pub fn create(database: &Database, input: CreateContextInput) -> Result<ContextDto, CommandError> {
    Ok(contexts::create(database, input.parent_id.as_deref(), &input.name)?.into())
}

pub fn create_path(
    database: &Database,
    input: CreateContextPathInput,
) -> Result<ContextDto, CommandError> {
    Ok(contexts::create_path(database, &input.names)?.into())
}

pub fn rename(database: &Database, input: RenameContextInput) -> Result<ContextDto, CommandError> {
    Ok(contexts::rename(database, &input.id, &input.name)?.into())
}

pub fn archive(database: &Database, id: &str) -> Result<(), CommandError> {
    Ok(contexts::archive(database, id)?)
}

#[tauri::command]
pub fn find_context(
    database: State<'_, Database>,
    id: String,
) -> Result<Option<ContextDto>, CommandError> {
    find(&database, &id)
}

#[tauri::command]
pub fn list_contexts(
    database: State<'_, Database>,
    include_archived: bool,
) -> Result<Vec<ContextDto>, CommandError> {
    list(&database, include_archived)
}

#[tauri::command]
pub fn create_context(
    database: State<'_, Database>,
    input: CreateContextInput,
) -> Result<ContextDto, CommandError> {
    create(&database, input)
}

#[tauri::command]
pub fn create_context_path(
    database: State<'_, Database>,
    input: CreateContextPathInput,
) -> Result<ContextDto, CommandError> {
    create_path(&database, input)
}

#[tauri::command]
pub fn rename_context(
    database: State<'_, Database>,
    input: RenameContextInput,
) -> Result<ContextDto, CommandError> {
    rename(&database, input)
}

#[tauri::command]
pub fn archive_context(database: State<'_, Database>, id: String) -> Result<(), CommandError> {
    archive(&database, &id)
}
