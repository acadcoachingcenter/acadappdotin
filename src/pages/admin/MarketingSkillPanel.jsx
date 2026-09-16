import { useState, useEffect } from 'react';

// Point this at your existing acad-api worker (api.acadapp.in).
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.acadapp.in';

const CONTENT_TYPES = [
  { value: 'batch_promo', label: 'Batch/course promo' },
  { value: 'fee_reminder', label: 'Fee reminder' },
  { value: 'admission_drive', label: 'Admission drive' },
  { value: 'festival_greeting', label: 'Festival greeting' },
  { value: 're_engagement', label: 'Re-engagement nudge' },
  { value: 'review_request', label: 'Review request' },
];

export default function MarketingSkillPanel() {
  const [contentType, setContentType] = useState('batch_promo');
  const [channel, setChannel] = useState('whatsapp');
  const [requestText, setRequestText] = useState('');
  const [draft, setDraft] = useState(null);      // { draftId, draftText, skillsApplied }
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastLearned, setLastLearned] = useState(null);
  const [skills, setSkills] = useState([]);

  useEffect(() => { loadSkills(); }, [contentType]);

  async function loadSkills() {
    const res = await fetch(`${API_BASE}/api/marketing/skills?contentType=${contentType}`, {
      credentials: 'include',
    });
    if (res.ok) setSkills(await res.json());
  }

  async function handleGenerate() {
    if (!requestText.trim()) return;
    setLoading(true);
    setDraft(null);
    setLastLearned(null);
    try {
      const res = await fetch(`${API_BASE}/api/marketing/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, channel, requestText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDraft(data);
      setEditedText(data.draftText);
    } catch (e) {
      alert('Generation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(status) {
    if (!draft) return;
    const finalText = status === 'edited' ? editedText : draft.draftText;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/marketing/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.draftId, status, finalText }),
      });
      const data = await res.json();
      if (status === 'edited' && data.learnedSkill) {
        setLastLearned(data.learnedSkill);
      }
      setDraft(null);
      setRequestText('');
      setIsEditing(false);
      loadSkills();
    } catch (e) {
      alert('Feedback failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: 4 }}>Marketing content assistant</h2>
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
        Gets better at ACAD's voice every time you edit or reject a draft.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <select value={contentType} onChange={(e) => setContentType(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}>
          {CONTENT_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="social">Social</option>
        </select>
      </div>

      <textarea
        value={requestText}
        onChange={(e) => setRequestText(e.target.value)}
        placeholder="e.g. Diwali greeting for NEET batch parents"
        rows={3}
        style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 10 }}
      />

      <button onClick={handleGenerate} disabled={loading || !requestText.trim()}
        style={{ background: '#0F1B3D', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>
        {loading ? 'Working…' : 'Generate draft'}
      </button>

      {draft && (
        <div style={{ marginTop: 20, border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          {isEditing ? (
            <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)}
              rows={4} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #1A6BFF' }} />
          ) : (
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 10 }}>{draft.draftText}</p>
          )}

          {draft.skillsApplied?.length > 0 && (
            <details style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              <summary style={{ cursor: 'pointer' }}>{draft.skillsApplied.length} learned rule(s) applied</summary>
              <ul>{draft.skillsApplied.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </details>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {!isEditing ? (
              <>
                <button onClick={() => handleFeedback('accepted')} disabled={loading}
                  style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                  Accept & send
                </button>
                <button onClick={() => setIsEditing(true)} disabled={loading}
                  style={{ background: 'white', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => handleFeedback('rejected')} disabled={loading}
                  style={{ background: 'white', color: '#EF4444', border: '1px solid #EF4444', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                  Reject
                </button>
              </>
            ) : (
              <button onClick={() => handleFeedback('edited')} disabled={loading}
                style={{ background: '#1A6BFF', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
                Save edited version
              </button>
            )}
          </div>
        </div>
      )}

      {lastLearned && (
        <p style={{ marginTop: 14, fontSize: 12, color: '#166534', background: '#DCFCE7', padding: 10, borderRadius: 6 }}>
          Learned: "{lastLearned}"
        </p>
      )}

      {skills.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>Skills learned so far for this content type</h3>
          <ul style={{ fontSize: 12, color: '#64748B', paddingLeft: 18 }}>
            {skills.map((s) => (
              <li key={s.id} style={{ marginBottom: 4 }}>
                {s.procedure_text} <span style={{ color: '#94A3B8' }}>({s.success_count}✓ / {s.fail_count}✗)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
