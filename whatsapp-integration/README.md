# Calendar Meet Link → WhatsApp Automation

## What it does
When a Google Calendar event (with Google Meet attached) is created or updated,
this workflow pulls the Meet link and attendee list, looks up each attendee's
WhatsApp number in a Cloudflare D1 table, and sends them the meeting link via
the Meta WhatsApp Cloud API. It also logs every send so a duplicate calendar
trigger firing on the same event won't double-send.

## Setup order

### 1. Deploy the lookup Worker (`worker/`)
```
cd worker
wrangler d1 create calendar-whatsapp-db
# copy the returned database_id into wrangler.toml
wrangler d1 execute calendar-whatsapp-db --file=./schema.sql
wrangler secret put API_KEY        # pick any strong random string
wrangler deploy
```
This gives you a URL like `https://calendar-whatsapp-lookup.<subdomain>.workers.dev`.

### 2. Add guest mappings
For each guest you expect to message, either run a raw D1 insert, or POST:
```
curl -X POST https://calendar-whatsapp-lookup.<subdomain>.workers.dev/guests \
  -H "X-API-Key: <your API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"guest@gmail.com","name":"Guest Name","whatsapp_number":"91XXXXXXXXXX"}'
```
`whatsapp_number` is digits only: country code + number, no `+`, no leading 0.

### 3. Get Meta WhatsApp Cloud API access
- Create/verify a Meta Business account and WhatsApp Business app in Meta for
  Developers, get a permanent access token and your Phone Number ID.
- **Create and get approval for a message template** — Meta requires a
  pre-approved template for any business-initiated message (i.e. anything
  you send that the guest didn't message first, which is exactly this case).
  In WhatsApp Manager → Message Templates, create a template named
  `meeting_link_notify` (category: Utility) with a body like:
  > Hi {{1}}, your meeting "{{2}}" is scheduled at {{3}}. Join here: {{4}}
  This step is manual on Meta's side and can take anywhere from minutes to
  a day or two for approval — do this first since everything else depends on it.

### 4. Import the n8n workflow (`n8n/calendar-to-whatsapp-workflow.json`)
- In n8n: Workflows → Import from File.
- Set the **Google Calendar Trigger** node's credential to the host's Google
  account (OAuth — do NOT use a password anywhere in this flow).
- Add n8n environment variables (Settings → Variables), used as `$vars.___`
  in the HTTP nodes:
  - `WORKER_API_KEY` — same value as the Worker's `API_KEY` secret
  - `META_WHATSAPP_TOKEN` — Meta permanent access token
  - `META_PHONE_NUMBER_ID` — Meta Phone Number ID
- Replace `YOUR-SUBDOMAIN` in the three HTTP Request node URLs with your
  actual Worker subdomain.
- Activate the workflow.

## Flow logic
```
Calendar event created/updated
  → extract Meet link + attendee emails
  → for each attendee:
      already sent for this event+email? → skip
      look up phone in D1
        found  → send WhatsApp template → log "sent"
        not found → log "skipped_no_number" (add them via step 2 later)
```

## Notes
- Google Calendar OAuth in n8n is safe — it's a scoped token, not a password.
  This is different from the "host the meeting" idea, which would require
  actual account login automation and isn't something I'd build (see chat).
- The Google Calendar Trigger polls on an interval (n8n default ~1 min for
  this node); it is not truly instant push, but it's close enough for
  "sent before the meeting starts" in virtually all cases.
- If a guest's number isn't in D1 yet, they simply get skipped and logged —
  no message is silently lost, you'll see `skipped_no_number` rows.
