use std::sync::Arc;

use devlog_desktop_lib::persistence::{CaptureError, CaptureSurface, Database};
use rusqlite::{params, Connection};
use tempfile::TempDir;

use CaptureSurface::{Main, QuickCapture};

/// Each test gets its own application-data directory; `open` again to
/// simulate an app restart.
struct TestApp {
    dir: TempDir,
}

impl TestApp {
    fn new() -> Self {
        Self {
            dir: TempDir::new().expect("create temp dir"),
        }
    }

    fn open(&self) -> Database {
        Database::open_in_dir(self.dir.path()).expect("open database")
    }
}

fn insert_context(database: &Database, id: &str, archived: bool) {
    database
        .with_connection(|connection| {
            connection.execute(
                "INSERT INTO contexts (id, name, created_at, updated_at, deleted_at)
                 VALUES (?1, ?1, 0, 0, ?2)",
                params![id, archived.then_some(1_i64)],
            )?;
            Ok(())
        })
        .unwrap();
}

fn entry_count(database: &Database) -> u32 {
    database
        .with_connection(|connection| {
            Ok(connection.query_row("SELECT count(*) FROM entries", [], |row| row.get(0))?)
        })
        .unwrap()
}

/// Makes a later statement inside submit fail, to prove earlier ones roll back.
fn fail_draft_deletes(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute_batch(
        "CREATE TEMP TRIGGER fail_draft_delete BEFORE DELETE ON capture_drafts
         BEGIN SELECT RAISE(ABORT, 'injected failure'); END;",
    )
}

#[test]
fn surfaces_keep_separate_raw_drafts_across_restart() {
    let app = TestApp::new();
    {
        let database = app.open();
        insert_context(&database, "devlog", false);
        let capture = database.capture();
        capture.save_draft(Main, "  \n", None).unwrap();
        capture
            .save_draft(QuickCapture, "first", Some("devlog"))
            .unwrap();
        capture
            .save_draft(QuickCapture, " second ", Some("devlog"))
            .unwrap();
    }

    let restarted = app.open();
    let capture = restarted.capture();
    let main = capture.draft(Main).unwrap().unwrap();
    let quick = capture.draft(QuickCapture).unwrap().unwrap();
    assert_eq!((main.content.as_str(), main.context_id), ("  \n", None));
    assert_eq!(quick.content, " second ");
    assert_eq!(quick.context_id.as_deref(), Some("devlog"));
}

#[test]
fn discard_is_idempotent_and_affects_only_its_surface() {
    let database = TestApp::new().open();
    let capture = database.capture();
    capture.save_draft(Main, "main", None).unwrap();
    capture.save_draft(QuickCapture, "quick", None).unwrap();

    capture.discard_draft(Main).unwrap();
    capture.discard_draft(Main).unwrap();

    assert_eq!(capture.draft(Main).unwrap(), None);
    assert_eq!(
        capture.draft(QuickCapture).unwrap().unwrap().content,
        "quick"
    );
}

#[test]
fn drafts_reject_unselectable_contexts_and_keep_the_previous_draft() {
    let database = TestApp::new().open();
    insert_context(&database, "archived", true);
    let capture = database.capture();
    let saved = capture.save_draft(Main, "keep", None).unwrap();

    assert!(matches!(
        capture.save_draft(Main, "lost", Some("missing")),
        Err(CaptureError::ContextNotFound)
    ));
    assert!(matches!(
        capture.save_draft(Main, "lost", Some("archived")),
        Err(CaptureError::ContextArchived)
    ));
    assert_eq!(capture.draft(Main).unwrap(), Some(saved));
}

