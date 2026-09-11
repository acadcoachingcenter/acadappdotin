// worker/src/engagementRoutes.js
// Phase 2: rule-based idle-event logging + Groq-summarized flags for tutors.
import { invokeLLM } from "./llm.js";

// Only regenerate a Groq summary once at least this many new raw events
// have accumulated since the last cached one -- keeps Groq calls cheap and
// avoids re-summarizing on every tutor sidebar poll.
const MIN_NEW_EVENTS_FOR_RESUMMARY = 3;

/*
 * POST /api/whiteboard/:sessionId/engagement
 * Logs a single idle/rejoin event from a student's (or any viewer's) client.
 * Body: { student_id, student_name?, event_type: 'idle_start'|'idle_end'|'rejoin', idle_seconds? }
 */
export async function logEngagementEvent(c) {
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json().catch(() => null);

  if (!body || !body.student_id || !body.event_type) {
    return c.json({ error: "student_id and event_type are required" }, 400);
  }

  const validTypes = ["idle_start", "idle_end", "rejoin"];
  if (!validTypes.includes(body.event_type)) {
    return c.json({ error: `event_type must be one of ${validTypes.join(", ")}` }, 400);
  }

  const session = await c.env.DB.prepare(
    `SELECT id FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();
  if (!session) return c.json({ error: "Session not found" }, 404);

  await c.env.DB.prepare(
    `INSERT INTO whiteboard_engagement_events
      (session_id, student_id, student_name, event_type, idle_seconds)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      sessionId,
      body.student_id,
      body.student_name || null,
      body.event_type,
      body.idle_seconds ?? null
    )
    .run();

  return c.json({ session_id: sessionId, logged: true }, 201);
}

/*
 * GET /api/whiteboard/:sessionId/engagement/summary
 * Returns raw recent events plus a Groq-generated natural-language summary
 * of engagement patterns (e.g. "3 students went idle shortly after the
 * 20-minute mark"). The summary is cached and only regenerated once enough
 * new events have come in since the last one.
 */
export async function getEngagementSummary(c) {
  const sessionId = c.req.param("sessionId");

  const session = await c.env.DB.prepare(
    `SELECT id FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();
  if (!session) return c.json({ error: "Session not found" }, 404);

  const { results: events } = await c.env.DB.prepare(
    `SELECT student_id, student_name, event_type, idle_seconds, created_at
     FROM whiteboard_engagement_events
     WHERE session_id = ?
     ORDER BY created_at ASC`
  )
    .bind(sessionId)
    .all();

  if (events.length === 0) {
    return c.json({ session_id: sessionId, summary: null, event_count: 0, events: [] });
  }

  const lastSummary = await c.env.DB.prepare(
    `SELECT summary_text, event_count_at_summary
     FROM whiteboard_engagement_summaries
     WHERE session_id = ?
     ORDER BY created_at DESC
     LIMIT 1`
  )
    .bind(sessionId)
    .first();

  const newEventsSinceLastSummary = events.length - (lastSummary?.event_count_at_summary || 0);

  // Reuse the cached summary if not enough new signal has accumulated yet.
  if (lastSummary && newEventsSinceLastSummary < MIN_NEW_EVENTS_FOR_RESUMMARY) {
    return c.json({
      session_id: sessionId,
      summary: lastSummary.summary_text,
      event_count: events.length,
      events: events.slice(-20),
    });
  }

  // Only summarize idle_end events (the ones with a duration) -- idle_start/
  // rejoin are useful for the raw timeline but add noise to the prompt.
  const idleEvents = events.filter((e) => e.event_type === "idle_end");

  let summaryText = null;

  if (idleEvents.length > 0 && c.env.GROQ_API_KEY) {
    const eventLines = idleEvents
      .map((e) => `${e.student_name || e.student_id} was idle for ${e.idle_seconds}s`)
      .join("\n");

    try {
      const result = await invokeLLM(c.env, {
        prompt:
          `You are monitoring student engagement during a live online tutoring class ` +
          `whiteboard session. Below is a raw log of idle periods (a student's cursor/` +
          `touch was inactive on the shared whiteboard for the given duration).\n\n` +
          `${eventLines}\n\n` +
          `Write 1-3 short, plain-English sentences a tutor could glance at mid-class to ` +
          `spot patterns worth checking on (e.g. several students going idle around the ` +
          `same time, or one student idle repeatedly). Do not just restate every line -- ` +
          `summarize the pattern. If nothing notable stands out, say so briefly.`,
      });
      summaryText = result?.text?.trim() || null;
    } catch (err) {
      console.error("Groq engagement summary failed:", err);
      // Fall through with no summary rather than failing the whole request --
      // the tutor still gets the raw event list.
    }
  }

  if (summaryText) {
    await c.env.DB.prepare(
      `INSERT INTO whiteboard_engagement_summaries (session_id, summary_text, event_count_at_summary)
       VALUES (?, ?, ?)`
    )
      .bind(sessionId, summaryText, events.length)
      .run();
  }

  return c.json({
    session_id: sessionId,
    summary: summaryText || lastSummary?.summary_text || null,
    event_count: events.length,
    events: events.slice(-20),
  });
}
