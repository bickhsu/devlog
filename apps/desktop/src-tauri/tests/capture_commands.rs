mod common;

use common::TestDataDir;
use devlog_desktop_lib::commands::capture::{self, CaptureInput};
use devlog_desktop_lib::commands::{CommandError, ErrorCode};
use devlog_desktop_lib::persistence::capture::CaptureSurface;
use devlog_desktop_lib::persistence::contexts;
use serde_json::json;

fn input(value: serde_json::Value) -> CaptureInput {
    serde_json::from_value(value).expect("deserialize capture input")
}

fn code(result: Result<impl std::fmt::Debug, CommandError>) -> ErrorCode {
    result.expect_err("command should fail").code
}

#[test]
fn capture_dtos_cross_ipc_as_camel_case_with_epoch_millis() {
    let database = TestDataDir::new().open();
    let devlog = contexts::create(&database, None, "DevLog").unwrap().id;

    let draft = capture::save_draft(
        &database,
        input(json!({ "surface": "quick-capture", "content": " raw ", "contextId": devlog })),
    )
    .unwrap();
    let value = serde_json::to_value(&draft).unwrap();
    assert_eq!(
        value,
        json!({
            "surface": "quick-capture",
            "content": " raw ",
            "contextId": devlog,
            "updatedAt": draft.updated_at,
        })
    );
    assert!(value["updatedAt"].is_i64());

    let entry = capture::submit_entry(
        &database,
        input(json!({ "surface": "quick-capture", "content": "done", "contextId": null })),
    )
    .unwrap();
    assert_eq!(
        serde_json::to_value(&entry).unwrap(),
        json!({
            "id": entry.id,
            "content": "done",
            "contextId": null,
            "createdAt": entry.created_at,
            "updatedAt": entry.updated_at,
            "deletedAt": null,
        })
    );
}

#[test]
fn commands_cover_the_draft_lifecycle() {
    let database = TestDataDir::new().open();
    let devlog = contexts::create(&database, None, "DevLog").unwrap().id;

    capture::save_draft(
        &database,
        input(json!({ "surface": "main", "content": "draft", "contextId": devlog })),
    )
    .unwrap();
    let draft = capture::find_draft(&database, CaptureSurface::Main)
        .unwrap()
        .expect("draft saved");
    assert_eq!(draft.content, "draft");

    capture::submit_entry(
        &database,
        input(json!({ "surface": "main", "content": "draft", "contextId": devlog })),
    )
    .unwrap();
    assert_eq!(
        capture::find_draft(&database, CaptureSurface::Main).unwrap(),
        None
    );
    assert_eq!(
        capture::default_context_id(&database).unwrap(),
        Some(devlog)
    );

    capture::discard_draft(&database, CaptureSurface::Main).unwrap();
}

#[test]
fn capture_input_rejects_unknown_surfaces() {
    let result = serde_json::from_value::<CaptureInput>(
        json!({ "surface": "sidebar", "content": "x", "contextId": null }),
    );
    assert!(result.is_err());
}

#[test]
fn capture_failures_cross_ipc_as_domain_codes() {
    let database = TestDataDir::new().open();
    let archived = contexts::create(&database, None, "Old").unwrap().id;
    contexts::archive(&database, &archived).unwrap();

    let empty = capture::submit_entry(
        &database,
        input(json!({ "surface": "main", "content": "  ", "contextId": null })),
    );
    assert_eq!(code(empty), ErrorCode::EmptyEntryContent);

    let archived = capture::save_draft(
        &database,
        input(json!({ "surface": "main", "content": "x", "contextId": archived })),
    );
    assert_eq!(code(archived), ErrorCode::ContextArchived);

    let missing = capture::submit_entry(
        &database,
        input(json!({ "surface": "main", "content": "x", "contextId": "missing" })),
    );
    assert_eq!(code(missing), ErrorCode::ContextNotFound);
}

#[test]
fn draft_storage_failures_report_draft_save_failed() {
    let database = TestDataDir::new().open();
    database
        .with_connection(|connection| {
            connection.execute_batch(
                "CREATE TEMP TRIGGER fail_draft_insert BEFORE INSERT ON capture_drafts
                 BEGIN SELECT RAISE(ABORT, 'injected failure'); END;",
            )?;
            Ok(())
        })
        .unwrap();

    let failed = capture::save_draft(
        &database,
        input(json!({ "surface": "main", "content": "x", "contextId": null })),
    );
    assert_eq!(
        serde_json::to_value(failed.unwrap_err()).unwrap(),
        json!({ "code": "DRAFT_SAVE_FAILED" })
    );
}
