// Sends email via Resend (https://resend.com). Free tier: 3,000 emails/mo, 100/day.
// Requires env.RESEND_API_KEY and env.EMAIL_FROM (must be on a domain verified in Resend,
// e.g. "ACAD Team <notifications@acadapp.in>"). See MIGRATION_GUIDE.md.
export async function sendEmailViaResend(env, { to, subject, html, replyTo }) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || "ACAD <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error (${res.status}): ${text}`);
  }
  return res.json();
}

// Matches base44.integrations.Core.SendEmail({ to, subject, body, from_name }) shape used
// throughout the frontend -- "body" was already HTML in every call site in this app.
export async function handleSendEmail(env, payload) {
  const { to, subject, body } = payload;
  if (!to || !subject || !body) {
    throw new Error("SendEmail requires to, subject, and body");
  }
  return sendEmailViaResend(env, { to, subject, html: body });
}
