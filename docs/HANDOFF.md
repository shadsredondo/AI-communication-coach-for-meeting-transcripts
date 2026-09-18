# Signal — Handoff / Start Here

_Read this first if you're picking up the project (human or coding agent).
It orients you fast; the deeper docs are linked at the bottom._

## What Signal is
A private AI communication coach. A user pastes a meeting transcript; Signal
reads it and returns coaching on **how they came across** — what landed, what
didn't, and what to do next time. Individual-pays, self-serve, consumer/prosumer.
Not a meeting-notes tool — it's about *you*, not the meeting.

## Run it locally
```bash
npm install
npm run dev          # http://localhost:3000
```
- **Requires `.env.local`** (gitignored — not in the repo). Set these:
  - `ANTHROPIC_API_KEY` — an Anthropic API key (server-side; the coaching calls)
  - `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the Supabase publishable/anon key
- Without these, auth and analysis won't work.

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
Supabase (auth + Postgres: `profiles`, `sessions`) · Anthropic SDK · Vercel.

> ⚠️ **Next.js note (see AGENTS.md):** this Next.js version has breaking changes
> vs. older docs — check `node_modules/next/dist/docs/` before writing Next-specific
> code. Most day-to-day work (prompt content, component render) doesn't touch Next APIs.

## How the coaching pipeline works (the core)
Two Claude calls, both `claude-sonnet-4-6`:
1. **Step 1 — Observational Analyst** (`/api/analyse/step1`, prompt in
   `lib/deterministic-prompt.ts`): extracts *only observable facts* from the
   transcript. No advice, no motives. This grounds the coaching.
2. **Step 2 — Sage** (`/api/analyse`, prompt assembled in `lib/system-prompt.ts`
   from the sections in `lib/prompt/sage-sections.ts`): turns the facts + the
   user's profile + the theme taxonomy into the coaching JSON.

Output is **prompt-for-JSON** (not tool-use): the model returns a JSON object,
the route brace-extracts + parses it and validates the theme tags.

## Key files
| Area | File |
|---|---|
| Sage coaching prompt (13 sections) | `lib/prompt/sage-sections.ts` |
| Step-1 observation prompt | `lib/deterministic-prompt.ts` |
| Theme taxonomy (12 themes) + goal→hypotheses | `lib/growth-hypotheses.ts` |
| Cross-meeting growth aggregation | `lib/growth.ts` |
| Auth (local ES256 JWT verify) + free-tier quota | `lib/auth-server.ts` |
| localStorage-first storage + Supabase sync | `lib/storage.ts` |
| Results page (renders the coaching) | `app/results/[id]/page.tsx` |
| Dashboard (growth home) | `app/dashboard/page.tsx` |
| Paid API routes | `app/api/analyse/route.ts`, `app/api/analyse/step1/route.ts` |

## Current state (branch: `dev`)
- `dev` is **ahead of `main`** by the dashboard hydration fix + the coaching
  voice/style pass. Merge `dev → main` to deploy the latest.
- The coaching **voice pass** just landed: plainer takeaway, a dynamic "The read"
  headline (from `diagnosis.headline`), a personalized "Your path" line (from
  `profile_check`), framework-first actions, and the results sections reordered
  so the whole-system **capability leads** (right after the takeaway).

## Open threads / next steps
- **Tighten the snapshot observations** (still ~25 words; a hard word-cap was
  discussed, not done).
- **Build an eval harness** — there is *none* today (no tests, no golden set).
  This is the biggest gap; see `open-questions.md`.
- **Ingestion**: users must already have a transcript (paste only). Upload-based
  ingestion is the next adoption unlock (`roadmap.md`).
- Verify Supabase **RLS**; make the quota durable; add payments. (`roadmap.md`)

## Gotchas that will bite you
- **Supabase free tier auto-pauses after ~7 days idle** → every request fails with
  "Failed to fetch". Fix: restore it in the Supabase dashboard.
- **React StrictMode double-fires** the analysis in dev (2× the Claude calls);
  production runs once. Un-guarded.
- **Dead code:** `lib/meeting-analyst-prompt.ts`, the `MeetingAnalysis` type, and
  `app/meeting-analysis/[id]/page.tsx` are remnants of a removed "Meeting Analyst"
  agent — not wired into the pipeline.

## The deeper docs (in this folder)
- `product-strategy.md` — who it's for, positioning, the cost model
- `roadmap.md` — priorities + what's deferred (Zoom, RAG) and why
- `decisions.md` — decision log (auth, JWT, immutability, no-scores…)
- `open-questions.md` — gaps, risks, unproven bets
- `brand.md` — the Deep Pine palette + fonts
- `signal-technical-writeup.md` — the full deep-dive
