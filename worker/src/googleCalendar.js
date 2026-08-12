const GOOGLE_CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const DEFAULT_MEET_LINK =
  "https://meet.google.com/wsb-ztxe-kwc";


/*
 * Create a Google Calendar event.
 *
 * The event includes:
 * - India timezone
 * - tutor
 * - students
 * - Google Meet link
 * - 10-minute popup reminder
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


  /*
   * Build attendee list.
   *
   * Remove duplicate email addresses.
   */
  const attendeeEmails = [
    tutorEmail,
    ...studentEmails,
  ]
    .filter(Boolean)
    .map((email) =>
      String(email).trim().toLowerCase()
    );


  const uniqueEmails = [
    ...new Set(attendeeEmails),
  ];


  const attendees = uniqueEmails.map(
    (email) => ({
      email,
    })
  );


  /*
   * Google Calendar event.
   *
   * The Meet URL is included in the description
   * because this is the fixed ACAD classroom link.
   */
  const event = {

    summary:
      title ||
      "ACAD Live Class",

    description:
      `${description || ""}\n\n` +
      `Google Meet:\n${meetLink}`,

    start: {
      dateTime:
        startDateTime,

      timeZone:
        "Asia/Kolkata",
    },

    end: {
      dateTime:
        endDateTime,

      timeZone:
        "Asia/Kolkata",
    },

    attendees,

    /*
     * Reminder 10 minutes before class.
     */
    reminders: {
      useDefault: false,

      overrides: [
        {
          method: "popup",
          minutes: 10,
        },
      ],
    },

    /*
     * Keep the fixed ACAD Meet link available
     * as the event location as well.
     */
    location:
      meetLink,

    /*
     * Prevent Google from automatically
     * creating another conference because
     * ACAD already has a default Meet room.
     */
    guestsCanModifyEvent: false,

    guestsCanInviteOthers: false,

    guestsCanSeeOtherGuests: true,
  };


  /*
   * Create event in the connected user's
   * primary Google Calendar.
   */
  const response =
    await fetch(
      GOOGLE_CALENDAR_API,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(event),
      }
    );


  const text =
    await response.text();


  let data = {};

  if (text) {
    try {
      data =
        JSON.parse(text);
    } catch {
      data = {};
    }
  }


  if (!response.ok) {

    console.error(
      "Google Calendar API error:",
      data
    );

    throw new Error(
      data?.error?.message ||
        "Unable to create Google Calendar event."
    );
  }


  return {
    id:
      data.id,

    htmlLink:
      data.htmlLink || null,

    status:
      data.status || null,

    summary:
      data.summary || title,

    start:
      data.start || null,

    end:
      data.end || null,
  };
}


/*
 * Build a readable class notification
 * description for the Calendar event.
 */
export function buildClassNotification({
  title,
  classTime,
  meetLink,
}) {

  return [
    "ACAD Online Class",
    "",
    `Class: ${title || "Live Class"}`,
    `Time: ${classTime || ""}`,
    "",
    "Join the class using Google Meet:",
    meetLink || DEFAULT_MEET_LINK,
    "",
    "Please join 5 minutes before the scheduled time.",
  ].join("\n");
}
