import { signSession, sessionCookie } from "./auth.js";

const GOOGLE_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v3/userinfo";

const GOOGLE_PROFILE_SCOPE =
  "openid email profile";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";


/*
 * Google OAuth start
 *
 * Normal login:
 *   /api/auth/google/start
 *
 * Calendar authorization:
 *   /api/auth/google/start?calendar=1
 *
 * Calendar authorization requests offline access so that
 * ACAD can later create Google Calendar events.
 */
export function googleStart(request, env) {
  const url = new URL(request.url);

  const redirectAfter =
    url.searchParams.get("redirect") ||
    env.APP_URL;

  const calendarRequested =
    url.searchParams.get("calendar") === "1";

  const state = btoa(
    JSON.stringify({
      r: redirectAfter,
      calendar: calendarRequested,
    })
  );

  const authUrl =
    new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set(
    "client_id",
    env.GOOGLE_CLIENT_ID
  );

  authUrl.searchParams.set(
    "redirect_uri",
    `${env.API_URL}/api/auth/google/callback`
  );

  authUrl.searchParams.set(
    "response_type",
    "code"
  );

  const scopes = calendarRequested
    ? `${GOOGLE_PROFILE_SCOPE} ${GOOGLE_CALENDAR_SCOPE}`
    : GOOGLE_PROFILE_SCOPE;

  authUrl.searchParams.set(
    "scope",
    scopes
  );

  authUrl.searchParams.set(
    "state",
    state
  );

  /*
   * Offline access is required for a refresh token.
   */
  if (calendarRequested) {
    authUrl.searchParams.set(
      "access_type",
      "offline"
    );

    /*
     * Force Google to show the Calendar permission
     * screen when the user explicitly connects Calendar.
     */
    authUrl.searchParams.set(
      "prompt",
      "consent"
    );

    authUrl.searchParams.set(
      "include_granted_scopes",
      "true"
    );
  } else {
    authUrl.searchParams.set(
      "prompt",
      "select_account"
    );
  }

  return Response.redirect(
    authUrl.toString(),
    302
  );
}


/*
 * Google OAuth callback
 */
