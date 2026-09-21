// enrollment.js — add next to tutorToken.js in the ACAD API Worker (the one behind api.acadapp.in).
//
// isEnrolledInNeetJee(user, env) is true when this student has a CURRENT enrolment in the NEET | JEE course.
// It reads the tables your API already has:  enrollments  (+ courses, for the course title).
//
// Matching, in plain words:
//   - the enrolment must belong to this student: student_id = their id, OR student_email = their email
//     (both come from the signed-in user record on the server, never from the browser)
//   - its status must be one of the "current" statuses (default list below; change with TUTOR_ACTIVE_STATUSES)
//   - the course must be the NEET | JEE course: its id is in TUTOR_COURSE_IDS, or its title / course_name
//     contains the whole word NEET or JEE ("NEET | JEE Intense", "IIT-JEE", "NEET Foundation" match;
//     names like "Jeeva" do not)
//
// Optional variables on the ACAD API Worker (all optional):
//   TUTOR_ACTIVE_STATUSES = "active,enrolled,approved,confirmed,paid,ongoing"
//   TUTOR_COURSE_IDS      = "abc123,def456"     (exact course ids. When set, ONLY these courses count and title matching is off)
//
// It assumes the D1 binding is called DB — change env.DB below if yours has another name.

const DEFAULT_ACTIVE = ['active', 'enrolled', 'approved', 'confirmed', 'paid', 'ongoing'];
const NEET_JEE_WORD = /(^|[^a-z0-9])(neet|jee)([^a-z0-9]|$)/i;

const list = (v, fallback = []) =>
  String(v || '').split(',').map((s) => s.trim()).filter(Boolean).length
    ? String(v).split(',').map((s) => s.trim()).filter(Boolean)
    : fallback;

// If TUTOR_COURSE_IDS is set it is EXCLUSIVE (only those courses count). Otherwise the title is matched.
export function isNeetJeeCourse(row, courseIds = []) {
  if (courseIds.length) return !!row.course_id && courseIds.includes(String(row.course_id));
  return NEET_JEE_WORD.test(String(row.course_title || '')) || NEET_JEE_WORD.test(String(row.course_name || ''));
}

export async function isEnrolledInNeetJee(user, env) {
  const db = env.DB;
  if (!db || !user) return false;
  const uid = String(user.id ?? user._id ?? '').trim() || null;
  const email = String(user.email || '').trim().toLowerCase() || null;
  if (!uid && !email) return false;

  const statuses = list(env.TUTOR_ACTIVE_STATUSES, DEFAULT_ACTIVE).map((s) => s.toLowerCase());
  const courseIds = list(env.TUTOR_COURSE_IDS).map(String);

  const { results } = await db.prepare(
    `SELECT e.course_id, e.course_name, e.status, c.title AS course_title
       FROM enrollments e
       LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = ?1 OR lower(e.student_email) = ?2
      LIMIT 50`
  ).bind(uid, email).all();

  return (results || []).some((r) =>
    statuses.includes(String(r.status || '').trim().toLowerCase()) && isNeetJeeCourse(r, courseIds));
}

// isNeetJeeTutor(user, env): true when this tutor teaches the NEET | JEE course, meaning they created it
// (courses.tutor_id) or are the tutor on one of its enrolments (enrollments.tutor_id).
export async function isNeetJeeTutor(user, env) {
  const db = env.DB;
  const uid = user && String(user.id ?? user._id ?? '').trim();
  if (!db || !uid) return false;
  const courseIds = list(env.TUTOR_COURSE_IDS).map(String);
  const { results } = await db.prepare(
    `SELECT c.id AS course_id, c.title AS course_title, c.title AS course_name
       FROM courses c WHERE c.tutor_id = ?1
     UNION
     SELECT e.course_id, c2.title, e.course_name
       FROM enrollments e LEFT JOIN courses c2 ON c2.id = e.course_id
      WHERE e.tutor_id = ?1
      LIMIT 100`
  ).bind(uid).all();
  return (results || []).some((r) => isNeetJeeCourse(r, courseIds));
}
