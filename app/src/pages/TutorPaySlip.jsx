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

   Pay period  = calendar month of payment_date.
   Teaching    = from the class timetable (LiveClass rows created
                 in Admin Classroom), matched to the tutor by email.
                 One standard Monday–Friday week is built from the
                 tutor's distinct weekly slots (weekday + start time
                 + subject + class + batch), then per subject row:
                   Hours / month  = hours per week × 4
                   Student-hours  = hours / month × students
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
  const [y, m] = base.split("-").map(Number);
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

const classWeekday = (c, meta) => {
  if (meta.day) return meta.day;
  const d = new Date(c.scheduled_date || "");
  return isNaN(d) ? "" : IST_WEEKDAY.format(d);
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
    const isTutorsClass = (c) => {
      const tutorAtt = classAttendees(c).find((a) => a.role === "tutor");
      const attEmail = String(tutorAtt?.email || c.tutor_email || "").trim().toLowerCase();
      if (tutorEmail && attEmail) return attEmail === tutorEmail;
      return (c.tutor_id && c.tutor_id === tid) || (tutorAtt?.id && tutorAtt.id === tid);
    };

    const tutorClasses = liveClasses.filter((c) => !isCancelled(c) && isTutorsClass(c));

    /* Prefer the pay month's classes; if the timetable has none in
       that month, use the tutor's classes up to the end of it. */
    let basis = "month";
    let pool = tutorClasses.filter((c) => {
      const d = istDay(c.scheduled_date);
      return d && d >= win.start && d <= win.end;
    });
    if (pool.length === 0) {
      basis = "standing";
      pool = tutorClasses.filter((c) => {
        const d = istDay(c.scheduled_date);
        return !d || d <= win.end;
      });
    }

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
            subject,
            grade,
            batch,
            minutes: classMinutes(c, meta),
            students: new Set(),
          });
        }

        classAttendees(c)
          .filter((a) => a.role === "student")
          .forEach((a) => {
            const k = attendeeKey(a);
            if (k) slots.get(slotKey).students.add(k);
          });
      });

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
              students: new Set(),
            });
          }
          const g = groups.get(key);
          g.weeklyClasses += 1;
          g.weeklyMinutes += slot.minutes;
          slot.students.forEach((k) => {
            g.students.add(k);
            allStudents.add(k);
          });
        });

        const rows = [...groups.values()]
          .map((g) => {
            const weeklyHours = g.weeklyMinutes / 60;
            const monthlyHours = weeklyHours * 4;
            const count = g.students.size;
            return {
              ...g,
              count,
              weeklyHours,
              monthlyHours,
              studentHours: monthlyHours * count,
            };
          })
          .sort((a, b) => a.subject.localeCompare(b.subject) || a.grade.localeCompare(b.grade));

        const sum = (f) => rows.reduce((t, r) => t + r[f], 0);

        return {
          source: "timetable",
          basis,
          rows,
          students: allStudents.size,
          subjects: [...new Set(rows.map((r) => r.subject))],
          weeklyClasses: sum("weeklyClasses"),
          weeklyHours: sum("weeklyHours"),
          monthlyHours: sum("monthlyHours"),
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

  const fmtHours = (h) =>
    h == null ? "—" : Number.isInteger(h) ? String(h) : h.toFixed(1);

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
        <span>Use <strong>Save as PDF</strong> as the destination in the print dialog.</span>
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
                  <span className="num">{fmtHours(summary.studentHours)}</span>
                  <span className="lbl">Student-hours (hours × students)</span>
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
                  {summary.source === "timetable" && <th className="r">Student-hours</th>}
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.subject}</td>
                    <td>{r.grade || "—"}</td>
                    <td>{r.batch || "—"}</td>
                    {summary.source === "timetable" && <td className="r">{r.weeklyClasses}</td>}
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.weeklyHours)}</td>}
                    {summary.source === "timetable" && <td className="r">{fmtHours(r.monthlyHours)}</td>}
                    <td className="r">{r.count}</td>
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
                ? `Calculated from one standard Monday–Friday week of the ACAD class timetable${
                    summary.basis === "standing" ? " (no classes dated in " + win.label + ", so the tutor's current weekly schedule is used)" : ""
                  }: hours per month = hours per week × 4; student-hours = hours per month × students in that subject. Students are counted once even if they attend more than one subject.`
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
.ps-source { font-size: 10.5px; color: var(--ps-muted); margin: 6px 0 0; font-style: italic; }

.ps-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12.5px; }
.ps-table th { text-align: left; font-weight: 600; color: var(--ps-muted); font-size: 11.5px; padding: 6px 8px; background: var(--ps-fill); border-bottom: 1px solid var(--ps-rule); }
.ps-table td { padding: 6px 8px; border-bottom: 1px solid var(--ps-rule); }
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
