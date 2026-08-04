# ACAD: base44 → Cloudflare migration

This replaces base44's hosted backend (entities, auth, file storage, email,
AI calls) with a Cloudflare Worker + D1 + R2, and keeps the frontend on
Cloudflare Pages. Everything below runs on Cloudflare's **free tier**, plus
two other free-tier accounts (Google OAuth, Resend, Groq -- all no-cost at
ACAD's current scale).

## What changed vs. the base44 export

| base44 concept | Replaced with |
|---|---|
| `@base44/sdk` entities (21 tables) | Cloudflare D1 (SQLite) + a generic REST API in the Worker |
| base44 built-in login | Google Sign-In, custom JWT session cookie |
| `UploadFile` integration | Cloudflare R2 bucket, served back through the Worker |
| `SendEmail` integration + Gmail connector | Resend API |
| `InvokeLLM` integration | Groq's free-tier LLM API (same provider as ACAD's other tools) |
| 3 base44 backend functions (email alerts) | Ported 1:1 into the Worker, same HTML templates, sent via Resend |
| Vite dev server (base44 CLI) | Plain Vite, deployed as a Cloudflare Pages site |

The frontend's ~130 files were **not rewritten**. A compatibility layer
(`app/src/api/base44Client.js` + `app/src/entities/*.js` +
`app/src/integrations/Core.js`) exposes the exact same `base44.entities.X.list()`
/ `.filter()` / `.create()` / etc. shape the pages already call, just backed
by the new Worker instead of base44. Only the following files were actually
rewritten: `base44Client.js`, `AuthContext.jsx`, `vite.config.js`,
`package.json` (base44 packages removed).

**One real behavior change:** base44's `AuthContext` could force a login
redirect on *every* page if the base44 app was configured to require
authentication site-wide. That setting lived in base44's dashboard and
wasn't included in the code export, so it couldn't be preserved. Since this
app clearly has public marketing/browse pages (course offers, "become a
tutor", etc.) alongside pages that already gate themselves individually with
`base44.auth.isAuthenticated()` / `redirectToLogin()`, the new `AuthContext`
no longer force-redirects on load -- pages that need login still ask for it
themselves. If you actually want the whole site locked behind Google login,
say so and it's a small change in `App.jsx`.

## Access rules -- please review

base44's per-entity read/write permission rules (who can read/write which
entity) lived in base44's dashboard, not in the code export, so they
couldn't be migrated automatically. `worker/entityConfig.js` has a
reconstruction based on how each entity is actually used in the frontend:

- **Public read** (no login needed): Course, OnlineBook, Event, ExamLevel, Topic, Review, MockTest
- **Public create** (no login needed -- intake forms): Inquiry, TuitionRequest, HomeTutor
- **Everything else** requires a logged-in session for both read and write

This is a reasonable default, not a guarantee it matches your old base44
config exactly -- skim `worker/entityConfig.js` before going live and adjust
`PUBLIC_READ` / `PUBLIC_CREATE` if something looks wrong (e.g. you may want
per-role restrictions like "only admins can write Course", which the current
generic API doesn't enforce -- see "Known limitations" below).

## Setup steps

### 1. Cloudflare account + Wrangler
```
npm install -g wrangler
wrangler login
```

### 2. Create the D1 database
```
cd worker
wrangler d1 create acad-db
# copy the returned database_id into wrangler.toml
npm run db:init          # loads schema/schema.sql into the live DB
```

### 3. Create the R2 bucket
```
wrangler r2 bucket create acad-uploads
```

### 4. Google OAuth (for login)
1. Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `https://api.acadapp.in/api/auth/google/callback` (use your actual API domain).
3. Note the Client ID and Client Secret for step 6.

### 5. Resend (for email)
1. Sign up at resend.com (free tier: 3,000 emails/month).
2. Verify a sending domain (or use their `onboarding@resend.dev` test address to start).
3. Note the API key for step 6.

### 6. Groq (for AI Question Paper Generator / Hindi Sabha grammar & writing tools)
1. Sign up at console.groq.com (free tier).
2. Note the API key for step 6.

### 7. Set Worker secrets
```
cd worker
wrangler secret put SESSION_SECRET       # e.g. output of: openssl rand -hex 32
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put GROQ_API_KEY
```
Also edit the non-secret values at the top of `wrangler.toml` (`APP_URL`,
`API_URL`, `COOKIE_DOMAIN`, `EMAIL_FROM`) to match your real domains.

### 8. Deploy the Worker
```
cd worker
npm install
npm run deploy
```
Then point `api.acadapp.in` (or whatever you set `API_URL` to) at the
Worker via a Cloudflare route/custom domain in the dashboard.

### 9. Deploy the frontend to Cloudflare Pages
```
cd app
npm install
cp .env.example .env     # set VITE_API_BASE to your deployed Worker URL
npm run build
wrangler pages deploy dist --project-name=acad
```
Point your custom domain (acadapp.in) at the Pages project in the Cloudflare
dashboard, same as you'd have done for base44's custom-domain feature.

### 10. Connect GitHub (optional, for auto-deploys)
You said you'd rather deploy manually via `wrangler deploy` / `wrangler
pages deploy` than set up GitHub Actions -- the steps above already do that.
If you push this to a GitHub repo, Cloudflare Pages can also auto-build on
push if you want it later (Pages project settings → connect to Git); not
required.

## Known limitations / things to revisit later

- **Role-based write permissions** aren't enforced per-entity (e.g. nothing
  stops a logged-in student from calling the Course update endpoint
  directly, only the UI hides that button). If that matters before you have
  real users, the next increment is adding a `user_type` check in
  `worker/src/index.js`'s entity routes.
- **`filter()` only supports exact-match equality** on top-level fields
  (matches every call site actually used in the app -- none use ranges,
  `$ne`, etc.). If a future page needs more, extend `filterEntity` in
  `worker/src/entities.js`.
- **Stripe** payment integration in the frontend (`@stripe/react-stripe-js`)
  was left as-is -- it's client-side and doesn't depend on base44. If any
  page had a Stripe *webhook* handled by a base44 function, that wasn't in
  this export and will need a new Worker route.
- **R2 free tier**: 10GB storage / 1M Class A ops per month -- plenty at
  ACAD's current scale; keep an eye on it once uploads grow.
- **D1 free tier**: 5GB storage, 5M rows read + 100k rows written per day --
  also generous for this stage.

## Repo layout in this package
```
worker/    Cloudflare Worker API (entities, auth, email, LLM, uploads)
app/       React/Vite frontend (base44 stripped out, same page code)
```
