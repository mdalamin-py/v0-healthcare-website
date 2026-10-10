# Dignity Home Health Care

A website and clinic management system for a home health care provider in Fresno, CA. Patients create an account, book a doctor and get a serial number, then follow the live queue. Doctors manage their own bookings and days off, and staff run everything from an admin dashboard. All data comes from Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)

## Features

**Patients**

- **Account:** sign up or sign in with an email or mobile one-time code (no passwords). A profile is needed before booking.
- **Booking:** pick a doctor, visit type (clinic, video, home) and session, then get a per-doctor serial number, an `.ics` calendar file and a confirmation email.
- **Live queue:** the serial each doctor is serving right now. Appointments can be checked or cancelled with a reference and phone number.
- **Doctors and departments:** search and filter doctors, see profiles, weekly hours, days off and verified reviews.
- **Schedule:** a 14-day roster showing who sits on which day, who is on leave, and who is on call.
- **Emergency:** doctors on duty now, an urgent callback request, the nearest emergency rooms and ambulance availability.
- **Ambulance service:** the fleet sorted A to Z by type and status, plus transport requests.
- **Nearby hospitals and clinics:** sorted by distance from the clinic or the visitor's location, with call and directions links.
- **OT live board:** theatre status and today's operations. Families track a case with a case code, and no names are shown.
- **Interns:** the intern list and ward and emergency duty roster.

**Doctors (`/doctor-portal`)**

- **Registration:** register with an email account. The clinic verifies the license and approves the application.
- **Self-service:** pause or resume online bookings, add or remove days off, and see the serial list for the next 7 days.

**Staff (`/admin`)**

- **Dashboard and appointments:** analytics, filters and CSV export.
- **Clinic operations:** live queue control, callbacks and review moderation.
- **Doctors:** profiles, weekly sessions, days off, the doctor and compounder emails, and registration approval.
- **Rosters and resources:** the duty roster (on-call, emergency, ward), ambulances and dispatch, operation theatres and nearby facilities.
- **Daily serial email:** the serial list goes to each doctor and their compounder at 10 AM clinic time.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, Lucide icons |
| Forms | React Hook Form, Zod |
| Database & auth | Supabase (Postgres, Auth, row level security) |
| Email | Resend |
| Hosting | Vercel (with Vercel Cron) |

## Setup

### 1. Install

```bash
pnpm install
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Production | Public site URL, used for links in emails and the sitemap |
| `SUPABASE_SERVICE_ROLE_KEY` | For the 10 AM email | Server-only key used by the cron job. Never expose it. |
| `CRON_SECRET` | For the 10 AM email | Any long random string |
| `RESEND_API_KEY` | For email | Booking confirmations, staff alerts and the serial list |
| `CONTACT_TO_EMAIL` | For email | Staff inbox(es), comma separated |
| `CONTACT_FROM_EMAIL` | No | Verified sender address |

Without the Supabase variables the site still builds, but accounts and booking show "temporarily unavailable".

### 2. Create the database

All migrations must be run, in filename order. Either use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or bundle them and paste the result once into **SQL Editor**:

```bash
pnpm db:bundle > setup.sql          # schema only
pnpm db:bundle --seed > setup.sql   # schema + sample doctors, sessions, fleet, theatres
```

### 3. Configure Supabase Auth

1. **Authentication → Providers → Email:** enabled.
2. **Authentication → URL Configuration:**
   - **Site URL:** your live URL.
   - **Redirect URLs:** add `https://<your-domain>/auth/confirm`.

   The sign-in email link then lands on `/auth/confirm` and logs the patient in.
3. **Optional, shows a 6-digit code in the email:** in **Authentication → Email Templates → Magic Link**, add `{{ .Token }}` to the template.
4. **Mobile sign-in only:** configure an SMS provider (e.g. Twilio) under **Providers → Phone**.

### 4. Create an admin

Create a user in **Authentication → Users**, then run:

```sql
insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
```

Sign in at `/admin/login`.

### 5. Run

```bash
pnpm dev   # http://localhost:3000
```

## Deployment (Vercel)

1. **Environment variables:** add every variable above in **Project Settings → Environment Variables**, then redeploy.
2. **Deployment protection:** turn off **Settings → Deployment Protection → Vercel Authentication** for production. Otherwise visitors get a Vercel login screen instead of the site.
3. **Cron:** `vercel.json` schedules the daily serial email. It needs `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | TypeScript check |
| `pnpm test:db` | Database tests against an in-memory Postgres (PGlite) |
| `pnpm db:bundle` | Print all migrations as one SQL script |

## Project structure

```
app/
  (site)/              Public pages, patient account, doctor portal
  admin/               Admin login and dashboard
  api/                 Contact form and cron endpoints
components/            UI and feature components
lib/
  clinic/              Public queries and formatting helpers
  admin/, doctor/      Session guards and queries
  supabase/            Typed clients and database types
  validations/         Shared zod schemas
proxy.ts               Session refresh and sign-in redirects
supabase/
  migrations/          Database schema (run all, in order)
  seed.sql             Sample data
  tests/               Database tests
scripts/bundle-sql.mjs Joins the migrations into one script
```

## License

Private project. All rights reserved.
