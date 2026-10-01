import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiClient } from "@/api/apiClient";

/* ============================================================
   TUTOR PAY SLIP

   Opened from Admin Dashboard → Tutor Payouts → "Pay Slip".
   URL: /TutorPaySlip?id=<tutor_payments.id>

   Rendered outside the main Layout (see App.jsx) so the printed
   PDF contains only the slip. Use the browser's Print dialog
   and choose "Save as PDF".

   Pay period  = the calendar month BEFORE payment_date
                 (salary is paid in arrears: a payout dated
                 01 Oct 2026 is for 01–30 Sep 2026).
   Teaching    = from the class timetable (LiveClass rows created
                 in Admin Classroom), matched to the tutor by email.
                 Dates are ignored: only the tutor's WEEKLY timetable
                 (weekday + time + subject + class + batch) matters.
                 One standard Monday–Friday week is built from the
                 tutor's distinct weekly slots (weekday + start time
                 + subject + class + batch). For each slot:
                   student-hours = slot hours × students in that slot
                 Then:
                   Hours / month          = hours per week × 4
                   Student-hours / week   = Σ (slot hours × slot students)
                   Student-hours / month  = student-hours per week × 4
                 e.g. Mon 1h×2 + Tue 1h×1 + Wed 1h×2 + Thu 1h×1
                      = 6 student-hours/week → 24/month
                 Saturday/Sunday classes are not counted.
                 If the timetable has no classes for this tutor,
                 falls back to active Enrollment records.
============================================================ */

const ADMIN_EMAILS = ["krishiv.advt@gmail.com"];

/* window.close() only works on tabs opened by script; fall back to the dashboard. */
const closeSlip = () => {
  window.close();
  setTimeout(() => {
    if (!window.closed) window.location.href = "/AdminDashboard";
  }, 150);
};

const toArray = (res) =>
  Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

const day = (v) => (v ? String(v).slice(0, 10) : "");

const getSubjects = (user) => {
  const raw = user?.subjects_teaching;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {
      /* comma-separated string */
    }
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d) => {
  if (!d) return "—";
  const dt = new Date(`${day(d)}T00:00:00`);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ---------- Amount in words (Indian numbering) ---------- */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const twoDigits = (n) =>
  n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? twoDigits(r) : ""].filter(Boolean).join(" ");
};

const integerToWords = (num) => {
  if (num === 0) return "Zero";
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  return [
    crore ? `${integerToWords(crore)} Crore` : "",
    lakh ? `${twoDigits(lakh)} Lakh` : "",
    thousand ? `${twoDigits(thousand)} Thousand` : "",
    rest ? threeDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const amountInWords = (amount) => {
  const value = Math.round((Number(amount) || 0) * 100);
  const rupees = Math.floor(value / 100);
  const paise = value % 100;
  let text = `Rupees ${integerToWords(rupees)}`;
  if (paise) text += ` and ${twoDigits(paise)} Paise`;
  return `${text} Only`;
};

/* ---------- Pay period helpers ---------- */

const monthWindow = (paymentDate) => {
  const base = day(paymentDate) || new Date().toISOString().slice(0, 10);
  const [py, pm] = base.split("-").map(Number);
  // Previous calendar month (January → December of the previous year)
  const y = pm === 1 ? py - 1 : py;
  const m = pm === 1 ? 12 : pm - 1;
  const last = new Date(y, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    start: `${y}-${mm}-01`,
    end: `${y}-${mm}-${String(last).padStart(2, "0")}`,
    label: new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    code: `${y}-${mm}`,
  };
};

/* An enrollment counts for the month if it had started by the end
   of the month and was still running at some point during it:
   - "active" enrollments count once started.
   - "completed" / "non_active" count if they were last changed
     on or after the first of the month (i.e. ended during or
     after it).
   - "rejected" / "pending_approval" never count. */
const wasActiveInMonth = (e, win) => {
  const status = String(e.status || "").toLowerCase();
  if (status === "rejected" || status === "pending_approval" || status === "pending") {
    return false;
  }
  const started = day(e.enrollment_date) || day(e.created_date);
  if (started && started > win.end) return false;
  if (status === "completed" || status === "non_active") {
    const changed = day(e.updated_date);
    return !changed || changed >= win.start;
  }
  return true;
};

/* ---------- Timetable (LiveClass) helpers ---------- */

const IST_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/* scheduled_date is an ISO timestamp; bucket it by the IST calendar day. */
const istDay = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d) ? day(iso) : IST_DAY.format(d);
};

