//! Capture commands backing Core's `AppStateRepository`. Each Tauri command
//! is a thin wrapper over a plain function so tests can call it with a
//! temporary `Database`.

use serde::{Deserialize, Serialize};
use tauri::State;

use super::error::{CommandError, ErrorCode};
use crate::persistence::capture::{
    self, CaptureDraftRecord, CaptureError, CaptureSurface, EntryRecord,
};
use crate::persistence::Database;

/// Mirrors `CaptureDraftDto` in `apps/desktop/src/adapters/tauri/dto.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureDraftDto {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
    pub updated_at: i64,
}

impl From<CaptureDraftRecord> for CaptureDraftDto {
    fn from(record: CaptureDraftRecord) -> Self {
        Self {
            surface: record.surface,
            content: record.content,
            context_id: record.context_id,
            updated_at: record.updated_at,
        }
    }
}

/// Mirrors `EntryDto` in `apps/desktop/src/adapters/tauri/dto.ts`.
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

impl From<EntryRecord> for EntryDto {
    fn from(record: EntryRecord) -> Self {
        Self {
            id: record.id,
            content: record.content,
            context_id: record.context_id,
            created_at: record.created_at,
            updated_at: record.updated_at,
            deleted_at: record.deleted_at,
        }
    }
}

/// Payload for both saving a draft and submitting it as an entry.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureInput {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
}

impl From<CaptureError> for CommandError {
    fn from(error: CaptureError) -> Self {
        let code = match error {
            CaptureError::EmptyContent => ErrorCode::EmptyEntryContent,
            CaptureError::ContextNotFound => ErrorCode::ContextNotFound,
            CaptureError::ContextArchived => ErrorCode::ContextArchived,
            CaptureError::Storage(error) => return error.into(),
        };
        Self::new(code)
    }
}

pub fn default_context_id(database: &Database) -> Result<Option<String>, CommandError> {
    Ok(capture::default_context_id(database)?)
}

pub fn find_draft(
    database: &Database,
    surface: CaptureSurface,
) -> Result<Option<CaptureDraftDto>, CommandError> {
    Ok(capture::find_draft(database, surface)?.map(CaptureDraftDto::from))
}

/// Storage failures report `DRAFT_SAVE_FAILED` so the UI can say the draft,
/// not the whole app, is at risk.
pub fn save_draft(
    database: &Database,
    input: CaptureInput,
) -> Result<CaptureDraftDto, CommandError> {
    match capture::save_draft(
        database,
        input.surface,
        &input.content,
        input.context_id.as_deref(),
    ) {
        Ok(record) => Ok(record.into()),
        Err(CaptureError::Storage(error)) => {
            eprintln!("[devlog] draft save failed: {error}");
            Err(CommandError::new(ErrorCode::DraftSaveFailed))
        }
        Err(error) => Err(error.into()),
    }
}

pub fn discard_draft(database: &Database, surface: CaptureSurface) -> Result<(), CommandError> {
    Ok(capture::discard_draft(database, surface)?)
}

pub fn submit_entry(database: &Database, input: CaptureInput) -> Result<EntryDto, CommandError> {
    let record = capture::submit_entry(
        database,
        input.surface,
        &input.content,
        input.context_id.as_deref(),
    )?;
    Ok(record.into())
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
    find_draft(&database, surface)
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
