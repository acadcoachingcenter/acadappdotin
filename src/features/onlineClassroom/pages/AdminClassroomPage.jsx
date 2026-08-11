
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Save, Trash2, X, Users, Video } from "lucide-react";
import {
  createClass,
  decodeClassMeta,
  deleteClass,
  FIXED_MEET_URL,
  listAcadUsers,
  listClassesForUser,
  syncClassToCalendar,
  updateClass,
} from "../../../lib/classroomApi";

const INDIA_TIMEZONE = "Asia/Kolkata";
const INDIA_OFFSET = "+05:30";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
  { id: "morning", name: "Morning", startTime: "06:00", endTime: "07:00" },
  { id: "evening-a", name: "Evening A", startTime: "18:00", endTime: "19:00" },
  { id: "evening-b", name: "Evening B", startTime: "19:00", endTime: "20:00" },
];

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Science",
  "English",
  "Tamil",
  "Hindi",
  "Computer Science",
];

function todayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}

function dayFromDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: INDIA_TIMEZONE,
  }).format(new Date(`${date}T12:00:00${INDIA_OFFSET}`));
}

function formatTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function iso(date, time) {
  return `${date}T${time}:00${INDIA_OFFSET}`;
}

function emptyForm() {
  const date = todayIST();
  return {
    grade: "9",
    subject: "Mathematics",
    batchName: "Morning",
    date,
    day: dayFromDate(date),
    timeSlot: "morning",
    tutorId: "",
    studentIds: [],
  };
}

function classToForm(c) {
  const meta = decodeClassMeta(c);
  const slot =
    TIME_SLOTS.find(
      (s) =>
        s.startTime === c.schedule?.startTime &&
        s.endTime === c.schedule?.endTime
    ) || TIME_SLOTS[0];

  return {
    grade: String(meta.grade || 9),
    subject: c.subject || "Mathematics",
    batchName: meta.batchName || slot.name,
    date: c.schedule?.date || todayIST(),
    day: c.schedule?.day || dayFromDate(c.schedule?.date),
    timeSlot: slot.id,
    tutorId: c.tutorId || "",
    studentIds: c.studentIds || [],
  };
}

