# DermaLens — Skincare, but make it fun

DermaLens is a cozy, playful skincare companion app. A friendly chick buddy helps
people build and keep a daily skincare routine through quests, streaks and coins —
without ever giving medical advice.

## What it does

- **Onboarding survey** — skin type, goals, sensitivity, current routine and
  ingredients to avoid, then you name your buddy (default: "Sunny").
- **Home & Quests** — morning and evening routine quests with streaks and coins.
  Add, edit, reorder and delete steps; set reminder times.
- **Buddy chat** — an AI chat that answers with the person's skin profile in mind.
  It gives general tips only and never diagnoses.
- **Face scan** — camera or photo upload returns Hydration, Texture and Clarity
  scores with tips. Photos are stored privately and only if the person opts in.
- **Calendar** — routine history, streak days and each day's skin photo.
- **Products** — a catalog of real cleansers, serums, moisturizers and sunscreens
  matched to the skin profile. Prices are approximate.
- **Dermatologist finder** — search by city or "near me" using public
  OpenStreetMap data (Nominatim + Overpass), with call/directions links.
- **Settings & Policies** — reminders, data export (JSON), photo deletion,
  account deletion, and plain-language Privacy/Terms pages.

## Tech stack

- **TanStack Start** (React 19, SSR, server functions) + **TanStack Router/Query**
- **Tailwind CSS v4** + shadcn-style UI components
- **Lovable Cloud** (Supabase) — auth (email, Google, Lovable), Postgres with
  row-level security, private photo storage
- **Lovable AI Gateway** — buddy chat and face-scan analysis (server-side only)
- **Vitest** + Testing Library for unit tests

## Project structure

```text
src/
  routes/                 # pages (TanStack Router file routes)
    index.tsx             # welcome / landing
    auth.tsx              # sign in / sign up
    _authenticated/       # pages that require sign-in
      onboarding.tsx      # survey + buddy naming
      _app/               # main app shell with bottom tab bar
        home.tsx  quests.tsx  chat.tsx  scan.tsx  calendar.tsx
        products.tsx  dermatologists.tsx  settings.tsx
  components/             # UI pieces (chick buddy, quest rows, score bars, ...)
  lib/
    data.ts               # queries & mutations (shared cache keys)
    progress.ts           # streak & coin rules (pure, tested)
    products.ts           # product catalog & matching (pure, tested)
    ai.functions.ts       # server functions: buddy chat, face scan
    derm.functions.ts     # server function: dermatologist search
    account.functions.ts  # server functions: delete account/photos
  integrations/supabase/  # generated Cloud clients (do not edit)
drizzle/                  # schema + migrations (managed by the platform)
supabase/                 # Cloud config (managed by the platform)
```

## Getting started

You need Node.js 20+ (or Bun).

```sh
git clone <this-repository-url>
cd <repository-name>
npm install        # or: bun install
npm run dev        # or: bun dev
```

The app runs at http://localhost:5173 (Vite default).

### Useful scripts

| Command         | What it does                    |
| --------------- | ------------------------------- |
| `npm run dev`   | Start the dev server            |
| `npm run build` | Production build                |
| `npm run test`  | Run the unit tests (Vitest)     |
| `npm run lint`  | Lint the codebase               |
| `npm run format`| Format with Prettier            |

## Environment variables

The app expects these variables in a local `.env` file (they are set
automatically inside Lovable; you only need this for local development):

| Variable                     | Purpose                                   | Where to get it                          |
| ---------------------------- | ----------------------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`          | Backend API URL                           | Lovable Cloud backend settings           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key for the browser | Lovable Cloud backend settings           |
| `VITE_SUPABASE_PROJECT_ID`   | Backend project identifier                | Lovable Cloud backend settings           |

Notes:

- The publishable key is safe to expose in the browser — row-level security
  protects the data. **Never** put a service-role/secret key in `VITE_*`
  variables or commit it to the repository.
- AI calls go through the Lovable AI Gateway and need **no API key** in the
  project; they run in server functions only.
- The dermatologist finder uses public OpenStreetMap endpoints and needs no key.

## Data & privacy rules (important)

- Skin photos live only in the private `skin-photos` storage bucket under
  `<user_id>/` and are shown via short-lived signed URLs.
- Every table has row-level security: people can only read and write their own
  rows.
- Quest rewards are copied by a database trigger so coins can't be inflated
  from the browser.
- The buddy gives general skincare tips only — never diagnoses. Keep the
  disclaimers on chat, scan, products and the dermatologist finder intact.

## Built with Lovable

This project was built with [Lovable](https://lovable.dev). Changes made in the
Lovable editor sync to the connected Git repository, and pushes to the synced
branch sync back into Lovable.
