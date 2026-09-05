import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Save, Trash2, X, Users, Video } from "lucide-react";
import {
  createClass,
  decodeClassMeta,
  deleteClass,
  listAcadUsers,
  listClassesForUser,
  syncClassToCalendar,
  updateClass,
} from "@/lib/classroomApi";

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
    TIME_SLOTS.find((s) => s.startTime === c.schedule?.startTime && s.endTime === c.schedule?.endTime) ||
    TIME_SLOTS[0];

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
      items.sort((a, b) => String(a.schedule?.startTime).localeCompare(String(b.schedule?.startTime)))
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
    const selectedStudents = students.filter((s) => form.studentIds.includes(s.id));
    const slot = TIME_SLOTS.find((s) => s.id === form.timeSlot) || TIME_SLOTS[0];

    const classData = {
      grade: Number(form.grade),
      subject: day === "Friday" ? "Revision / Weekly Test" : form.subject,
      batchName: form.batchName || slot.name,
      tutor: {
        id: tutor.id,
        name: tutor.full_name || tutor.email,
        email: tutor.email,
        // Sourced directly from the tutor's own ACAD profile - no manual
        // entry. Tutors without a phone on file simply won't get a
        // WhatsApp message; they still get the Calendar invite + email.
        phone: tutor.phone || "",
      },
      students: selectedStudents.map((s) => ({
        id: s.id,
        name: s.full_name || s.email,
        email: s.email,
        phone: s.phone || "",
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
        )} student(s). WhatsApp sent to ${result.whatsapp?.attempted ?? 0} recipient(s).`
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

  if (loading) return <p className="text-slate-600">Loading ACAD classroom data…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Live Class Timetable</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tutor and student details, including WhatsApp numbers, are taken directly from ACAD
            login/user records.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} />
          Schedule Class
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <div className="flex items-start gap-2">
          <Video size={18} className="mt-0.5 shrink-0" />
          <div>
            <strong>Per-class Google Meet</strong>
            <p className="mt-1">
              Each class gets its own Google Meet link, generated automatically the first time you
              click "Google Calendar" below. Tutor and students are notified by email and WhatsApp
              (when a phone number is on file).
            </p>
          </div>
        </div>
      </div>

      {showEditor && (
        <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Live Class" : "Schedule Live Class"}
              </h3>
              <p className="text-sm text-slate-600">
                Selecting a tutor/student uses the ACAD account records; no manual email or phone
                entry is required.
              </p>
            </div>
            <button type="button" onClick={closeEditor} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Grade</span>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => {
                  const date = e.target.value;
                  setForm({ ...form, date, day: dayFromDate(date) });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Day</span>
              <input
                value={form.day}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Time</span>
              <select
                value={form.timeSlot}
                onChange={(e) => {
                  const slot = TIME_SLOTS.find((s) => s.id === e.target.value);
                  setForm({ ...form, timeSlot: e.target.value, batchName: slot?.name || form.batchName });
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {formatTime(s.startTime)} to {formatTime(s.endTime)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Subject</span>
              <select
                value={form.day === "Friday" ? "Revision / Weekly Test" : form.subject}
                disabled={form.day === "Friday"}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              >
                {SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
                <option>Revision / Weekly Test</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-900">Batch</span>
              <input
                value={form.batchName}
                onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm md:col-span-2 lg:col-span-3">
              <span className="mb-1 block font-medium text-slate-900">Tutor</span>
              <select
                value={form.tutorId}
                onChange={(e) => setForm({ ...form, tutorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                <option value="">Select an ACAD tutor</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email} — {t.email}
                    {t.phone ? ` — ${t.phone}` : " — no phone on file"}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 lg:col-span-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                <Users size={16} />
                Students
              </div>
              <div className="max-h-56 overflow-auto rounded-lg border border-slate-300 p-3">
                {students.length === 0 ? (
                  <p className="text-sm text-slate-600">No ACAD student accounts found.</p>
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
                          <span className="ml-1 text-slate-500">
                            ({s.email}{s.phone ? `, ${s.phone}` : ", no phone on file"})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : editingId ? "Save Changes" : "Schedule Class"}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {DAYS.map((day) => (
          <section key={day} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
              <CalendarDays size={17} className="text-slate-500" />
              <h3 className="font-semibold text-slate-900">{day}</h3>
            </div>

            {grouped[day]?.length ? (
              <div className="divide-y divide-slate-200">
                {grouped[day].map((c) => (
                  <div key={c.id} className="p-4">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Time</p>
                          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-900">
                            <Clock size={14} />
                            {formatTime(c.schedule?.startTime)} - {formatTime(c.schedule?.endTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Grade</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">Grade {c.grade}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Subject</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{c.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Batch</p>
                          <p className="mt-1 text-sm text-slate-900">{c.batchName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Tutor / Students</p>
                          <p className="mt-1 text-sm text-slate-900">
                            {c.tutorName} / {c.studentIds?.length || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCalendar(c)}
                          disabled={syncingId === c.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
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

                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Meet:{" "}
                      <span className="font-mono">
                        {c.meetUrl || "Not generated yet — click Google Calendar"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-slate-600">No classes scheduled.</div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
