// Minimal HMAC-signed session tokens (JWT-like) using Web Crypto only -- no npm JWT lib needed.

function b64url(bytes) {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// payload: plain object, e.g. { uid, email, exp }
export async function signSession(payload, secret) {
  const key = await hmacKey(secret);
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sig = b64url(sigBuf);
  return `${body}.${sig}`;
}

export async function verifySession(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(body)
  );
  if (!valid) return null;
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token, env, maxAgeSeconds) {
  const domain = env.COOKIE_DOMAIN ? `Domain=${env.COOKIE_DOMAIN}; ` : "";
  const expiry = maxAgeSeconds === 0 ? "Max-Age=0" : `Max-Age=${maxAgeSeconds}`;

  return `acad_session=${encodeURIComponent(token)}; ${domain}Path=/; HttpOnly; Secure; SameSite=None; ${expiry}`;
}

// Returns the authenticated user's D1 row, or null.
export async function getSessionUser(request, env) {
  const token = getCookie(request, "acad_session");
  if (!token) return null;
  const payload = await verifySession(token, env.SESSION_SECRET);
  if (!payload) return null;
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.uid).first();
  return row || null;
}
