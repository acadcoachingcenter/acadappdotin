import { useState } from "react";
import { Check, Link2, CalendarClock, Loader2 } from "lucide-react";
import { updateMeetUrl, syncClassToCalendar } from "../../../lib/classroomApi";

export default function MeetLinkForm({ classItem, onUpdated }) {
  const [value, setValue] = useState(classItem.meetUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = value.trim();
    if (trimmed && !trimmed.startsWith("https://meet.google.com/")) {
      setError("Enter a valid Google Meet link (https://meet.google.com/...)");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMeetUrl(classItem.id, trimmed);
      onUpdated?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncToCalendar() {
    setSyncing(true);
    setSyncError("");
    setSyncResult(null);
    try {
      const result = await syncClassToCalendar(classItem, {
        tutorEmail: classItem.tutorEmail,
        studentEmails: classItem.studentEmails || [],
      });
      setValue(result.meetUrl);
      onUpdated?.(result.classItem);
      setSyncResult(result);
    } catch (err) {
      setSyncError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          onClick={handleSyncToCalendar}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accentdark transition-colors hover:bg-accent/20 disabled:opacity-60"
        >
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
          {syncing ? "Scheduling & notifying…" : "Schedule & Notify (Google Calendar)"}
        </button>
        {syncResult && (
          <p className="mt-1.5 text-xs text-live">
            Meet link generated. Notified {syncResult.notified} of{" "}
            {syncResult.notified + syncResult.notifyFailures} recipient(s)
            {syncResult.mocked && " (mock - deploy the worker for real sends)"}.
          </p>
        )}
        {syncError && <p className="mt-1.5 text-xs text-red-600">{syncError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate">
            <Link2 size={13} />
            Or set the Meet link manually
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full rounded-md border border-chalkline bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-board px-4 py-2 text-sm font-semibold text-chalk transition-colors hover:bg-boarddark disabled:opacity-60 sm:mt-6"
        >
          {saved ? (
            <>
              <Check size={15} /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save link"
          )}
        </button>
      </form>
    </div>
  );
}
