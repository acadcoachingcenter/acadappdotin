import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { X, Loader2, Sparkles, Users } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import {
  createWhiteboardSession,
  endWhiteboardSession,
  getEngagementSummary,
  getWhiteboardSession,
  logEngagementEvent,
  saveWhiteboardSnapshot,
} from "@/lib/whiteboardApi";
import { apiClient } from "@/api/apiClient";

// How often the tutor's local changes are flushed to the server as a
// snapshot. This is a periodic-snapshot MVP, not full real-time sync —
// students/admin viewers poll for updates rather than seeing every stroke
// live. Real-time multi-user sync (Yjs/Durable Objects) is a fast-follow.
const AUTOSAVE_DEBOUNCE_MS = 4000;
const VIEWER_POLL_MS = 8000;

// Phase 2 — engagement monitoring tuning. A viewer (student) is flagged
// idle after this many seconds with no pointer/touch/keyboard activity on
// the whiteboard. The tutor's sidebar re-checks for new flags on this cadence.
const IDLE_THRESHOLD_MS = 45000;
const ENGAGEMENT_POLL_MS = 20000;

function parseWhiteboardData(classItem) {
  try {
    const parsed = JSON.parse(classItem?.whiteboard_data || "");
    if (parsed && parsed.sessionId) return parsed;
  } catch {
    // no existing whiteboard session for this class yet
  }
  return null;
}

async function persistWhiteboardMeta(classId, meta) {
  // Reuses the existing whiteboard_data column on LiveClass (already in the
  // schema, previously unused) to point students/admin at the active
  // session for this class.
  await apiClient.entities.LiveClass.update(classId, {
    whiteboard_data: JSON.stringify(meta),
  });
}

// Tracks pointer/touch/keyboard activity on the whiteboard for a single
// viewer and reports idle_start/idle_end events to the Worker. Rule-based —
// no ML, just a debounce timer. Returns nothing; fires side effects only.
function useIdleTracking({ enabled, sessionId, user }) {
  const idleTimerRef = useRef(null);
  const idleSinceRef = useRef(null);
  const isIdleRef = useRef(false);

  useEffect(() => {
    if (!enabled || !sessionId || !user?.id) return;

    function reportIdleStart() {
      if (isIdleRef.current) return;
      isIdleRef.current = true;
      idleSinceRef.current = Date.now();
      logEngagementEvent(sessionId, {
        student_id: user.id,
        student_name: user.full_name || user.email || "Student",
        event_type: "idle_start",
      }).catch(() => {});
    }

    function reportIdleEnd() {
      if (!isIdleRef.current) return;
      isIdleRef.current = false;
      const idleSeconds = Math.round((Date.now() - (idleSinceRef.current || Date.now())) / 1000);
      logEngagementEvent(sessionId, {
        student_id: user.id,
        student_name: user.full_name || user.email || "Student",
        event_type: "idle_end",
        idle_seconds: idleSeconds,
      }).catch(() => {});
    }

    function resetTimer() {
      reportIdleEnd();
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(reportIdleStart, IDLE_THRESHOLD_MS);
    }

    const events = ["pointermove", "pointerdown", "touchstart", "keydown", "wheel"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearTimeout(idleTimerRef.current);
      // Flush a final idle_end if the viewer navigates away mid-idle, so the
      // session's numbers aren't left hanging.
      reportIdleEnd();
    };
  }, [enabled, sessionId, user?.id, user?.full_name, user?.email]);
}

// Tutor-only sidebar: polls the Groq-summarized engagement feed and shows
// quiet flags without interrupting the whiteboard itself.
function EngagementSidebar({ sessionId }) {
  const [summary, setSummary] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function poll() {
      try {
        const data = await getEngagementSummary(sessionId);
        if (cancelled) return;
        setSummary(data.summary);
        setEventCount(data.event_count || 0);
      } catch {
        // transient — next poll retries
      }
    }

    poll();
    const interval = setInterval(poll, ENGAGEMENT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  if (!summary) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 w-72">
      {open ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <Sparkles size={14} className="text-amber-500" />
              Engagement flags
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Hide
            </button>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">{summary}</p>
          <p className="mt-2 text-[10px] text-slate-400">{eventCount} event(s) this session</p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg"
        >
          <Users size={13} />
          Flags
        </button>
      )}
    </div>
  );
}

