//! Runs real commands through a mock Tauri app and records the invalidation
//! events each mutation broadcasts.

mod common;

use std::sync::{Arc, Mutex};

use common::TestDataDir;
use devlog_desktop_lib::commands;
use devlog_desktop_lib::events::{
    APP_STATE_CHANGED, CAPTURE_DRAFT_CHANGED, CONTEXTS_CHANGED, ENTRIES_CHANGED,
};
use serde_json::{json, Value};
use tauri::ipc::{CallbackFn, InvokeBody};
use tauri::test::{get_ipc_response, mock_builder, mock_context, noop_assets, MockRuntime};
use tauri::webview::InvokeRequest;
use tauri::{App, Listener, WebviewWindow, WebviewWindowBuilder};

const EVENTS: [&str; 4] = [
    ENTRIES_CHANGED,
    CONTEXTS_CHANGED,
    CAPTURE_DRAFT_CHANGED,
    APP_STATE_CHANGED,
];

struct Harness {
    // Held so the app, and with it the listeners, outlive each test body.
    _app: App<MockRuntime>,
    _data_dir: TestDataDir,
    webview: WebviewWindow<MockRuntime>,
    received: Arc<Mutex<Vec<(String, Value)>>>,
}

impl Harness {
    fn new() -> Self {
        let data_dir = TestDataDir::new();
        let app = mock_builder()
            .manage(data_dir.open())
            .invoke_handler(commands::handler())
            .build(mock_context(noop_assets()))
            .expect("build mock app");
        let webview = WebviewWindowBuilder::new(&app, "main", Default::default())
            .build()
            .expect("build mock window");

        let received = Arc::new(Mutex::new(Vec::new()));
        for name in EVENTS {
            let received = Arc::clone(&received);
            app.listen_any(name, move |event| {
                let payload = serde_json::from_str(event.payload()).expect("JSON payload");
                received.lock().unwrap().push((name.to_owned(), payload));
            });
        }

        Self {
            _app: app,
            _data_dir: data_dir,
            webview,
            received,
        }
    }

    fn invoke(&self, cmd: &str, body: Value) -> Result<Value, Value> {
        get_ipc_response(
            &self.webview,
            InvokeRequest {
                cmd: cmd.into(),
                callback: CallbackFn(0),
                error: CallbackFn(1),
                url: "tauri://localhost".parse().unwrap(),
                body: InvokeBody::Json(body),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.to_string(),
            },
        )
        .map(|response| response.deserialize::<Value>().unwrap())
    }

    /// Events received since the last call, in emit order.
    fn take(&self) -> Vec<(String, Value)> {
        std::mem::take(&mut *self.received.lock().unwrap())
    }
}

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
    harness
        .invoke("list_contexts", json!({ "includeArchived": true }))
        .unwrap();
    harness
        .invoke("get_capture_draft", json!({ "surface": "main" }))
        .unwrap();

    assert_eq!(harness.take(), vec![]);
}
