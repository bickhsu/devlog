//! Cross-window invalidation events. After a mutation commits, the command
//! that ran it broadcasts which kinds of data changed; every window then
//! reloads the authoritative data through its repositories. Payloads only
//! name what changed, never the new data, so an event cannot become a second
//! data source that drifts from SQLite.
//!
//! Mirrors `apps/desktop/src/application/invalidation-events.ts`; keep the
//! event names and payload fields in sync.

use serde::Serialize;
use tauri::{Emitter, Runtime};

use crate::persistence::capture::CaptureSurface;

pub const ENTRIES_CHANGED: &str = "entries-changed";
pub const CONTEXTS_CHANGED: &str = "contexts-changed";
pub const CAPTURE_DRAFT_CHANGED: &str = "capture-draft-changed";
pub const APP_STATE_CHANGED: &str = "app-state-changed";

/// One kind of data a committed mutation changed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Invalidation {
    /// An entry was created or edited.
    Entries { entry_id: String },
    /// Contexts were created, renamed, or archived. `context_id` is the
    /// context the command targeted (the last segment of a created path).
    Contexts { context_id: String },
    /// A surface's draft was saved, discarded, submitted, or had its
    /// context cleared by an archive.
    CaptureDraft { surface: CaptureSurface },
    /// The default context for new drafts changed.
    AppState,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct EntriesChangedPayload<'a> {
    entry_id: &'a str,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ContextsChangedPayload<'a> {
    context_id: &'a str,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct CaptureDraftChangedPayload {
    surface: CaptureSurface,
}

#[derive(Debug, Clone, Serialize)]
struct EmptyPayload {}

impl Invalidation {
    pub fn event_name(&self) -> &'static str {
        match self {
            Self::Entries { .. } => ENTRIES_CHANGED,
            Self::Contexts { .. } => CONTEXTS_CHANGED,
            Self::CaptureDraft { .. } => CAPTURE_DRAFT_CHANGED,
            Self::AppState => APP_STATE_CHANGED,
        }
    }

    fn emit_with<R: Runtime>(&self, emitter: &impl Emitter<R>) -> tauri::Result<()> {
        let name = self.event_name();
        match self {
            Self::Entries { entry_id } => emitter.emit(name, EntriesChangedPayload { entry_id }),
            Self::Contexts { context_id } => {
                emitter.emit(name, ContextsChangedPayload { context_id })
            }
            Self::CaptureDraft { surface } => {
                emitter.emit(name, CaptureDraftChangedPayload { surface: *surface })
            }
            Self::AppState => emitter.emit(name, EmptyPayload {}),
        }
    }
}

/// Broadcasts to every window, including the one that ran the mutation, so
/// all views follow the same reload path. The mutation has already
/// committed, so a failed emit is logged instead of failing the command.
pub fn emit<R: Runtime>(emitter: &impl Emitter<R>, invalidations: &[Invalidation]) {
    for invalidation in invalidations {
        if let Err(error) = invalidation.emit_with(emitter) {
            eprintln!(
                "[devlog] failed to emit {}: {error}",
                invalidation.event_name()
            );
        }
    }
}
