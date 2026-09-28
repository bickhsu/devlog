use std::path::PathBuf;

use devlog_desktop_lib::commands::{database_status, CommandError, ErrorCode};
use devlog_desktop_lib::persistence::migrations::{Migration, MIGRATIONS};
use devlog_desktop_lib::persistence::{Database, PersistenceError, DATABASE_FILE_NAME};
use rusqlite::{params, Connection};
use tempfile::TempDir;

/// Each test gets its own throwaway application-data directory.
struct TestDataDir {
    dir: TempDir,
}

impl TestDataDir {
    fn new() -> Self {
        Self {
            dir: TempDir::new().expect("create temp dir"),
        }
    }

    fn database_path(&self) -> PathBuf {
        self.dir.path().join(DATABASE_FILE_NAME)
    }

    fn open(&self) -> Database {
        Database::open_in_dir(self.dir.path()).expect("open database")
    }

    /// Bypasses `Database` to inspect what actually landed on disk.
    fn raw_connection(&self) -> Connection {
        Connection::open(self.database_path()).expect("open raw connection")
    }
}

fn user_version(connection: &Connection) -> u32 {
    connection
        .pragma_query_value(None, "user_version", |row| row.get(0))
        .unwrap()
}

fn table_names(connection: &Connection) -> Vec<String> {
    let mut statement = connection
        .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
        .unwrap();
    statement
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap()
}

fn is_constraint_violation(result: rusqlite::Result<usize>) -> bool {
    matches!(
        result,
        Err(rusqlite::Error::SqliteFailure(error, _))
            if error.code == rusqlite::ErrorCode::ConstraintViolation
    )
}

fn insert_context(
    connection: &Connection,
    id: &str,
    parent_id: Option<&str>,
    name: &str,
) -> rusqlite::Result<usize> {
    connection.execute(
        "INSERT INTO contexts (id, parent_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, 0, 0)",
        params![id, parent_id, name],
    )
}

#[test]
fn fresh_database_applies_initial_schema_and_connection_settings() {
    let data_dir = TestDataDir::new();
    let database = data_dir.open();

    assert_eq!(database.schema_version(), 1);

    database
        .with_connection(|connection| {
            assert_eq!(user_version(connection), 1);
            assert_eq!(
                table_names(connection),
                ["app_state", "capture_drafts", "contexts", "entries"]
            );

            let foreign_keys: bool =
                connection.pragma_query_value(None, "foreign_keys", |row| row.get(0))?;
            let journal_mode: String =
                connection.pragma_query_value(None, "journal_mode", |row| row.get(0))?;
            let busy_timeout: i64 =
                connection.pragma_query_value(None, "busy_timeout", |row| row.get(0))?;
            assert!(foreign_keys);
            assert_eq!(journal_mode, "wal");
            assert_eq!(busy_timeout, 5_000);

            let current_context: Option<String> = connection.query_row(
                "SELECT current_context_id FROM app_state WHERE id = 1",
                [],
                |row| row.get(0),
            )?;
            assert_eq!(current_context, None);
            Ok(())
        })
        .unwrap();
}

#[test]
fn reopening_existing_database_keeps_data_without_rerunning_migrations() {
    let data_dir = TestDataDir::new();

    data_dir
        .open()
        .with_connection(|connection| {
            insert_context(connection, "ctx-1", None, "Work")?;
            connection.execute(
                "UPDATE app_state SET current_context_id = 'ctx-1' WHERE id = 1",
                [],
            )?;
            Ok(())
        })
        .unwrap();

    let reopened = data_dir.open();
    assert_eq!(reopened.schema_version(), 1);

    reopened
        .with_connection(|connection| {
            let (rows, current): (u32, Option<String>) = connection.query_row(
                "SELECT count(*), max(current_context_id) FROM app_state",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;
            assert_eq!(rows, 1, "seed row must not be inserted twice");
            assert_eq!(current.as_deref(), Some("ctx-1"));
            Ok(())
        })
        .unwrap();
}

#[test]
fn schema_enforces_foreign_keys() {
    let database = TestDataDir::new().open();

    database
        .with_connection(|connection| {
            assert!(is_constraint_violation(insert_context(
                connection,
                "child",
                Some("missing"),
                "Orphan"
            )));
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO entries (id, content, context_id, created_at, updated_at)
                 VALUES ('e1', 'note', 'missing', 0, 0)",
                [],
            )));
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO capture_drafts (surface, content, context_id, updated_at)
                 VALUES ('main', '', 'missing', 0)",
                [],
            )));
            assert!(is_constraint_violation(connection.execute(
                "UPDATE app_state SET current_context_id = 'missing'",
                [],
            )));
            Ok(())
        })
        .unwrap();
}

#[test]
fn active_sibling_context_names_are_unique_ignoring_ascii_case() {
    let database = TestDataDir::new().open();

    database
        .with_connection(|connection| {
            insert_context(connection, "root-a", None, "Work")?;
            assert!(is_constraint_violation(insert_context(
                connection, "root-b", None, "WORK"
            )));

            // Same name under a different parent is fine.
            insert_context(connection, "child", Some("root-a"), "Work")?;

            // Archiving frees the name for a new active sibling.
            connection.execute("UPDATE contexts SET deleted_at = 1 WHERE id = 'root-a'", [])?;
            insert_context(connection, "root-c", None, "work")?;
            Ok(())
        })
        .unwrap();
}

