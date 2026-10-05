//! A mock Tauri app that runs real commands over IPC against a temporary
//! database and records every invalidation event they emit.

use std::sync::{Arc, Mutex};

use devlog_desktop_lib::commands;
use devlog_desktop_lib::events::{
    APP_STATE_CHANGED, CAPTURE_DRAFT_CHANGED, CONTEXTS_CHANGED, ENTRIES_CHANGED,
};
use devlog_desktop_lib::persistence::Database;
use serde_json::Value;
use tauri::ipc::{CallbackFn, InvokeBody};
use tauri::test::{get_ipc_response, mock_builder, mock_context, noop_assets, MockRuntime};
use tauri::webview::InvokeRequest;
use tauri::{App, Listener, Manager, WebviewWindow, WebviewWindowBuilder};

use super::TestDataDir;

const EVENTS: [&str; 4] = [
    ENTRIES_CHANGED,
    CONTEXTS_CHANGED,
    CAPTURE_DRAFT_CHANGED,
    APP_STATE_CHANGED,
];

pub struct Harness {
    // Held so the listeners outlive each test body.
    app: App<MockRuntime>,
    _data_dir: TestDataDir,
    webview: WebviewWindow<MockRuntime>,
    received: Arc<Mutex<Vec<(String, Value)>>>,
}

impl Harness {
    pub fn new() -> Self {
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
            app,
            _data_dir: data_dir,
            webview,
            received,
        }
    }

    pub fn invoke(&self, cmd: &str, body: Value) -> Result<Value, Value> {
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

    /// The managed database, for arranging state without emitting events.
    pub fn database(&self) -> tauri::State<'_, Database> {
        self.app.state::<Database>()
    }

    /// Events received since the last call, in emit order.
    pub fn take(&self) -> Vec<(String, Value)> {
        std::mem::take(&mut *self.received.lock().unwrap())
    }
}
