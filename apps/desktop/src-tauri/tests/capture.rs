mod common;

use std::sync::Arc;

use common::TestDataDir;
use devlog_desktop_lib::persistence::capture::{self, CaptureError, CaptureSurface};
use devlog_desktop_lib::persistence::contexts;
use devlog_desktop_lib::persistence::Database;

use CaptureSurface::{Main, QuickCapture};

fn create_context(database: &Database, name: &str) -> String {
    contexts::create(database, None, name)
        .expect("create context")
        .id
}

fn archived_context(database: &Database, name: &str) -> String {
    let id = create_context(database, name);
    contexts::archive(database, &id).expect("archive context");
    id
}

fn entry_count(database: &Database) -> u32 {
    database
        .with_connection(|connection| {
            Ok(connection.query_row("SELECT count(*) FROM entries", [], |row| row.get(0))?)
        })
        .unwrap()
}

#[test]
fn surfaces_keep_separate_raw_drafts_across_restart() {
    let data_dir = TestDataDir::new();
    let devlog = {
        let database = data_dir.open();
        let devlog = create_context(&database, "DevLog");
        capture::save_draft(&database, Main, "  \n", None).unwrap();
        capture::save_draft(&database, QuickCapture, "first", Some(&devlog)).unwrap();
        capture::save_draft(&database, QuickCapture, " second ", Some(&devlog)).unwrap();
        devlog
    };

    let restarted = data_dir.open();
    let main = capture::find_draft(&restarted, Main).unwrap().unwrap();
    let quick = capture::find_draft(&restarted, QuickCapture)
        .unwrap()
        .unwrap();
    assert_eq!((main.content.as_str(), main.context_id), ("  \n", None));
    assert_eq!(quick.content, " second ");
    assert_eq!(quick.context_id, Some(devlog));
}

#[test]
fn discard_is_idempotent_and_affects_only_its_surface() {
    let database = TestDataDir::new().open();
    capture::save_draft(&database, Main, "main", None).unwrap();
    capture::save_draft(&database, QuickCapture, "quick", None).unwrap();

    capture::discard_draft(&database, Main).unwrap();
    capture::discard_draft(&database, Main).unwrap();

    assert_eq!(capture::find_draft(&database, Main).unwrap(), None);
    let quick = capture::find_draft(&database, QuickCapture)
        .unwrap()
        .unwrap();
    assert_eq!(quick.content, "quick");
}

#[test]
fn drafts_reject_unselectable_contexts_and_keep_the_previous_draft() {
    let database = TestDataDir::new().open();
    let archived = archived_context(&database, "Old");
    let saved = capture::save_draft(&database, Main, "keep", None).unwrap();

    for missing in ["not-a-uuid", "01890a5d-ac96-774b-bcce-b302099a8057"] {
        assert!(matches!(
            capture::save_draft(&database, Main, "lost", Some(missing)),
            Err(CaptureError::ContextNotFound)
        ));
    }
    assert!(matches!(
        capture::save_draft(&database, Main, "lost", Some(&archived)),
        Err(CaptureError::ContextArchived)
    ));
    assert_eq!(capture::find_draft(&database, Main).unwrap(), Some(saved));
}

#[test]
fn submit_creates_entry_sets_current_context_and_clears_only_its_draft() {
    let database = TestDataDir::new().open();
    let devlog = create_context(&database, "DevLog");
    capture::save_draft(&database, QuickCapture, "draft", Some(&devlog)).unwrap();
    capture::save_draft(&database, Main, "unfinished", None).unwrap();

    let entry = capture::submit_entry(
        &database,
        QuickCapture,
        "\n  Shipped capture.  \n",
        Some(&devlog),
    )
    .unwrap();

    assert_eq!(entry.content, "Shipped capture.");
    assert_eq!(entry.context_id.as_deref(), Some(devlog.as_str()));
    assert_eq!(entry.created_at, entry.updated_at);
    assert_eq!(entry.deleted_at, None);
    let id = uuid::Uuid::parse_str(&entry.id).expect("entry id is a UUID");
    assert_eq!(id.get_version_num(), 7);

    assert_eq!(entry_count(&database), 1);
    assert_eq!(
        capture::default_context_id(&database).unwrap(),
        Some(devlog)
    );
    assert_eq!(capture::find_draft(&database, QuickCapture).unwrap(), None);
    let main = capture::find_draft(&database, Main).unwrap().unwrap();
    assert_eq!(main.content, "unfinished");
}

