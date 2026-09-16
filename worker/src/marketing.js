/**
 * ACAD Marketing Skill Engine — Worker logic (v1)
 *
 * Framework-agnostic functions. Wire them into your existing Worker's
 * fetch handler / router (plain Workers routing or Hono — whichever
 * acad-api already uses). Expects:
 *   - env.DB        → D1 database binding
 *   - env.GROQ_API_KEY → same key already used by the Doubt Solver
 *
 * Three endpoints to expose:
 *   POST /api/marketing/generate   → generateDraft()
 *   POST /api/marketing/feedback   → submitFeedback()
 *   GET  /api/marketing/skills     → listSkills()  (for the admin panel)
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
 * Very deliberately NOT a vector search. ACAD's stack is D1, no
 * embeddings store exists yet, and at the scale of one tenant's skill
 * table (dozens, not thousands, of rows) a keyword-overlap score is
 * plenty. Swap this for Cloudflare Vectorize if/when skill volume or
 * retrieval quality actually demands it — don't add the dependency
 * before the data justifies it.
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
    // Skills with a track record of working are worth surfacing even
    // without an exact keyword hit; skills that keep failing sink.
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
    skillsApplied: skills.map((s) => s.procedure_text),
  };
}

/**
 * The core of the self-improving loop. Staff review the draft in the
 * admin panel and respond one of three ways — that response IS the
 * training signal:
 *   - accepted: sent as-is → reinforce the skills that were used
 *   - edited:   sent with changes → the diff between draft and final
 *               is distilled into a NEW skill (or strengthens an
 *               existing similar one)
 *   - rejected: not sent → the skills used get a fail mark
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
  // v1 keeps this simple and cheap: ask the model to summarize what
  // changed as one reusable instruction, tagged with request keywords.
  // This is the piece to make smarter later (e.g. batching several
  // edits before writing a skill, to avoid overfitting on one-off
  // phrasing); for now, every correction is a signal worth keeping.
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

export { generateDraft, submitFeedback, listSkills, retrieveSkills, CONTENT_TYPE_GUIDANCE };
