const GOOGLE_CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const DEFAULT_MEET_LINK =
  "https://meet.google.com/wsb-ztxe-kwc";


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/*
 * Create a Google Calendar event.
 *
 * IMPORTANT:
 * This function expects a valid Google OAuth access token.
 * OAuth/token storage will be connected in the next file.
 */
export async function createGoogleCalendarEvent(
  accessToken,
  {
    title,
    description,
    startDateTime,
    endDateTime,
    tutorEmail,
    tutorName,
    studentEmails = [],
    meetLink = DEFAULT_MEET_LINK,
  }
) {

  if (!accessToken) {
    throw new Error(
      "Google Calendar access token is missing."
    );
  }


  if (!title) {
    throw new Error(
      "Calendar event title is required."
    );
  }


  if (!startDateTime || !endDateTime) {
    throw new Error(
      "Calendar start and end times are required."
    );
  }


  /*
   * Remove duplicate/empty email addresses.
   */
  const attendees = [
    tutorEmail,
    ...studentEmails,
  ]
    .filter(Boolean)
    .map((email) => String(email).trim())
    .filter(Boolean);


  const uniqueAttendees = [
    ...new Set(attendees),
  ];


  /*
   * Calendar event description.
   *
   * The default Meet link is deliberately included
   * so the class remains usable even before automatic
   * Google Meet conference generation is enabled.
   */
  const eventDescription = `
${description || "ACAD Online Class"}

Google Meet:
${meetLink}

Tutor:
${tutorName || "ACAD Tutor"}

Class reminder:
10 minutes before the scheduled class.
`.trim();


  const event = {

    summary: title,

    description:
      eventDescription,

    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Kolkata",
    },

    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Kolkata",
    },

    attendees:
      uniqueAttendees.map((email) => ({
        email,
      })),

    reminders: {

      useDefault: false,

      overrides: [
        {
          method: "email",
          minutes: 10,
        },
        {
          method: "popup",
          minutes: 10,
        },
      ],

    },

  };


  /*
   * Use Google Calendar API.
   */
  const response = await fetch(
    GOOGLE_CALENDAR_API,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(event),

    }
  );


  const responseText =
    await response.text();


  let responseData = {};

  if (responseText) {

    try {

      responseData =
        JSON.parse(responseText);

    } catch {

      responseData = {
        raw: responseText,
      };

    }

  }


  if (!response.ok) {

    const googleError =
      responseData?.error?.message ||
      responseData?.error_description ||
      responseData?.raw ||
      `Google Calendar returned HTTP ${response.status}`;

    throw new Error(
      `Google Calendar error: ${googleError}`
    );

  }


  return {

    id:
      responseData.id || null,

    htmlLink:
      responseData.htmlLink || null,

    meetLink,

    attendees:
      uniqueAttendees,

  };

}


/*
 * Build the notification text that will eventually
 * be sent to the tutor/student by email.
 */
export function buildClassNotification({
  title,
  classTime,
  meetLink = DEFAULT_MEET_LINK,
}) {

  return `
Mam, please connect with the students at ${escapeHtml(
    classTime
  )} for the ${escapeHtml(
    title || "online class"
  )} in the following Google Meet link:

${escapeHtml(meetLink)}

The Google Calendar reminder is scheduled for 10 minutes before the class.
`.trim();

}


export {
  DEFAULT_MEET_LINK,
};
