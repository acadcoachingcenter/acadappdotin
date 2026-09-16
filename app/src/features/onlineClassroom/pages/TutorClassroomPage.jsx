import { useEffect, useMemo, useState } from "react";
import { ExternalLink, CalendarDays, LayoutGrid, List, BookOpen, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import {
  classStatus,
  formatClassTime,
  listClassesForUser,
  listClassLogs,
  addClassLog,
  updateClassLog,
  deleteClassLog,
} from "@/lib/classroomApi";
import WeeklyTimetable from "../components/WeeklyTimetable";
import WhiteboardButton from "../components/WhiteboardButton";

function todayIST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

const emptyLogForm = { logDate: todayIST(), className: "", chapter: "", topicsCovered: "" };

export default function TutorClassroomPage({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [editingLogId, setEditingLogId] = useState(null); // null = not open, "new" = adding
  const [logForm, setLogForm] = useState(emptyLogForm);
  const [savingLog, setSavingLog] = useState(false);

  useEffect(() => {
    listClassesForUser(user).then(setClasses).finally(() => setLoading(false));
  }, [user]);

  const refreshLogs = () => {
    setLogsLoading(true);
    listClassLogs(user.id).then(setLogs).finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    refreshLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Suggested class names from this tutor's own scheduled classes, so they
  // don't have to retype "Grade 9 - Mathematics" from scratch each time -
  // but the field stays free text, since a tutor may log an ad-hoc class
  // that was never on the ACAD schedule at all.
  const classNameSuggestions = useMemo(() => {
    const set = new Set(classes.map((c) => `Grade ${c.grade} - ${c.subject}`));
    return [...set];
  }, [classes]);

  const startAddLog = () => {
    setLogForm(emptyLogForm);
    setEditingLogId("new");
  };

  const startEditLog = (log) => {
    setLogForm({
      logDate: log.log_date,
      className: log.class_name,
      chapter: log.chapter || "",
      topicsCovered: log.topics_covered,
    });
    setEditingLogId(log.id);
  };

  const cancelLogEdit = () => {
    setEditingLogId(null);
    setLogForm(emptyLogForm);
  };

  const handleSaveLog = async () => {
    if (!logForm.logDate || !logForm.className.trim() || !logForm.topicsCovered.trim()) {
      alert("Please fill in at least Date, Class, and Topics Covered.");
      return;
    }

    setSavingLog(true);
    try {
      if (editingLogId === "new") {
        await addClassLog({
          tutorId: user.id,
          tutorName: user.full_name || user.email,
          logDate: logForm.logDate,
          className: logForm.className.trim(),
          chapter: logForm.chapter.trim(),
          topicsCovered: logForm.topicsCovered.trim(),
        });
      } else {
        await updateClassLog(editingLogId, {
          logDate: logForm.logDate,
          className: logForm.className.trim(),
          chapter: logForm.chapter.trim(),
          topicsCovered: logForm.topicsCovered.trim(),
        });
      }
      cancelLogEdit();
      refreshLogs();
    } catch (error) {
      console.error("Error saving class log:", error);
      alert("Failed to save: " + (error.message || "Unknown error"));
    } finally {
      setSavingLog(false);
    }
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`Delete this log entry for ${log.log_date}?`)) return;
    try {
      await deleteClassLog(log.id);
      refreshLogs();
    } catch (error) {
      console.error("Error deleting class log:", error);
      alert("Failed to delete: " + (error.message || "Unknown error"));
    }
  };

  if (loading) return <p className="text-slate-600">Loading your classes…</p>;

  return (
    <div className="space-y-4">
      {classes.length > 0 && (
        <div className="flex justify-end">
          <div className="flex rounded-lg border border-slate-300 p-0.5">
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${
                view === "list" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <List size={15} />
              List
            </button>
            <button
              onClick={() => setView("timetable")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${
                view === "timetable" ? "bg-slate-900 text-white" : "text-slate-600"
              }`}
            >
              <LayoutGrid size={15} />
              Timetable
            </button>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No classes have been assigned to you yet.
        </div>
      ) : view === "timetable" ? (
        <WeeklyTimetable classes={classes} />
      ) : (
        classes.map((c) => {
          const status = classStatus(c);
          return (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Grade {c.grade} · {c.subject}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {c.batchName} · {c.schedule.day}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    <CalendarDays size={14} className="mr-1 inline" />
                    {c.schedule.date} · {formatClassTime(c)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {c.meetUrl ? (
                    <a
                      href={c.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <ExternalLink size={16} />
                      Join Google Meet
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500">
                      Link not generated yet
                    </span>
                  )}
                  <WhiteboardButton
                    classItem={c}
                    role="tutor"
                    user={user}
                    size="sm"
                    onMetaChange={(meta) =>
                      setClasses((prev) =>
                        prev.map((cls) =>
                          cls.id === c.id
                            ? { ...cls, whiteboard_data: JSON.stringify(meta) }
                            : cls
                        )
                      )
                    }
                  />
                </div>
              </div>

              {!c.meetUrl && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  The admin hasn't synced this class to Google Calendar yet, so no Meet link exists.
                  You'll get an email and WhatsApp notification once it's sent.
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="border-t border-slate-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <BookOpen size={18} />
              Class Log
            </h2>
            <p className="text-sm text-slate-600">
              Log what you covered, for any date — add an entry any time, including for classes
              you forgot to log earlier.
            </p>
          </div>
          {editingLogId === null && (
            <button
              onClick={startAddLog}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} />
              Add Entry
            </button>
          )}
        </div>

        {editingLogId !== null && (
          <div className="mb-4 rounded-xl border-2 border-blue-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-900">Date</span>
                <input
                  type="date"
                  value={logForm.logDate}
                  onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-900">Class</span>
                <input
                  list="class-name-suggestions"
                  value={logForm.className}
                  onChange={(e) => setLogForm({ ...logForm, className: e.target.value })}
                  placeholder="e.g. Grade 9 - Mathematics"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                <datalist id="class-name-suggestions">
                  {classNameSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-900">Chapter</span>
                <input
                  value={logForm.chapter}
                  onChange={(e) => setLogForm({ ...logForm, chapter: e.target.value })}
                  placeholder="e.g. Chapter 4"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="text-sm lg:col-span-1 sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-900">Topics Covered</span>
                <input
                  value={logForm.topicsCovered}
                  onChange={(e) => setLogForm({ ...logForm, topicsCovered: e.target.value })}
                  placeholder="e.g. Photosynthesis, practice problems 1-10"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSaveLog}
                disabled={savingLog}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={14} />
                {savingLog ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelLogEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {logsLoading ? (
          <p className="text-sm text-slate-600">Loading log entries…</p>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
            No log entries yet. Click "Add Entry" to log your first class.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Class</th>
                  <th className="px-4 py-2.5">Chapter</th>
                  <th className="px-4 py-2.5">Topics Covered</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{log.log_date}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{log.class_name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{log.chapter || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">{log.topics_covered}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button
                        onClick={() => startEditLog(log)}
                        className="mr-1 rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log)}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
