// app/src/pages/NeetJeeTutorPage.jsx
// Hosts the NEET·JEE Smart Tutor inside acadapp.in and hands it a short-lived signed token.
//
// How sign-in works: acadapp.in uses a cookie session, which the separate tutor site can't see. So this
// page asks the ACAD API (which does see the cookie) for a 30-minute token, then passes it to the tutor
// iframe with postMessage (exact origin, never in the URL). The tutor Worker verifies the signature.
import React, { useCallback, useEffect, useRef, useState } from 'react';
// ADJUST if your alias/path differs: this is the client from apiClient.js
import { apiClient } from '@/api/apiClient';

// Must match the tutor page's exact origin (and ALLOWED_ORIGINS in the tutor Worker's wrangler.toml)
const TUTOR_URL = 'https://acad-neet-tutor.pages.dev';
const REFRESH_MS = 20 * 60 * 1000;   // tokens last 30 min; renew well before that

export default function NeetJeeTutorPage() {
  const frameRef = useRef(null);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  const busy = useRef(false);
  const lastSent = useRef(0);

  // The iframe's "load" event and its "ready" message both ask for a token; answer only once per burst.
  const sendSession = useCallback(async (force = false) => {
    if (busy.current) return;
    if (!force && Date.now() - lastSent.current < 3000) return;
    busy.current = true;
    try {
      const out = await apiClient.functions.invoke('tutorToken', {});
      const win = frameRef.current && frameRef.current.contentWindow;
      if (!win || !out || !out.token) return;
      win.postMessage({ type: 'ACAD_AUTH', token: out.token, user: out.user }, TUTOR_URL);
      lastSent.current = Date.now();
      setError('');
    } catch (e) {
      console.error('Tutor sign-in failed', e);
      if (e && e.status === 403) { setDenied(true); return; }        // signed in but not enrolled
      setError(e && e.status === 401
        ? 'Please sign in to ACAD to use the NEET | JEE Smart-Tutor.'
        : 'Could not start the tutor right now. Please try again in a moment.');
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    function onMessage(ev) {
      if (ev.origin !== TUTOR_URL) return;
      if (ev.source !== (frameRef.current && frameRef.current.contentWindow)) return;
      if (ev.data && ev.data.type === 'ACAD_TUTOR_READY') sendSession();   // also sent again after an expired token
    }
    window.addEventListener('message', onMessage);
    const timer = setInterval(() => sendSession(true), REFRESH_MS);
    return () => { window.removeEventListener('message', onMessage); clearInterval(timer); };
  }, [sendSession]);

  if (denied) {
    return (
      <div style={{ maxWidth: 520, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>NEET | JEE Smart-Tutor</h2>
        <p style={{ opacity: 0.75 }}>
          This tutor is available to students enrolled in the NEET | JEE course. If you are enrolled and
          still see this message, please contact ACAD.
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', minHeight: 560, position: 'relative' }}>
      {error && (
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
          background: '#7f1d1d', color: '#fff', padding: '8px 16px', borderRadius: 999, fontSize: 14 }}>
          {error}
        </div>
      )}
      <iframe
        ref={frameRef}
        src={TUTOR_URL}
        title="ACAD NEET JEE Smart Tutor"
        onLoad={() => sendSession()}
        allow="microphone; autoplay"
        style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
      />
    </div>
  );
}
