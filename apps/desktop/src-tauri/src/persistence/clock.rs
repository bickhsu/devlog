use std::time::{SystemTime, UNIX_EPOCH};

/// Current time as Unix epoch milliseconds, the storage format for every
/// timestamp column (see `0001_initial.sql`).
pub fn now_millis() -> i64 {
    let elapsed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    i64::try_from(elapsed.as_millis()).unwrap_or(i64::MAX)
}
