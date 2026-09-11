-- Phase 2: AI engagement monitoring
-- Rule-based idle events logged client-side by student/viewer whiteboard
-- sessions, periodically summarized by Groq into tutor-facing flags.

CREATE TABLE IF NOT EXISTS whiteboard_engagement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES whiteboard_sessions(id),
  student_id TEXT NOT NULL,
  student_name TEXT,
  event_type TEXT NOT NULL,
  idle_seconds INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_wb_engagement_session ON whiteboard_engagement_events(session_id);
CREATE INDEX IF NOT EXISTS idx_wb_engagement_session_created ON whiteboard_engagement_events(session_id, created_at);

CREATE TABLE IF NOT EXISTS whiteboard_engagement_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES whiteboard_sessions(id),
  summary_text TEXT NOT NULL,
  event_count_at_summary INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_wb_summaries_session ON whiteboard_engagement_summaries(session_id);