// Talks to the /api/whiteboard/* routes on the main ACAD API Worker
// (acad-api) — same cookie-session auth as apiClient.js, so no separate
// login/token handling is needed here.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";

async function whiteboardFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      // keep HTTP status text
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export function createWhiteboardSession({ classroom_id, title, subject }) {
  return whiteboardFetch("/api/whiteboard/sessions", {
    method: "POST",
    body: JSON.stringify({ classroom_id, title, subject }),
  });
}

export function endWhiteboardSession(sessionId, sceneJson) {
  return whiteboardFetch(`/api/whiteboard/${sessionId}/end`, {
    method: "POST",
    body: JSON.stringify(sceneJson ? { scene_json: sceneJson } : {}),
  });
}

export function saveWhiteboardSnapshot(sessionId, sceneJson) {
  return whiteboardFetch(`/api/whiteboard/${sessionId}/snapshot`, {
    method: "POST",
    body: JSON.stringify({ scene_json: sceneJson }),
  });
}

export function getWhiteboardSession(sessionId) {
  return whiteboardFetch(`/api/whiteboard/${sessionId}`);
}

// ---------------------------------------------------------------------------
// Phase 2 — engagement monitoring
// ---------------------------------------------------------------------------

export function logEngagementEvent(sessionId, event) {
  return whiteboardFetch(`/api/whiteboard/${sessionId}/engagement`, {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function getEngagementSummary(sessionId) {
  return whiteboardFetch(`/api/whiteboard/${sessionId}/engagement/summary`);
}
