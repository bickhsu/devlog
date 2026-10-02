use serde::Serialize;

use crate::persistence::PersistenceError;

/// Mirrors `DomainErrorCode` in `packages/core/src/domain/errors.ts`; keep
/// the serialized strings in sync so the Desktop adapter can rebuild a
/// `DomainError` without parsing messages.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    EmptyEntryContent,
    EntryNotFound,
    ContextNotFound,
    ContextArchived,
    ContextNameInvalid,
    ContextNameConflict,
    DraftSaveFailed,
    StorageUnavailable,
}

/// The only error shape that crosses IPC: `{ "code": "..." }`. It carries no
/// message, SQL, path, or driver detail by construction.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
pub struct CommandError {
    pub code: ErrorCode,
}

impl CommandError {
    pub const fn new(code: ErrorCode) -> Self {
        Self { code }
    }
}

/// Unclassified storage failures become `STORAGE_UNAVAILABLE`. Commands that
/// need a specific code (e.g. `DRAFT_SAVE_FAILED`) map before converting.
impl From<PersistenceError> for CommandError {
    fn from(error: PersistenceError) -> Self {
        eprintln!("[devlog] storage command failed: {error}");
        Self::new(ErrorCode::StorageUnavailable)
    }
}
