mod common;

use common::TestDataDir;
use devlog_desktop_lib::commands::contexts::{
    self, ContextDto, CreateContextInput, RenameContextInput,
};
use devlog_desktop_lib::commands::{CommandError, ErrorCode};
use serde_json::json;

fn create_input(value: serde_json::Value) -> CreateContextInput {
    serde_json::from_value(value).expect("deserialize create input")
}

fn code(result: Result<impl std::fmt::Debug, CommandError>) -> ErrorCode {
    result.expect_err("command should fail").code
}

#[test]
fn context_dto_crosses_ipc_as_camel_case_with_epoch_millis() {
    let database = TestDataDir::new().open();
    let work = contexts::create(
        &database,
        create_input(json!({ "parentId": null, "name": "Work" })),
    )
    .unwrap();
    let child = contexts::create(
        &database,
        create_input(json!({ "parentId": work.id, "name": "DevLog" })),
    )
    .unwrap();

    let value = serde_json::to_value(&child).unwrap();
    assert_eq!(
        value,
        json!({
            "id": child.id,
            "parentId": work.id,
            "name": "DevLog",
            "createdAt": child.created_at,
            "updatedAt": child.updated_at,
            "deletedAt": null,
        })
    );
    assert!(value["createdAt"].is_i64());
}

#[test]
fn commands_cover_the_repository_lifecycle() {
    let database = TestDataDir::new().open();
    let work = contexts::create(
        &database,
        create_input(json!({ "parentId": null, "name": "Work" })),
    )
    .unwrap();
    let rename: RenameContextInput =
        serde_json::from_value(json!({ "id": work.id, "name": "Job" })).unwrap();

    assert_eq!(contexts::rename(&database, rename).unwrap().name, "Job");
    contexts::archive(&database, &work.id).unwrap();

    let found: ContextDto = contexts::find(&database, &work.id).unwrap().unwrap();
    assert!(found.deleted_at.is_some());
    assert!(contexts::find(&database, "missing").unwrap().is_none());
    assert!(contexts::list(&database, false).unwrap().is_empty());
    assert_eq!(contexts::list(&database, true).unwrap(), [found]);
}

#[test]
fn context_failures_map_to_domain_error_codes() {
    let database = TestDataDir::new().open();
    let work = contexts::create(
        &database,
        create_input(json!({ "parentId": null, "name": "Work" })),
    )
    .unwrap();

    assert_eq!(
        code(contexts::create(
            &database,
            create_input(json!({ "parentId": null, "name": "a/b" }))
        )),
        ErrorCode::ContextNameInvalid
    );
    assert_eq!(
        code(contexts::create(
            &database,
            create_input(json!({ "parentId": null, "name": "WORK" }))
        )),
        ErrorCode::ContextNameConflict
    );
    assert_eq!(
        code(contexts::archive(&database, "missing")),
        ErrorCode::ContextNotFound
    );
    contexts::archive(&database, &work.id).unwrap();
    let under_archived = create_input(json!({ "parentId": work.id, "name": "Child" }));
    let error = contexts::create(&database, under_archived).unwrap_err();
    assert_eq!(
        serde_json::to_value(error).unwrap(),
        json!({ "code": "CONTEXT_ARCHIVED" })
    );
}
