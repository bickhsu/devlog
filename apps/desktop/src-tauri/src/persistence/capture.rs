//! Capture drafts and entry submission. Each write runs in one immediate
//! transaction; submit creates the entry, updates the current context, and
//! clears the source draft together or not at all.

use std::fmt;

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::clock::now_millis;
use super::contexts::{self, ContextError};
use super::database::Database;
use super::error::PersistenceError;

/// Mirrors Core's `CaptureSurface`; each surface owns at most one draft.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CaptureSurface {
    Main,
    QuickCapture,
}

impl CaptureSurface {
    fn as_str(self) -> &'static str {
        match self {
            Self::Main => "main",
            Self::QuickCapture => "quick-capture",
        }
    }
}

/// A stored draft. Content is raw, so it may be empty or whitespace-only.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureDraftRecord {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryRecord {
    pub id: String,
    pub content: String,
    pub context_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
}

/// Expected capture failures, kept apart from storage failures so commands
/// can return a specific code instead of `STORAGE_UNAVAILABLE`.
#[derive(Debug)]
pub enum CaptureError {
    EmptyContent,
    ContextNotFound,
    ContextArchived,
    Storage(PersistenceError),
}

impl fmt::Display for CaptureError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyContent => f.write_str("entry content is empty"),
            Self::ContextNotFound => f.write_str("context not found"),
            Self::ContextArchived => f.write_str("context is archived"),
            Self::Storage(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for CaptureError {}

impl From<PersistenceError> for CaptureError {
    fn from(error: PersistenceError) -> Self {
        Self::Storage(error)
    }
}

impl From<rusqlite::Error> for CaptureError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Storage(error.into())
    }
}

/// The context preselected for new drafts; `None` until a submit sets one.
pub fn default_context_id(database: &Database) -> Result<Option<String>, PersistenceError> {
    database.with_connection(|connection| {
        Ok(connection.query_row(
            "SELECT current_context_id FROM app_state WHERE id = 1",
            [],
            |row| row.get(0),
        )?)
    })
}

pub fn find_draft(
    database: &Database,
    surface: CaptureSurface,
) -> Result<Option<CaptureDraftRecord>, PersistenceError> {
    database.with_connection(|connection| {
        Ok(connection
            .query_row(
                "SELECT content, context_id, updated_at FROM capture_drafts WHERE surface = ?1",
                [surface.as_str()],
                |row| {
                    Ok(CaptureDraftRecord {
                        surface,
                        content: row.get(0)?,
                        context_id: row.get(1)?,
                        updated_at: row.get(2)?,
                    })
                },
            )
            .optional()?)
    })
}

/// Stores raw content as typed; only the context must be selectable.
pub fn save_draft(
    database: &Database,
    surface: CaptureSurface,
    content: &str,
    context_id: Option<&str>,
) -> Result<CaptureDraftRecord, CaptureError> {
    database.with_transaction(|transaction| {
        ensure_selectable(transaction, context_id)?;
        let updated_at = now_millis();
        transaction.execute(
            "INSERT INTO capture_drafts (surface, content, context_id, updated_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT (surface) DO UPDATE SET
               content = excluded.content,
               context_id = excluded.context_id,
               updated_at = excluded.updated_at",
            params![surface.as_str(), content, context_id, updated_at],
        )?;
        Ok(CaptureDraftRecord {
            surface,
            content: content.to_owned(),
            context_id: context_id.map(str::to_owned),
            updated_at,
        })
    })
}

/// Idempotent; other surfaces' drafts are untouched.
pub fn discard_draft(database: &Database, surface: CaptureSurface) -> Result<(), PersistenceError> {
    database.with_connection(|connection| {
        connection.execute(
            "DELETE FROM capture_drafts WHERE surface = ?1",
            [surface.as_str()],
        )?;
        Ok(())
    })
}

/// Validates the payload, then inserts the entry, sets the current context
/// (including `None`), and deletes only this surface's draft. One
/// transaction, so any failure rolls back all three.
pub fn submit_entry(
    database: &Database,
    surface: CaptureSurface,
    content: &str,
    context_id: Option<&str>,
) -> Result<EntryRecord, CaptureError> {
    let content = normalize_content(content)?;

    database.with_transaction(|transaction| {
        ensure_selectable(transaction, context_id)?;
        let now = now_millis();
        let entry = EntryRecord {
            id: Uuid::now_v7().to_string(),
            content: content.to_owned(),
            context_id: context_id.map(str::to_owned),
            created_at: now,
            updated_at: now,
            deleted_at: None,
        };
        transaction.execute(
            "INSERT INTO entries (id, content, context_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?4)",
            params![entry.id, entry.content, entry.context_id, now],
        )?;
        transaction.execute(
            "UPDATE app_state SET current_context_id = ?1, updated_at = ?2 WHERE id = 1",
            params![context_id, now],
        )?;
        transaction.execute(
            "DELETE FROM capture_drafts WHERE surface = ?1",
            [surface.as_str()],
        )?;
        Ok(entry)
    })
}

/// Mirrors Core's `normalizeEntryContent` so the write boundary does not
/// depend on the caller having normalized.
fn normalize_content(content: &str) -> Result<&str, CaptureError> {
    let content = content.trim_matches(contexts::is_js_whitespace);
    if content.is_empty() {
        return Err(CaptureError::EmptyContent);
    }
    Ok(content)
}

/// Captures follow the same rule as context writes: an existing, active
/// context, or none.
fn ensure_selectable(
    connection: &Connection,
    context_id: Option<&str>,
) -> Result<(), CaptureError> {
    let Some(context_id) = context_id else {
        return Ok(());
    };
    match contexts::require_active(connection, context_id) {
        Ok(_) => Ok(()),
        Err(ContextError::NotFound) => Err(CaptureError::ContextNotFound),
        Err(ContextError::Archived) => Err(CaptureError::ContextArchived),
        Err(ContextError::Storage(error)) => Err(CaptureError::Storage(error)),
        Err(ContextError::NameInvalid | ContextError::NameConflict) => {
            unreachable!("require_active only reports lookup failures")
        }
    }
}
