// Drop-in replacement for base44's generated client.
// Talks to the ACAD Cloudflare Worker API.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8787";


async function apiFetch(
  path,
  options = {}
) {
  const res = await fetch(
    `${API_BASE}${path}`,
    {
      credentials: "include",

      headers: {
        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },

      ...options,
    }
  );


  if (!res.ok) {

    let message =
      res.statusText;

    try {

      const body =
        await res.json();

      message =
        body.error ||
        message;

    } catch {
      // Keep HTTP status text.
    }


    const err =
      new Error(message);

    err.status =
      res.status;

    throw err;
  }


  if (res.status === 204) {
    return null;
  }


  return res.json();
}


/*
 * ACAD entities.
 */
const ENTITY_NAMES = [
  "Assignment",
  "Attendance",
  "BookPurchase",
  "Course",
  "Enrollment",
  "Event",
  "ExamLevel",
  "HomeTutor",
  "Inquiry",
  "LiveClass",
  "MockTest",
  "OnlineBook",
  "QuestionPaper",
  "Review",
  "StudentProgress",
  "StudentSubmission",
  "StudyMaterial",
  "Submission",
  "Topic",
  "TuitionRequest",
  "TutorInterest",
  "User",
];


function makeEntityClient(
  name
) {

  return {

    list: (
      sort,
      limit
    ) => {

      const params =
        new URLSearchParams();

      if (sort) {
        params.set(
          "sort",
          sort
        );
      }

      if (limit) {
        params.set(
          "limit",
          String(limit)
        );
      }

      const qs =
        params.toString();

      return apiFetch(
        `/api/entities/${name}${
          qs ? `?${qs}` : ""
        }`
      );
    },


    filter: (
      query = {},
      sort,
      limit
    ) =>
      apiFetch(
        `/api/entities/${name}/filter`,
        {
          method: "POST",

          body: JSON.stringify({
            query,
            sort,
            limit,
          }),
        }
      ),


    get: (id) =>
      apiFetch(
        `/api/entities/${name}/${id}`
      ),


    create: (data) =>
      apiFetch(
        `/api/entities/${name}`,
        {
          method: "POST",

          body:
            JSON.stringify(data),
        }
      ),


    update: (
      id,
      data
    ) =>
      apiFetch(
        `/api/entities/${name}/${id}`,
        {
          method: "PUT",

          body:
            JSON.stringify(data),
        }
      ),


    delete: (id) =>
      apiFetch(
        `/api/entities/${name}/${id}`,
        {
          method: "DELETE",
        }
      ),


    updateMany: (
      query,
      update
    ) =>
      apiFetch(
        `/api/entities/${name}/bulk`,
        {
          method: "PUT",

          body:
            JSON.stringify({
              query,
              update,
            }),
        }
      ),
  };
}


const entities =
  Object.fromEntries(
    ENTITY_NAMES.map(
      (name) => [
        name,
        makeEntityClient(name),
      ]
    )
  );


/*
 * Authentication.
 */
const auth = {

  me: () =>
    apiFetch(
      "/api/auth/me"
    ),


  isAuthenticated:
    async () => {

      try {

        await apiFetch(
          "/api/auth/me"
        );

        return true;

      } catch {

        return false;
      }
    },


  updateMe: (
    data
  ) =>
    apiFetch(
      "/api/auth/me",
      {
        method: "PUT",

        body:
          JSON.stringify(data),
      }
    ),


  logout:
    async (
      redirectUrl
    ) => {

      await apiFetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      ).catch(
        () => {}
      );

      window.location.href =
        redirectUrl || "/";
    },


  /*
   * Normal Google login.
   */
  redirectToLogin:
    (
      returnUrl
    ) => {

      const target =
        returnUrl ||
        window.location.href;

      window.location.href =
        `${API_BASE}/api/auth/google/start?redirect=${encodeURIComponent(
          target
        )}`;
    },


  /*
   * Google Calendar authorization.
   *
   * This is deliberately separate from
   * normal login.
   *
   * It requests the Calendar permission and
   * asks Google for offline access.
   */
  connectGoogleCalendar:
    (
      returnUrl
    ) => {

      const target =
        returnUrl ||
        window.location.href;

      window.location.href =
        `${API_BASE}/api/auth/google/start?calendar=1&redirect=${encodeURIComponent(
          target
        )}`;
    },


  /*
   * Check whether the current user has
   * connected Google Calendar.
   */
  calendarStatus:
    () =>
      apiFetch(
        "/api/auth/calendar/status"
      ),

};


/*
 * Core integrations.
 */
const Core = {

  UploadFile:
    async ({
      file,
    }) => {

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );


      const res =
        await fetch(
          `${API_BASE}/api/upload`,
          {
            method: "POST",

            credentials:
              "include",

            body:
              formData,
          }
        );


      if (!res.ok) {
        throw new Error(
          "File upload failed"
        );
      }


      return res.json();
    },


  SendEmail:
    (
      payload
    ) =>
      apiFetch(
        "/api/email/send",
        {
          method: "POST",

          body:
            JSON.stringify(
              payload
            ),
        }
      ),


  InvokeLLM:
    (
      payload
    ) =>
      apiFetch(
        "/api/llm/invoke",
        {
          method: "POST",

          body:
            JSON.stringify(
              payload
            ),
        }
      ),
};


/*
 * Named backend functions.
 */
const functionsApi = {

  invoke:
    (
      name,
      payload
    ) =>
      apiFetch(
        `/api/functions/${name}`,
        {
          method: "POST",

          body:
            JSON.stringify(
              payload
            ),
        }
      ),
};


/*
 * Base44-compatible no-op analytics.
 */
const appLogs = {

  logUserInApp:
    () =>
      Promise.resolve(),

};


export const apiClient = {

  entities,

  auth,

  integrations: {
    Core,
  },

  functions:
    functionsApi,

  appLogs,

};
