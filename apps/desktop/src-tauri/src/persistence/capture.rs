//! Capture drafts and entry submission. Each operation runs in one
//! transaction; submit creates the entry, updates the current context, and
//! clears the source draft together or not at all.

use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension, Transaction, TransactionBehavior};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

    fn parse(value: &str) -> rusqlite::Result<Self> {
        match value {
            "main" => Ok(Self::Main),
            "quick-capture" => Ok(Self::QuickCapture),
            other => Err(rusqlite::Error::InvalidColumnType(
                0,
                format!("surface {other}"),
                rusqlite::types::Type::Text,
            )),
        }
    }
}

/// Timestamps are Unix epoch milliseconds, matching the schema.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CaptureDraft {
    pub surface: CaptureSurface,
    pub content: String,
    pub context_id: Option<String>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Entry {
    pub id: String,
    pub content: String,
    pub context_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub deleted_at: Option<i64>,
}

/// Expected rejections stay distinct from storage failures so commands can
/// map each to its own transport code.
#[derive(Debug)]
pub enum CaptureError {
    EmptyContent,
    ContextNotFound,
    ContextArchived,
    Storage(PersistenceError),
}

impl From<rusqlite::Error> for CaptureError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Storage(error.into())
    }
}

/// Capture operations on the shared connection; get one from `Database::capture`.
pub struct CaptureStore<'a> {
    database: &'a Database,
}

impl Database {
    pub fn capture(&self) -> CaptureStore<'_> {
        CaptureStore { database: self }
    }
}

impl CaptureStore<'_> {
    /// The context preselected for new drafts; `None` until a submit sets one.
    pub fn default_context_id(&self) -> Result<Option<String>, PersistenceError> {
        self.database.with_connection(|connection| {
            Ok(connection.query_row(
                "SELECT current_context_id FROM app_state WHERE id = 1",
                [],
                |row| row.get(0),
            )?)
        })
    }

    pub fn draft(&self, surface: CaptureSurface) -> Result<Option<CaptureDraft>, PersistenceError> {
        self.database
            .with_connection(|connection| Ok(read_draft(connection, surface)?))
    }

    /// Stores raw content, including empty or whitespace-only text.
    pub fn save_draft(
        &self,
        surface: CaptureSurface,
        content: &str,
        context_id: Option<&str>,
    ) -> Result<CaptureDraft, CaptureError> {
        self.write(|transaction| {
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
            Ok(CaptureDraft {
                surface,
                content: content.to_owned(),
                context_id: context_id.map(str::to_owned),
                updated_at,
            })
        })
    }

    /// Idempotent; other surfaces' drafts are untouched.
    pub fn discard_draft(&self, surface: CaptureSurface) -> Result<(), PersistenceError> {
        self.database.with_connection(|connection| {
            connection.execute(
                "DELETE FROM capture_drafts WHERE surface = ?1",
                [surface.as_str()],
            )?;
            Ok(())
        })
    }

    /// Validates the payload, then atomically inserts the entry, sets the
    /// current context (including `None`), and deletes only this surface's
    /// draft. Any failure rolls back all three.
    pub fn submit_entry(
        &self,
        surface: CaptureSurface,
        content: &str,
        context_id: Option<&str>,
    ) -> Result<Entry, CaptureError> {
        // Core normalizes first; trimming again guards the write boundary.
        let content = content.trim();
        if content.is_empty() {
            return Err(CaptureError::EmptyContent);
        }

        self.write(|transaction| {
            ensure_selectable(transaction, context_id)?;
            let now = now_millis();
            let entry = Entry {
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

    /// Commits only if `operation` succeeds; dropping the transaction on an
    /// error rolls it back.
    fn write<T>(
        &self,
        operation: impl FnOnce(&Transaction) -> Result<T, CaptureError>,
    ) -> Result<T, CaptureError> {
        let mut outcome = None;
        self.database
            .with_connection(|connection| {
                let transaction =
                    connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
                let result = operation(&transaction);
                if result.is_ok() {
                    transaction.commit()?;
                }
                outcome = Some(result);
                Ok(())
            })
            .map_err(CaptureError::Storage)?;
        outcome.expect("write operation ran")
    }
}

fn read_draft(
    connection: &Connection,
    surface: CaptureSurface,
) -> rusqlite::Result<Option<CaptureDraft>> {
    connection
        .query_row(
            "SELECT surface, content, context_id, updated_at FROM capture_drafts WHERE surface = ?1",
            [surface.as_str()],
            |row| {
                Ok(CaptureDraft {
                    surface: CaptureSurface::parse(&row.get::<_, String>(0)?)?,
                    content: row.get(1)?,
                    context_id: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            },
        )
        .optional()
}

/// Captures may reference only an existing, active context (or none).
fn ensure_selectable(
    connection: &Connection,
    context_id: Option<&str>,
) -> Result<(), CaptureError> {
    let Some(context_id) = context_id else {
        return Ok(());
    };
    let deleted_at: Option<Option<i64>> = connection
        .query_row(
            "SELECT deleted_at FROM contexts WHERE id = ?1",
            [context_id],
            |row| row.get(0),
        )
        .optional()?;
    match deleted_at {
        None => Err(CaptureError::ContextNotFound),
        Some(Some(_)) => Err(CaptureError::ContextArchived),
        Some(None) => Ok(()),
    }
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |elapsed| elapsed.as_millis() as i64)
}
