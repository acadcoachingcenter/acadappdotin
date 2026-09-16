-- Standalone tutor class-log table (Date | Class | Chapter | Topics
-- Covered). Not tied to a specific live_classes row, so tutors can add or
-- backfill an entry for any past date at any time.
-- Run once: npx wrangler d1 execute acad-db --remote --file=./add_class_logs.sql

CREATE TABLE IF NOT EXISTS class_logs (
  id TEXT PRIMARY KEY,
  tutor_id TEXT NOT NULL,
  tutor_name TEXT,
  log_date TEXT NOT NULL,
  class_name TEXT NOT NULL,
  chapter TEXT,
  topics_covered TEXT NOT NULL,
  created_date TEXT DEFAULT (datetime('now')),
  updated_date TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_class_logs_tutor ON class_logs(tutor_id);
CREATE INDEX IF NOT EXISTS idx_class_logs_date ON class_logs(log_date);
