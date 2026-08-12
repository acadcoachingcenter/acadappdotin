import {
  createGoogleCalendarEvent,
  DEFAULT_MEET_LINK,
  buildClassNotification,
} from "./googleCalendar.js";

const GOOGLE_TOKEN_URL =
  "https://oauth2.googleapis.com/token";


/*
 * Convert ACAD local Indian time into an ISO datetime.
 *
 * Example:
 * 2026-08-15 + 18:00
 *
 * becomes:
 * 2026-08-15T18:00:00+05:30
 */
function toIndiaDateTime(date, time) {
  if (!date || !time) {
    throw new Error(
      "Class date and time are required."
    );
  }

  return `${date}T${time}:00+05:30`;
}


/*
 * Refresh Google's access token using the
 * refresh token stored in D1.
 */
async function refreshGoogleAccessToken(
  env,
  refreshToken
) {
  if (!refreshToken) {
    throw new Error(
      "Google Calendar is not connected. Please connect Google Calendar first."
    );
  }

  const response = await fetch(
    GOOGLE_TOKEN_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },

      body: new URLSearchParams({
        client_id:
          env.GOOGLE_CLIENT_ID,

        client_secret:
          env.GOOGLE_CLIENT_SECRET,

        refresh_token:
          refreshToken,

        grant_type:
          "refresh_token",
      }),
    }
  );

  const text =
    await response.text();

  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Unable to refresh Google Calendar access."
    );
  }

  if (!data.access_token) {
    throw new Error(
      "Google did not return a new access token."
    );
  }

  return data.access_token;
}


/*
 * Get the Google refresh token connected
 * to the logged-in ACAD user.
 */