#[test]
fn submit_trims_the_same_whitespace_as_core() {
    let database = TestDataDir::new().open();

    let entry = capture::submit_entry(&database, Main, "\u{FEFF} note \u{85}", None).unwrap();
    assert_eq!(entry.content, "note \u{85}");
    assert!(matches!(
        capture::submit_entry(&database, Main, "\u{FEFF}\u{3000}", None),
        Err(CaptureError::EmptyContent)
    ));
}

#[test]
fn submit_without_context_resets_the_current_context() {
    let database = TestDataDir::new().open();
    let devlog = create_context(&database, "DevLog");
    capture::submit_entry(&database, Main, "first", Some(&devlog)).unwrap();

    capture::submit_entry(&database, Main, "second", None).unwrap();

    assert_eq!(capture::default_context_id(&database).unwrap(), None);
}

#[test]
fn rejected_submissions_leave_entries_context_and_draft_unchanged() {
    let database = TestDataDir::new().open();
    let devlog = create_context(&database, "DevLog");
    let archived = archived_context(&database, "Old");
    capture::submit_entry(&database, Main, "saved", Some(&devlog)).unwrap();
    let draft = capture::save_draft(&database, Main, "keep me", None).unwrap();

    assert!(matches!(
        capture::submit_entry(&database, Main, " \t\n", None),
        Err(CaptureError::EmptyContent)
    ));
    assert!(matches!(
        capture::submit_entry(&database, Main, "valid", Some("missing")),
        Err(CaptureError::ContextNotFound)
    ));
    assert!(matches!(
        capture::submit_entry(&database, Main, "valid", Some(&archived)),
        Err(CaptureError::ContextArchived)
    ));

    assert_eq!(entry_count(&database), 1);
    assert_eq!(
        capture::default_context_id(&database).unwrap(),
        Some(devlog)
    );
    assert_eq!(capture::find_draft(&database, Main).unwrap(), Some(draft));
}

#[test]
fn submit_rolls_back_every_change_when_a_later_step_fails() {
    let database = TestDataDir::new().open();
    let devlog = create_context(&database, "DevLog");
    let draft = capture::save_draft(&database, Main, "keep me", None).unwrap();
    // Make the last statement of submit fail, after the entry insert and
    // current-context update have already run.
    database
        .with_connection(|connection| {
            connection.execute_batch(
                "CREATE TEMP TRIGGER fail_draft_delete BEFORE DELETE ON capture_drafts
                 BEGIN SELECT RAISE(ABORT, 'injected failure'); END;",
            )?;
            Ok(())
        })
        .unwrap();

    assert!(matches!(
        capture::submit_entry(&database, Main, "keep me", Some(&devlog)),
        Err(CaptureError::Storage(_))
    ));

    assert_eq!(entry_count(&database), 0);
    assert_eq!(capture::default_context_id(&database).unwrap(), None);
    assert_eq!(capture::find_draft(&database, Main).unwrap(), Some(draft));
}

#[test]
fn concurrent_captures_on_both_surfaces_stay_consistent() {
    let database = Arc::new(TestDataDir::new().open());
    let writers: Vec<_> = (0..8)
        .map(|index| {
            let database = Arc::clone(&database);
            std::thread::spawn(move || {
                capture::submit_entry(&database, Main, &format!("entry {index}"), None).unwrap();
                capture::save_draft(&database, QuickCapture, &format!("draft {index}"), None)
                    .unwrap();
            })
        })
        .collect();
    for writer in writers {
        writer.join().unwrap();
    }

    assert_eq!(entry_count(&database), 8);
    assert_eq!(capture::find_draft(&database, Main).unwrap(), None);
    let quick = capture::find_draft(&database, QuickCapture)
        .unwrap()
        .unwrap();
    assert!(quick.content.starts_with("draft "));
}
