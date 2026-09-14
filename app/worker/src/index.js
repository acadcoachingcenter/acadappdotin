import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  getSessionUser,
  signSession,
  sessionCookie,
} from "./auth.js";

import {
  googleStart,
  googleCallback,
} from "./googleAuth.js";

import {
  getEntityConfig,
  canReadPublic,
  canCreatePublic,
  isAdminOnlyWrite,
  listEntity,
  filterEntity,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  updateManyEntity,
} from "./entities.js";

import { handleSendEmail } from "./email.js";

import {
  invokeNotifyFunction,
} from "./notifyFunctions.js";

import { invokeLLM } from "./llm.js";

import {
  generateGradeMeQuestions,
  fetchSchoolBookSubjects,
  fetchSchoolBookChapters,
} from "./grademe.js";

import {
  handleUpload,
  serveFile,
} from "./upload.js";


const app = new Hono();


/*
 * ---------- CORS ----------
 *
 * ACAD has multiple frontend domains:
 *
 * https://acadapp.in
 * https://classroom.acadapp.in
 *
 * Both need access to the API.
 */
app.use(
  "*",
  cors({
    origin: (origin) => {

      const allowedOrigins = [
        "https://acadapp.in",
        "https://www.acadapp.in",
        "https://classroom.acadapp.in",
        "http://localhost:5173",
      ];

      if (
        origin &&
        allowedOrigins.includes(origin)
      ) {
        return origin;
      }

      /*
       * For requests without an Origin header,
       * return the main ACAD domain.
       */
      return "https://acadapp.in";
    },

    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,

    maxAge: 86400,
  })
);


/*
 * ---------- Auth ----------
 */


/*
 * Google OAuth start.
 */
app.get(
  "/api/auth/google/start",
  (c) =>
    googleStart(
      c.req.raw,
      c.env
    )
);


/*
 * Google OAuth callback.
 */
app.get(
  "/api/auth/google/callback",
  (c) =>
    googleCallback(
      c.req.raw,
      c.env
    )
);


/*
 * Current logged-in user.
 */
app.get(
  "/api/auth/me",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    return c.json(user);
  }
);


/*
 * Update current user.
 */
app.put(
  "/api/auth/me",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    const body =
      await c.req.json();

    /*
     * Identity fields cannot be changed
     * through this endpoint.
     */
    delete body.id;
    delete body.email;

    const updated =
      await updateEntity(
        c.env,
        "User",
        user.id,
        body
      );

    return c.json(updated);
  }
);


/*
 * Logout.
 */
app.post(
  "/api/auth/logout",
  async (c) => {

    const headers =
      new Headers();

    headers.append(
      "Set-Cookie",
      sessionCookie(
        "",
        c.env,
        0
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: {
          ...Object.fromEntries(
            headers
          ),

          "Content-Type":
            "application/json",
        },
      }
    );
  }
);


/*
 * ---------- Generic entity CRUD ----------
 */


/*
 * List entity.
 */
app.get(
  "/api/entities/:name",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    if (!canReadPublic(name)) {

      const user =
        await getSessionUser(
          c.req.raw,
          c.env
        );

      if (!user) {
        return c.json(
          {
            error:
              "Not authenticated",
          },
          401
        );
      }
    }

    const {
      sort,
      limit,
    } = c.req.query();

    return c.json(
      await listEntity(
        c.env,
        name,
        {
          sort,
          limit,
        }
      )
    );
  }
);


/*
 * Filter entity.
 */
app.post(
  "/api/entities/:name/filter",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    if (!canReadPublic(name)) {

      const user =
        await getSessionUser(
          c.req.raw,
          c.env
        );

      if (!user) {
        return c.json(
          {
            error:
              "Not authenticated",
          },
          401
        );
      }
    }

    const body =
      await c.req.json();

    const {
      query,
      sort,
      limit,
    } = body;

    return c.json(
      await filterEntity(
        c.env,
        name,
        {
          query,
          sort,
          limit,
        }
      )
    );
  }
);


/*
 * Bulk update.
 */
app.put(
  "/api/entities/:name/bulk",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    const {
      query,
      update,
    } =
      await c.req.json();

    return c.json(
      await updateManyEntity(
        c.env,
        name,
        query,
        update
      )
    );
  }
);


/*
 * Get one entity.
 */
app.get(
  "/api/entities/:name/:id",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    if (!canReadPublic(name)) {

      const user =
        await getSessionUser(
          c.req.raw,
          c.env
        );

      if (!user) {
        return c.json(
          {
            error:
              "Not authenticated",
          },
          401
        );
      }
    }

    const row =
      await getEntity(
        c.env,
        name,
        c.req.param("id")
      );

    if (!row) {
      return c.json(
        {
          error:
            "Not found",
        },
        404
      );
    }

    return c.json(row);
  }
);


/*
 * Create entity.
 */
app.post(
  "/api/entities/:name",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (
      !user &&
      !canCreatePublic(name)
    ) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    if (
      isAdminOnlyWrite(name) &&
      String(user?.user_type).toLowerCase() !== "admin"
    ) {
      return c.json(
        {
          error:
            "Admin access required",
        },
        403
      );
    }

    const body =
      await c.req.json();

    const created =
      await createEntity(
        c.env,
        name,
        body,
        user?.id
      );

    return c.json(
      created,
      201
    );
  }
);


/*
 * Update entity.
 */
