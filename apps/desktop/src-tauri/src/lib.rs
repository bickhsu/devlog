pub mod commands;
pub mod persistence;

use tauri::{App, Manager, WebviewWindowBuilder};

use persistence::{Database, PersistenceError};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(commands::handler())
        .setup(|app| {
            initialize_database(app)?;
            // Product windows are declared with `create: false` so none exists
            // until the schema is complete; a migration failure aborts startup
            // here. Tauri has already built any `create: true` windows.
            for window in app.config().app.windows.iter().filter(|w| !w.create) {
                WebviewWindowBuilder::from_config(app.handle(), window)?.build()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the DevLog desktop application");
}

fn initialize_database(app: &App) -> Result<(), PersistenceError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| PersistenceError::DataDirectory(error.to_string()))?;
    let database = Database::open_in_dir(&data_dir).inspect_err(|error| {
        eprintln!("[devlog] database initialization failed: {error}");
    })?;
    app.manage(database);
    Ok(())
}
