-- Timestamps are Unix epoch milliseconds (INTEGER), matching JavaScript Date.
-- Core owns full normalization; these checks guard data integrity at rest.

CREATE TABLE contexts (
  id TEXT PRIMARY KEY NOT NULL,
  parent_id TEXT REFERENCES contexts (id),
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Archiving retires a context but keeps it as history; deletion is a
  -- separate, future action. Active means both are NULL.
  archived_at INTEGER,
  deleted_at INTEGER,
  CHECK (parent_id IS NULL OR parent_id <> id),
  CHECK (trim(name, char(32, 9, 10, 11, 12, 13)) <> ''),
  CHECK (instr(name, '/') = 0)
) STRICT;

-- Active siblings cannot share a name; NOCASE folds ASCII letters only.
CREATE UNIQUE INDEX contexts_active_sibling_name
  ON contexts (ifnull(parent_id, ''), name COLLATE NOCASE)
  WHERE archived_at IS NULL AND deleted_at IS NULL;

CREATE INDEX contexts_parent_id ON contexts (parent_id);

CREATE TABLE entries (
  id TEXT PRIMARY KEY NOT NULL,
  content TEXT NOT NULL,
  context_id TEXT REFERENCES contexts (id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  CHECK (trim(content, char(32, 9, 10, 11, 12, 13)) <> '')
) STRICT;

CREATE INDEX entries_active_created_at
  ON entries (created_at, id)
  WHERE deleted_at IS NULL;

CREATE INDEX entries_context_id ON entries (context_id);

-- Drafts keep raw text, so empty and whitespace-only content is allowed.
CREATE TABLE capture_drafts (
  surface TEXT PRIMARY KEY NOT NULL CHECK (surface IN ('main', 'quick-capture')),
  content TEXT NOT NULL,
  context_id TEXT REFERENCES contexts (id),
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX capture_drafts_context_id ON capture_drafts (context_id);

-- Single-row table; the seed row lets reads skip existence checks.
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  current_context_id TEXT REFERENCES contexts (id),
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX app_state_current_context_id ON app_state (current_context_id);

INSERT INTO app_state (id, current_context_id, updated_at)
VALUES (1, NULL, CAST(unixepoch('subsec') * 1000 AS INTEGER));
