/**
 * Cloudflare Worker: guest-contact lookup service for the
 * Calendar -> WhatsApp Meet-link automation.
 *
 * Endpoints (all require header:  X-API-Key: <your secret>):
 *
 *   GET  /lookup?email=someone@gmail.com
 *        -> { found: true, email, name, whatsapp_number }
 *        -> { found: false }  (404 body, 200 status so n8n IF node reads it easily)
 *
 *   POST /guests            body: { email, name, whatsapp_number }
 *        Upserts a mapping. whatsapp_number must be E.164 digits only,
 *        e.g. "919790818436" (country code + number, no + or leading 0).
 *
 *   GET  /guests            -> list all mappings (for admin/debug)
 *
 *   POST /log-send          body: { event_id, attendee_email, whatsapp_number, status, meet_link }
 *        Records a send attempt. Unique on (event_id, attendee_email) so a
 *        second n8n run for the same event+guest won't double count
 *        (INSERT OR REPLACE is used, so re-sends simply overwrite the log row).
 *
 *   GET  /already-sent?event_id=...&email=...
 *        -> { sent: true|false }   use this before sending to avoid duplicate
 *        WhatsApp messages if the Calendar trigger fires twice for one edit.
 *
 * Deploy:
 *   wrangler d1 create calendar-whatsapp-db
 *   wrangler d1 execute calendar-whatsapp-db --file=./schema.sql
 *   wrangler secret put API_KEY
 *   wrangler deploy
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function unauthorized() {
  return json({ error: "unauthorized" }, 401);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiKey = request.headers.get("X-API-Key");

    if (!env.API_KEY || apiKey !== env.API_KEY) {
      return unauthorized();
    }

    try {
      // GET /lookup?email=
      if (request.method === "GET" && url.pathname === "/lookup") {
        const email = (url.searchParams.get("email") || "").trim().toLowerCase();
        if (!email) return json({ error: "email query param required" }, 400);

        const row = await env.DB.prepare(
          "SELECT email, name, whatsapp_number FROM guest_contacts WHERE lower(email) = ?"
        )
          .bind(email)
          .first();

        if (!row) return json({ found: false });
        return json({ found: true, ...row });
      }

      // POST /guests  (upsert)
      if (request.method === "POST" && url.pathname === "/guests") {
        const body = await request.json();
        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || "").trim();
        const whatsapp_number = (body.whatsapp_number || "").replace(/[^\d]/g, "");

        if (!email || !whatsapp_number) {
          return json({ error: "email and whatsapp_number are required" }, 400);
        }

        await env.DB.prepare(
          `INSERT INTO guest_contacts (email, name, whatsapp_number, updated_at)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(email) DO UPDATE SET
             name = excluded.name,
             whatsapp_number = excluded.whatsapp_number,
             updated_at = datetime('now')`
        )
          .bind(email, name, whatsapp_number)
          .run();

        return json({ success: true, email, name, whatsapp_number });
      }

      // GET /guests  (admin list)
      if (request.method === "GET" && url.pathname === "/guests") {
        const { results } = await env.DB.prepare(
          "SELECT email, name, whatsapp_number, updated_at FROM guest_contacts ORDER BY updated_at DESC"
        ).all();
        return json({ guests: results });
      }

      // GET /already-sent?event_id=&email=
      if (request.method === "GET" && url.pathname === "/already-sent") {
        const event_id = url.searchParams.get("event_id");
        const email = (url.searchParams.get("email") || "").trim().toLowerCase();
        if (!event_id || !email) {
          return json({ error: "event_id and email query params required" }, 400);
        }
        const row = await env.DB.prepare(
          `SELECT status FROM meet_link_sends WHERE event_id = ? AND lower(attendee_email) = ? AND status = 'sent'`
        )
          .bind(event_id, email)
          .first();
        return json({ sent: !!row });
      }

      // POST /log-send
      if (request.method === "POST" && url.pathname === "/log-send") {
        const body = await request.json();
        const { event_id, attendee_email, whatsapp_number, status, meet_link } = body;
        if (!event_id || !attendee_email || !status) {
          return json({ error: "event_id, attendee_email, status are required" }, 400);
        }

        await env.DB.prepare(
          `INSERT INTO meet_link_sends (event_id, attendee_email, whatsapp_number, status, meet_link, sent_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(event_id, attendee_email) DO UPDATE SET
             whatsapp_number = excluded.whatsapp_number,
             status = excluded.status,
             meet_link = excluded.meet_link,
             sent_at = datetime('now')`
        )
          .bind(event_id, attendee_email, whatsapp_number || null, status, meet_link || null)
          .run();

        return json({ success: true });
      }

      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
