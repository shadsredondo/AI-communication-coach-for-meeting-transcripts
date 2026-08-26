# Open Questions, Known Gaps & Risks

Things we're carrying that aren't resolved. Keep this honest — it's the list
that stops us from believing the product is more finished than it is.

## Unvalidated assumptions (highest stakes first)

- **The retention/compounding thesis is unproven.** Single-meeting value is
  validated; that individuals come back for meeting 3–5 and stay (enough to pay a
  subscription that clears inference cost) is **not**. This is the cheapest,
  most important experiment to run before building the full commercial machine.
- **Frequency is unknown.** People don't have a "meeting that mattered" daily.
  Low usage frequency threatens both the growth-pattern payoff and subscription
  logic. No validated theory of how often a user returns.
- **Painkiller vs. vitamin.** "Grow as a communicator" is important-but-not-
  urgent for most. A sharper wedge may be a specific high-stakes moment (exec
  review, negotiation, interview, difficult 1:1). Unresolved.

## Technical gaps to close before public / paid launch

- **Supabase RLS not verified.** Need to confirm at the database level that user
  A cannot read user B's transcripts/profile. Policies live in the Supabase
  dashboard, not the repo. Non-negotiable before strangers' data goes in.
- **Quota is resettable.** `checkQuota` counts persisted sessions, so deleting a
  meeting frees quota. Fine for v1; a durable increment-only counter should come
  with billing.
- **Happy-path not yet verified end-to-end on a live env.** The guardrail's
  security behavior (401/402) is verified; a clean signup → first-meeting-succeeds
  → second-hits-402 run still needs to pass on a Vercel preview (blocked locally
  by env issues below).
- **No payments, no real paywall screen.** The 402 "Upgrade" button currently
  points at `/dashboard` as a placeholder.
- **Tagging consistency unmeasured.** Cross-meeting patterns depend on the same
  behavior getting the same `theme_id`. No eval yet confirms this holds.

## Environment gotchas (bit us during local testing)

- **Free-tier Supabase projects auto-pause after ~1 week of inactivity.** A
  paused project makes every request fail with "Failed to fetch." Restore it
  from the Supabase dashboard after a break. (Project ref: `uzaubkvumdzuajxmfiae`.)
- **Local `.env.local` Anthropic key expires/gets revoked.** Refresh it before
  running analyses on localhost. The live site is unaffected (separate key on
  Vercel).
- **Turbopack workspace root.** A stray lockfile in the home directory made
  `next dev` resolve the wrong root; pinned via `turbopack.root` in
  `next.config.ts`.
- **Vercel env scoping.** If verifying on a preview, ensure `ANTHROPIC_API_KEY`
  and the Supabase vars are enabled for the **Preview** environment, not just
  Production.

## Product loopholes noted but not yet addressed

- **First-run vs. the pitch.** A brand-new user with one meeting sees the "warm
  seed" empty state, not the growth trajectory that sells the product. Consider
  a locked/blurred "your patterns" preview, or set the expectation in-product.
- **Name backfill depends on auth metadata.** Accounts created before name-
  capture only get a name if it exists in Supabase auth metadata.
