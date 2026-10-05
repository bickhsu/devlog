//! Context storage. Every write runs in one immediate transaction so the
//! validation it performs (parent state, sibling names) holds at commit.

use std::fmt;

use rusqlite::{params, Connection, OptionalExtension, Row};
use uuid::Uuid;

use super::clock::now_millis;
use super::database::Database;
use super::error::PersistenceError;

/// A stored context. Archived contexts stay as history so entries keep
/// resolving their context and path. `deleted_at` is reserved for a future
/// delete action and is never set yet; such rows are treated as gone.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContextRecord {
    pub id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub archived_at: Option<i64>,
    pub deleted_at: Option<i64>,
}

impl ContextRecord {
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }

    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }
}

/// Expected context failures, kept apart from storage failures so commands
/// can return a specific code instead of `STORAGE_UNAVAILABLE`.
#[derive(Debug)]
pub enum ContextError {
    NotFound,
    Archived,
    NameInvalid,
    NameConflict,
    Storage(PersistenceError),
}

impl fmt::Display for ContextError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => f.write_str("context not found"),
            Self::Archived => f.write_str("context is archived"),
            Self::NameInvalid => f.write_str("context name is invalid"),
            Self::NameConflict => f.write_str("context name already exists among siblings"),
            Self::Storage(error) => error.fmt(f),
        }
    }
}

impl std::error::Error for ContextError {}

impl From<PersistenceError> for ContextError {
    fn from(error: PersistenceError) -> Self {
        Self::Storage(error)
    }
}

impl From<rusqlite::Error> for ContextError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Storage(error.into())
    }
}

const COLUMNS: &str = "id, parent_id, name, created_at, updated_at, archived_at, deleted_at";

/// The archived root plus every descendant, bound to `?1`. `UNION` (not
/// `UNION ALL`) stops on revisited rows, so a malformed cycle cannot loop.
macro_rules! with_subtree {
    ($statement:literal) => {
        concat!(
            "WITH RECURSIVE subtree (id) AS (
               SELECT ?1
               UNION
               SELECT contexts.id FROM contexts JOIN subtree ON contexts.parent_id = subtree.id
             ) ",
            $statement
        )
    };
}

pub fn find(database: &Database, id: &str) -> Result<Option<ContextRecord>, PersistenceError> {
    database.with_connection(|connection| Ok(find_in(connection, id)?))
}

/// Never includes deleted contexts. Ordered by creation for a stable result;
/// display ordering belongs to Core.
pub fn list(
    database: &Database,
    include_archived: bool,
) -> Result<Vec<ContextRecord>, PersistenceError> {
    database.with_connection(|connection| {
        let mut statement = connection.prepare(&format!(
            "SELECT {COLUMNS} FROM contexts
             WHERE deleted_at IS NULL AND (?1 OR archived_at IS NULL)
             ORDER BY created_at, id"
        ))?;
        let contexts = statement
            .query_map([include_archived], from_row)?
            .collect::<Result<_, _>>()?;
        Ok(contexts)
    })
}

pub fn create(
    database: &Database,
    parent_id: Option<&str>,
    name: &str,
) -> Result<ContextRecord, ContextError> {
    let name = normalize_name(name)?;

    database.with_transaction(|transaction| {
        if let Some(parent_id) = parent_id {
            require_active(transaction, parent_id)?;
        }
        ensure_unique_sibling(transaction, parent_id, name, None)?;
        Ok(insert_in(transaction, parent_id, name)?)
    })
}

/// `mkdir -p` for a root-first list of names: each segment reuses the active
/// sibling with the same name (ASCII case-insensitive) or is created under
/// the previous one. One transaction, so a failing segment leaves no new
/// ancestors behind. Returns the last segment.
pub fn create_path(database: &Database, names: &[String]) -> Result<ContextRecord, ContextError> {
    let names = names
        .iter()
        .map(|name| normalize_name(name))
        .collect::<Result<Vec<_>, _>>()?;
    if names.is_empty() {
        return Err(ContextError::NameInvalid);
    }

    database.with_transaction(|transaction| {
        let mut parent: Option<ContextRecord> = None;
        for name in names {
            let parent_id = parent.as_ref().map(|context| context.id.as_str());
            let existing = find_active_sibling(transaction, parent_id, name, None)?;
            let context = match existing {
                Some(context) => context,
                None => insert_in(transaction, parent_id, name)?,
            };
            parent = Some(context);
        }
        Ok(parent.expect("names is not empty"))
    })
}

/// Archived contexts are read-only history, so renaming one is refused.
pub fn rename(database: &Database, id: &str, name: &str) -> Result<ContextRecord, ContextError> {
    let name = normalize_name(name)?;

    database.with_transaction(|transaction| {
        let context = require_active(transaction, id)?;
        ensure_unique_sibling(transaction, context.parent_id.as_deref(), name, Some(id))?;

        let now = now_millis();
        transaction.execute(
            "UPDATE contexts SET name = ?2, updated_at = ?3 WHERE id = ?1",
            params![id, name, now],
        )?;
        Ok(ContextRecord {
            name: name.to_owned(),
            updated_at: now,
            ..context
        })
    })
}

