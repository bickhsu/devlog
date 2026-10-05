mod common;

use common::TestDataDir;
use devlog_desktop_lib::persistence::contexts::{self, ContextError, ContextRecord};
use devlog_desktop_lib::persistence::Database;
use rusqlite::Connection;

fn create(database: &Database, parent: Option<&ContextRecord>, name: &str) -> ContextRecord {
    contexts::create(database, parent.map(|context| context.id.as_str()), name)
        .expect("create context")
}

fn find(database: &Database, id: &str) -> ContextRecord {
    contexts::find(database, id)
        .unwrap()
        .expect("context exists")
}

fn active_names(database: &Database) -> Vec<String> {
    contexts::list(database, false)
        .unwrap()
        .into_iter()
        .map(|context| context.name)
        .collect()
}

fn set_references(connection: &Connection, current: &str, main: &str, quick: &str) {
    connection
        .execute("UPDATE app_state SET current_context_id = ?1", [current])
        .unwrap();
    connection
        .execute(
            "INSERT INTO capture_drafts (surface, content, context_id, updated_at)
             VALUES ('main', 'main draft', ?1, 0), ('quick-capture', '  quick\n', ?2, 0)",
            [main, quick],
        )
        .unwrap();
}

fn references(connection: &Connection) -> (Option<String>, Vec<(String, Option<String>)>) {
    let current = connection
        .query_row("SELECT current_context_id FROM app_state", [], |row| {
            row.get(0)
        })
        .unwrap();
    let mut statement = connection
        .prepare("SELECT content, context_id FROM capture_drafts ORDER BY surface")
        .unwrap();
    let drafts = statement
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    (current, drafts)
}

#[test]
fn creates_root_and_child_contexts_with_uuid_v7_ids() {
    let database = TestDataDir::new().open();

    let work = create(&database, None, "  Work  ");
    let devlog = create(&database, Some(&work), "開發日誌");

    assert_eq!(work.name, "Work");
    assert_eq!(work.parent_id, None);
    assert_eq!(devlog.parent_id.as_deref(), Some(work.id.as_str()));
    assert_eq!(work.created_at, work.updated_at);
    assert_eq!(work.deleted_at, None);
    for id in [&work.id, &devlog.id] {
        let uuid = uuid::Uuid::parse_str(id).expect("id is a UUID");
        assert_eq!(uuid.get_version_num(), 7);
    }
    assert_eq!(find(&database, &devlog.id), devlog);
}

#[test]
fn rejects_blank_names_and_path_separators() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");

    for name in ["", " \t\n", "/", "Work / DevLog"] {
        assert!(matches!(
            contexts::create(&database, None, name),
            Err(ContextError::NameInvalid)
        ));
        assert!(matches!(
            contexts::rename(&database, &work.id, name),
            Err(ContextError::NameInvalid)
        ));
    }
    assert_eq!(active_names(&database), ["Work"]);
}

#[test]
fn active_sibling_names_are_unique_ignoring_ascii_case() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");
    let home = create(&database, None, "Home");

    assert!(matches!(
        contexts::create(&database, None, " work "),
        Err(ContextError::NameConflict)
    ));
    assert!(matches!(
        contexts::rename(&database, &home.id, "WORK"),
        Err(ContextError::NameConflict)
    ));

    // Different parents, a case-only rename of itself, and archived names are fine.
    create(&database, Some(&work), "Home");
    assert_eq!(
        contexts::rename(&database, &work.id, "WORK").unwrap().name,
        "WORK"
    );
    contexts::archive(&database, &home.id).unwrap();
    create(&database, None, "home");
}

#[test]
fn rejects_missing_or_archived_targets() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");

    assert!(matches!(
        contexts::create(&database, Some("missing"), "Child"),
        Err(ContextError::NotFound)
    ));
    assert!(matches!(
        contexts::rename(&database, "missing", "Name"),
        Err(ContextError::NotFound)
    ));
    assert!(matches!(
        contexts::archive(&database, "missing"),
        Err(ContextError::NotFound)
    ));

    contexts::archive(&database, &work.id).unwrap();
    assert!(matches!(
        contexts::create(&database, Some(&work.id), "Child"),
        Err(ContextError::Archived)
    ));
    assert!(matches!(
        contexts::rename(&database, &work.id, "Old work"),
        Err(ContextError::Archived)
    ));
}

