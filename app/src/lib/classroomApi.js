import { apiClient } from "@/api/apiClient";

// Dedicated Cloudflare Worker that creates the Calendar event + Meet link
// and sends email/WhatsApp notifications. Separate from the main ACAD API
// Worker (apiClient/API_BASE) by design - this one only needs Google
// Calendar + Gmail + Meta WhatsApp credentials, not the full ACAD DB.
const NOTIFY_WORKER_URL =
  import.meta.env.VITE_NOTIFY_WORKER_URL ||
  "https://acad-classroom-notify.krishiv-advt.workers.dev";

// Matches the ADMIN_EMAILS allowlist in Layout.jsx - ACAD determines admin
// status by email allowlist, not a "role"/user_type value. Keep these two
// lists in sync if the admin list ever changes.
const ADMIN_EMAILS = ["krishiv.advt@gmail.com"];

export function isAcadAdmin(user) {
  return ADMIN_EMAILS.includes(String(user?.email || "").toLowerCase());
}

export function acadUserType(user) {
  return String(user?.user_type || "").toLowerCase();
}

function encodeMeta({ grade, batchName, day, startTime, endTime }) {
  return JSON.stringify({
    __acadClassMeta: 1,
    grade: Number(grade),
    batchName: batchName || "",
    day: day || "",
    startTime: startTime || "",
    endTime: endTime || "",
  });
}

export function decodeClassMeta(classItem) {
  try {
    const parsed = JSON.parse(classItem?.description || "");
    if (parsed?.__acadClassMeta === 1) return parsed;
  } catch {
    // fall through to defaults below
  }

  return {
    grade: classItem?.grade || "",
    batchName: classItem?.batchName || "",
    day: "",
    startTime: "",
    endTime: "",
  };
}

function normalizeClass(row) {
  const meta = decodeClassMeta(row);
  const attendees = Array.isArray(row.attendees)
    ? row.attendees
    : (() => {
        try {
          return JSON.parse(row.attendees || "[]");
        } catch {
          return [];
        }
      })();

  const tutor =
    attendees.find((a) => a.role === "tutor") ||
    (row.tutor_id
      ? { id: row.tutor_id, name: row.tutor_name || "", email: row.tutor_email || "", role: "tutor" }
      : null);

  const students = attendees.filter((a) => a.role === "student");

  const scheduled = row.scheduled_date || "";
  const duration = Number(row.duration_minutes || 60);
  const start = scheduled ? new Date(scheduled) : null;
  const end = start ? new Date(start.getTime() + duration * 60000) : null;

  return {
    ...row,
    id: row.id,
    grade: meta.grade,
    subject: row.title || "Class",
    batchName: meta.batchName,
    tutorId: tutor?.id || row.tutor_id || "",
    tutorName: tutor?.name || "",
    tutorEmail: tutor?.email || "",
    tutorPhone: tutor?.phone || "",
    studentIds: students.map((s) => s.id).filter(Boolean),
    studentEmails: students.map((s) => s.email).filter(Boolean),
    attendees,
    // No more static fallback - meeting_link is the real value the Worker
    // wrote back after generating a Calendar event, or empty until the
    // class has been synced at least once.
    meetUrl: row.meeting_link || "",
    schedule: {
      day:
        meta.day ||
        (start
          ? new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" }).format(start)
          : ""),
      date: scheduled ? scheduled.slice(0, 10) : "",
      timezone: "Asia/Kolkata",
      startTime:
        meta.startTime ||
        (start
          ? new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            }).format(start)
          : ""),
      endTime:
        meta.endTime ||
        (end
          ? new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            }).format(end)
          : ""),
      startTimeISO: scheduled,
      endTimeISO: end?.toISOString() || "",
    },
  };
}

export async function listAcadUsers(type) {
  const rows = await apiClient.entities.User.list(null, 1000);
  const users = Array.isArray(rows) ? rows : [];
  return users
    .filter((u) => String(u.user_type || "").toLowerCase() === type)
    .sort((a, b) => String(a.full_name || a.email).localeCompare(String(b.full_name || b.email)));
}