const parseJSON = (v, fallback) => {
  if (v && typeof v === "object") return v;
  try {
    return JSON.parse(v || "");
  } catch (_) {
    return fallback;
  }
};

const classMeta = (c) => {
  const m = parseJSON(c.description, null);
  return m && m.__acadClassMeta === 1 ? m : {};
};

const classAttendees = (c) => {
  const a = parseJSON(c.attendees, []);
  return Array.isArray(a) ? a : [];
};

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const IST_WEEKDAY = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
const IST_TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

/* Weekday comes from the class's actual scheduled date (IST). The stored
   meta.day label is only a fallback — it can be stale after an edit or a
   copied class, which would merge e.g. a Thursday class into Tuesday. */
const classWeekday = (c, meta) => {
  const d = new Date(c.scheduled_date || "");
  if (!isNaN(d)) return IST_WEEKDAY.format(d);
  return meta.day || "";
};

/* A class belongs to the tutor if ANY identifier matches: the class
   tutor_id, the tutor attendee's id, or the tutor attendee's email. */
const matchesTutor = (c, tid, tutorEmail) => {
  const tutorAtt = classAttendees(c).find((a) => a.role === "tutor");
  const attEmail = String(tutorAtt?.email || c.tutor_email || "").trim().toLowerCase();
  return Boolean(
    (c.tutor_id && c.tutor_id === tid) ||
      (tutorAtt?.id && tutorAtt.id === tid) ||
      (tutorEmail && attEmail && attEmail === tutorEmail)
  );
};

const classStart = (c, meta) => {
  if (meta.startTime) return meta.startTime;
  const d = new Date(c.scheduled_date || "");
  return isNaN(d) ? "" : IST_TIME.format(d);
};

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (Number.isFinite(m) ? m : 0) : null;
};

const classMinutes = (c, meta) => {
  const d = Number(c.duration_minutes);
  if (d > 0) return d;
  const a = toMinutes(meta.startTime);
  const b = toMinutes(meta.endTime);
  return a != null && b != null && b > a ? b - a : 60;
};

const isCancelled = (c) => /cancel/i.test(String(c.status || ""));

const attendeeKey = (a) =>
  a.id || String(a.email || "").trim().toLowerCase() || a.name || "";

const studentKey = (e) =>
  e.student_id || (e.student_email || "").toLowerCase() || e.student_name || e.id;

/* ============================================================ */

