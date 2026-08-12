/*
 * Google Calendar connection status.
 *
 * Never return Google access or refresh tokens
 * to the browser.
 */

export async function calendarStatus(
  env,
  user
) {
  if (!user) {
    return {
      connected: false,
      error: "Not authenticated",
    };
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS google_oauth_tokens (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        refresh_token TEXT,
        scope TEXT,
        created_date TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_date TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const token =
      await env.DB.prepare(`
        SELECT
          user_id,
          email,
          refresh_token,
          scope,
          updated_date
        FROM google_oauth_tokens
        WHERE user_id = ?
      `)
        .bind(user.id)
        .first();

    const connected =
      Boolean(token?.refresh_token);

    return {
      connected,

      email: connected
        ? token.email
        : null,

      scope: connected
        ? token.scope || ""
        : null,

      updated_date: connected
        ? token.updated_date
        : null,
    };

  } catch (error) {

    console.error(
      "Calendar status error:",
      error
    );

    throw new Error(
      "Unable to check Google Calendar connection."
    );
  }
}