app.put(
  "/api/entities/:name/:id",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    if (
      isAdminOnlyWrite(name) &&
      String(user?.user_type).toLowerCase() !== "admin"
    ) {
      return c.json(
        {
          error:
            "Admin access required",
        },
        403
      );
    }

    const body =
      await c.req.json();

    const updated =
      await updateEntity(
        c.env,
        name,
        c.req.param("id"),
        body
      );

    return c.json(updated);
  }
);


/*
 * Delete entity.
 */
app.delete(
  "/api/entities/:name/:id",
  async (c) => {

    const name =
      c.req.param("name");

    if (!getEntityConfig(name)) {
      return c.json(
        {
          error:
            "Unknown entity",
        },
        404
      );
    }

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    if (
      isAdminOnlyWrite(name) &&
      String(user?.user_type).toLowerCase() !== "admin"
    ) {
      return c.json(
        {
          error:
            "Admin access required",
        },
        403
      );
    }

    return c.json(
      await deleteEntity(
        c.env,
        name,
        c.req.param("id")
      )
    );
  }
);


/*
 * ---------- Integrations ----------
 */


/*
 * Email.
 */
app.post(
  "/api/email/send",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    try {

      const result =
        await handleSendEmail(
          c.env,
          await c.req.json()
        );

      return c.json({
        success: true,
        id: result?.id,
      });

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        502
      );
    }
  }
);


/*
 * LLM.
 */
app.post(
  "/api/llm/invoke",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    try {

      return c.json(
        await invokeLLM(
          c.env,
          await c.req.json()
        )
      );

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        502
      );
    }
  }
);


/*
 * ---------- GradeMe ----------
 *
 * Self-grade practice questions students can reach any time, aimed at the
 * moment a tutor is unreachable and a student is left waiting. Questions are
 * AI-drafted from SchoolBook's ingested NCERT chapter content and held as
 * "pending" until an admin approves them -- see grademe.js.
 */


/*
 * Trigger AI drafting of new GradeMe questions for a subject/chapter --
 * admin only. Writes rows to grademe_questions with status "pending".
 */
app.post(
  "/api/grademe/generate",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    if (
      String(user.user_type)
        .toLowerCase() !== "admin"
    ) {
      return c.json(
        {
          error:
            "Admin access required",
        },
        403
      );
    }

    try {

      const body =
        await c.req.json();

      const result =
        await generateGradeMeQuestions(
          c.env,
          body,
          user.id
        );

      return c.json(result);

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        502
      );
    }
  }
);


/*
 * Proxy SchoolBook's subject list -- any logged-in user. Kept server-to-server
 * so the browser only ever talks to acad-api, never to schoolbooks.acadapp.in
 * directly (SchoolBook's own CORS rules only allow its own subdomain origins).
 */
app.get(
  "/api/grademe/subjects",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    try {

      return c.json(
        await fetchSchoolBookSubjects(
          c.env
        )
      );

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        502
      );
    }
  }
);


/*
 * Proxy SchoolBook's chapter list for a given subject -- any logged-in user.
 */
app.get(
  "/api/grademe/chapters",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    const subject =
      c.req.query("subject");

    if (!subject) {
      return c.json(
        {
          error:
            "Missing 'subject' query parameter",
        },
        400
      );
    }

    try {

      return c.json(
        await fetchSchoolBookChapters(
          c.env,
          subject
        )
      );

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        502
      );
    }
  }
);


/*
 * Upload.
 */
app.post(
  "/api/upload",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    return handleUpload(
      c.req.raw,
      c.env
    );
  }
);


/*
 * Uploaded files.
 */
app.get(
  "/files/:key",
  async (c) =>
    serveFile(
      c.req.raw,
      c.env,
      c.req.param("key")
    )
);


/*
 * ---------- Other named notification functions ----------
 *
 * These continue to use the existing
 * Resend-backed notification system.
 */
app.post(
  "/api/functions/:name",
  async (c) => {

    const user =
      await getSessionUser(
        c.req.raw,
        c.env
      );

    if (!user) {
      return c.json(
        {
          error:
            "Not authenticated",
        },
        401
      );
    }

    try {

      const result =
        await invokeNotifyFunction(
          c.env,
          c.req.param("name"),
          await c.req.json()
        );

      return c.json(
        result
      );

    } catch (e) {

      return c.json(
        {
          error:
            e.message,
        },
        400
      );
    }
  }
);


/*
 * Health check.
 */
app.get(
  "/",
  (c) =>
    c.json({
      status:
        "ACAD API running",
    })
);


/*
 * ---------- Global error handler ----------
 *
 * Without this, ANY unhandled exception in ANY route above (a D1 error,
 * an auth-token verification failure, a bad JSON body, anything) falls
 * through to Hono's default error response, which is not JSON. The
 * frontend's apiFetch() then fails to parse res.json(), falls back to
 * res.statusText -- which is always empty on Cloudflare Workers because
 * HTTP/2 responses carry no status-text reason phrase -- and every real
 * error collapses into the generic "Unknown error" popup.
 *
 * This handler guarantees every failure comes back as JSON with a real
 * message, so the frontend (and we, when debugging) can actually see
 * what broke.
 */
app.onError((err, c) => {

  console.error(
    "Unhandled error:",
    err
  );

  return c.json(
    {
      error:
        err?.message ||
        "Internal server error",
    },
    500
  );
});


export default app;
