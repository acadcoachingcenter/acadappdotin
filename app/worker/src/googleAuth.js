import { signSession, sessionCookie } from "./auth.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// GET /api/auth/google/start?redirect=<url the browser should land on after login>
export function googleStart(request, env) {
  const url = new URL(request.url);
  const redirectAfter = url.searchParams.get("redirect") || env.APP_URL;
  const state = btoa(JSON.stringify({ r: redirectAfter }));

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", `${env.API_URL}/api/auth/google/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return Response.redirect(authUrl.toString(), 302);
}

// GET /api/auth/google/callback?code=...&state=...
export async function googleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  let redirectAfter = env.APP_URL;
  try {
    redirectAfter = JSON.parse(atob(stateRaw)).r || env.APP_URL;
  } catch { /* fall back to APP_URL */ }

  if (!code) {
    return Response.redirect(`${env.APP_URL}/?login_error=missing_code`, 302);
  }

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.API_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    return Response.redirect(`${env.APP_URL}/?login_error=token_exchange_failed`, 302);
  }
  const tokens = await tokenRes.json();

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    return Response.redirect(`${env.APP_URL}/?login_error=profile_fetch_failed`, 302);
  }
  const profile = await profileRes.json(); // { email, name, picture, ... }

  // Upsert user in D1
  let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(profile.email).first();
  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, email, full_name, profile_image, user_type, created_date, updated_date)
       VALUES (?, ?, ?, ?, 'student', datetime('now'), datetime('now'))`
    ).bind(id, profile.email, profile.name || "", profile.picture || "").run();
    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  }

  const token = await signSession(
    { uid: user.id, email: user.email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    env.SESSION_SECRET
  );

  const headers = new Headers();
  headers.append("Set-Cookie", sessionCookie(token, env, 30 * 24 * 60 * 60));
  headers.set("Location", redirectAfter);
  return new Response(null, { status: 302, headers });
}
