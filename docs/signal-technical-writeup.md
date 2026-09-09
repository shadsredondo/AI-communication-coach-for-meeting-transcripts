# Signal — Technical Archaeology Write-up

_A depth-first account of what Signal is, how it was built, and the real
decisions and tradeoffs behind it. Written for interview prep — honest about
scope, specific about mechanics. Pulled from the codebase, git history (86
commits), prompts, and docs as of the Deep-Pine rebrand._

---

## 1. What Signal actually does

**The problem.** Capable professionals get almost no honest feedback on *how
they come across* in meetings — the thing that quietly shapes their trajectory.
Peers won't risk it, managers are vague and annual, and you can't see yourself
clearly while you're in the room. Remote work made it worse (thinner signals, no
hallway debrief).

**Who it's for.** Individual professionals — product managers first (the Sage
persona is literally "a trusted senior advisor and mentor for product managers").
Individual-pays, self-serve; not sold to a company. (See `docs/product-strategy.md`.)

**End-to-end flow (the actual routes):**
1. `/` landing → `/auth` (Supabase email/password; sign-up captures a name).
2. `/setup` — a 2-step profile: role (with seniority inferred by regex in
   `inferLevel`), work environment, then up-to-two strengths, up-to-two
   communication challenges, and one career goal. The goal maps to a set of
   "growth hypotheses" (`getHypothesesForGoal`).
3. `/new` — paste a transcript. Participants are auto-detected
   (`parseTranscript`, `extractRolesFromTranscript`) with a 600ms debounce; the
   draft is stashed in `sessionStorage`.
4. `/analyzing` — fires **Step 1** (`POST /api/analyse/step1`), shows a paced
   "Reading the room…" animation, builds a `Session`, saves it, routes on.
5. `/results/[id]` — fires **Step 2** (`POST /api/analyse`), stores the coaching
   on the session, and renders it as a scroll-paced editorial report.

**What "done" looks like for one use:** a single meeting produces one immutable
coaching report — a one-line takeaway, up to three observation→action pairs, a
root-cause diagnosis, a recurring "pattern," a "next-level capability," and
supporting transcript quotes — plus theme tags that feed a cross-meeting growth
view on the dashboard.

---

## 2. Architecture and technical decisions

**Stack.** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind
v4 · Supabase (auth + Postgres: `profiles`, `sessions` tables) · Anthropic SDK
(`@anthropic-ai/sdk`) · Vercel hosting + analytics.

**System (in words):**
```
Browser (Next client)
  ├─ localStorage-first state (sessions, profile, draft)
  ├─ Supabase JS (anon/publishable key) — auth + profiles/sessions sync
  └─ fetch → Next API routes (server, hold the Anthropic key)
        ├─ /api/analyse/step1  → Claude (Observational Analyst)
        └─ /api/analyse        → Claude (Sage coach)
```

**The core decision: a two-stage pipeline (observe, then coach).**
- **Step 1 — Observational Analyst** (`lib/deterministic-prompt.ts`): extracts
  *only observable facts* — who spoke, questions asked, decisions, topic shifts,
  user "watch moments" (over-explanation, hesitation, filler…), each with a
  `high|medium|low` confidence and an `insufficient_evidence` bucket. It is
  explicitly forbidden to interpret motives or feelings, or to coach.
- **Step 2 — Sage** (`lib/system-prompt.ts`, assembled from
  `lib/prompt/sage-sections.ts`): takes the transcript + the Step-1 facts + the
  user's profile + the theme taxonomy, and produces the coaching JSON.

  **Why split it:** grounding. Step 1 pins the coaching to what's actually in the
  transcript, which is the main defense against a coach that invents politics or
  motives. It's the "accuracy" half of the accuracy-vs-usefulness split (see §3).

**Model + params.** Both stages use `claude-sonnet-4-6`, `max_tokens: 4096`.
Notably, the **coaching call runs at `temperature: 0.4`** (commit `b25c7b6`,
"temperature 0.4 for consistency") while **Step 1 uses the default temperature** —
a deliberate-looking asymmetry: lower variance where wording consistency matters
(coaching + theme tags), default where it's pure extraction. _Gap: Step 1 isn't
pinned to temp 0, which you might expect for a "deterministic" extractor — worth
owning as a small inconsistency rather than a designed choice._

