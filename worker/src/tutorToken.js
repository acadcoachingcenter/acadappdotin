// tutorToken.js — add this to the ACAD API Worker (the one that serves api.acadapp.in).
//
// It does two things:
//   1. tutorAccess : tells the React app whether to show the "NEET | JEE Smart-Tutor" button.
//   2. tutorToken  : turns a valid acadapp.in cookie session into a short-lived signed token that the
//                    separate tutor Worker can verify. It REFUSES students who are not enrolled,
//                    so hiding the button is a convenience, not the security.
//
// Who may use the tutor:
//   admins             -> always
//   tutors             -> when verified (users.is_verified) AND they teach the NEET | JEE course
//   students           -> only if isEnrolled(user) says yes (see "Wiring" below)
//
// Setup on the ACAD API Worker:   npx wrangler secret put TUTOR_JWT_SECRET
//   (a long random string; set the SAME value on the tutor Worker)
//
// Wiring: where your API already handles  POST /api/functions/:name  add
//
//     import { tutorAccessHandler, tutorTokenHandler } from './tutorToken.js';
//     import { isEnrolledInNeetJee, isNeetJeeTutor } from './enrollment.js';
//     const gate = {
//       isEnrolled:    (user) => isEnrolledInNeetJee(user, env),
//       isCourseTutor: (user) => isNeetJeeTutor(user, env),
//     };
//     case 'tutorAccess': return tutorAccessHandler(currentUser, env, gate);
//     case 'tutorToken':  return tutorTokenHandler(currentUser, env, gate);
//
// isEnrolledInNeetJee (enrollment.js) is true when the student has a current NEET | JEE enrolment.
// For a quick pilot you can set the variable TUTOR_ALLOW_ALL_STUDENTS = "1" to let every signed-in
// student in. TUTOR_REQUIRE_VERIFIED_TUTOR = "0" lets unverified tutors in too, and
// TUTOR_ALLOW_ANY_VERIFIED_TUTOR = "1" lets every verified tutor in, not only the course's tutor (neither recommended).

const enc = new TextEncoder();
const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Your users table has user_type (and the platform may also set role), so look at both.
export function roleOf(user) {
  const raw = `${(user && user.role) || ''} ${(user && user.user_type) || ''}`.toLowerCase();
  return raw.includes('admin') ? 'admin' : /tutor|teacher|faculty/.test(raw) ? 'tutor' : 'student';
}
const truthy = (v) => v === 1 || v === true || v === '1' || String(v).toLowerCase() === 'true';

export async function canUseTutor(user, env, gate = {}) {
  if (!user) return false;
  if (/suspend|block|disabl|deactivat|inactive|ban/i.test(String(user.account_status || ''))) return false;
  const role = roleOf(user);
  if (role === 'admin') return true;
  // Tutors see students' names and questions in Insights, so they must be verified AND teach the NEET | JEE course.
  if (role === 'tutor') {
    if (!truthy(user.is_verified) && env.TUTOR_REQUIRE_VERIFIED_TUTOR !== '0') return false;
    if (env.TUTOR_ALLOW_ANY_VERIFIED_TUTOR === '1') return true;
    if (typeof gate.isCourseTutor !== 'function') return false;             // fail closed
    try { return (await gate.isCourseTutor(user)) === true; } catch { return false; }
  }
  if (env && env.TUTOR_ALLOW_ALL_STUDENTS === '1') return true;
  if (typeof gate.isEnrolled !== 'function') return false;       // fail closed
  try { return (await gate.isEnrolled(user)) === true; } catch { return false; }
}

export async function mintTutorToken(user, secret, ttlSeconds = 1800) {
  const role = roleOf(user);
  const name = String(user.full_name || user.name || user.email || 'Student').slice(0, 80);
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(enc.encode(JSON.stringify({
    iss: 'acadapp.in',
    aud: 'acad-neet-tutor',
    sub: String(user.id ?? user._id ?? user.email),
    name, role, iat: now, exp: now + ttlSeconds,
  })));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${payload}`));
  return { token: `${header}.${payload}.${b64url(sig)}`, user: { name, role }, expires_in: ttlSeconds };
}

const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Used by the button: {eligible: true|false}. 401 when not signed in.
export async function tutorAccessHandler(user, env, gate = {}) {
  if (!user) return reply({ error: 'Not signed in' }, 401);
  return reply({ eligible: await canUseTutor(user, env, gate), role: roleOf(user) });
}

// Used by the tutor page: returns the signed token, or 403 for students who are not enrolled.
export async function tutorTokenHandler(user, env, gate = {}) {
  if (!user) return reply({ error: 'Not signed in' }, 401);
  if (!env.TUTOR_JWT_SECRET) return reply({ error: 'Tutor sign-in is not configured' }, 500);
  if (!(await canUseTutor(user, env, gate))) {
    return reply({ error: 'The NEET | JEE Smart-Tutor is for students enrolled in the NEET | JEE course.' }, 403);
  }
  return reply(await mintTutorToken(user, env.TUTOR_JWT_SECRET));
}
