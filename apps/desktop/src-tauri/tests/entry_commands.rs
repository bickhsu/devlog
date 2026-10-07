//! Entry commands over real IPC, so argument names and DTO shapes match what
//! `TauriEntryRepository` sends and expects.

mod common;

use common::ipc::Harness;
use devlog_desktop_lib::events::ENTRIES_CHANGED;
use devlog_desktop_lib::persistence::contexts;
use serde_json::{json, Value};

fn submit(harness: &Harness, content: &str, context_id: Value) -> Value {
    harness
        .invoke(
            "submit_capture_entry",
            json!({ "input": { "surface": "main", "content": content, "contextId": context_id } }),
        )
        .unwrap()
}

#[test]
fn update_entry_returns_the_edited_dto_and_invalidates_entries() {
    let harness = Harness::new();
    let devlog = contexts::create(&harness.database(), None, "DevLog")
        .unwrap()
        .id;
    let entry = submit(&harness, "draft", Value::Null);
    harness.take();

    let updated = harness
        .invoke(
            "update_entry",
            json!({ "input": { "id": entry["id"], "content": " final ", "contextId": devlog } }),
        )
        .unwrap();

    assert_eq!(
        updated,
        json!({
            "id": entry["id"],
            "content": "final",
            "contextId": devlog,
            "createdAt": entry["createdAt"],
            "updatedAt": updated["updatedAt"],
            "deletedAt": null,
        })
    );
    assert_eq!(
        harness.take(),
        vec![(
            ENTRIES_CHANGED.to_owned(),
            json!({ "entryId": entry["id"] })
        )]
    );
    assert_eq!(
        harness
            .invoke("get_entry", json!({ "id": entry["id"] }))
            .unwrap(),
        updated
    );
}

#[test]
fn update_entry_errors_are_typed_codes() {
    let harness = Harness::new();
    let archived = contexts::create(&harness.database(), None, "Archived")
        .unwrap()
        .id;
    contexts::archive(&harness.database(), &archived).unwrap();
    let entry = submit(&harness, "keep", Value::Null);
    harness.take();
    let update = |id: &Value, content: &str, context_id: Value| {
        harness.invoke(
            "update_entry",
            json!({ "input": { "id": id, "content": content, "contextId": context_id } }),
        )
    };

    assert_eq!(
        update(
            &json!("0190f5c4-0000-7000-8000-000000000000"),
            "x",
            Value::Null
        ),
        Err(json!({ "code": "ENTRY_NOT_FOUND" }))
    );
    assert_eq!(
        update(&entry["id"], "   ", Value::Null),
        Err(json!({ "code": "EMPTY_ENTRY_CONTENT" }))
    );
    assert_eq!(
        update(
            &entry["id"],
            "x",
            json!("0190f5c4-0000-7000-8000-000000000000")
        ),
        Err(json!({ "code": "CONTEXT_NOT_FOUND" }))
    );
    assert_eq!(
        update(&entry["id"], "x", json!(archived)),
        Err(json!({ "code": "CONTEXT_ARCHIVED" }))
    );
    assert_eq!(harness.take(), vec![]);
    assert_eq!(
        harness.invoke("get_entry", json!({ "id": entry["id"] })),
        Ok(entry)
    );
}

#[test]
fn list_commands_accept_the_adapter_argument_names() {
    let harness = Harness::new();
    let work = contexts::create(&harness.database(), None, "Work")
        .unwrap()
        .id;
    let devlog = contexts::create(&harness.database(), Some(&work), "DevLog")
        .unwrap()
        .id;
    let first = submit(&harness, "first", json!(work));
    let second = submit(&harness, "second", json!(devlog));
    let created_at = first["createdAt"].as_i64().unwrap();

    let listed = harness
        .invoke(
            "list_entries_between",
            json!({ "from": created_at, "to": i64::MAX }),
        )
        .unwrap();
    assert_eq!(listed, json!([first, second]));

    let direct = harness
        .invoke(
            "list_entries_by_context",
            json!({ "contextId": work, "includeDescendants": false }),
        )
        .unwrap();
    assert_eq!(direct, json!([first]));

    let subtree = harness
        .invoke(
            "list_entries_by_context",
            json!({ "contextId": work, "includeDescendants": true }),
        )
        .unwrap();
    assert_eq!(subtree, json!([first, second]));

    assert_eq!(
        harness
            .invoke("get_entry", json!({ "id": "missing" }))
            .unwrap(),
        Value::Null
    );
}