#[test]
fn schema_rejects_invalid_rows() {
    let database = TestDataDir::new().open();

    database
        .with_connection(|connection| {
            assert!(is_constraint_violation(insert_context(connection, "c1", None, " \t\n")));
            assert!(is_constraint_violation(insert_context(connection, "c2", None, "a/b")));
            assert!(is_constraint_violation(insert_context(connection, "c3", Some("c3"), "Self")));
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO entries (id, content, created_at, updated_at) VALUES ('e1', '  \n', 0, 0)",
                [],
            )));
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO capture_drafts (surface, content, updated_at) VALUES ('sidebar', 'x', 0)",
                [],
            )));
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO app_state (id, updated_at) VALUES (2, 0)",
                [],
            )));
            // STRICT tables reject values of the wrong storage class.
            assert!(is_constraint_violation(connection.execute(
                "INSERT INTO entries (id, content, created_at, updated_at) VALUES ('e2', 'x', 'today', 0)",
                [],
            )));
            Ok(())
        })
        .unwrap();
}

#[test]
fn drafts_preserve_empty_and_whitespace_content() {
    let database = TestDataDir::new().open();

    database
        .with_connection(|connection| {
            connection.execute(
                "INSERT INTO capture_drafts (surface, content, updated_at) VALUES ('main', '', 0)",
                [],
            )?;
            connection.execute(
                "INSERT INTO capture_drafts (surface, content, updated_at) VALUES ('quick-capture', '  \n', 0)",
                [],
            )?;
            let content: String = connection.query_row(
                "SELECT content FROM capture_drafts WHERE surface = 'quick-capture'",
                [],
                |row| row.get(0),
            )?;
            assert_eq!(content, "  \n");
            Ok(())
        })
        .unwrap();
}

#[test]
fn failed_migration_rolls_back_and_keeps_last_complete_schema() {
    let data_dir = TestDataDir::new();
    let broken = [
        MIGRATIONS[0],
        Migration {
            version: 2,
            sql: "CREATE TABLE partial (id TEXT PRIMARY KEY); INSERT INTO missing VALUES (1);",
        },
    ];

    let result = Database::open_with_migrations(&data_dir.database_path(), &broken);
    assert!(matches!(
        result,
        Err(PersistenceError::Migration { version: 2, .. })
    ));

    let connection = data_dir.raw_connection();
    assert_eq!(user_version(&connection), 1);
    assert!(!table_names(&connection).contains(&"partial".to_owned()));

    // The next launch with a fixed build migrates normally.
    assert_eq!(data_dir.open().schema_version(), 1);
}

#[test]
fn failed_first_migration_leaves_no_schema() {
    let data_dir = TestDataDir::new();
    let broken = [Migration {
        version: 1,
        sql: "CREATE TABLE contexts (id TEXT); SELECT * FROM missing;",
    }];

    assert!(Database::open_with_migrations(&data_dir.database_path(), &broken).is_err());

    let connection = data_dir.raw_connection();
    assert_eq!(user_version(&connection), 0);
    assert!(table_names(&connection).is_empty());
}

#[test]
fn database_from_newer_build_is_refused() {
    let data_dir = TestDataDir::new();
    data_dir.open();
    data_dir
        .raw_connection()
        .pragma_update(None, "user_version", 99)
        .unwrap();

    assert!(matches!(
        Database::open_in_dir(data_dir.dir.path()),
        Err(PersistenceError::UnsupportedSchemaVersion {
            found: 99,
            latest: 1
        })
    ));
}

#[test]
fn status_command_returns_camel_case_dto() {
    let database = TestDataDir::new().open();
    let status = database_status(&database).unwrap();

    assert_eq!(
        serde_json::to_value(status).unwrap(),
        serde_json::json!({ "schemaVersion": 1 })
    );
}

#[test]
fn storage_failures_cross_ipc_as_code_only() {
    let error: CommandError = PersistenceError::DataDirectory("/Users/secret/path".into()).into();

    assert_eq!(
        serde_json::to_value(error).unwrap(),
        serde_json::json!({ "code": "STORAGE_UNAVAILABLE" })
    );
}

#[test]
fn error_codes_match_core_domain_error_codes() {
    let core_errors = std::fs::read_to_string(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("../../../packages/core/src/domain/errors.ts"),
    )
    .expect("read core errors.ts");
    let core_block = core_errors
        .split("export const DomainErrorCode = {")
        .nth(1)
        .and_then(|rest| rest.split("} as const").next())
        .expect("DomainErrorCode block");
    let core_codes: Vec<&str> = core_block
        .lines()
        .filter_map(|line| line.split('\'').nth(1))
        .collect();

    let native_codes: Vec<String> = [
        ErrorCode::EmptyEntryContent,
        ErrorCode::EntryNotFound,
        ErrorCode::ContextNotFound,
        ErrorCode::ContextArchived,
        ErrorCode::ContextNameInvalid,
        ErrorCode::ContextNameConflict,
        ErrorCode::DraftSaveFailed,
        ErrorCode::StorageUnavailable,
    ]
    .into_iter()
    .map(|code| {
        serde_json::to_value(code)
            .unwrap()
            .as_str()
            .unwrap()
            .to_owned()
    })
    .collect();

    assert_eq!(native_codes, core_codes);
}
