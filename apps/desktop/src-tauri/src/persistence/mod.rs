//! Native SQLite persistence. React never sees SQL, file paths, or driver
//! errors; it reaches this module only through Tauri commands.

mod capture;
mod clock;
pub mod contexts;
mod database;
mod error;
pub mod migrations;

pub use capture::{CaptureDraft, CaptureError, CaptureStore, CaptureSurface, Entry};
pub use database::{Database, BUSY_TIMEOUT, DATABASE_FILE_NAME};
pub use error::PersistenceError;
