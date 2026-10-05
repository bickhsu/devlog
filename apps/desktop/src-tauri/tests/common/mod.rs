//! Shared temp-database harness for integration tests.

// Each test crate compiles this module separately and uses a different subset.
#![allow(dead_code)]

use std::path::{Path, PathBuf};

use devlog_desktop_lib::persistence::{Database, DATABASE_FILE_NAME};
use rusqlite::Connection;
use tempfile::TempDir;

/// Each test gets its own throwaway application-data directory.
pub struct TestDataDir {
    dir: TempDir,
}

impl TestDataDir {
    pub fn new() -> Self {
        Self {
            dir: TempDir::new().expect("create temp dir"),
        }
    }

    pub fn path(&self) -> &Path {
        self.dir.path()
    }

    pub fn database_path(&self) -> PathBuf {
        self.dir.path().join(DATABASE_FILE_NAME)
    }

    pub fn open(&self) -> Database {
        Database::open_in_dir(self.dir.path()).expect("open database")
    }

    /// Bypasses `Database` to inspect what actually landed on disk.
    pub fn raw_connection(&self) -> Connection {
        Connection::open(self.database_path()).expect("open raw connection")
    }
}
