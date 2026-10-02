use std::fmt;

/// Native persistence failure. Diagnostics stay in Rust logs; commands map
/// these to transport-safe codes before anything crosses into the webview.
#[derive(Debug)]
pub enum PersistenceError {
    /// The application-data directory could not be resolved or created.
    DataDirectory(String),
    /// A required connection setting (e.g. WAL) could not be applied.
    Configuration(String),
    Sqlite(rusqlite::Error),
    /// A migration failed and its transaction was rolled back.
    Migration {
        version: u32,
        source: rusqlite::Error,
    },
    /// The database was written by a newer DevLog build than this one.
    UnsupportedSchemaVersion {
        found: u32,
        latest: u32,
    },
}

impl fmt::Display for PersistenceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::DataDirectory(reason) => {
                write!(f, "application data directory unavailable: {reason}")
            }
            Self::Configuration(reason) => write!(f, "sqlite configuration failed: {reason}"),
            Self::Sqlite(error) => write!(f, "sqlite error: {error}"),
            Self::Migration { version, source } => {
                write!(f, "migration {version} failed: {source}")
            }
            Self::UnsupportedSchemaVersion { found, latest } => write!(
                f,
                "database schema version {found} is newer than supported version {latest}"
            ),
        }
    }
}

impl std::error::Error for PersistenceError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Sqlite(source) | Self::Migration { source, .. } => Some(source),
            Self::DataDirectory(_)
            | Self::Configuration(_)
            | Self::UnsupportedSchemaVersion { .. } => None,
        }
    }
}

impl From<rusqlite::Error> for PersistenceError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Sqlite(error)
    }
}