#[test]
fn submit_creates_entry_sets_current_context_and_clears_only_its_draft() {
    let database = TestApp::new().open();
    insert_context(&database, "devlog", false);
    let capture = database.capture();
    capture
        .save_draft(QuickCapture, "draft", Some("devlog"))
        .unwrap();
    capture.save_draft(Main, "unfinished", None).unwrap();

    let entry = capture
        .submit_entry(QuickCapture, "\n  Shipped capture.  \n", Some("devlog"))
        .unwrap();

    assert_eq!(entry.content, "Shipped capture.");
    assert_eq!(entry.context_id.as_deref(), Some("devlog"));
    assert_eq!(entry.created_at, entry.updated_at);
    assert_eq!(entry.deleted_at, None);
    let id = uuid::Uuid::parse_str(&entry.id).expect("entry id is a UUID");
    assert_eq!(id.get_version_num(), 7);

    assert_eq!(entry_count(&database), 1);
    assert_eq!(
        capture.default_context_id().unwrap().as_deref(),
        Some("devlog")
    );
    assert_eq!(capture.draft(QuickCapture).unwrap(), None);
    assert_eq!(capture.draft(Main).unwrap().unwrap().content, "unfinished");
}

#[test]
fn submit_without_context_resets_the_current_context() {
    let database = TestApp::new().open();
    insert_context(&database, "devlog", false);
    let capture = database.capture();
    capture.submit_entry(Main, "first", Some("devlog")).unwrap();

    capture.submit_entry(Main, "second", None).unwrap();

    assert_eq!(capture.default_context_id().unwrap(), None);
}

#[test]
fn rejected_submissions_leave_entries_context_and_draft_unchanged() {
    let database = TestApp::new().open();
    insert_context(&database, "devlog", false);
    insert_context(&database, "archived", true);
    let capture = database.capture();
    capture.submit_entry(Main, "saved", Some("devlog")).unwrap();
    let draft = capture.save_draft(Main, "keep me", None).unwrap();

    assert!(matches!(
        capture.submit_entry(Main, " \t\n", None),
        Err(CaptureError::EmptyContent)
    ));
    assert!(matches!(
        capture.submit_entry(Main, "valid", Some("missing")),
        Err(CaptureError::ContextNotFound)
    ));
    assert!(matches!(
        capture.submit_entry(Main, "valid", Some("archived")),
        Err(CaptureError::ContextArchived)
    ));

    assert_eq!(entry_count(&database), 1);
    assert_eq!(
        capture.default_context_id().unwrap().as_deref(),
        Some("devlog")
    );
    assert_eq!(capture.draft(Main).unwrap(), Some(draft));
}

#[test]
fn submit_rolls_back_every_change_when_a_later_step_fails() {
    let database = TestApp::new().open();
    insert_context(&database, "devlog", false);
    let capture = database.capture();
    let draft = capture.save_draft(Main, "keep me", None).unwrap();
    database
        .with_connection(|connection| Ok(fail_draft_deletes(connection)?))
        .unwrap();

    assert!(matches!(
        capture.submit_entry(Main, "keep me", Some("devlog")),
        Err(CaptureError::Storage(_))
    ));

    assert_eq!(entry_count(&database), 0);
    assert_eq!(capture.default_context_id().unwrap(), None);
    assert_eq!(capture.draft(Main).unwrap(), Some(draft));
}

#[test]
fn concurrent_captures_on_both_surfaces_stay_consistent() {
    let database = Arc::new(TestApp::new().open());
    let submits: Vec<_> = (0..8)
        .map(|index| {
            let database = Arc::clone(&database);
            std::thread::spawn(move || {
                let capture = database.capture();
                capture
                    .submit_entry(Main, &format!("entry {index}"), None)
                    .unwrap();
                capture
                    .save_draft(QuickCapture, &format!("draft {index}"), None)
                    .unwrap();
            })
        })
        .collect();
    for submit in submits {
        submit.join().unwrap();
    }

    let capture = database.capture();
    assert_eq!(entry_count(&database), 8);
    assert_eq!(capture.draft(Main).unwrap(), None);
    assert!(capture
        .draft(QuickCapture)
        .unwrap()
        .unwrap()
        .content
        .starts_with("draft "));
}
