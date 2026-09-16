-- Adds a covered_portions column to live_classes, so tutors can log what
-- syllabus/topics were actually covered in each class session (a log-book
-- feature that didn't exist before).
-- Run once: npx wrangler d1 execute acad-db --remote --file=./add_covered_portions.sql

ALTER TABLE live_classes ADD COLUMN covered_portions TEXT;
