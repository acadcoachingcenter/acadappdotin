-- Adds the account_status column that AdminTutorManagement.jsx has been
-- trying to read/write all along - it doesn't exist yet, so every "Mark
-- Deleted"/"Suspended"/etc. status change has been silently doing nothing.
-- Run once: npx wrangler d1 execute acad-db --remote --file=./add_account_status.sql

ALTER TABLE users ADD COLUMN account_status TEXT;