async function getGoogleRefreshToken(
  env,
  userId
) {
  /*
   * Do not assume the table exists.
   * The OAuth callback creates it.
   */
  const tableExists =
    await env.DB.prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'google_oauth_tokens'
      `
    ).first();

  if (!tableExists) {
    throw new Error(
      "Google Calendar has not been connected yet. Please connect Google Calendar first."
    );
  }

  const row =
    await env.DB.prepare(
      `
      SELECT
        user_id,
        email,
        refresh_token,
        scope
      FROM google_oauth_tokens
      WHERE user_id = ?
      `
    )
      .bind(userId)
      .first();

  if (!row) {
    throw new Error(
      "Google Calendar is not connected to this ACAD account."
    );
  }

  if (!row.refresh_token) {
    throw new Error(
      "Google Calendar authorization is incomplete. Please connect Google Calendar again."
    );
  }

  return row;
}


/*
 * Get a user's email/name from the ACAD users table.
 */
async function getUserById(
  env,
  userId
) {
  if (!userId) {
    return null;
  }

  return env.DB.prepare(
    `
    SELECT
      id,
      email,
      full_name,
      user_type
    FROM users
    WHERE id = ?
    `
  )
    .bind(userId)
    .first();
}


/*
 * Create the LiveClass record.
 *
 * The existing LiveClass entity has:
 *
 * course_id
 * tutor_id
 * title
 * description
 * scheduled_date
 * duration_minutes
 * meeting_link
 * recording_url
 * whiteboard_data
 * status
 * attendees
 * materials
 */
async function createLiveClass(
  env,
  data,
  userId
) {
  const id =
    crypto.randomUUID();

  const attendees =
    JSON.stringify(
      data.attendees || []
    );

  const materials =
    JSON.stringify([]);

  await env.DB.prepare(
    `
    INSERT INTO live_classes
    (
      id,
      created_by,
      course_id,
      tutor_id,
      title,
      description,
      scheduled_date,
      duration_minutes,
      meeting_link,
      recording_url,
      whiteboard_data,
      status,
      attendees,
      materials
    )
    VALUES
    (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    )
    `
  )
    .bind(
      id,
      userId || null,

      data.course_id ||
        null,

      data.tutor_id ||
        null,

      data.title ||
        "ACAD Live Class",

      data.description ||
        "",

      data.scheduled_date,

      data.duration_minutes ||
        60,

      data.meeting_link ||
        DEFAULT_MEET_LINK,

      null,

      null,

      "scheduled",

      attendees,

      materials
    )
    .run();

  return env.DB.prepare(
    `
    SELECT *
    FROM live_classes
    WHERE id = ?
    `
  )
    .bind(id)
    .first();
}


/*
 * Main Schedule & Notify function.
 */
export async function scheduleClass(
  env,
  user,
  body
) {
  if (!user) {
    throw new Error(
      "You must be logged in to schedule a class."
    );
  }

  if (!body) {
    throw new Error(
      "Schedule request data is missing."
    );
  }


  /*
   * Required fields.
   */
  if (!body.course_id) {
    throw new Error(
      "Course is required."
    );
  }

  if (!body.class_date) {
    throw new Error(
      "Class date is required."
    );
  }

  if (!body.start_time) {
    throw new Error(
      "Class start time is required."
    );
  }

  if (!body.end_time) {
    throw new Error(
      "Class end time is required."
    );
  }


  /*
   * Find tutor.
   */
  let tutor = null;

  if (body.tutor_id) {
    tutor =
      await getUserById(
        env,
        body.tutor_id
      );
  }

  /*
   * If tutor_id was not supplied,
   * use the logged-in user.
   */
  if (!tutor) {
    tutor =
      await getUserById(
        env,
        user.id
      );
  }

  if (!tutor) {
    throw new Error(
      "Tutor account could not be found."
    );
  }


  /*
   * Determine the Google Calendar account.
   *
   * IMPORTANT:
   *
   * The Google Calendar account connected
   * to the logged-in user creates the event.
   *
   * Therefore, if the ADMIN schedules the
   * class while their Google Calendar is
   * connected, the admin is the Calendar host.
   */
  const calendarOwner =
    await getUserById(
      env,
      user.id
    );

  if (!calendarOwner) {
    throw new Error(
      "Calendar owner account could not be found."
    );
  }


  /*
   * Get Google refresh token.
   */
  const googleToken =
    await getGoogleRefreshToken(
      env,
      calendarOwner.id
    );


  /*
   * Refresh access token.
   */
  const accessToken =
    await refreshGoogleAccessToken(
      env,
      googleToken.refresh_token
    );


  /*
   * Student emails supplied by the frontend.
   */
  let studentEmails =
    Array.isArray(body.student_emails)
      ? body.student_emails
      : [];


  /*
   * Remove duplicates and empty values.
   */
  studentEmails =
    [
      ...new Set(
        studentEmails
          .filter(Boolean)
          .map((email) =>
            String(email).trim()
          )
          .filter(Boolean)
      ),
    ];


  /*
   * Also retrieve students from D1 when IDs
   * were supplied.
   *
   * This prevents incorrect/missing email
   * information from the browser.
   */
  const studentIds =
    Array.isArray(body.student_ids)
      ? body.student_ids
      : [];


  const students = [];


  for (const studentId of studentIds) {
    const student =
      await getUserById(
        env,
        studentId
      );

    if (student) {
      students.push(student);
    }
  }


  const databaseStudentEmails =
    students
      .map(
        (student) =>
          student.email
      )
      .filter(Boolean);


  studentEmails =
    [
      ...new Set([
        ...studentEmails,
        ...databaseStudentEmails,
      ]),
    ];


  /*
   * Calculate duration.
   */
  const startMinutes =
    parseTimeToMinutes(
      body.start_time
    );

  const endMinutes =
    parseTimeToMinutes(
      body.end_time
    );

  let durationMinutes =
    endMinutes - startMinutes;


  /*
   * Basic protection against an invalid
   * end time.
   */
  if (durationMinutes <= 0) {
    throw new Error(
      "Class end time must be later than start time."
    );
  }


  /*
   * Build Indian timezone datetimes.
   */
  const startDateTime =
    toIndiaDateTime(
      body.class_date,
      body.start_time
    );

  const endDateTime =
    toIndiaDateTime(
      body.class_date,
      body.end_time
    );


  /*
   * Default Meet link.
   *
   * This can later be replaced by
   * Google-generated conference data.
   */
  const meetLink =
    String(
      body.meet_link ||
        DEFAULT_MEET_LINK
    ).trim();


  /*
   * Calendar event title.
   */
  const title =
    body.title ||
    body.course_name ||
    "ACAD Live Class";


  /*
   * Calendar description.
   */
  const description =
    buildClassNotification({
      title,
      classTime:
        formatDisplayTime(
          body.start_time
        ),
      meetLink,
    });


  /*
   * Create Google Calendar event.
   */
  const calendarEvent =
    await createGoogleCalendarEvent(
      accessToken,
      {
        title,

        description,

        startDateTime,

        endDateTime,

        tutorEmail:
          tutor.email,

        tutorName:
          tutor.full_name ||
          tutor.email,

        studentEmails,

        meetLink,
      }
    );


  /*
   * Build LiveClass attendees.
   */
  const attendees = [];


  attendees.push({
    user_id:
      tutor.id,

    name:
      tutor.full_name ||
      tutor.email,

    email:
      tutor.email,

    role:
      "tutor",

    status:
      "invited",
  });


  for (const student of students) {

    attendees.push({
      user_id:
        student.id,

      name:
        student.full_name ||
        student.email,

      email:
        student.email,

      role:
        "student",

      status:
        "invited",
    });

  }


  /*
   * Save ACAD LiveClass record.
   */
  const liveClass =
    await createLiveClass(
      env,
      {
        course_id:
          body.course_id,

        tutor_id:
          tutor.id,

        title,

        description,

        scheduled_date:
          `${body.class_date} ${body.start_time}`,

        duration_minutes:
          durationMinutes,

        meeting_link:
          meetLink,

        attendees,
      },
      user.id
    );


  return {

    success: true,

    message:
      "Class scheduled successfully.",

    live_class:
      liveClass,

    calendar: {

      event_id:
        calendarEvent.id,

      html_link:
        calendarEvent.htmlLink,

      meet_link:
        meetLink,

      reminder_minutes:
        10,

      tutor_email:
        tutor.email,

      student_emails:
        studentEmails,

    },

  };
}


/*
 * Convert HH:MM into minutes.
 */
function parseTimeToMinutes(
  time
) {
  const parts =
    String(time)
      .split(":")
      .map(Number);

  if (
    parts.length !== 2 ||
    Number.isNaN(parts[0]) ||
    Number.isNaN(parts[1])
  ) {
    throw new Error(
      `Invalid time: ${time}`
    );
  }

  return (
    parts[0] * 60 +
    parts[1]
  );
}


/*
 * Format HH:MM for notification text.
 *
 * 17:50 -> 5:50 PM
 */
function formatDisplayTime(
  time
) {
  const [
    hourText,
    minuteText,
  ] =
    String(time).split(":");

  let hour =
    Number(hourText);

  const minute =
    minuteText || "00";

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  hour =
    hour % 12 || 12;

  return `${hour}:${minute} ${suffix}`;
}
