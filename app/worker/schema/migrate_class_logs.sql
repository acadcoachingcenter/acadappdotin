-- One-time repair for class_logs.
--
-- The live table was created outside schema.sql without the standard
-- created_by / created_date / updated_date columns, so every save from the
-- Online Classroom "classes covered" log fails with:
--   D1_ERROR: table class_logs has no column named created_by
--
-- ONLY RUN THIS IF THE TABLE IS EMPTY. Check first:
--   wrangler d1 execute acad-db --remote --command "SELECT COUNT(*) AS n FROM class_logs;"
-- If n is 0, run:
--   wrangler d1 execute acad-db --remote --file=./schema/migrate_class_logs.sql
-- If n is anything else, DON'T run this - it drops the table and any
-- entries in it would be lost. Paste the row count and the output of
--   wrangler d1 execute acad-db --remote --command "PRAGMA table_info(class_logs);"
-- instead, and the missing columns can be added in place with ALTER TABLE.

DROP TABLE IF EXISTS class_logs;

CREATE TABLE class_logs (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now')),
  tutor_id TEXT,
  tutor_name TEXT,
  log_date TEXT,
  class_name TEXT,
  chapter TEXT,
  topics_covered TEXT
);

CREATE INDEX IF NOT EXISTS idx_class_logs_tutor_date
  ON class_logs (tutor_id, log_date);