#[test]
fn rename_keeps_identity_and_creation_time() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");
    let child = create(&database, Some(&work), "DevLog");

    let renamed = contexts::rename(&database, &child.id, " Dev Log ").unwrap();

    assert_eq!(renamed.name, "Dev Log");
    assert_eq!(renamed.id, child.id);
    assert_eq!(renamed.parent_id, child.parent_id);
    assert_eq!(renamed.created_at, child.created_at);
    assert!(renamed.updated_at >= child.updated_at);
    assert_eq!(find(&database, &child.id), renamed);
}

#[test]
fn list_excludes_archived_unless_requested_and_find_keeps_history() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");
    create(&database, None, "Home");
    contexts::archive(&database, &work.id).unwrap();

    assert_eq!(active_names(&database), ["Home"]);
    let all: Vec<_> = contexts::list(&database, true)
        .unwrap()
        .into_iter()
        .map(|context| context.name)
        .collect();
    assert_eq!(all, ["Work", "Home"]);
    assert!(find(&database, &work.id).is_archived());
}

#[test]
fn archive_cascades_and_clears_references_but_keeps_history() {
    let data_dir = TestDataDir::new();
    let database = data_dir.open();
    let work = create(&database, None, "Work");
    let devlog = create(&database, Some(&work), "DevLog");
    let core = create(&database, Some(&devlog), "Core");
    let infra = create(&database, Some(&work), "Infra");
    let home = create(&database, None, "Home");
    let connection = data_dir.raw_connection();
    set_references(&connection, &core.id, &devlog.id, &home.id);
    connection
        .execute(
            "INSERT INTO entries (id, content, context_id, created_at, updated_at)
             VALUES ('e1', 'logged', ?1, 0, 0)",
            [&core.id],
        )
        .unwrap();

    contexts::archive(&database, &devlog.id).unwrap();

    let archived_devlog = find(&database, &devlog.id);
    let archived_core = find(&database, &core.id);
    assert!(archived_devlog.is_archived());
    assert_eq!(archived_core.deleted_at, archived_devlog.deleted_at);
    assert!(!find(&database, &work.id).is_archived());
    assert!(!find(&database, &infra.id).is_archived());
    assert_eq!(active_names(&database), ["Work", "Infra", "Home"]);

    let (current, drafts) = references(&connection);
    assert_eq!(current, None);
    assert_eq!(
        drafts,
        [
            ("main draft".to_owned(), None),
            ("  quick\n".to_owned(), Some(home.id.clone())),
        ]
    );
    let entry_context: String = connection
        .query_row(
            "SELECT context_id FROM entries WHERE id = 'e1'",
            [],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(entry_context, core.id);
}

#[test]
fn archiving_an_archived_context_is_a_no_op() {
    let database = TestDataDir::new().open();
    let work = create(&database, None, "Work");
    let devlog = create(&database, Some(&work), "DevLog");
    contexts::archive(&database, &devlog.id).unwrap();
    let archived = find(&database, &devlog.id);

    std::thread::sleep(std::time::Duration::from_millis(2));
    contexts::archive(&database, &devlog.id).unwrap();
    assert_eq!(find(&database, &devlog.id), archived);

    // A later parent archive leaves the earlier descendant timestamp alone.
    contexts::archive(&database, &work.id).unwrap();
    assert_eq!(find(&database, &devlog.id), archived);
    assert!(find(&database, &work.id).deleted_at > archived.deleted_at);
}

#[test]
fn failed_archive_rolls_back_every_change() {
    let data_dir = TestDataDir::new();
    let database = data_dir.open();
    let work = create(&database, None, "Work");
    let devlog = create(&database, Some(&work), "DevLog");
    let connection = data_dir.raw_connection();
    set_references(&connection, &devlog.id, &devlog.id, &work.id);
    // Fail the last statement of the archive transaction.
    connection
        .execute_batch(
            "CREATE TRIGGER fail_draft_update BEFORE UPDATE ON capture_drafts
             BEGIN SELECT RAISE(ABORT, 'injected failure'); END;",
        )
        .unwrap();
    let before = references(&connection);

    assert!(matches!(
        contexts::archive(&database, &work.id),
        Err(ContextError::Storage(_))
    ));

    assert!(!find(&database, &work.id).is_archived());
    assert!(!find(&database, &devlog.id).is_archived());
    assert_eq!(references(&connection), before);
}
