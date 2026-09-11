import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { X, Loader2 } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import {
  createWhiteboardSession,
  endWhiteboardSession,
  getWhiteboardSession,
  saveWhiteboardSnapshot,
} from "@/lib/whiteboardApi";
import { apiClient } from "@/api/apiClient";

// How often the tutor's local changes are flushed to the server as a
// snapshot. This is a periodic-snapshot MVP, not full real-time sync —
// students/admin viewers poll for updates rather than seeing every stroke
// live. Real-time multi-user sync (Yjs/Durable Objects) is a fast-follow.
const AUTOSAVE_DEBOUNCE_MS = 4000;
const VIEWER_POLL_MS = 8000;

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

export default function ClassroomWhiteboard({ classItem, role, onClose, onMetaChange }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [ending, setEnding] = useState(false);
  const excalidrawApiRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isEditor = role === "tutor";

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
      </div>
    </div>
  );
}
