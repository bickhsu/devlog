//! Entry reads and edits. Entries are created only by capture submission
//! (see `capture.rs`); editing changes content and context but never `id`,
//! `created_at`, or timeline position.

use std::fmt;

use rusqlite::{params, Connection, OptionalExtension, Row};

use super::capture::EntryRecord;
use super::clock::now_millis;
use super::contexts::{self, ContextError};
use super::database::Database;
use super::error::PersistenceError;

/// Expected edit failures, kept apart from storage failures so commands can
/// return a specific code instead of `STORAGE_UNAVAILABLE`.
#[derive(Debug)]
pub enum EntryError {
    NotFound,
    EmptyContent,
    ContextNotFound,
    ContextArchived,
    Storage(PersistenceError),
}

impl fmt::Display for EntryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => f.write_str("entry not found"),
            Self::EmptyContent => f.write_str("entry content is empty"),
            Self::ContextNotFound => f.write_str("context not found"),
            Self::ContextArchived => f.write_str("context is archived"),
            Self::Storage(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for EntryError {}

impl From<PersistenceError> for EntryError {
    fn from(error: PersistenceError) -> Self {
        Self::Storage(error)
    }
}

impl From<rusqlite::Error> for EntryError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Storage(error.into())
    }
}

const COLUMNS: &str = "id, content, context_id, created_at, updated_at, deleted_at";

/// Soft-deleted entries are treated as gone.
pub fn find(database: &Database, id: &str) -> Result<Option<EntryRecord>, PersistenceError> {
    database.with_connection(|connection| Ok(find_in(connection, id)?))
}

/// Replaces content and context in one immediate transaction. Keeping the
/// entry's current context is allowed even if it was archived since, so
/// fixing a typo never forces a context change; switching to a different
/// context requires an active one (or none).
pub fn update(
    database: &Database,
    id: &str,
    content: &str,
    context_id: Option<&str>,
) -> Result<EntryRecord, EntryError> {
    let content = normalize_content(content)?;

    database.with_transaction(|transaction| {
        let entry = find_in(transaction, id)?.ok_or(EntryError::NotFound)?;
        if context_id != entry.context_id.as_deref() {
            ensure_selectable(transaction, context_id)?;
        }

        // A clock set backwards must not make an edit predate its creation.
        let updated_at = now_millis().max(entry.created_at);
        transaction.execute(
            "UPDATE entries SET content = ?2, context_id = ?3, updated_at = ?4 WHERE id = ?1",
            params![id, content, context_id, updated_at],
        )?;
        Ok(EntryRecord {
            content: content.to_owned(),
            context_id: context_id.map(str::to_owned),
            updated_at,
            ..entry
        })
    })
}

/// Entries with `from <= created_at < to`, ordered by `(created_at, id)`.
pub fn list_between(
    database: &Database,
    from: i64,
    to: i64,
) -> Result<Vec<EntryRecord>, PersistenceError> {
    database.with_connection(|connection| {
        let mut statement = connection.prepare(&format!(
            "SELECT {COLUMNS} FROM entries
             WHERE deleted_at IS NULL AND created_at >= ?1 AND created_at < ?2
             ORDER BY created_at, id"
        ))?;
        let entries = statement
            .query_map(params![from, to], from_row)?
            .collect::<Result<_, _>>()?;
        Ok(entries)
    })
}

/// Entries of a context, archived or not, optionally with every descendant.
/// Ordered by `(created_at, id)` for a stable result; Core owns grouping.
/// An unknown context simply has no entries.
pub fn list_by_context(
    database: &Database,
    context_id: &str,
    include_descendants: bool,
) -> Result<Vec<EntryRecord>, PersistenceError> {
    if !contexts::is_canonical_uuid(context_id) {
        return Ok(Vec::new());
    }
    database.with_connection(|connection| {
        // `UNION` (not `UNION ALL`) stops on revisited rows, so a malformed
        // cycle cannot loop; `?2` limits the walk to the context itself.
        let mut statement = connection.prepare(&format!(
            "WITH RECURSIVE subtree (id) AS (
               SELECT ?1
               UNION
               SELECT contexts.id FROM contexts JOIN subtree ON contexts.parent_id = subtree.id
               WHERE ?2
             )
             SELECT {COLUMNS} FROM entries
             WHERE deleted_at IS NULL AND context_id IN subtree
             ORDER BY created_at, id"
        ))?;
        let entries = statement
            .query_map(params![context_id, include_descendants], from_row)?
            .collect::<Result<_, _>>()?;
        Ok(entries)
    })
}

/// Ids are generated as canonical UUIDs, so any other shape cannot name an
/// entry and is not found without a query.
fn find_in(connection: &Connection, id: &str) -> rusqlite::Result<Option<EntryRecord>> {
    if !contexts::is_canonical_uuid(id) {
        return Ok(None);
    }
    connection
        .query_row(
            &format!("SELECT {COLUMNS} FROM entries WHERE id = ?1 AND deleted_at IS NULL"),
            [id],
            from_row,
        )
        .optional()
}

/// Mirrors Core's `normalizeEntryContent`, like submission does.
fn normalize_content(content: &str) -> Result<&str, EntryError> {
    let content = content.trim_matches(contexts::is_js_whitespace);
    if content.is_empty() {
        return Err(EntryError::EmptyContent);
    }
    Ok(content)
}

fn ensure_selectable(connection: &Connection, context_id: Option<&str>) -> Result<(), EntryError> {
    let Some(context_id) = context_id else {
        return Ok(());
    };
    match contexts::require_active(connection, context_id) {
        Ok(_) => Ok(()),
        Err(ContextError::NotFound) => Err(EntryError::ContextNotFound),
        Err(ContextError::Archived) => Err(EntryError::ContextArchived),
        Err(ContextError::Storage(error)) => Err(EntryError::Storage(error)),
        Err(ContextError::NameInvalid | ContextError::NameConflict) => {
            unreachable!("require_active only reports lookup failures")
        }
    }
}

fn from_row(row: &Row<'_>) -> rusqlite::Result<EntryRecord> {
    Ok(EntryRecord {
        id: row.get(0)?,
        content: row.get(1)?,
        context_id: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        deleted_at: row.get(5)?,
    })
}
