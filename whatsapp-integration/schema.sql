-- D1 schema: guest_contacts
-- Run with: wrangler d1 execute calendar-whatsapp-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS guest_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  whatsapp_number TEXT NOT NULL,   -- E.164 format, e.g. 919790818436 (no +, no leading 0)
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_guest_email ON guest_contacts(email);

-- Optional: log of every meeting-link message sent, useful for debugging /
-- avoiding duplicate sends if the calendar trigger fires twice for one update
CREATE TABLE IF NOT EXISTS meet_link_sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  whatsapp_number TEXT,
  status TEXT,              -- 'sent' | 'skipped_no_number' | 'failed'
  meet_link TEXT,
  sent_at TEXT DEFAULT (datetime('now')),
  UNIQUE(event_id, attendee_email)
);

-- Seed example row (edit/remove before deploying)
-- INSERT INTO guest_contacts (email, name, whatsapp_number) VALUES
--   ('example.guest@gmail.com', 'Example Guest', '919790818436');