export async function googleCallback(
  request,
  env
) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code");

  const stateRaw =
    url.searchParams.get("state");

  let redirectAfter =
    env.APP_URL;

  let calendarRequested =
    false;


  /*
   * Decode OAuth state safely.
   */
  try {
    if (stateRaw) {
      const state =
        JSON.parse(
          atob(stateRaw)
        );

      redirectAfter =
        state.r ||
        env.APP_URL;

      calendarRequested =
        state.calendar === true;
    }
  } catch {
    redirectAfter =
      env.APP_URL;
  }


  if (!code) {
    return Response.redirect(
      `${env.APP_URL}/?login_error=missing_code`,
      302
    );
  }


  /*
   * Exchange authorization code
   * for Google access/refresh tokens.
   */
  const tokenRes =
    await fetch(
      GOOGLE_TOKEN_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body:
          new URLSearchParams({
            code,

            client_id:
              env.GOOGLE_CLIENT_ID,

            client_secret:
              env.GOOGLE_CLIENT_SECRET,

            redirect_uri:
              `${env.API_URL}/api/auth/google/callback`,

            grant_type:
              "authorization_code",
          }),
      }
    );


  if (!tokenRes.ok) {

    const errorText =
      await tokenRes.text();

    console.error(
      "Google token exchange failed:",
      errorText
    );

    return Response.redirect(
      `${env.APP_URL}/?login_error=token_exchange_failed`,
      302
    );
  }


  const tokens =
    await tokenRes.json();


  if (!tokens.access_token) {

    console.error(
      "Google response did not contain access_token:",
      tokens
    );

    return Response.redirect(
      `${env.APP_URL}/?login_error=missing_access_token`,
      302
    );
  }


  /*
   * Get Google profile.
   */
  const profileRes =
    await fetch(
      GOOGLE_USERINFO_URL,
      {
        headers: {
          Authorization:
            `Bearer ${tokens.access_token}`,
        },
      }
    );


  if (!profileRes.ok) {

    const errorText =
      await profileRes.text();

    console.error(
      "Google profile request failed:",
      errorText
    );

    return Response.redirect(
      `${env.APP_URL}/?login_error=profile_fetch_failed`,
      302
    );
  }


  const profile =
    await profileRes.json();


  if (!profile.email) {

    return Response.redirect(
      `${env.APP_URL}/?login_error=missing_google_email`,
      302
    );
  }


  /*
   * Find or create ACAD user.
   */
  let user =
    await env.DB
      .prepare(
        "SELECT * FROM users WHERE email = ?"
      )
      .bind(profile.email)
      .first();


  if (!user) {

    const id =
      crypto.randomUUID();

    await env.DB
      .prepare(
        `INSERT INTO users
        (
          id,
          email,
          full_name,
          profile_image,
          user_type,
          created_date,
          updated_date
        )
        VALUES (?, ?, ?, ?, 'student', datetime('now'), datetime('now'))`
      )
      .bind(
        id,
        profile.email,
        profile.name || "",
        profile.picture || ""
      )
      .run();

    user =
      await env.DB
        .prepare(
          "SELECT * FROM users WHERE id = ?"
        )
        .bind(id)
        .first();
  }


  /*
   * Calendar authorization:
   *
   * Store the Google refresh token in a dedicated
   * D1 table instead of exposing it to the browser.
   *
   * The table is created automatically if it does
   * not already exist.
   */
  if (calendarRequested) {

    await env.DB
      .prepare(
        `
        CREATE TABLE IF NOT EXISTS google_oauth_tokens (
          user_id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          refresh_token TEXT,
          scope TEXT,
          created_date TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_date TEXT DEFAULT CURRENT_TIMESTAMP
        )
        `
      )
      .run();


    /*
     * Google normally returns a refresh_token when
     * offline consent is granted.
     *
     * If Google doesn't return a new refresh token,
     * preserve the existing one.
     */
    let refreshToken =
      tokens.refresh_token || null;


    if (!refreshToken) {

      const existing =
        await env.DB
          .prepare(
            `
            SELECT refresh_token
            FROM google_oauth_tokens
            WHERE user_id = ?
            `
          )
          .bind(user.id)
          .first();

      refreshToken =
        existing?.refresh_token ||
        null;
    }


    await env.DB
      .prepare(
        `
        INSERT INTO google_oauth_tokens
        (
          user_id,
          email,
          refresh_token,
          scope,
          created_date,
          updated_date
        )
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))

        ON CONFLICT(user_id)
        DO UPDATE SET
          email = excluded.email,
          refresh_token = COALESCE(
            excluded.refresh_token,
            google_oauth_tokens.refresh_token
          ),
          scope = excluded.scope,
          updated_date = datetime('now')
        `
      )
      .bind(
        user.id,
        user.email,
        refreshToken,
        tokens.scope || ""
      )
      .run();


    if (!refreshToken) {

      console.error(
        "Calendar authorization completed but no refresh token was available for:",
        user.email
      );

      return Response.redirect(
        `${env.APP_URL}/?calendar_error=refresh_token_missing`,
        302
      );
    }
  }


  /*
   * Create ACAD session.
   */
  const token =
    await signSession(
      {
        uid: user.id,
        email: user.email,

        exp:
          Date.now() +
          30 *
            24 *
            60 *
            60 *
            1000,
      },

      env.SESSION_SECRET
    );


  const headers =
    new Headers();


  headers.append(
    "Set-Cookie",
    sessionCookie(
      token,
      env,
      30 *
        24 *
        60 *
        60
    )
  );


  /*
   * If Calendar authorization was completed,
   * return to the requested classroom page.
   */
  if (calendarRequested) {

    const separator =
      redirectAfter.includes("?")
        ? "&"
        : "?";

    headers.set(
      "Location",
      `${redirectAfter}${separator}calendar_connected=1`
    );

  } else {

    headers.set(
      "Location",
      redirectAfter
    );
  }


  return new Response(
    null,
    {
      status: 302,
      headers,
    }
  );
}
