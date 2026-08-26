# Roadmap & Prioritization

_Last meaningful update: Aug 2026. Viewed through the "individual-pays,
self-serve" lens (see [product-strategy.md](product-strategy.md))._

## Priority stack

1. **Cost / auth guardrail** — _in progress, largely complete._
   Only signed-in users can trigger paid analysis; free tier capped. Required
   before charging anyone or exposing the product publicly. See
   `decisions.md` (auth guardrail, local JWT, free-tier quota).

2. **Upload-based ingestion** — _next._
   Let the user bring a transcript file (Zoom export, Otter, Granola, Fathom,
   Google Meet), not just paste. This is the real adoption unlock: user-
   controlled, consumer-compatible, works with every source, cheap to build,
   no new cost line. Validates the "easier ingestion → better retention"
   hypothesis.

3. **Patterns / growth experience + tagging consistency.**
   The across-meetings trajectory is what people subscribe *for*. Depends on
   tag consistency — the same behavior must get the same `theme_id` across
   meetings, or the patterns are noise. Consider making tagging a constrained
   classification step rather than free generation.

4. **Consumer pricing + paywall.**
   A price point (~$10–20/mo) that clears per-analysis cost. The free-tier
   quota (`FREE_MEETING_LIMIT`) is the seed of this.

## Deliberately deferred (and why)

- **Zoom integration — parked.** Attractive because "everyone has Zoom on work
  email," but that Zoom account belongs to the *employer*. It requires admin
  app-approval, raises data-governance/consent issues, and the transcript often
  doesn't exist (cloud recording is paid-tier and frequently disabled). It
  quietly turns Signal into a B2B product. Only revisit as a deliberate **B2B
  chapter** (sell to the company, admin-approved, team dashboards) — never as
  bottom-up consumer ingestion.

- **Personal desktop recorder — later.** The on-brand premium ingestion path
  (local, private, no bot joins the call — the Granola model). Deferred because
  it's a real native-audio build, adds a **transcription cost line** (Whisper/
  Deepgram/etc. per minute), and puts consent handling on us. Do it only after
  upload proves retention justifies it. Note: a "bot that joins the meeting" is
  explicitly the wrong form — a visible participant kills the private/personal
  positioning.

- **RAG (vector retrieval) — deferred.** The instinct to organize coaching
  knowledge into modular docs is good and worth doing. But embedding-based
  retrieval is premature: the whole playbook fits in the context window, and
  retrieval adds a new failure mode (fetching the wrong chunk). Signal already
  tags `theme_id`, so **deterministic theme→module routing** gets ~90% of the
  value with none of the vector-store complexity. Graduate to real RAG only when
  the library outgrows the context window or needs fuzzy semantic matching. Fine
  as a *learning* project — just don't confuse "learn RAG" with "highest-leverage
  thing for Signal."

## Not on the critical path (but valuable)

- Coaching-quality investments (playbook modules like Perception Gap, grounding
  Sage in curated principles). Improve output but compete with the commercial
  priorities above. Sequence after the retention loop is validated.
