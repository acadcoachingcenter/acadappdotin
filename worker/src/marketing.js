/**
 * ACAD Marketing Skill Engine — Worker logic (v2)
 *
 * Framework-agnostic functions. Wire them into your existing Worker's
 * fetch handler / router. Expects:
 *   - env.DB        → D1 database binding
 *   - env.GROQ_API_KEY → same key already used by the Doubt Solver
 *   - env.GROQ_MODEL   → e.g. "openai/gpt-oss-120b"
 *
 * Endpoints to expose (see ROUTER_SNIPPET_V2.js):
 *   POST   /api/marketing/generate       → generateDraft()
 *   POST   /api/marketing/feedback       → submitFeedback()
 *   GET    /api/marketing/skills         → listSkills()
 *   GET    /api/marketing/drafts         → listApprovedDrafts()   (NEW)
 *   DELETE /api/marketing/drafts/:id     → deleteDraft()          (NEW)
 *   GET    /api/marketing/brand-profile  → getBrandProfile()      (NEW)
 *   PUT    /api/marketing/brand-profile  → updateBrandProfile()   (NEW)
 */

const CONTENT_TYPE_GUIDANCE = {
  batch_promo: 'Promote a course/batch (e.g. NEET 2027 batch enrolling now). Include a clear CTA to enroll or call.',
  fee_reminder: 'Remind a parent of a pending fee payment. Polite, non-pushy, includes amount/due date placeholders.',
  admission_drive: 'Encourage a prospective student/parent to enroll. Highlight results, faculty, or seats filling fast.',
  festival_greeting: 'A short festival greeting to parents/students. Warm, brief, on-brand — not a sales pitch.',
  re_engagement: 'Win back a student/parent who has gone quiet (missed classes, unresponsive). Gentle, no guilt-tripping.',
  review_request: 'Ask a satisfied parent/student for a Google review or testimonial. Short, easy, one clear ask.',
};

/**
 * Keyword-overlap + reliability score retrieval. See v1 notes: no
 * vector DB until skill volume actually justifies one.
 */
