/**
 * "Join Class" button — classroom app integration
 * ------------------------------------------------
 * Calls the Worker's /class-meet-link endpoint to find the Meet link for
 * the logged-in student's currently-scheduled class, then opens it.
 *
 * You'll need, per class the button is rendered for:
 *   - the student's email (from your existing auth/session)
 *   - the class's scheduled start time (ISO string, e.g. from your
 *     class/schedule data)
 *
 * The window sent to the API is 15 min before -> 2 hours after the
 * scheduled start, so early clicks and normal class-length overruns both
 * still match the right Calendar event. Adjust WINDOW_BEFORE_MIN /
 * WINDOW_AFTER_MIN below if your classes run longer.
 */

const WORKER_BASE_URL = "https://calendar-whatsapp-lookup.YOUR-SUBDOMAIN.workers.dev";
const WORKER_API_KEY = "REPLACE_WITH_YOUR_WORKER_API_KEY"; // move to env/config, don't commit as plaintext

const WINDOW_BEFORE_MIN = 15;
const WINDOW_AFTER_MIN = 120;

async function getClassMeetLink(studentEmail, classStartIso) {
  const start = new Date(new Date(classStartIso).getTime() - WINDOW_BEFORE_MIN * 60000).toISOString();
  const end = new Date(new Date(classStartIso).getTime() + WINDOW_AFTER_MIN * 60000).toISOString();

  const url = `${WORKER_BASE_URL}/class-meet-link?email=${encodeURIComponent(
    studentEmail
  )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  const res = await fetch(url, {
    headers: { "X-API-Key": WORKER_API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Lookup failed: ${res.status}`);
  }

  return res.json(); // { found: true, meet_link, event_summary, start_time } | { found: false }
}

// ---- Plain JS / vanilla button wiring ----
// <button id="join-class-btn">Join Class</button>
async function onJoinClassClick(studentEmail, classStartIso) {
  const btn = document.getElementById("join-class-btn");
  btn.disabled = true;
  btn.textContent = "Finding link...";

  try {
    const result = await getClassMeetLink(studentEmail, classStartIso);
    if (result.found) {
      window.open(result.meet_link, "_blank", "noopener");
    } else {
      alert("No scheduled meeting link found for this class right now. Please check with your teacher.");
    }
  } catch (err) {
    console.error(err);
    alert("Couldn't fetch the meeting link. Please try again in a moment.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Join Class";
  }
}

/*
// ---- React version ----

import { useState } from "react";

function JoinClassButton({ studentEmail, classStartIso }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await getClassMeetLink(studentEmail, classStartIso);
      if (result.found) {
        window.open(result.meet_link, "_blank", "noopener");
      } else {
        alert("No scheduled meeting link found for this class right now.");
      }
    } catch (err) {
      console.error(err);
      alert("Couldn't fetch the meeting link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Finding link..." : "Join Class"}
    </button>
  );
}

export default JoinClassButton;
*/