export default function AdminClassroomPage({ user }) {
  const [classes, setClasses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const [classRows, tutorRows, studentRows] = await Promise.all([
        listClassesForUser(user),
        listAcadUsers("tutor"),
        listAcadUsers("student"),
      ]);
      setClasses(classRows);
      setTutors(tutorRows);
      setStudents(studentRows);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Unable to load ACAD classroom data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user]);

  const grouped = useMemo(() => {
    const out = Object.fromEntries(DAYS.map((d) => [d, []]));
    for (const c of classes) {
      const d = c.schedule?.day;
      if (out[d]) out[d].push(c);
    }
    Object.values(out).forEach((items) =>
      items.sort((a, b) =>
        String(a.schedule?.startTime).localeCompare(String(b.schedule?.startTime))
      )
    );
    return out;
  }, [classes]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setShowEditor(true);
  }

  function openEdit(c) {
    setEditingId(c.id);
    setForm(classToForm(c));
    setMessage("");
    setShowEditor(true);
  }

  function closeEditor() {
    setShowEditor(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function toggleStudent(id) {
    setForm((current) => ({
      ...current,
      studentIds: current.studentIds.includes(id)
        ? current.studentIds.filter((x) => x !== id)
        : [...current.studentIds, id],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    const day = dayFromDate(form.date);

    if (!form.date || !form.tutorId) {
      setMessage("Please select the class date and tutor.");
      return;
    }

    if (day === "Saturday" || day === "Sunday") {
      setMessage("ACAD live classes are scheduled Monday to Friday only.");
      return;
    }

    if (!form.studentIds.length) {
      setMessage("Please select at least one ACAD student.");
      return;
    }

    const tutor = tutors.find((t) => t.id === form.tutorId);
    const selectedStudents = students.filter((s) =>
      form.studentIds.includes(s.id)
    );
    const slot =
      TIME_SLOTS.find((s) => s.id === form.timeSlot) || TIME_SLOTS[0];

    const classData = {
      grade: Number(form.grade),
      subject: day === "Friday" ? "Revision / Weekly Test" : form.subject,
      batchName: form.batchName || slot.name,
      tutor: {
        id: tutor.id,
        name: tutor.full_name || tutor.email,
        email: tutor.email,
      },
      students: selectedStudents.map((s) => ({
        id: s.id,
        name: s.full_name || s.email,
        email: s.email,
      })),
      durationMinutes: 60,
      schedule: {
        day,
        date: form.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startTimeISO: iso(form.date, slot.startTime),
      },
      status: "scheduled",
    };

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateClass(editingId, classData);
        setMessage("Class updated. Click Google Calendar to send/update the invitations.");
      } else {
        await createClass(classData);
        setMessage("Class created. Click Google Calendar to notify the tutor and students.");
      }
      closeEditor();
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCalendar(c) {
    setSyncingId(c.id);
    setMessage("");
    try {
      const result = await syncClassToCalendar(c);
      setMessage(
        `Google Calendar invitation sent to the tutor and ${Math.max(
          0,
          (c.attendees?.length || 1) - 1
        )} student(s).`
      );
      if (result.calendarLink) {
        window.open(result.calendarLink, "_blank", "noopener,noreferrer");
      }
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Google Calendar sync failed.");
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete ${c.subject} - ${c.batchName}?`)) return;
    try {
      await deleteClass(c.id);
      await refresh();
      setMessage("Class deleted.");
    } catch (err) {
      setMessage(err.message || "Unable to delete class.");
    }
  }

  if (loading) return <p className="text-slate">Loading ACAD classroom data…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Live Class Timetable
          </h2>
          <p className="mt-1 text-sm text-slate">
            Tutor and student details are taken directly from ACAD login/user records.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} />
          Schedule Class
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-chalkline bg-white px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <div className="flex items-start gap-2">
          <Video size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Default Google Meet</strong>
            <div className="mt-1 font-mono text-xs">{FIXED_MEET_URL}</div>
            <p className="mt-1">
              This link is fixed for the ACAD class. The admin/host starts the meeting;
              tutors and students join through the same link.
            </p>
          </div>
        </div>
      </div>

      {showEditor && (
        <form onSubmit={handleSave} className="rounded-xl border border-chalkline bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {editingId ? "Edit Live Class" : "Schedule Live Class"}
              </h3>
              <p className="text-sm text-slate">
                Selecting a tutor/student uses the ACAD account records; no manual email entry is required.
              </p>
            </div>
            <button type="button" onClick={closeEditor} className="rounded-lg p-2 text-slate hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Grade</span>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full rounded-lg border border-chalkline px-3 py-2"
              >
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => {
                  const date = e.target.value;
                  setForm({ ...form, date, day: dayFromDate(date) });
                }}
                className="w-full rounded-lg border border-chalkline px-3 py-2"
                required
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Day</span>
              <input
                value={form.day}
                readOnly
                className="w-full rounded-lg border border-chalkline bg-slate-50 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Time</span>
              <select
                value={form.timeSlot}
                onChange={(e) => {
                  const slot = TIME_SLOTS.find((s) => s.id === e.target.value);
                  setForm({
                    ...form,
                    timeSlot: e.target.value,
                    batchName: slot?.name || form.batchName,
                  });
                }}
                className="w-full rounded-lg border border-chalkline px-3 py-2"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {formatTime(s.startTime)} to {formatTime(s.endTime)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Subject</span>
              <select
                value={form.day === "Friday" ? "Revision / Weekly Test" : form.subject}
                disabled={form.day === "Friday"}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-chalkline px-3 py-2 disabled:bg-slate-100"
              >
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                <option>Revision / Weekly Test</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink">Batch</span>
              <input
                value={form.batchName}
                onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                className="w-full rounded-lg border border-chalkline px-3 py-2"
              />
            </label>

            <label className="text-sm md:col-span-2 lg:col-span-3">
              <span className="mb-1 block font-medium text-ink">Tutor</span>
              <select
                value={form.tutorId}
                onChange={(e) => setForm({ ...form, tutorId: e.target.value })}
                className="w-full rounded-lg border border-chalkline px-3 py-2"
                required
              >
                <option value="">Select an ACAD tutor</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email} — {t.email}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 lg:col-span-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <Users size={16} />
                Students
              </div>
              <div className="max-h-56 overflow-auto rounded-lg border border-chalkline p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-slate">No ACAD student accounts found.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {students.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={form.studentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                        />
                        <span className="text-sm">
                          <strong>{s.full_name || s.email}</strong>
                          <span className="ml-1 text-slate">({s.email})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-ink">Google Meet link</label>
              <input
                value={FIXED_MEET_URL}
                readOnly
                className="mt-1 w-full rounded-lg border border-chalkline bg-slate-50 px-3 py-2 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-slate">
                Automatically filled. It is intentionally not editable.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : editingId ? "Save Changes" : "Schedule Class"}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-chalkline px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {DAYS.map((day) => (
          <section key={day} className="overflow-hidden rounded-xl border border-chalkline bg-white">
            <div className="flex items-center gap-2 border-b border-chalkline px-5 py-3">
              <CalendarDays size={17} className="text-slate" />
              <h3 className="font-display font-semibold text-ink">{day}</h3>
            </div>

            {grouped[day]?.length ? (
              <div className="divide-y divide-chalkline">
                {grouped[day].map((c) => (
                  <div key={c.id} className="p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate">Time</p>
                          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink">
                            <Clock size={14} />
                            {formatTime(c.schedule?.startTime)} - {formatTime(c.schedule?.endTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate">Grade</p>
                          <p className="mt-1 text-sm font-semibold text-ink">Grade {c.grade}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate">Subject</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{c.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate">Batch</p>
                          <p className="mt-1 text-sm text-ink">{c.batchName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate">Tutor / Students</p>
                          <p className="mt-1 text-sm text-ink">
                            {c.tutorName} / {c.studentIds?.length || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-chalkline px-3 py-2 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCalendar(c)}
                          disabled={syncingId === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <CalendarDays size={14} />
                          {syncingId === c.id ? "Sending…" : "Google Calendar"}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate">
                      Meet: <span className="font-mono">{FIXED_MEET_URL}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-slate">No classes scheduled.</div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
