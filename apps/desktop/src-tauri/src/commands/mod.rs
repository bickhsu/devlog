//! Tauri command boundary. Every command returns `Result<Dto, CommandError>`
//! so the webview only ever receives camelCase DTOs or a typed error code.

pub mod capture;
pub mod contexts;
pub mod entries;
mod error;
mod status;

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
        entries::get_entry,
        entries::update_entry,
        entries::list_entries_between,
        entries::list_entries_by_context,
    ]
}
