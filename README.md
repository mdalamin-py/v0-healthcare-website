# Dignity Home Health Care

A modern website and clinic management system for a home health care provider in Fresno, CA. Patients can find a doctor, see weekly schedules and the on-call roster, and book appointments online with an instant serial number. Staff manage everything from a secure admin dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)

## Features

**For patients**

- **Doctor directory:** search by name or specialty, filter by "available today", and view profiles with weekly hours.
- **Schedule and on-call:** a day-by-day clinic timetable, the doctor on call right now, and a 7-day roster.
- **Online booking:** pick a doctor and session, see live remaining capacity, and get a serial number and booking reference.
- **Self-service:** check appointment status or cancel using the reference and phone number.
- **Contact form:** validated, spam-protected, and delivered by email via Resend.
- **Design:** responsive, accessible, light and dark themes, with reduced-motion support.

**For staff (`/admin`)**

- **Dashboard:** today's queue, status counts and the current on-call doctor.
- **Appointments:** filter by date, doctor or status, and confirm, complete or cancel inline.
- **Doctors:** create and edit doctors, hide them from the site, and manage weekly sessions and capacity.
- **On-call roster:** schedule shifts in clinic (Pacific) time.

**Under the hood**

- **Row level security:** patient data is never publicly readable. Bookings go through security-definer Postgres functions.
- **Atomic serial numbers:** assigned under an advisory lock. Full sessions, duplicate bookings and invalid dates are rejected in the database.
- **Validation:** zod schemas are shared between the client and the server, and booking and contact endpoints are rate limited.
- **Rendering:** static pages with incremental revalidation, and public pages are revalidated when admins make changes.
- **SEO:** metadata, sitemap, robots rules, JSON-LD structured data and a generated Open Graph image.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Radix UI primitives, Lucide icons |
| Forms | React Hook Form, Zod |
| Database & auth | Supabase (Postgres, Auth, RLS) |
| Email | Resend REST API |
| Hosting | Vercel |

## Getting started

### Prerequisites

- Node.js 20 or later
- pnpm 9 (`corepack enable`)
- A [Supabase](https://supabase.com) project

### 1. Install

```bash
pnpm install
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon / publishable key |
| `NEXT_PUBLIC_SITE_URL` | Production | Public site URL for canonical links and the sitemap |
| `RESEND_API_KEY` | Production | Enables contact form email delivery |
| `CONTACT_TO_EMAIL` | Production | Comma-separated recipients for contact messages |
| `CONTACT_FROM_EMAIL` | No | Verified sender address |

Never expose the Supabase `service_role` key. The app does not need it.

### 2. Set up the database

In the Supabase dashboard, open **SQL Editor** and run, in order:

1. `supabase/migrations/20261010000000_clinic_schema.sql`, which creates the tables, security policies and functions.
2. `supabase/seed.sql` (optional). This adds sample doctors, schedules and on-call shifts.

> If the project already contains tables from the earlier v0 prototype (`doctors`, `appointments`, `patients`, …), drop them first. The migration creates its own `doctors` and `appointments` tables.

### 3. Create an admin

1. In **Authentication → Users**, click **Add user** and create a user with an email and password.
2. Grant admin access in the SQL Editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

3. Sign in at `/admin/login`.

### 4. Run

```bash
pnpm dev        # http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run the TypeScript compiler |
| `pnpm test:db` | Run the database tests in an in-memory Postgres (PGlite) |

## Project structure

```
app/
  (site)/              Public pages (home, doctors, schedule, appointments, …)
  admin/               Admin login and dashboard (protected)
  api/contact/         Contact form endpoint
  sitemap.ts, robots.ts, opengraph-image.tsx, manifest.ts
components/            UI, page sections, doctors, appointments and admin components
lib/
  clinic/              Public data queries and formatting helpers
  admin/               Admin auth guard, queries and time-zone helpers
  supabase/            Typed Supabase clients and database types
  validations/         Shared zod schemas
proxy.ts               Session refresh and redirect for /admin routes
supabase/
  migrations/          Database schema
  seed.sql             Sample data
  tests/               Database tests
```

## Deployment

The project deploys to Vercel. Add the environment variables above in **Project Settings → Environment Variables** and redeploy. Public pages fall back to a "call us" message if the database is unavailable, so a missing or unmigrated database never breaks the build.

## License

Private project. All rights reserved.