export default function ClassroomWhiteboard({ classItem, role, user, onClose, onMetaChange }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [ending, setEnding] = useState(false);
  const excalidrawApiRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isEditor = role === "tutor";

  useIdleTracking({ enabled: role === "student", sessionId, user });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");

      const existing = parseWhiteboardData(classItem);

      try {
        if (isEditor) {
          if (existing?.sessionId && existing.status === "active") {
            // Resume the tutor's own already-active session.
            const data = await getWhiteboardSession(existing.sessionId);
            if (cancelled) return;
            setSessionId(existing.sessionId);
            setInitialData(data.latest_snapshot?.scene_json || null);
          } else {
            // Start a new session for this class.
            const created = await createWhiteboardSession({
              classroom_id: classItem.id,
              title: classItem.subject,
              subject: classItem.subject,
            });
            if (cancelled) return;
            setSessionId(created.session_id);
            await persistWhiteboardMeta(classItem.id, {
              sessionId: created.session_id,
              status: "active",
            });
            onMetaChange?.({ sessionId: created.session_id, status: "active" });
          }
        } else {
          // Student / admin viewer — needs an already-active session.
          if (!existing?.sessionId || existing.status !== "active") {
            setError("The tutor hasn't started the whiteboard for this class yet.");
            setLoading(false);
            return;
          }
          const data = await getWhiteboardSession(existing.sessionId);
          if (cancelled) return;
          setSessionId(existing.sessionId);
          setInitialData(data.latest_snapshot?.scene_json || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load the whiteboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classItem.id]);

  // Viewer polling — refresh the read-only canvas periodically.
  useEffect(() => {
    if (isEditor || !sessionId) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const data = await getWhiteboardSession(sessionId);
        const scene = data.latest_snapshot?.scene_json;
        if (scene && excalidrawApiRef.current) {
          excalidrawApiRef.current.updateScene(scene);
        }
        if (data.session?.status === "ended") {
          setError("The tutor ended this whiteboard session.");
          clearInterval(pollTimerRef.current);
        }
      } catch {
        // transient network hiccup — next poll will retry
      }
    }, VIEWER_POLL_MS);

    return () => clearInterval(pollTimerRef.current);
  }, [isEditor, sessionId]);

  const flushSnapshot = useCallback(
    (sceneJson) => {
      if (!sessionId || !isEditor) return;
      saveWhiteboardSnapshot(sessionId, sceneJson).catch((err) => {
        console.error("Whiteboard autosave failed:", err);
      });
    },
    [sessionId, isEditor]
  );

  function handleChange(elements, appState) {
    if (!isEditor) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      flushSnapshot({ elements, appState: { viewBackgroundColor: appState.viewBackgroundColor } });
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  async function handleEndSession() {
    if (!sessionId || !excalidrawApiRef.current) return;
    setEnding(true);
    try {
      const elements = excalidrawApiRef.current.getSceneElements();
      const appState = excalidrawApiRef.current.getAppState();
      await endWhiteboardSession(sessionId, {
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor },
      });
      await persistWhiteboardMeta(classItem.id, { sessionId, status: "ended" });
      onMetaChange?.({ sessionId, status: "ended" });
      onClose?.();
    } catch (err) {
      setError(err.message || "Unable to end the whiteboard session.");
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Whiteboard — Grade {classItem.grade} · {classItem.subject}
          </h2>
          <p className="text-xs text-slate-500">
            {isEditor ? "You are the presenter — changes save automatically." : "View-only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditor && sessionId && (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              {ending ? "Ending…" : "End Whiteboard"}
            </button>
          )}
          <button
            onClick={() => onClose?.()}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close whiteboard"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading whiteboard…
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full items-center justify-center px-6">
            <div className="max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-900">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && (
          <Excalidraw
            excalidrawAPI={(api) => (excalidrawApiRef.current = api)}
            initialData={{
              elements: initialData?.elements || [],
              appState: {
                viewBackgroundColor: initialData?.appState?.viewBackgroundColor || "#ffffff",
              },
            }}
            viewModeEnabled={!isEditor}
            onChange={handleChange}
          />
        )}

        {!loading && !error && isEditor && sessionId && (
          <EngagementSidebar sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
