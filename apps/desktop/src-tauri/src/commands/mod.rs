//! Tauri command boundary. Every command returns `Result<Dto, CommandError>`
//! so the webview only ever receives camelCase DTOs or a typed error code.

mod capture;
pub mod contexts;
mod error;
mod status;

pub use capture::{
    capture_draft, default_context_id, discard_draft, save_draft, submit_entry, CaptureDraftDto,
    CaptureInput, EntryDto,
};
pub use error::{CommandError, ErrorCode};
pub use status::{database_status, DatabaseStatusDto};

/// Single registration point for all commands exposed to the webview.
pub fn handler<R: tauri::Runtime>() -> impl Fn(tauri::ipc::Invoke<R>) -> bool + Send + Sync + 'static
{
    tauri::generate_handler![
        status::get_database_status,
        contexts::find_context,
        contexts::list_contexts,
        contexts::create_context,
        contexts::create_context_path,
        contexts::rename_context,
        contexts::archive_context,
        capture::get_default_context_id,
        capture::get_capture_draft,
        capture::save_capture_draft,
        capture::discard_capture_draft,
        capture::submit_capture_entry,
    ]
}
