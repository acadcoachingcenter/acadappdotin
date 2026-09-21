// worker/whiteboardRoutes.js
// Whiteboard session, delta, and snapshot endpoints for the ACAD classroom app.
// Hono-compatible: every exported function takes the Hono context `c` directly.

const D1_DELTA_THRESHOLD = 500;

function generateId() {
  return crypto.randomUUID();
}

/*
 * POST /api/whiteboard/sessions
 * Creates a new whiteboard session when a tutor starts a class.
 * Body: { classroom_id, tutor_id, title?, subject? }
 */
export async function createSession(c) {
  const body = await c.req.json().catch(() => null);
  if (!body || !body.classroom_id || !body.tutor_id) {
    return c.json({ error: "classroom_id and tutor_id are required" }, 400);
  }

  const id = generateId();
  const startedAt = Date.now();

  await c.env.DB.prepare(
    `INSERT INTO whiteboard_sessions
      (id, classroom_id, tutor_id, title, subject, status, started_at, storage_mode)
     VALUES (?, ?, ?, ?, ?, 'active', ?, 'd1')`
  )
    .bind(id, body.classroom_id, body.tutor_id, body.title || null, body.subject || null, startedAt)
    .run();

  return c.json({ session_id: id, started_at: startedAt, status: "active" }, 201);
}

/*
 * POST /api/whiteboard/:sessionId/end
 * Ends a session: sets status + ended_at. Optionally saves a final snapshot
 * if scene_json is included in the body.
 * Body (optional): { scene_json }
 */
export async function endSession(c) {
  const sessionId = c.req.param("sessionId");

  const session = await c.env.DB.prepare(
    `SELECT id, status FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();

  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.status === "ended") {
    return c.json({ session_id: sessionId, status: "ended", already_ended: true });
  }

  const endedAt = Date.now();
  const body = await c.req.json().catch(() => ({}));

  await c.env.DB.prepare(
    `UPDATE whiteboard_sessions SET status = 'ended', ended_at = ? WHERE id = ?`
  )
    .bind(endedAt, sessionId)
    .run();

  if (body.scene_json) {
    const lastSeqRow = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(seq), 0) as max_seq FROM whiteboard_deltas WHERE session_id = ?`
    )
      .bind(sessionId)
      .first();

    await c.env.DB.prepare(
      `INSERT INTO whiteboard_snapshots (session_id, scene_json, checkpoint_seq)
       VALUES (?, ?, ?)`
    )
      .bind(sessionId, JSON.stringify(body.scene_json), lastSeqRow.max_seq || 0)
      .run();
  }

  return c.json({ session_id: sessionId, status: "ended", ended_at: endedAt });
}

/*
 * POST /api/whiteboard/:sessionId/deltas
 * Batched delta write — frontend buffers Yjs updates client-side and flushes
 * every ~3-5 seconds, not per keystroke.
 * Body: { deltas: [{ delta_json, client_id? }, ...] }
 */
export async function appendDeltas(c) {
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json().catch(() => null);

  if (!body || !Array.isArray(body.deltas) || body.deltas.length === 0) {
    return c.json({ error: "deltas array is required" }, 400);
  }

  const session = await c.env.DB.prepare(
    `SELECT id, status, storage_mode FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();

  if (!session) return c.json({ error: "Session not found" }, 404);
  if (session.status === "ended") return c.json({ error: "Session already ended" }, 409);

  // storage_mode = 'r2' sessions should be writing deltas elsewhere (R2-backed
  // path) — this endpoint only serves 'd1' mode. Extend here when the R2 path
  // is built out.
  if (session.storage_mode === "r2") {
    return c.json({ error: "Session has migrated to R2 storage — use the R2 delta endpoint" }, 409);
  }

  const lastSeqRow = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(seq), 0) as max_seq FROM whiteboard_deltas WHERE session_id = ?`
  )
    .bind(sessionId)
    .first();

  let nextSeq = (lastSeqRow.max_seq || 0) + 1;
  const now = Date.now();

  const stmts = body.deltas.map((d) => {
    const seq = nextSeq++;
    return c.env.DB.prepare(
      `INSERT INTO whiteboard_deltas (session_id, seq, delta_json, client_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(sessionId, seq, JSON.stringify(d.delta_json), d.client_id || null, now);
  });

  await c.env.DB.batch(stmts);

  const totalDeltas = nextSeq - 1;
  const shouldMigrate = totalDeltas >= D1_DELTA_THRESHOLD;

  return c.json({
    session_id: sessionId,
    last_seq: totalDeltas,
    count_inserted: body.deltas.length,
    approaching_r2_migration: shouldMigrate, // signal only — actual migration is a separate job
  });
}

/*
 * GET /api/whiteboard/:sessionId/deltas?since=<seq>
 * For replay/reload — fetch deltas after a given checkpoint.
 */
export async function getDeltas(c) {
  const sessionId = c.req.param("sessionId");
  const since = parseInt(c.req.query("since") || "0", 10);

  const { results } = await c.env.DB.prepare(
    `SELECT seq, delta_json, client_id, created_at
     FROM whiteboard_deltas
     WHERE session_id = ? AND seq > ?
     ORDER BY seq ASC`
  )
    .bind(sessionId, since)
    .all();

  return c.json({
    session_id: sessionId,
    deltas: results.map((r) => ({ ...r, delta_json: JSON.parse(r.delta_json) })),
  });
}

/*
 * POST /api/whiteboard/:sessionId/snapshot
 * Periodic checkpoint save (call this every N deltas, not just at session end).
 * Body: { scene_json }
 */
export async function saveSnapshot(c) {
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json().catch(() => null);

  if (!body || !body.scene_json) return c.json({ error: "scene_json is required" }, 400);

  const session = await c.env.DB.prepare(
    `SELECT id FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();
  if (!session) return c.json({ error: "Session not found" }, 404);

  const lastSeqRow = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(seq), 0) as max_seq FROM whiteboard_deltas WHERE session_id = ?`
  )
    .bind(sessionId)
    .first();

  await c.env.DB.prepare(
    `INSERT INTO whiteboard_snapshots (session_id, scene_json, checkpoint_seq)
     VALUES (?, ?, ?)`
  )
    .bind(sessionId, JSON.stringify(body.scene_json), lastSeqRow.max_seq || 0)
    .run();

  return c.json({ session_id: sessionId, checkpoint_seq: lastSeqRow.max_seq || 0 });
}

/*
 * GET /api/whiteboard/:sessionId
 * Fetch session metadata + latest snapshot, for reload/rejoin.
 */
export async function getSession(c) {
  const sessionId = c.req.param("sessionId");

  const session = await c.env.DB.prepare(
    `SELECT * FROM whiteboard_sessions WHERE id = ?`
  )
    .bind(sessionId)
    .first();
  if (!session) return c.json({ error: "Session not found" }, 404);

  const snapshot = await c.env.DB.prepare(
    `SELECT scene_json, checkpoint_seq, created_at
     FROM whiteboard_snapshots
     WHERE session_id = ?
     ORDER BY checkpoint_seq DESC
     LIMIT 1`
  )
    .bind(sessionId)
    .first();

  return c.json({
    session,
    latest_snapshot: snapshot ? { ...snapshot, scene_json: JSON.parse(snapshot.scene_json) } : null,
  });
}