export default function TutorPaySlip() {
  const location = useLocation();
  const paymentId = new URLSearchParams(location.search).get("id");

  const [state, setState] = useState({ loading: true, error: "" });
  const [payment, setPayment] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!paymentId) throw new Error("No payout selected. Open this page from the Admin Dashboard.");

        const me = await apiClient.auth.me();
        const isAdmin =
          String(me?.user_type || me?.role || "").toLowerCase() === "admin" ||
          ADMIN_EMAILS.includes(String(me?.email || "").toLowerCase());
        if (!isAdmin) throw new Error("Only admins can view tutor pay slips.");

        const pay = await apiClient.entities.TutorPayment.get(paymentId);
        const p = pay?.data && !pay?.id ? pay.data : pay;
        if (!p?.id) throw new Error("Payout record not found.");
        setPayment(p);

        const [userRes, courseRes, enrollRes, classRes] = await Promise.all([
          p.tutor_id ? apiClient.entities.User.get(p.tutor_id).catch(() => null) : null,
          apiClient.entities.Course.list().catch(() => []),
          apiClient.entities.Enrollment.list().catch(() => []),
          apiClient.entities.LiveClass.list(null, 2000).catch(() => []),
        ]);

        setTutor(userRes?.data && !userRes?.id ? userRes.data : userRes);
        setCourses(toArray(courseRes));
        setEnrollments(toArray(enrollRes));
        setLiveClasses(toArray(classRes));
        setState({ loading: false, error: "" });
      } catch (err) {
        console.error("Pay slip load error:", err);
        setState({ loading: false, error: err.message || "Unable to load pay slip." });
      }
    };
    load();
  }, [paymentId]);

  const win = useMemo(() => monthWindow(payment?.payment_date), [payment]);

  const summary = useMemo(() => {
    const empty = { source: "none", rows: [], students: 0, subjects: [] };
    if (!payment) return empty;

    const tid = payment.tutor_id;
    const tutorEmail = String(tutor?.email || "").trim().toLowerCase();

    /* ---- 1. Class timetable: one standard Mon–Fri week × 4 ---- */
    const allTutorClasses = liveClasses.filter((c) => matchesTutor(c, tid, tutorEmail));
    const tutorClasses = allTutorClasses.filter((c) => !isCancelled(c));

    /* Dates are ignored — the tutor's whole timetable is collapsed into
       one standard Monday–Friday week below. */
    const pool = tutorClasses;

    if (pool.length > 0) {
      /* Collapse repeated weeks into distinct weekly slots. */
      const slots = new Map();

      pool.forEach((c) => {
        const meta = classMeta(c);
        const weekday = classWeekday(c, meta);
        if (!WEEKDAYS.includes(weekday)) return; // Monday–Friday only

        const subject = c.title || "Class";
        const grade = meta.grade ? `Class ${meta.grade}` : "";
        const batch = meta.batchName || "";
        const slotKey = `${weekday}|${classStart(c, meta)}|${subject}|${grade}|${batch}`;

        if (!slots.has(slotKey)) {
          slots.set(slotKey, {
            weekday,
            time: classStart(c, meta),
            subject,
            grade,
            batch,
            minutes: classMinutes(c, meta),
            students: new Set(),
            latest: "",
          });
        }

        /* A slot repeats every week; use the most recent occurrence's
           student list so a student who left/joined isn't double counted. */
        const slot = slots.get(slotKey);
        const when = String(c.scheduled_date || "");
        if (when >= slot.latest) {
          slot.latest = when;
          slot.minutes = classMinutes(c, meta);
          slot.students = new Set(
            classAttendees(c)
              .filter((a) => a.role === "student")
              .map(attendeeKey)
              .filter(Boolean)
          );
        }
      });

      const dayOrder = (d) => WEEKDAYS.indexOf(d);
      const timetable = [...slots.values()]
        .map((sl) => ({
          weekday: sl.weekday,
          time: sl.time,
          subject: sl.subject,
          grade: sl.grade,
          batch: sl.batch,
          hours: sl.minutes / 60,
          count: sl.students.size,
          studentHours: (sl.minutes / 60) * sl.students.size,
        }))
        .sort((x, y) => dayOrder(x.weekday) - dayOrder(y.weekday) || x.time.localeCompare(y.time));

      if (slots.size > 0) {
        const groups = new Map();
        const allStudents = new Set();

        slots.forEach((slot) => {
          const key = `${slot.subject}|${slot.grade}|${slot.batch}`;
          if (!groups.has(key)) {
            groups.set(key, {
              subject: slot.subject,
              grade: slot.grade,
              batch: slot.batch,
              weeklyClasses: 0,
              weeklyMinutes: 0,
              weeklyStudentHours: 0,
              students: new Set(),
            });
          }
          const g = groups.get(key);
          g.weeklyClasses += 1;
          g.weeklyMinutes += slot.minutes;
          g.weeklyStudentHours += (slot.minutes / 60) * slot.students.size;
          slot.students.forEach((k) => {
            g.students.add(k);
            allStudents.add(k);
          });
        });

        const rows = [...groups.values()]
          .map((g) => {
            const weeklyHours = g.weeklyMinutes / 60;
            return {
              ...g,
              count: g.students.size,
              weeklyHours,
              monthlyHours: weeklyHours * 4,
              studentHours: g.weeklyStudentHours * 4,
            };
          })
          .sort((a, b) => a.subject.localeCompare(b.subject) || a.grade.localeCompare(b.grade));

        const sum = (f) => rows.reduce((t, r) => t + r[f], 0);

        return {
          source: "timetable",
          timetable,
          rows,
          students: allStudents.size,
          subjects: [...new Set(rows.map((r) => r.subject))],
          weeklyClasses: sum("weeklyClasses"),
          weeklyHours: sum("weeklyHours"),
          monthlyHours: sum("monthlyHours"),
          weeklyStudentHours: sum("weeklyStudentHours"),
          studentHours: sum("studentHours"),
        };
      }
    }

    /* ---- 2. Fallback: enrollments ---- */
    const courseById = new Map(courses.map((c) => [c.id, c]));
    const tutorCourseIds = new Set(courses.filter((c) => c.tutor_id === tid).map((c) => c.id));

    const relevant = enrollments.filter(
      (e) => (e.tutor_id === tid || tutorCourseIds.has(e.course_id)) && wasActiveInMonth(e, win)
    );

    if (relevant.length === 0) return empty;

    const groups = new Map();
    const allStudents = new Set();

    relevant.forEach((e) => {
      const course = courseById.get(e.course_id);
      const key = e.course_id || e.course_name || "other";
      if (!groups.has(key)) {
        groups.set(key, {
          subject: course?.subject || course?.title || e.course_name || "Course",
          grade: course?.grade_level || "",
          batch: course?.title || e.course_name || "",
          students: new Set(),
        });
      }
      const k = studentKey(e);
      groups.get(key).students.add(k);
      allStudents.add(k);
    });

    const rows = [...groups.values()].map((g) => ({ ...g, count: g.students.size }));

    return {
      source: "enrollments",
      rows,
      students: allStudents.size,
      subjects: [...new Set(rows.map((r) => r.subject))],
    };
  }, [payment, tutor, liveClasses, courses, enrollments, win]);

  /* Screen-only check: every class row read for this tutor. */
  const classCheck = useMemo(() => {
    if (!payment) return [];
    const tid = payment.tutor_id;
    const tutorEmail = String(tutor?.email || "").trim().toLowerCase();
    return liveClasses
      .filter((c) => matchesTutor(c, tid, tutorEmail))
      .map((c) => {
        const meta = classMeta(c);
        const weekday = classWeekday(c, meta);
        return {
          date: istDay(c.scheduled_date),
          weekday,
          storedDay: meta.day || "",
          time: classStart(c, meta),
          subject: c.title || "Class",
          students: classAttendees(c).filter((a) => a.role === "student").length,
          status: c.status || "",
          used: isCancelled(c) ? "No — cancelled" : WEEKDAYS.includes(weekday) ? "Yes" : "No — weekend",
        };
      })
      .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
  }, [payment, tutor, liveClasses]);

  const fmtHours = (h) =>
    h == null ? "—" : Number.isInteger(h) ? String(h) : String(Math.round(h * 100) / 100);

  const slipNo = payment
    ? `ACAD/PS/${win.code}/${String(payment.id).replace(/-/g, "").slice(0, 6).toUpperCase()}`
    : "";

  useEffect(() => {
    if (payment) {
      const name = (payment.tutor_name || tutor?.full_name || "Tutor").replace(/\s+/g, "_");
      document.title = `ACAD_PaySlip_${name}_${win.code}`;
    }
  }, [payment, tutor, win]);

  if (state.loading) {
    return <div className="ps-status">Preparing pay slip…</div>;
  }

  if (state.error) {
    return (
      <div className="ps-status">
        <p>{state.error}</p>
        <button type="button" onClick={closeSlip}>Close</button>
      </div>
    );
  }

  const tutorName = tutor?.full_name || payment.tutor_name || "—";
  const expertise = getSubjects(tutor);

  return (
    <div className="ps-wrap">
      <style>{CSS}</style>

      <div className="ps-toolbar no-print">
        <span>
          Use <strong>Save as PDF</strong> as the destination in the print dialog.
          <span className="ps-build"> · slip v9 (weekday from class date)</span>
        </span>
        <div>
          <button type="button" className="ps-btn ghost" onClick={closeSlip}>Close</button>
          <button type="button" className="ps-btn" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      </div>

      <article className="ps-sheet">
        {/* LETTERHEAD */}
        <header className="ps-head">
          <img src="/images/acad-logo.jpeg" alt="ACAD" className="ps-logo" />
          <div className="ps-org">
            <h1>ACAD Online Coaching</h1>
            <p>Chennai, Tamil Nadu &nbsp;|&nbsp; acadapp.in</p>
          </div>
          <div className="ps-doc">
            <h2>Tutor Pay Slip</h2>
            <p>{win.label}</p>
          </div>
        </header>

        <dl className="ps-meta">
          <div><dt>Slip No.</dt><dd>{slipNo}</dd></div>
          <div><dt>Pay period</dt><dd>{formatDate(win.start)} to {formatDate(win.end)}</dd></div>
          <div><dt>Issued on</dt><dd>{formatDate(new Date().toISOString())}</dd></div>
        </dl>

        {/* TUTOR */}
        <section className="ps-section">
          <h3>Tutor details</h3>
          <dl className="ps-grid">
            <div><dt>Name</dt><dd className="strong">{tutorName}</dd></div>
            <div><dt>Tutor ID</dt><dd>{String(payment.tutor_id || "—").slice(0, 8).toUpperCase()}</dd></div>
            {tutor?.email && <div><dt>Email</dt><dd>{tutor.email}</dd></div>}
            {tutor?.phone && <div><dt>Phone</dt><dd>{tutor.phone}</dd></div>}
            <div className="span">
              <dt>Subject expertise</dt>
              <dd>
                {expertise.length ? (
                  <span className="ps-tags">
                    {expertise.map((s) => <span key={s}>{s}</span>)}
                  </span>
                ) : (
                  "Not recorded"
                )}
              </dd>
            </div>
          </dl>
        </section>

        {/* TEACHING */}
        <section className="ps-section">
          <h3>Teaching summary for {win.label}</h3>
          <div className="ps-figures four">
            {summary.source === "timetable" ? (
              <>
                <div>
                  <span className="num">{summary.weeklyClasses}</span>
                  <span className="lbl">Classes per week (Mon–Fri)</span>
                </div>
                <div>
                  <span className="num">{fmtHours(summary.monthlyHours)}</span>
                  <span className="lbl">Hours taught in month (weekly × 4)</span>
                </div>
                <div>
                  <span className="num">{summary.students}</span>
                  <span className="lbl">Students handled</span>
                </div>
                <div>
                  <span className="num">{fmtHours(summary.weeklyStudentHours)}</span>
                  <span className="lbl">
                    Student-hours / week (× 4 = {fmtHours(summary.studentHours)} / month)
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="num">{summary.students}</span>
                  <span className="lbl">Students handled</span>
                </div>
                <div>
                  <span className="num">{summary.subjects.length}</span>
                  <span className="lbl">Subjects taught</span>
                </div>
              </>
            )}
          </div>

          {summary.source === "timetable" && summary.timetable?.length > 0 && (
            <>
              <h4 className="ps-sub">Weekly timetable</h4>
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Class</th>
                    <th>Batch</th>
                    <th className="r">Hours</th>
                    <th className="r">Students</th>
                    <th className="r">Student-hours</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.timetable.map((t, i) => (
                    <tr key={i}>
                      <td>{t.weekday}</td>
                      <td className="nw">{t.time || "—"}</td>
                      <td>{t.subject}</td>
                      <td className="nw">{t.grade || "—"}</td>
                      <td className="nw">{t.batch || "—"}</td>
                      <td className="r">{fmtHours(t.hours)}</td>
                      <td className="r">{t.count}</td>
                      <td className="r">{fmtHours(t.studentHours)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>Total per week</td>
                    <td className="r">{fmtHours(summary.weeklyHours)}</td>
                    <td className="r">{summary.students}</td>
                    <td className="r">{fmtHours(summary.weeklyStudentHours)}</td>
                  </tr>
                </tfoot>
              </table>
              <h4 className="ps-sub">Monthly summary by subject (week × 4)</h4>
            </>
          )}

          {summary.rows.length > 0 ? (
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Batch</th>
                  {summary.source === "timetable" && <th className="r">Classes / week</th>}
                  {summary.source === "timetable" && <th className="r">Hours / week</th>}
                  {summary.source === "timetable" && <th className="r">Hours / month (×4)</th>}
                  <th className="r">Students</th>
                  {summary.source === "timetable" && <th className="r">Student-hrs / week</th>}
                  {summary.source === "timetable" && <th className="r">Student-hrs / month (×4)</th>}
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.subject}</td>
                    <td className="nw">{r.grade || "—"}</td>
                    <td className="nw">{r.batch || "—"}</td>
                    {summary.source === "timetable" && <td className="r">{r.weeklyClasses}</td>}
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.weeklyHours)}</td>}
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.monthlyHours)}</td>}
                    <td className="r">{r.count}</td>
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.weeklyStudentHours)}</td>}
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.studentHours)}</td>}
                  </tr>
                ))}
              </tbody>
              {summary.source === "timetable" && (
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    <td className="r">{summary.weeklyClasses}</td>
                    <td className="r">{fmtHours(summary.weeklyHours)}</td>
                    <td className="r">{fmtHours(summary.monthlyHours)}</td>
                    <td className="r">{summary.students}</td>
                    <td className="r">{fmtHours(summary.weeklyStudentHours)}</td>
                    <td className="r">{fmtHours(summary.studentHours)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <p className="ps-empty">
              No Monday–Friday classes in the timetable and no active enrollments found for this tutor.
            </p>
          )}

          {summary.source !== "none" && (
            <p className="ps-source">
              {summary.source === "timetable"
                ? `Based on the tutor's weekly Monday–Friday timetable (shown above): student-hours per week = sum of (class hours × students in that class); per month = per week × 4 weeks. Hours per month = hours per week × 4. Students handled counts each student once.`
                : `No timetable classes found for this tutor; students and subjects are based on active course enrollments.`}
            </p>
          )}
        </section>

        {/* PAYMENT */}
        <section className="ps-section">
          <h3>Payment</h3>
          <div className="ps-pay">
            <dl className="ps-grid">
              <div><dt>Payment date</dt><dd>{formatDate(payment.payment_date)}</dd></div>
              <div><dt>Method</dt><dd>{payment.payment_method || "—"}</dd></div>
              <div className="span"><dt>Transaction ID</dt><dd>{payment.transaction_id || "—"}</dd></div>
              {payment.notes && <div className="span"><dt>Notes</dt><dd>{payment.notes}</dd></div>}
            </dl>
            <div className="ps-amount">
              <span className="lbl">Amount paid</span>
              <span className="big">₹{formatINR(payment.amount)}</span>
              <span className="words">{amountInWords(payment.amount)}</span>
            </div>
          </div>
        </section>

        <footer className="ps-foot">
          This is a computer-generated pay slip issued by ACAD Online Coaching and does not
          require a signature. For queries, contact the ACAD admin team quoting the slip number.
        </footer>
      </article>

      <details className="ps-check no-print">
        <summary>
          Timetable check (screen only): {classCheck.length} class
          {classCheck.length === 1 ? "" : "es"} found for this tutor out of {liveClasses.length} in the
          timetable
        </summary>
        <p>
          Every timetable row linked to this tutor. Repeats of the same weekday, time, subject,
          class and batch count once. If a class you expect is missing here, it is assigned to a
          different tutor in Admin Classroom.
        </p>
        <div className="ps-check-scroll">
          <table className="ps-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Stored day</th>
                <th>Time</th>
                <th>Subject</th>
                <th className="r">Students</th>
                <th>Status</th>
                <th>Used</th>
              </tr>
            </thead>
            <tbody>
              {classCheck.map((r, i) => (
                <tr key={i}>
                  <td className="nw">{formatDate(r.date)}</td>
                  <td>{r.weekday}</td>
                  <td className={r.storedDay && r.storedDay !== r.weekday ? "warn" : ""}>
                    {r.storedDay || "—"}
                  </td>
                  <td className="nw">{r.time || "—"}</td>
                  <td>{r.subject}</td>
                  <td className="r">{r.students}</td>
                  <td>{r.status || "—"}</td>
                  <td>{r.used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ============================================================
   STYLES (screen + print)
============================================================ */

const CSS = `
:root {
  --ps-ink: #1d2733;
  --ps-muted: #5d6b7c;
  --ps-blue: #1565C0;
  --ps-rule: #d6dde7;
  --ps-fill: #f2f6fb;
}
body { background: #e9edf2; }
.ps-wrap {
  min-height: 100vh;
  padding: 24px 12px 48px;
  color: var(--ps-ink);
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
}
.ps-status {
  max-width: 480px; margin: 80px auto; padding: 24px; text-align: center;
  font-family: system-ui, sans-serif; color: #334;
}
.ps-status button { margin-top: 12px; padding: 6px 14px; border: 1px solid #ccd; border-radius: 6px; background: #fff; cursor: pointer; }

.ps-toolbar {
  max-width: 210mm; margin: 0 auto 16px; display: flex; flex-wrap: wrap; gap: 10px;
  align-items: center; justify-content: space-between; font-size: 13px; color: var(--ps-muted);
}
.ps-toolbar > div { display: flex; gap: 8px; }
.ps-btn {
  padding: 8px 16px; border-radius: 6px; border: 1px solid var(--ps-blue);
  background: var(--ps-blue); color: #fff; font-weight: 600; font-size: 14px; cursor: pointer;
}
.ps-btn.ghost { background: #fff; color: var(--ps-blue); }
.ps-btn:focus-visible { outline: 2px solid #0d47a1; outline-offset: 2px; }

.ps-sheet {
  max-width: 210mm; margin: 0 auto; background: #fff; padding: 14mm 14mm 10mm;
  box-shadow: 0 1px 3px rgba(20,30,50,.12); border-top: 6px solid var(--ps-blue);
}

.ps-head { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 2px solid var(--ps-ink); }
.ps-logo { width: 62px; height: 62px; object-fit: contain; }
.ps-org { flex: 1; }
.ps-org h1 { margin: 0; font-size: 21px; font-weight: 700; letter-spacing: .2px; }
.ps-org p { margin: 2px 0 0; font-size: 12px; color: var(--ps-muted); }
.ps-doc { text-align: right; }
.ps-doc h2 { margin: 0; font-size: 17px; font-weight: 700; color: var(--ps-blue); }
.ps-doc p { margin: 2px 0 0; font-size: 13px; font-weight: 600; }

.ps-meta { display: flex; flex-wrap: wrap; gap: 6px 28px; margin: 10px 0 0; font-size: 12px; }
.ps-meta div { display: flex; gap: 6px; }
.ps-meta dt { color: var(--ps-muted); }
.ps-meta dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }

.ps-section { margin-top: 18px; }
.ps-section h3 {
  margin: 0 0 8px; font-size: 13px; font-weight: 700; color: var(--ps-blue);
  padding-bottom: 4px; border-bottom: 1px solid var(--ps-rule);
}

.ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 0; font-size: 13px; }
.ps-grid .span { grid-column: 1 / -1; }
.ps-grid dt { color: var(--ps-muted); font-size: 11.5px; }
.ps-grid dd { margin: 1px 0 0; overflow-wrap: anywhere; }
.ps-grid dd.strong { font-weight: 700; font-size: 14px; }

.ps-tags { display: inline-flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
.ps-tags span { border: 1px solid var(--ps-rule); background: var(--ps-fill); border-radius: 4px; padding: 1px 7px; font-size: 12px; }

.ps-figures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border: 1px solid var(--ps-rule); border-radius: 6px; }
.ps-figures.four { grid-template-columns: repeat(4, 1fr); }
.ps-figures > div { padding: 10px 16px; display: flex; flex-direction: column; justify-content: center; }
.ps-figures > div + div { border-left: 1px solid var(--ps-rule); }
.ps-figures .num { font-size: 26px; font-weight: 700; line-height: 1.1; font-variant-numeric: tabular-nums; }
.ps-figures .lbl { font-size: 11.5px; color: var(--ps-muted); }
.ps-sub { margin: 14px 0 0; font-size: 12px; font-weight: 700; color: var(--ps-ink); }
.ps-check { max-width: 210mm; margin: 16px auto 0; background: #fff; padding: 10px 14px; border: 1px dashed var(--ps-rule); font-size: 12px; }
.ps-check summary { cursor: pointer; font-weight: 600; color: var(--ps-blue); }
.ps-check p { margin: 6px 0; color: var(--ps-muted); }
.ps-check-scroll { overflow-x: auto; }
.ps-check td.warn { color: #b45309; font-weight: 700; }
.ps-build { opacity: .6; font-size: 11px; }
.ps-source { font-size: 10.5px; color: var(--ps-muted); margin: 6px 0 0; font-style: italic; }

.ps-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
.ps-table th { text-align: left; font-weight: 600; color: var(--ps-muted); font-size: 11.5px; padding: 6px 8px; background: var(--ps-fill); border-bottom: 1px solid var(--ps-rule); }
.ps-table td { padding: 6px 8px; border-bottom: 1px solid var(--ps-rule); }
.ps-table .nw { white-space: nowrap; }
.ps-table th { line-height: 1.25; }
.ps-table tfoot td { font-weight: 700; border-top: 2px solid var(--ps-ink); border-bottom: 0; }
.ps-table .r { text-align: right; font-variant-numeric: tabular-nums; }
.ps-empty { font-size: 12.5px; color: var(--ps-muted); margin: 10px 0 0; }

.ps-pay { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.ps-amount {
  background: var(--ps-fill); border: 1px solid var(--ps-rule); border-left: 4px solid var(--ps-blue);
  border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column;
}
.ps-amount .lbl { font-size: 11.5px; color: var(--ps-muted); }
.ps-amount .big { font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 2px 0 4px; }
.ps-amount .words { font-size: 12px; font-style: italic; }

.ps-foot { margin-top: 26px; padding-top: 8px; border-top: 1px solid var(--ps-rule); font-size: 10.5px; color: var(--ps-muted); line-height: 1.5; }

@media (max-width: 640px) {
  .ps-sheet { padding: 18px 14px; }
  .ps-head { flex-wrap: wrap; }
  .ps-doc { text-align: left; width: 100%; }
  .ps-grid, .ps-pay { grid-template-columns: 1fr; }
  .ps-figures, .ps-figures.four { grid-template-columns: 1fr 1fr; }
  .ps-figures > div:nth-child(3) { border-left: 0; }
  .ps-figures > div:nth-child(n+3) { border-top: 1px solid var(--ps-rule); }
}

@page { size: A4; margin: 10mm; }
@media print {
  body { background: #fff !important; }
  .no-print { display: none !important; }
  .ps-wrap { padding: 0; min-height: 0; }
  .ps-sheet { box-shadow: none; max-width: none; padding: 0 2mm; }
  .ps-section, .ps-table tr, .ps-pay { break-inside: avoid; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
