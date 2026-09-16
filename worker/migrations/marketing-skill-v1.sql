-- ACAD Marketing Skill Engine — D1 schema (v1, single-tenant)
-- Run with: wrangler d1 execute <DB_NAME> --file=./schema.sql

-- Single-row brand profile. If SkylineBot ever goes multi-tenant again,
-- this becomes a per-merchant table with a merchant_id foreign key —
-- everything else below already references content by request/draft id,
-- not by tenant, so that migration is additive, not a rewrite.
CREATE TABLE IF NOT EXISTS brand_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'ACAD Online Coaching',
  tone TEXT DEFAULT 'warm, encouraging, respectful of parents and students',
  languages TEXT DEFAULT 'English, Tamil',
  audience_notes TEXT,        -- free text: who reads this (parents vs students vs prospects)
  key_phrases TEXT,           -- comma-separated house phrases/CTAs that are known to work
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO brand_profile (id) VALUES (1);

CREATE TABLE IF NOT EXISTS content_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,   -- batch_promo | fee_reminder | admission_drive | festival_greeting | re_engagement | review_request
  channel TEXT NOT NULL DEFAULT 'whatsapp',  -- whatsapp | sms | email | social | website
  raw_request TEXT NOT NULL,    -- what staff typed, e.g. "Diwali greeting for NEET batch parents"
  requested_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL REFERENCES content_requests(id),
  draft_text TEXT NOT NULL,
  skills_used TEXT,             -- JSON array of skill ids applied when generating this draft
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | edited | rejected
  final_text TEXT,              -- populated if status = edited
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL DEFAULT '',   -- '' = applies to all content types
  trigger_tags TEXT NOT NULL,              -- comma-separated keywords for matching, e.g. "diwali,festival,greeting"
  procedure_text TEXT NOT NULL,            -- the learned instruction, e.g. "Mix Tamil + English for parent greetings, keep under 3 lines"
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  source_draft_id INTEGER REFERENCES content_drafts(id),
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_skills_content_type ON skills(content_type);
CREATE INDEX IF NOT EXISTS idx_drafts_request ON content_drafts(request_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON content_drafts(status);
