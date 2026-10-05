mod common;

use common::TestDataDir;
use devlog_desktop_lib::persistence::capture::{self, CaptureSurface, EntryRecord};
use devlog_desktop_lib::persistence::entries::{self, EntryError};
use devlog_desktop_lib::persistence::{contexts, Database};
use rusqlite::params;

const MISSING_ID: &str = "0190f5c4-0000-7000-8000-000000000000";

fn create_context(database: &Database, parent_id: Option<&str>, name: &str) -> String {
    contexts::create(database, parent_id, name)
        .expect("create context")
        .id
}

fn submit(database: &Database, content: &str, context_id: Option<&str>) -> EntryRecord {
    capture::submit_entry(database, CaptureSurface::Main, content, context_id)
        .expect("submit entry")
}

/// Inserts directly so tests control `created_at` precisely.
fn insert_entry(database: &Database, id: &str, created_at: i64, context_id: Option<&str>) {
    database
        .with_connection(|connection| {
            connection.execute(
                "INSERT INTO entries (id, content, context_id, created_at, updated_at)
                 VALUES (?1, ?1, ?2, ?3, ?3)",
                params![id, context_id, created_at],
            )?;
            Ok(())
        })
        .unwrap();
}

fn soft_delete(database: &Database, id: &str) {
    database
        .with_connection(|connection| {
            connection.execute("UPDATE entries SET deleted_at = 1 WHERE id = ?1", [id])?;
            Ok(())
        })
        .unwrap();
}

fn uuid(n: u8) -> String {
    format!("0190f5c4-0000-7000-8000-0000000000{n:02x}")
}

fn ids(entries: &[EntryRecord]) -> Vec<&str> {
    entries.iter().map(|entry| entry.id.as_str()).collect()
}

#[test]
fn update_replaces_content_and_context_but_keeps_identity_and_position() {
    let database = TestDataDir::new().open();
    let devlog = create_context(&database, None, "DevLog");
    let original = submit(&database, "Fixd the bug", None);

    let updated = entries::update(
        &database,
        &original.id,
        "\n  Fixed the bug.\n  Added a test.  \n",
        Some(&devlog),
    )
    .unwrap();

    assert_eq!(updated.id, original.id);
    assert_eq!(updated.created_at, original.created_at);
    assert_eq!(updated.content, "Fixed the bug.\n  Added a test.");
    assert_eq!(updated.context_id.as_deref(), Some(devlog.as_str()));
    assert!(updated.updated_at >= original.updated_at);
    assert_eq!(
        entries::find(&database, &original.id).unwrap(),
        Some(updated)
    );
}

#[test]
fn update_keeps_an_archived_context_but_refuses_to_select_one() {
    let database = TestDataDir::new().open();
    let old = create_context(&database, None, "Old");
    let other = create_context(&database, None, "Other");
    let entry = submit(&database, "history", Some(&old));
    contexts::archive(&database, &old).unwrap();
    contexts::archive(&database, &other).unwrap();

    let kept = entries::update(&database, &entry.id, "history, edited", Some(&old)).unwrap();
    assert_eq!(kept.context_id.as_deref(), Some(old.as_str()));

    let error = entries::update(&database, &entry.id, "moved", Some(&other)).unwrap_err();
    assert!(matches!(error, EntryError::ContextArchived));

    let cleared = entries::update(&database, &entry.id, "unclassified", None).unwrap();
    assert_eq!(cleared.context_id, None);

    // Once moved off, the archived context cannot be chosen again.
    let error = entries::update(&database, &entry.id, "back", Some(&old)).unwrap_err();
    assert!(matches!(error, EntryError::ContextArchived));
}

#[test]
fn failed_updates_leave_the_entry_unchanged() {
    let database = TestDataDir::new().open();
    let entry = submit(&database, "keep me", None);

    let empty = entries::update(&database, &entry.id, " \n\t ", None).unwrap_err();
    assert!(matches!(empty, EntryError::EmptyContent));
    let missing_context = entries::update(&database, &entry.id, "x", Some(MISSING_ID)).unwrap_err();
    assert!(matches!(missing_context, EntryError::ContextNotFound));

    assert_eq!(entries::find(&database, &entry.id).unwrap(), Some(entry));
}

#[test]
fn missing_malformed_and_deleted_entries_are_not_found() {
    let database = TestDataDir::new().open();
    let entry = submit(&database, "soon deleted", None);
    soft_delete(&database, &entry.id);

    for id in [
        MISSING_ID,
        "not-a-uuid",
        &MISSING_ID.to_uppercase(),
        &entry.id,
    ] {
        assert_eq!(entries::find(&database, id).unwrap(), None, "{id}");
        let error = entries::update(&database, id, "x", None).unwrap_err();
        assert!(matches!(error, EntryError::NotFound), "{id}");
    }
}

#[test]
fn list_between_is_half_open_stable_and_skips_deleted() {
    let database = TestDataDir::new().open();
    insert_entry(&database, &uuid(4), 2_000, None);
    insert_entry(&database, &uuid(2), 1_000, None);
    insert_entry(&database, &uuid(1), 1_000, None);
    insert_entry(&database, &uuid(3), 999, None);
    insert_entry(&database, &uuid(5), 1_500, None);
    soft_delete(&database, &uuid(5));

    let listed = entries::list_between(&database, 1_000, 2_000).unwrap();

    assert_eq!(ids(&listed), [uuid(1), uuid(2)]);
    assert!(entries::list_between(&database, 2_000, 1_000)
        .unwrap()
        .is_empty());
}

#[test]
fn list_by_context_optionally_includes_archived_descendants() {
    let database = TestDataDir::new().open();
    let work = create_context(&database, None, "Work");
    let devlog = create_context(&database, Some(&work), "DevLog");
    let ui = create_context(&database, Some(&devlog), "UI");
    let personal = create_context(&database, None, "Personal");
    insert_entry(&database, &uuid(3), 3, Some(&ui));
    insert_entry(&database, &uuid(1), 1, Some(&work));
    insert_entry(&database, &uuid(2), 2, Some(&devlog));
    insert_entry(&database, &uuid(4), 4, Some(&personal));
    insert_entry(&database, &uuid(5), 5, None);
    insert_entry(&database, &uuid(6), 6, Some(&devlog));
    soft_delete(&database, &uuid(6));
    contexts::archive(&database, &devlog).unwrap();

    let direct = entries::list_by_context(&database, &work, false).unwrap();
    assert_eq!(ids(&direct), [uuid(1)]);

    let subtree = entries::list_by_context(&database, &work, true).unwrap();
    assert_eq!(ids(&subtree), [uuid(1), uuid(2), uuid(3)]);

    let archived = entries::list_by_context(&database, &devlog, true).unwrap();
    assert_eq!(ids(&archived), [uuid(2), uuid(3)]);

    for id in [MISSING_ID, "not-a-uuid"] {
        assert!(entries::list_by_context(&database, id, true)
            .unwrap()
            .is_empty());
    }
}