/// Archives the context and its descendants in one transaction and clears
/// current/draft references into the subtree. Draft content and entry
/// `context_id`s are untouched so nothing typed or logged is lost.
/// Descendants archived earlier keep their original `archived_at`.
pub fn archive(database: &Database, id: &str) -> Result<(), ContextError> {
    database.with_transaction(|transaction| {
        let root = find_in(transaction, id)?
            .filter(|context| !context.is_deleted())
            .ok_or(ContextError::NotFound)?;
        if root.is_archived() {
            return Ok(());
        }

        let now = now_millis();
        transaction.execute(
            with_subtree!(
                "UPDATE contexts SET archived_at = ?2, updated_at = ?2
                 WHERE archived_at IS NULL AND deleted_at IS NULL AND id IN subtree"
            ),
            params![id, now],
        )?;
        transaction.execute(
            with_subtree!(
                "UPDATE app_state SET current_context_id = NULL, updated_at = ?2
                 WHERE current_context_id IN subtree"
            ),
            params![id, now],
        )?;
        transaction.execute(
            with_subtree!(
                "UPDATE capture_drafts SET context_id = NULL, updated_at = ?2
                 WHERE context_id IN subtree"
            ),
            params![id, now],
        )?;
        Ok(())
    })
}

/// Mirrors Core's `normalizeContextName` so the write boundary does not
/// depend on the caller having normalized.
fn normalize_name(name: &str) -> Result<&str, ContextError> {
    let name = name.trim();
    if name.is_empty() || name.contains('/') {
        return Err(ContextError::NameInvalid);
    }
    Ok(name)
}

/// Every id from the webview (find, parent, rename, archive) is looked up
/// here. Ids are generated as canonical lowercase hyphenated UUIDs, so any
/// other shape cannot name a context and is not found without a query.
fn find_in(connection: &Connection, id: &str) -> rusqlite::Result<Option<ContextRecord>> {
    if !is_canonical_uuid(id) {
        return Ok(None);
    }
    connection
        .query_row(
            &format!("SELECT {COLUMNS} FROM contexts WHERE id = ?1"),
            [id],
            from_row,
        )
        .optional()
}

/// Any UUID version is accepted so ids from a future sync source still work.
fn is_canonical_uuid(id: &str) -> bool {
    Uuid::try_parse(id).is_ok_and(|uuid| uuid.hyphenated().to_string() == id)
}

fn require_active(connection: &Connection, id: &str) -> Result<ContextRecord, ContextError> {
    let context = find_in(connection, id)?
        .filter(|context| !context.is_deleted())
        .ok_or(ContextError::NotFound)?;
    if context.is_archived() {
        return Err(ContextError::Archived);
    }
    Ok(context)
}

/// Checked first so a conflict maps to a specific error code instead of a
/// constraint violation from the index.
fn ensure_unique_sibling(
    connection: &Connection,
    parent_id: Option<&str>,
    name: &str,
    except_id: Option<&str>,
) -> Result<(), ContextError> {
    if find_active_sibling(connection, parent_id, name, except_id)?.is_some() {
        return Err(ContextError::NameConflict);
    }
    Ok(())
}

/// Same rule as the `contexts_active_sibling_name` index (NOCASE folds ASCII
/// only).
fn find_active_sibling(
    connection: &Connection,
    parent_id: Option<&str>,
    name: &str,
    except_id: Option<&str>,
) -> rusqlite::Result<Option<ContextRecord>> {
    connection
        .query_row(
            &format!(
                "SELECT {COLUMNS} FROM contexts
                 WHERE parent_id IS ?1 AND name = ?2 COLLATE NOCASE
                   AND archived_at IS NULL AND deleted_at IS NULL AND id IS NOT ?3"
            ),
            params![parent_id, name, except_id],
            from_row,
        )
        .optional()
}

/// Callers have already checked the parent and sibling names.
fn insert_in(
    connection: &Connection,
    parent_id: Option<&str>,
    name: &str,
) -> rusqlite::Result<ContextRecord> {
    let now = now_millis();
    let context = ContextRecord {
        id: Uuid::now_v7().to_string(),
        parent_id: parent_id.map(str::to_owned),
        name: name.to_owned(),
        created_at: now,
        updated_at: now,
        archived_at: None,
        deleted_at: None,
    };
    connection.execute(
        "INSERT INTO contexts (id, parent_id, name, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)",
        params![context.id, context.parent_id, context.name, now],
    )?;
    Ok(context)
}

fn from_row(row: &Row<'_>) -> rusqlite::Result<ContextRecord> {
    Ok(ContextRecord {
        id: row.get(0)?,
        parent_id: row.get(1)?,
        name: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        archived_at: row.get(5)?,
        deleted_at: row.get(6)?,
    })
}
