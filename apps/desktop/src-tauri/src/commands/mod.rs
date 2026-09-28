//! Tauri command boundary. Every command returns `Result<Dto, CommandError>`
//! so the webview only ever receives camelCase DTOs or a typed error code.

mod error;
mod status;

pub use error::{CommandError, ErrorCode};
pub use status::{database_status, DatabaseStatusDto};

/// Single registration point for all commands exposed to the webview.
pub fn handler<R: tauri::Runtime>() -> impl Fn(tauri::ipc::Invoke<R>) -> bool + Send + Sync + 'static
{
    tauri::generate_handler![status::get_database_status]
}
