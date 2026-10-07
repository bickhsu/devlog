//! Runs real commands through a mock Tauri app and records the invalidation
//! events each mutation broadcasts.

mod common;

use common::ipc::Harness;
use devlog_desktop_lib::events::{
    APP_STATE_CHANGED, CAPTURE_DRAFT_CHANGED, CONTEXTS_CHANGED, ENTRIES_CHANGED,
};
use serde_json::{json, Value};

fn event(name: &str, payload: Value) -> (String, Value) {
    (name.to_owned(), payload)
}

#[test]
fn draft_writes_invalidate_only_their_surface() {
    let harness = Harness::new();

    harness
        .invoke(
            "save_capture_draft",
            json!({ "input": { "surface": "main", "content": "typing", "contextId": null } }),
        )
        .unwrap();
    harness
        .invoke(
            "discard_capture_draft",
            json!({ "surface": "quick-capture" }),
        )
        .unwrap();

    assert_eq!(
        harness.take(),
        vec![
            event(CAPTURE_DRAFT_CHANGED, json!({ "surface": "main" })),
            event(CAPTURE_DRAFT_CHANGED, json!({ "surface": "quick-capture" })),
        ]
    );
}

#[test]
fn submit_invalidates_entries_source_draft_and_app_state() {
    let harness = Harness::new();

    let entry = harness
        .invoke(
            "submit_capture_entry",
            json!({ "input": { "surface": "quick-capture", "content": "done", "contextId": null } }),
        )
        .unwrap();

    assert_eq!(
        harness.take(),
        vec![
            event(ENTRIES_CHANGED, json!({ "entryId": entry["id"] })),
            event(CAPTURE_DRAFT_CHANGED, json!({ "surface": "quick-capture" })),
            event(APP_STATE_CHANGED, json!({})),
        ]
    );
}

#[test]
fn context_writes_invalidate_contexts() {
    let harness = Harness::new();

    let work = harness
        .invoke(
            "create_context",
            json!({ "input": { "parentId": null, "name": "Work" } }),
        )
        .unwrap();
    let devlog = harness
        .invoke(
            "create_context_path",
            json!({ "input": { "names": ["Work", "DevLog"] } }),
        )
        .unwrap();
    harness
        .invoke(
            "rename_context",
            json!({ "input": { "id": devlog["id"], "name": "Logbook" } }),
        )
        .unwrap();

    assert_eq!(
        harness.take(),
        vec![
            event(CONTEXTS_CHANGED, json!({ "contextId": work["id"] })),
            event(CONTEXTS_CHANGED, json!({ "contextId": devlog["id"] })),
            event(CONTEXTS_CHANGED, json!({ "contextId": devlog["id"] })),
        ]
    );
}

#[test]
fn archive_invalidates_every_reference_it_may_clear() {
    let harness = Harness::new();
    let work = harness
        .invoke(
            "create_context",
            json!({ "input": { "parentId": null, "name": "Work" } }),
        )
        .unwrap();
    harness.take();

    harness
        .invoke("archive_context", json!({ "id": work["id"] }))
        .unwrap();

    assert_eq!(
        harness.take(),
        vec![
            event(CONTEXTS_CHANGED, json!({ "contextId": work["id"] })),
            event(APP_STATE_CHANGED, json!({})),
            event(CAPTURE_DRAFT_CHANGED, json!({ "surface": "main" })),
            event(CAPTURE_DRAFT_CHANGED, json!({ "surface": "quick-capture" })),
        ]
    );
}

#[test]
fn failed_mutations_and_reads_emit_nothing() {
    let harness = Harness::new();

    let error = harness
        .invoke(
            "submit_capture_entry",
            json!({ "input": { "surface": "main", "content": "  ", "contextId": null } }),
        )
        .unwrap_err();
    assert_eq!(error, json!({ "code": "EMPTY_ENTRY_CONTENT" }));
    harness.take();

    let work = harness
        .invoke(
            "create_context",
            json!({ "input": { "parentId": null, "name": "Work" } }),
        )
        .unwrap();
    harness
        .invoke(
            "create_context",
            json!({ "input": { "parentId": null, "name": "Personal" } }),
        )
        .unwrap();
    harness.take();
    let missing = "0190f5c4-0000-7000-8000-000000000000";
    assert_eq!(
        harness.invoke(
            "create_context",
            json!({ "input": { "parentId": null, "name": "  " } }),
        ),
        Err(json!({ "code": "CONTEXT_NAME_INVALID" }))
    );
    assert_eq!(
        harness.invoke(
            "rename_context",
            json!({ "input": { "id": work["id"], "name": "Personal" } }),
        ),
        Err(json!({ "code": "CONTEXT_NAME_CONFLICT" }))
    );
    assert_eq!(
        harness.invoke("archive_context", json!({ "id": missing })),
        Err(json!({ "code": "CONTEXT_NOT_FOUND" }))
    );
    assert_eq!(
        harness.invoke(
            "save_capture_draft",
            json!({ "input": { "surface": "main", "content": "x", "contextId": missing } }),
        ),
        Err(json!({ "code": "CONTEXT_NOT_FOUND" }))
    );
    harness
        .invoke("list_contexts", json!({ "includeArchived": true }))
        .unwrap();
    harness
        .invoke("get_capture_draft", json!({ "surface": "main" }))
        .unwrap();

    assert_eq!(harness.take(), vec![]);
}