async function retrieveSkills(env, { contentType, requestText }) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM skills WHERE content_type = ? OR content_type = ''`
  ).bind(contentType).all();

  const requestWords = new Set(
    requestText.toLowerCase().match(/[a-z0-9\u0B80-\u0BFF]+/g) || []
  );

  const scored = results.map((skill) => {
    const tags = skill.trigger_tags.toLowerCase().split(',').map((t) => t.trim());
    const overlap = tags.filter((t) => requestWords.has(t)).length;
    const reliability = skill.success_count - skill.fail_count;
    return { skill, score: overlap * 3 + reliability * 0.5 };
  });

  return scored
    .filter((s) => s.score > 0 || s.skill.content_type === contentType)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.skill);
}

async function generateDraft(env, payload) {
  const { contentType, requestText, channel = 'whatsapp', requestedBy } = payload;

  if (!CONTENT_TYPE_GUIDANCE[contentType]) {
    return { error: `Unknown content_type: ${contentType}` };
  }

  const brand = await env.DB.prepare('SELECT * FROM brand_profile WHERE id = 1').first();
  const skills = await retrieveSkills(env, { contentType, requestText });

  const { results: requestRow } = await env.DB.prepare(
    `INSERT INTO content_requests (content_type, channel, raw_request, requested_by)
     VALUES (?, ?, ?, ?) RETURNING id`
  ).bind(contentType, channel, requestText, requestedBy || null).all();
  const requestId = requestRow[0].id;

  const systemPrompt = [
    `You write marketing/communication content for ${brand.business_name}, a coaching center in Tamil Nadu.`,
    `Tone: ${brand.tone}.`,
    `Audience/languages: ${brand.languages}. Notes: ${brand.audience_notes || 'none yet'}.`,
    brand.key_phrases ? `House phrases that work well: ${brand.key_phrases}.` : '',
    `Task type: ${CONTENT_TYPE_GUIDANCE[contentType]}`,
    `Channel: ${channel} — keep it appropriately short for this channel.`,
    skills.length
      ? `Learned rules from past corrections at this center (follow these):\n` +
        skills.map((s) => `- ${s.procedure_text}`).join('\n')
      : '',
    `Output ONLY the message text — no preamble, no quotation marks, no explanation.`,
  ].filter(Boolean).join('\n\n');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: requestText },
      ],
      temperature: 0.7,
    }),
  });

  const groqData = await groqRes.json();
  const draftText = groqData.choices?.[0]?.message?.content?.trim();

  if (!draftText) {
    return { error: 'Generation failed', detail: groqData };
  }

  const { results: draftRow } = await env.DB.prepare(
    `INSERT INTO content_drafts (request_id, draft_text, skills_used)
     VALUES (?, ?, ?) RETURNING id`
  ).bind(requestId, draftText, JSON.stringify(skills.map((s) => s.id))).all();

  return {
    draftId: draftRow[0].id,
    requestId,
    draftText,
    contentType,
    skillsApplied: skills.map((s) => s.procedure_text),
  };
}

/**
 * accepted/edited/rejected feedback. accepted and edited both leave the
 * draft permanently visible via listApprovedDrafts() until the admin
 * deletes it — see deleteDraft(). rejected does not appear there.
 */
async function submitFeedback(env, { draftId, status, finalText, correctionNote }) {
  if (!['accepted', 'edited', 'rejected'].includes(status)) {
    return { error: 'status must be accepted | edited | rejected' };
  }

  const draft = await env.DB.prepare('SELECT * FROM content_drafts WHERE id = ?').bind(draftId).first();
  if (!draft) return { error: 'draft not found' };

  await env.DB.prepare(
    `UPDATE content_drafts SET status = ?, final_text = ?, reviewed_at = datetime('now') WHERE id = ?`
  ).bind(status, finalText || null, draftId).run();

  const skillIds = JSON.parse(draft.skills_used || '[]');

  if (status === 'accepted') {
    if (skillIds.length) {
      await env.DB.prepare(
        `UPDATE skills SET success_count = success_count + 1, last_used_at = datetime('now')
         WHERE id IN (${skillIds.map(() => '?').join(',')})`
      ).bind(...skillIds).run();
    }
    return { ok: true };
  }

  if (status === 'rejected') {
    if (skillIds.length) {
      await env.DB.prepare(
        `UPDATE skills SET fail_count = fail_count + 1 WHERE id IN (${skillIds.map(() => '?').join(',')})`
      ).bind(...skillIds).run();
    }
    return { ok: true };
  }

  // status === 'edited' → distill the correction into a new skill.
  const request = await env.DB.prepare('SELECT * FROM content_requests WHERE id = ?').bind(draft.request_id).first();

  const summarizePrompt = [
    'Compare the DRAFT and FINAL versions of a marketing message below.',
    'In one short sentence, state the reusable rule that explains the change',
    '(e.g. "Always mention the fee due date explicitly" or "Avoid English-only text for parent greetings").',
    'Output ONLY that one sentence, no preamble.',
    '',
    `DRAFT: ${draft.draft_text}`,
    `FINAL: ${finalText}`,
    correctionNote ? `Staff note: ${correctionNote}` : '',
  ].filter(Boolean).join('\n');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: summarizePrompt }],
      temperature: 0.3,
    }),
  });
  const groqData = await groqRes.json();
  const procedureText = groqData.choices?.[0]?.message?.content?.trim();

  if (procedureText) {
    const tags = (request.raw_request.toLowerCase().match(/[a-z0-9\u0B80-\u0BFF]+/g) || [])
      .filter((w) => w.length > 3)
      .slice(0, 6)
      .join(',');

    await env.DB.prepare(
      `INSERT INTO skills (content_type, trigger_tags, procedure_text, success_count, source_draft_id, last_used_at)
       VALUES (?, ?, ?, 1, ?, datetime('now'))`
    ).bind(request.content_type, tags, procedureText, draftId).run();
  }

  return { ok: true, learnedSkill: procedureText || null };
}

async function listSkills(env, { contentType } = {}) {
  const query = contentType
    ? env.DB.prepare('SELECT * FROM skills WHERE content_type = ? ORDER BY success_count - fail_count DESC').bind(contentType)
    : env.DB.prepare('SELECT * FROM skills ORDER BY success_count - fail_count DESC');
  const { results } = await query.all();
  return results;
}

/**
 * NEW (v2): persistent list of approved (accepted or edited) drafts,
 * joined with their originating request, for the "Approved Content"
 * panel. Stays until deleteDraft() removes it.
 */
async function listApprovedDrafts(env, { contentType } = {}) {
  const query = contentType
    ? env.DB.prepare(
        `SELECT d.id, d.draft_text, d.final_text, d.status, d.reviewed_at, d.created_at,
                r.content_type, r.channel, r.raw_request
         FROM content_drafts d
         JOIN content_requests r ON r.id = d.request_id
         WHERE d.status IN ('accepted', 'edited') AND r.content_type = ?
         ORDER BY d.reviewed_at DESC`
      ).bind(contentType)
    : env.DB.prepare(
        `SELECT d.id, d.draft_text, d.final_text, d.status, d.reviewed_at, d.created_at,
                r.content_type, r.channel, r.raw_request
         FROM content_drafts d
         JOIN content_requests r ON r.id = d.request_id
         WHERE d.status IN ('accepted', 'edited')
         ORDER BY d.reviewed_at DESC`
      );
  const { results } = await query.all();
  return results;
}

/**
 * NEW (v2): manual delete for an approved draft. Admin-only, enforced
 * at the route level (see ROUTER_SNIPPET_V2.js).
 */
async function deleteDraft(env, draftId) {
  const result = await env.DB.prepare('DELETE FROM content_drafts WHERE id = ?').bind(draftId).run();
  return { ok: true, deleted: result.meta?.changes > 0 };
}

/**
 * NEW (v2): brand_profile read/update, including the contact fields
 * the graphic generator uses for its footer.
 */
async function getBrandProfile(env) {
  return env.DB.prepare('SELECT * FROM brand_profile WHERE id = 1').first();
}

async function updateBrandProfile(env, fields) {
  const allowed = [
    'business_name', 'tone', 'languages', 'audience_notes', 'key_phrases',
    'contact_phone', 'contact_email', 'contact_website', 'contact_address', 'logo_url',
  ];
  const setClauses = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (!setClauses.length) return { error: 'no valid fields to update' };

  setClauses.push(`updated_at = datetime('now')`);
  await env.DB.prepare(
    `UPDATE brand_profile SET ${setClauses.join(', ')} WHERE id = 1`
  ).bind(...values).run();

  return getBrandProfile(env);
}

export {
  generateDraft,
  submitFeedback,
  listSkills,
  listApprovedDrafts,
  deleteDraft,
  getBrandProfile,
  updateBrandProfile,
  retrieveSkills,
  CONTENT_TYPE_GUIDANCE,
};
