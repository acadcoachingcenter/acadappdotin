
import { getAcadApiBase } from "./acadAuth";

const API_BASE = getAcadApiBase();
const NOTIFY_WORKER_URL =
  import.meta.env.VITE_NOTIFY_WORKER_URL ||
  "https://acad-classroom-notify.krishiv-advt.workers.dev";

export const FIXED_MEET_URL = "https://meet.google.com/wsb-ztxe-kwc";

async function apiFetch(path, options = {}) {
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
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
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
  } catch {}

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
      ? {
          id: row.tutor_id,
          name: row.tutor_name || "",
          email: row.tutor_email || "",
          role: "tutor",
        }
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
    studentIds: students.map((s) => s.id).filter(Boolean),
    studentEmails: students.map((s) => s.email).filter(Boolean),
    attendees,
    meetUrl: row.meeting_link || FIXED_MEET_URL,
    schedule: {
      day: meta.day || (start
        ? new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            timeZone: "Asia/Kolkata",
          }).format(start)
        : ""),
      date: scheduled ? scheduled.slice(0, 10) : "",
      timezone: "Asia/Kolkata",
      startTime: meta.startTime || (start
        ? new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Kolkata",
          }).format(start)
        : ""),
      endTime: meta.endTime || (end
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
  const rows = await apiFetch("/api/entities/User?limit=1000");
  const users = Array.isArray(rows) ? rows : [];
  return users
    .filter((u) => String(u.user_type || "").toLowerCase() === type)
    .sort((a, b) =>
      String(a.full_name || a.email).localeCompare(String(b.full_name || b.email))
    );
}

export async function listClassesForUser(user) {
  if (!user) return [];

  const rows = await apiFetch("/api/entities/LiveClass?limit=1000");
  const classes = (Array.isArray(rows) ? rows : []).map(normalizeClass);

  if (user.role === "admin") return classes;

  if (user.role === "tutor") {
    return classes.filter((c) => c.tutorId === user.id);
  }

  if (user.role === "student") {
    return classes.filter((c) =>
      c.attendees.some((a) => a.id === user.id && a.role === "student")
    );
  }

  return [];
}

export async function getClass(classId) {
  return normalizeClass(await apiFetch(`/api/entities/LiveClass/${classId}`));
}

export async function createClass(classData) {
  const attendees = [
    {
      id: classData.tutor.id,
      name: classData.tutor.name,
      email: classData.tutor.email,
      role: "tutor",
    },
    ...classData.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: "student",
    })),
  ];

  const scheduledDate = classData.schedule.startTimeISO;

  const row = await apiFetch("/api/entities/LiveClass", {
    method: "POST",
    body: JSON.stringify({
      course_id: "",
      tutor_id: classData.tutor.id,
      title: classData.subject,
      description: encodeMeta(classData),
      scheduled_date: scheduledDate,
      duration_minutes: classData.durationMinutes || 60,
      meeting_link: FIXED_MEET_URL,
      recording_url: "",
      whiteboard_data: "",
      status: "scheduled",
      attendees,
      materials: [],
    }),
  });

  return normalizeClass(row);
}

export async function updateClass(classId, classData) {
  const attendees = [
    {
      id: classData.tutor.id,
      name: classData.tutor.name,
      email: classData.tutor.email,
      role: "tutor",
    },
    ...classData.students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: "student",
    })),
  ];

  const row = await apiFetch(`/api/entities/LiveClass/${classId}`, {
    method: "PUT",
    body: JSON.stringify({
      tutor_id: classData.tutor.id,
      title: classData.subject,
      description: encodeMeta(classData),
      scheduled_date: classData.schedule.startTimeISO,
      duration_minutes: classData.durationMinutes || 60,
      meeting_link: FIXED_MEET_URL,
      status: classData.status || "scheduled",
      attendees,
    }),
  });

  return normalizeClass(row);
}

export async function deleteClass(classId) {
  await apiFetch(`/api/entities/LiveClass/${classId}`, { method: "DELETE" });
  return true;
}

export async function syncClassToCalendar(classItem) {
  const meta = decodeClassMeta(classItem);
  const students = classItem.attendees
    .filter((a) => a.role === "student")
    .map((a) => ({ name: a.name, email: a.email }));

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
      tutor: { name: tutor.name, email: tutor.email },
      students,
      startTime: classItem.schedule.startTimeISO,
      endTime: classItem.schedule.endTimeISO,
      meetUrl: FIXED_MEET_URL,
    }),
  });

  if (!res.ok) {
    throw new Error(`Google Calendar sync failed: ${await res.text()}`);
  }

  const data = await res.json();

  const updatedRow = await apiFetch(`/api/entities/LiveClass/${classItem.id}`, {
    method: "PUT",
    body: JSON.stringify({
      meeting_link: FIXED_MEET_URL,
      status: "scheduled",
    }),
  });

  return {
    ...data,
    meetUrl: FIXED_MEET_URL,
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
  const opts = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  return `${new Date(start).toLocaleTimeString("en-IN", opts)} - ${new Date(
    end
  ).toLocaleTimeString("en-IN", opts)}`;
}