**How the Anthropic API is used (and how it isn't).** This is **prompt-for-JSON,
not tool use / structured outputs.** Each route sends a system prompt that ends
with a strict JSON schema and "Return a single valid JSON object. No text before
or after it," then defends on the way back:
- `extractJSON()` — grabs the substring from the first `{` to the last `}`
  (Step 1 additionally strips ```` ```json ```` fences).
- `JSON.parse` inside try/catch → a `500` with the raw text logged on failure.
- A **validation guard** on the coaching: `coaching.snapshot` is re-mapped to
  reject any `theme_id` not in the closed taxonomy (`isValidThemeId`) and to
  coerce a bad `valence` to `'growth'`.
- Typed error handling for `Anthropic.AuthenticationError` (401),
  `RateLimitError` (429), `BadRequestError` (400).

  **Tradeoff:** simpler and provider-agnostic, but it trusts the model to emit
  clean JSON. The guard covers the *tagging* fields but not the whole shape — a
  malformed report is a 500, not a graceful degrade. Tool-use/structured-outputs
  would harden the schema at some cost in flexibility; this wasn't adopted.

**State/storage decision: localStorage-first, Supabase as sync.** `lib/storage.ts`
reads/writes localStorage synchronously and mirrors to Supabase
(`loadSessionsFromSupabase` merges remote + local-only and uploads the strays).
Chosen for speed and offline-ish feel; the cost was a class of hydration/merge
bugs (stale dashboard, lost pre-sign-in meeting, cross-account bleed) that had to
be fixed one by one. `docs/roadmap.md` flags "flip source of truth to the DB" as
the real fix.

**Auth decision that changed mid-build.** The paid routes verify the caller's
Supabase JWT. The first implementation called `supabase.auth.getUser(token)` — a
network round-trip **per request** (~700ms) that got **rate-limited** under load
and intermittently rejected valid tokens. It was replaced (commit `70e32dd`) with
**local ES256 verification against Supabase's published JWKS** using Node's
native `crypto` (`lib/auth-server.ts`) — algorithm pinned to ES256, claims
checked (exp/iss/aud/sub), JWKS cached 10 min. Instant, no per-request dependency;
revocation is bounded by the ~1h token lifetime.

**The significant reversals (from git history):**
- **Meeting Analyst agent, tried and pulled in ~1 day.** `dc00718` (2026-05-20)
  added "Agent 1: Meeting Analyst — sequential agentic pipeline" (a full meeting
  analysis: summary, decisions, action items — the `MeetingAnalysis` type,
  `lib/meeting-analyst-prompt.ts`, a transition screen, `/meeting-analysis/[id]`).
  `39f9b66` (2026-05-21) **reverted it**: "Revert to single-agent pipeline, remove
  Meeting Analyst." A week later `aa85489` (2026-05-27) introduced the *leaner*
  **Step 1 Deterministic Agent** — grounding-for-coaching, not meeting-notes.
  _Reasonable read (flagged as interpretation): full meeting-notes is a different
  product (that's Granola's job) and added latency/cost without improving the
  coaching, so it was replaced by an observation layer that serves the coach._
  **Dead code today:** `lib/meeting-analyst-prompt.ts` is never imported, the
  `/meeting-analysis/[id]` page is linked from nowhere and always redirects
  (nothing populates `session.meetingAnalysis`).
- **Coaching schema churned repeatedly:** `5777c5b` diagnosis-first → `d9339d7`
  "four-question output" → `4080a14` add the "If you have 30 seconds" snapshot →
  `5038b0e` pair observations 1:1 with actions and **retire the `next_move`
  field** → `2e56d69` tag snapshots with `theme_id`+`valence` for cross-meeting
  tracking → `48c2e5c` make reports **immutable**.
- **A tried-and-reverted field:** `3301580` added `goal_narrative` /
  `challenge_narrative`; `e79029c` reverted them ("sidebar uses raw profile data
  only") — a case of asking the model for something the UI could get for free.
- **Prompt decomposed** (`8327434`) from one 15KB string into 13 named sections,
  verified byte-identical, to make voice edits surgical.

---

## 3. The evaluation / rubric work

**Walk-through of generation.** Transcript + participants → Step 1 emits the
observational JSON → that JSON, plus the transcript, the user's profile, the
"growth hypotheses," and the **12-theme taxonomy** (`lib/growth-hypotheses.ts`:
`strategic_framing, executive_presence, recommendation_conviction,
stakeholder_influence, objection_handling, clarity, conciseness,
active_listening, difficult_conversations, conflict_navigation,
alignment_building, coaching_others`) → Sage emits the coaching JSON
(`goal_outcome`, `snapshot[]`, `remember`, `profile_check`, `diagnosis`,
`pattern`, `next_level`, `evidence`).

**How "good" is defined — honestly: in the prompt, not in an eval.**
There is **no eval set, no scoring script, no rubric-as-code, and no test files**
in this repo (searched: no `evals/`, `test/`, `*.test.ts`, no golden transcripts).
"Good coaching" is encoded entirely as *instructions Sage must obey*:
- **Grounding:** Step 1's "only report what's in the transcript"; Sage's "Do not
  invent evidence — only reference what appears in the transcript."
- **Anti-generic (usefulness):** in the `SNAPSHOT` section — _"Generic coaching
  ('be more concise', 'build more alignment') is a failure. Every observation and
  action must be anchored in [the user's discipline and seniority; who was in the
  room and what their function was evaluating; the specific stakes]."_ And the
  "never a neutral recap" rule.
- **Depth:** the mandatory root-cause pass ("ask 'why' at least five times") and
  "Wear the PM hat" (name gaps in PM-discipline terms by seniority).
- **Goal-alignment:** the `goal_outcome` field — `strong | partial | off_track`,
  **evaluated relative to the user's stated career goal**, not the meeting in
  the abstract.

**Accuracy ≠ usefulness — where it lives in this system.** This is a *design*
distinction, not a measured one. The two-stage split is exactly this separation:
- **Accuracy** is Step 1's job — no hallucinated motives, confidence-gated,
  `insufficient_evidence` for anything below "medium."
- **Usefulness / goal-alignment** is Sage's job — the anti-generic rules and
  `goal_outcome`.

  **What "grounded but not useful" looks like here, concretely:** a report that
  quotes only real transcript moments (zero hallucination) but says "you could be
  more concise" or "work on executive presence" — true, cited, and worthless,
  because it isn't tied to the user's discipline, the room, or their goal. The
  code *tries* to prevent this with the "generic coaching is a failure" rule and
  the `goal_outcome` lever. **But nothing measures whether it succeeds.** The
  intended defense is prompt-encoded intent; the eval that would catch a grounded-
  but-generic report doesn't exist yet.

  **This is the single biggest gap between the product's ambition and its
  current state**, and it's already acknowledged in `docs/open-questions.md`
  ("Tagging consistency unmeasured") and `docs/roadmap.md` (an A/B "grounded vs.
  not" test is proposed, not built).

---

## 4. What's genuinely hard about this problem

**Where the code shows real wrestling:**
- **Getting a coach to *not* make things up.** The entire two-stage design, the
  confidence levels, and the `insufficient_evidence` bucket exist to fight
  hallucinated politics. That's the hard part of AI coaching, and it drove an
  architecture, not a prompt line.
- **JSON out of an LLM, reliably.** `extractJSON` brace-matching, markdown-fence
  stripping, the try/catch-to-500, and the theme/valence guard are all scar
  tissue from the model not always returning clean, on-taxonomy JSON.
- **Consistency vs. determinism.** LLMs can't be made bitwise-deterministic, so
  consistency is bought two ways: `temperature: 0.4` on the coaching call, and
  **immutability** — a report is generated once (`if (!session.coachingOutput)`)
  and cached forever; "same input → same output" is achieved by *not asking
  again*, with a manual "Regenerate" as the escape hatch.
- **Transcript ingestion.** `lib/transcript-parser.ts` handles Zoom vs. raw
  formats, speaker/role extraction, and a debounced auto-detect — messier than it
  looks, and still the product's biggest adoption wall (you must already *have* a
  transcript).
- **Cross-meeting growth from noisy tags.** `lib/growth.ts` rolls `theme_id` +
  `valence` across meetings into `becoming_strength` / `recurring_growth` /
  `consistent_strength`, with a **backfill** that reads `diagnosis.hypothesis_tags`
  for older reports that predate snapshot tagging — a compatibility layer so
  history still feeds the growth view without re-running (and re-billing) the AI.
- **Auth latency/rate-limits** → the network-`getUser` → local-JWKS rewrite (§2).

**Known limitations / still rough:**
- **No evals** (the big one). Tagging consistency — the foundation of the growth
  view — is unmeasured. If the same behavior gets different `theme_id`s across
  meetings, the patterns are noise.
- **Cold start vs. the pitch:** the compounding "growth over time" value needs
  ~3 meetings with recurring themes; a first-time user sees a "warm seed" empty
  state, not the trajectory that sells the product.
- **Quota is soft:** `checkQuota` counts `sessions` rows, so deleting a meeting
  frees quota (fine for v1, wrong for billing).
- **RLS unverified:** row-level security lives in the Supabase dashboard, not the
  repo — not confirmed that user A can't read user B's transcripts.
- **Dead code:** the Meeting Analyst remnants (§2).
- **Dev double-billing:** React StrictMode double-fires the generate effect in
  dev (2× the Claude calls); production runs once, but it's un-guarded.

---

## 5. Honest scope assessment

**This is a working prototype — a strong one, but a prototype, not production.**

It genuinely works end-to-end (verified live this cycle: sign-up → setup →
sign-in → analyze → results, plus delete, regenerate, sign-out, the auth/quota
guardrail). The coaching quality is the real, differentiated asset. But "prototype"
is the honest label, for concrete reasons:
- **No tests, no evals, no monitoring.** Quality rests on prompt instructions and
  spot-checks, not measurement.
- **No payments / real paywall;** the free tier is one meeting and the "Upgrade"
  button is a placeholder.
- **Security/data gaps for public use:** RLS unverified; quota resettable; no
  durable usage metering.
- **Unproven core bet:** the compounding-retention thesis (people come back for
  meeting 3, 4, 5 and pay) has not been validated with real users — it's the
  cheapest, most important experiment still to run.
- **Real per-use cost** (~2 Sonnet calls/meeting) with no unit-economics work yet.

**To get to production-grade:**
1. **Build the eval harness** — a golden transcript set + a rubric scored on
   grounding, specificity, goal-alignment, and tagging consistency; run RAG/no-RAG
   and prompt changes against it. This is the thing that turns "sounds good" into
   "measurably good."
2. **Verify RLS + move source-of-truth to the DB** (kill the localStorage-merge
   bug class).
3. **Durable usage metering + payments** (Stripe), replacing the session-count quota.
4. **Harden the model boundary** — schema validation on the whole coaching object
   (or structured outputs), graceful degrade instead of 500s, retries.
5. **Solve ingestion** — upload/paste-plus so users aren't blocked on already
   having a transcript.
6. **Remove dead code; guard the StrictMode double-call; add observability**
   (error tracking, per-user cost).

---

## 6. Plain-language summary (say-it-out-loud version)

Signal is a private communication coach that reads the transcript of a meeting
and tells you how you actually came across — what landed, what didn't, and one
specific thing to do differently next time. Under the hood it runs two passes:
the first pass just pulls out the facts of what happened, with no interpretation,
so the coaching can't make things up; the second pass is the "coach" that turns
those facts into feedback tied to your role and your goals. The hardest part
wasn't getting an AI to say something — it was getting it to say something
*useful*: it's easy to be accurate and still generic, so a lot of the work went
into forcing the feedback to be specific to the actual room instead of "be more
concise." It's a working prototype — the whole flow works and the coaching is
genuinely good — but I'd call it a prototype honestly, because the thing that
would make it a real product, an evaluation system that measures whether the
coaching is actually helpful, is the piece I haven't built yet. If I took it
further, that eval harness is the first thing I'd build, because everything else
depends on being able to measure "good."
