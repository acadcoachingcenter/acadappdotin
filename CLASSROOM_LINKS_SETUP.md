# Setting up the 6 permanent subject classroom links

This adds a small `subject_classrooms` table + admin page so you can paste in
your 6 manually-created Google Meet links (English / Tamil / Science / Maths /
Social Science / Hindi) as a fallback for when the automatic Calendar →
WhatsApp class notification doesn't reach a student or tutor in time.

## 1. Apply the new table to your live D1 database

The `CREATE TABLE IF NOT EXISTS subject_classrooms (...)` statement has been
appended to `worker/schema/schema.sql` (and the `app/worker` copy — see the
note about duplicate worker folders from before). Apply it to your **actual
deployed** database with:

```
cd worker    # or app/worker, whichever you deploy from
wrangler d1 execute acad-db --remote --file=./schema/schema.sql
```

`CREATE TABLE IF NOT EXISTS` is safe to re-run — it won't touch your existing
21 tables, it only adds the new one.

## 2. Deploy the Worker and frontend as usual

No new environment variables or secrets are needed for this feature.

## 3. Add your 6 links

1. Create your 6 permanent Google Meet links yourself in Google Meet/Calendar
   (a "nicknamed" recurring room works best so it doesn't expire).
2. Log in to ACAD as admin → sidebar → **Classroom Links**.
3. Click **Add Link** for each subject, paste the Meet URL, save.

Once saved, every student and tutor will see a **"Permanent Classroom Links"**
card on their dashboard listing all active subjects with one-tap join buttons.
You can hide (eye icon) a subject's link temporarily without deleting it —
useful if a room needs to be swapped out.

## Where this fits with the rest of your automation

- **Primary path:** tutor creates the class in Google Calendar, invites guest
  emails → the n8n + Cloudflare Worker + D1 WhatsApp notifier sends the
  per-class Meet link automatically (pending Meta template approval).
- **Fallback #1 (this feature):** the 6 permanent subject links, always
  visible on the dashboard, for when the automatic notification fails.
- **Fallback #2:** the "Smart Classroom" AI tutor banner, for when no live
  tutor is available at all.
