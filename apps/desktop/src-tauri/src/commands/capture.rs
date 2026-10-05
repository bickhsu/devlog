use serde::{Deserialize, Serialize};
use tauri::State;

use super::error::{CommandError, ErrorCode};
use crate::persistence::{CaptureDraft, CaptureError, CaptureSurface, Database, Entry};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureDraftDto {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
    pub updated_at: i64,
}

impl From<CaptureDraft> for CaptureDraftDto {
    fn from(draft: CaptureDraft) -> Self {
        Self {
            surface: draft.surface,
            content: draft.content,
            context_id: draft.context_id,
            updated_at: draft.updated_at,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryDto {
    pub id: String,
    pub content: String,
    pub context_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
}

impl From<Entry> for EntryDto {
    fn from(entry: Entry) -> Self {
        Self {
            id: entry.id,
            content: entry.content,
            context_id: entry.context_id,
            created_at: entry.created_at,
            updated_at: entry.updated_at,
            deleted_at: entry.deleted_at,
        }
    }
}

/// Payload for both saving a draft and submitting it as an entry.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureInput {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
}

#[tauri::command]
pub fn get_default_context_id(
    database: State<'_, Database>,
) -> Result<Option<String>, CommandError> {
    default_context_id(&database)
}

#[tauri::command]
pub fn get_capture_draft(
    database: State<'_, Database>,
    surface: CaptureSurface,
) -> Result<Option<CaptureDraftDto>, CommandError> {
    capture_draft(&database, surface)
}

#[tauri::command]
pub fn save_capture_draft(
    database: State<'_, Database>,
    input: CaptureInput,
) -> Result<CaptureDraftDto, CommandError> {
    save_draft(&database, input)
}

#[tauri::command]
pub fn discard_capture_draft(
    database: State<'_, Database>,
    surface: CaptureSurface,
) -> Result<(), CommandError> {
    discard_draft(&database, surface)
}

#[tauri::command]
pub fn submit_capture_entry(
    database: State<'_, Database>,
    input: CaptureInput,
) -> Result<EntryDto, CommandError> {
    submit_entry(&database, input)
}

pub fn default_context_id(database: &Database) -> Result<Option<String>, CommandError> {
    Ok(database.capture().default_context_id()?)
}

pub fn capture_draft(
    database: &Database,
    surface: CaptureSurface,
) -> Result<Option<CaptureDraftDto>, CommandError> {
    Ok(database.capture().draft(surface)?.map(Into::into))
}

/// Storage failures report `DRAFT_SAVE_FAILED` so the UI can say the draft,
/// not the whole app, is at risk.
pub fn save_draft(
    database: &Database,
    input: CaptureInput,
) -> Result<CaptureDraftDto, CommandError> {
    database
        .capture()
        .save_draft(input.surface, &input.content, input.context_id.as_deref())
        .map(Into::into)
        .map_err(|error| command_error(error, ErrorCode::DraftSaveFailed))
}

pub fn discard_draft(database: &Database, surface: CaptureSurface) -> Result<(), CommandError> {
    Ok(database.capture().discard_draft(surface)?)
}

pub fn submit_entry(database: &Database, input: CaptureInput) -> Result<EntryDto, CommandError> {
    database
        .capture()
        .submit_entry(input.surface, &input.content, input.context_id.as_deref())
        .map(Into::into)
        .map_err(|error| command_error(error, ErrorCode::StorageUnavailable))
}

fn command_error(error: CaptureError, storage_code: ErrorCode) -> CommandError {
    CommandError::new(match error {
        CaptureError::EmptyContent => ErrorCode::EmptyEntryContent,
        CaptureError::ContextNotFound => ErrorCode::ContextNotFound,
        CaptureError::ContextArchived => ErrorCode::ContextArchived,
        CaptureError::Storage(error) => {
            eprintln!("[devlog] capture command failed: {error}");
            storage_code
        }
    })
}