// Students for the class-scheduling picker come from active Enrollment
// records (AdminEnrollmentManagement), not raw User signups - many
// students are added directly by admin during enrollment and never
// separately create/complete a full ACAD account, so the `users` table
// alone misses them. Enrollment records also already carry the WhatsApp
// number collected at enrollment time, which is exactly what's needed here.
export async function listActiveEnrolledStudents() {
  const rows = await apiClient.entities.Enrollment.list("-created_date", 1000);
  const enrollments = Array.isArray(rows) ? rows : [];

  const byEmail = new Map();

  for (const e of enrollments) {
    if (e.status !== "active") continue;

    const email = (e.student_email || "").trim().toLowerCase();
    // Some numbers were entered with a leading apostrophe (a spreadsheet
    // text-format artifact) or spaces - strip everything but digits.
    const phone = (e.student_whatsapp || "").replace(/[^\d]/g, "");
    const key = email || `whatsapp:${phone}`;
    if (!key) continue;

    // One student may have multiple active enrollments (different
    // courses/tutors) - keep one entry per student for the picker, merging
    // in a phone number if an earlier record for the same student lacked one.
    const existing = byEmail.get(key);
    if (existing) {
      if (!existing.phone && phone) existing.phone = phone;
      continue;
    }

    byEmail.set(key, {
      id: e.student_id || e.id,
      full_name: e.student_name || e.student_email || e.student_whatsapp || "Student",
      email: e.student_email || "",
      phone,
    });
  }

  return [...byEmail.values()].sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function listClassesForUser(user) {
  if (!user) return [];

  const rows = await apiClient.entities.LiveClass.list(null, 1000);
  const classes = (Array.isArray(rows) ? rows : []).map(normalizeClass);

  if (isAcadAdmin(user)) return classes;

  const type = acadUserType(user);

  if (type === "tutor") {
    return classes.filter((c) => c.tutorId === user.id);
  }

  if (type === "student") {
    return classes.filter((c) => c.attendees.some((a) => a.id === user.id && a.role === "student"));
  }

  return [];
}

export async function getClass(classId) {
  return normalizeClass(await apiClient.entities.LiveClass.get(classId));
}

function buildAttendees(classData) {
  return [
    {
      id: classData.tutor.id,
      name: classData.tutor.name,
      email: classData.tutor.email,
      phone: classData.tutor.phone || "",
      role: "tutor",
    },
    ...classData.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone || "",
      role: "student",
    })),
  ];
}

export async function createClass(classData) {
  const attendees = buildAttendees(classData);
  const scheduledDate = classData.schedule.startTimeISO;

  const row = await apiClient.entities.LiveClass.create({
    course_id: "",
    tutor_id: classData.tutor.id,
    title: classData.subject,
    description: encodeMeta(classData),
    scheduled_date: scheduledDate,
    duration_minutes: classData.durationMinutes || 60,
    meeting_link: "",
    recording_url: "",
    whiteboard_data: "",
    status: "scheduled",
    attendees,
    materials: [],
  });

  return normalizeClass(row);
}

export async function updateClass(classId, classData) {
  const attendees = buildAttendees(classData);

  const row = await apiClient.entities.LiveClass.update(classId, {
    tutor_id: classData.tutor.id,
    title: classData.subject,
    description: encodeMeta(classData),
    scheduled_date: classData.schedule.startTimeISO,
    duration_minutes: classData.durationMinutes || 60,
    status: classData.status || "scheduled",
    attendees,
  });

  return normalizeClass(row);
}

export async function deleteClass(classId) {
  await apiClient.entities.LiveClass.delete(classId);
  return true;
}

export async function syncClassToCalendar(classItem) {
  const meta = decodeClassMeta(classItem);
  const students = classItem.attendees
    .filter((a) => a.role === "student")
    .map((a) => ({ name: a.name, email: a.email, phone: a.phone || undefined }));

  const tutor = classItem.attendees.find((a) => a.role === "tutor");

  if (!tutor?.email) {
    throw new Error("The selected tutor does not have an email address in ACAD.");
  }

  const res = await fetch(`${NOTIFY_WORKER_URL}/api/calendar/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classId: classItem.id,
      subject: classItem.subject,
      batchName: meta.batchName,
      grade: meta.grade,
      tutor: { name: tutor.name, email: tutor.email, phone: tutor.phone || undefined },
      students,
      startTime: classItem.schedule.startTimeISO,
      endTime: classItem.schedule.endTimeISO,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar sync failed: ${await res.text()}`);
  }

  const data = await res.json();

  if (!data.meetUrl) {
    throw new Error("Calendar sync succeeded but no Meet link was returned.");
  }

  // Store the REAL, dynamically-generated Meet link - previously this
  // overwrote it with a hardcoded fallback URL, throwing away the actual
  // per-class link the Worker just created.
  const updatedRow = await apiClient.entities.LiveClass.update(classItem.id, {
    meeting_link: data.meetUrl,
    status: "scheduled",
  });

  return {
    ...data,
    meetUrl: data.meetUrl,
    classItem: normalizeClass(updatedRow),
  };
}

export function classStatus(classItem) {
  const start = new Date(classItem?.schedule?.startTimeISO || "");
  const end = new Date(classItem?.schedule?.endTimeISO || "");
  const now = Date.now();

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    if (now >= start.getTime() && now <= end.getTime()) return "live";
    if (start.getTime() - now <= 15 * 60000 && start.getTime() > now) {
      return "live-soon";
    }
  }

  return "upcoming";
}

export function formatClassTime(classItem) {
  const start = classItem.schedule?.startTimeISO;
  const end = classItem.schedule?.endTimeISO;
  if (!start || !end) return "";
  const opts = { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" };
  return `${new Date(start).toLocaleTimeString("en-IN", opts)} - ${new Date(end).toLocaleTimeString(
    "en-IN",
    opts
  )}`;
}
