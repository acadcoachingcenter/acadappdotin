-- One-time migration: study_materials already exists in production (unused,
-- empty - confirmed via git history, no frontend code has ever referenced
-- it), but with only the original base44-migration column set. A plain
-- CREATE TABLE IF NOT EXISTS in schema.sql won't touch an already-existing
-- table, so these columns need to be added explicitly, once.
--
-- Run this ONCE:
--   wrangler d1 execute acad-db --remote --file=./schema/migrate_study_materials.sql
--
-- Safe to run only once - re-running will error with "duplicate column
-- name" (SQLite has no ADD COLUMN IF NOT EXISTS). If that happens, it just
-- means this migration already succeeded; no action needed.

ALTER TABLE study_materials ADD COLUMN tutor_name TEXT;
ALTER TABLE study_materials ADD COLUMN grade TEXT;
ALTER TABLE study_materials ADD COLUMN subject TEXT;
ALTER TABLE study_materials ADD COLUMN chapter TEXT;
ALTER TABLE study_materials ADD COLUMN chapter_title TEXT;
ALTER TABLE study_materials ADD COLUMN is_active INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_study_materials_chapter
  ON study_materials (grade, subject, chapter);
