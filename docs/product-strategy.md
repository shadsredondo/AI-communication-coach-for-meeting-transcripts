# Product Strategy

_Last meaningful update: Aug 2026._

## What Signal is

An AI communication coach built on meeting transcripts. It reads a transcript,
tags how the user showed up against a closed taxonomy of communication themes,
and — over multiple meetings — reflects back what is becoming a strength and
what keeps showing up as a growth edge.

The coaching voice is **Sage**: a warm, direct senior mentor for product
managers (the initial ICP), framing gaps as a stage of development, not a
verdict on the person.

## Who it's for

- **Initial ICP:** individual professionals — product managers first — who are
  strong at the work but want to see and improve how they come across.
- The motivating insight: high-achievers who are excellent at their job but
  struggle to read the room (especially on remote calls) have no mirror for it.

## Who pays — the decision that shapes everything

**The individual pays, not their company.** Signal is a consumer / prosumer,
self-serve product. This was decided deliberately (see `decisions.md`) and has
hard consequences:

- **Zero-gatekeeper is non-negotiable.** No IT approval, admin, or sales call
  can sit between signup and value.
- **Ingestion must be user-controlled** — the individual brings their own data
  (paste / upload / eventually a personal recorder), never something their
  employer controls. This is why work-Zoom integration is deferred (see roadmap).
- **Retention is the business.** An individual renews only if the compounding,
  across-meetings value is real. The single-meeting report is the hook; the
  growth trajectory is the product.
- **Privacy is load-bearing, not marketing.** Individuals paste *work*
  conversations into a personal tool. "Your private space, never shared with
  your employer" is the permission structure that lets them use it at all — and
  the moat. The competitive edge is that someone can improve **privately, on
  their own, without their company being involved.**

## Design philosophy

- **No scores, no grades, no regeneration.** Deliberate. Signal is a coach, not
  a report card. This is a differentiator we protect.
- **AI does extraction; the product does meaning-making.** The model tags and
  observes once per meeting; the compounding insight comes from aggregating
  those tags cheaply — not from repeated AI calls.
- **Immutable reports.** A report is generated once and never silently
  regenerated (see `decisions.md`). Consistency comes from caching, not from
  trying to make the LLM deterministic.

## The core commercial tension to stay honest about

Signal has real per-use cost (~2 Claude Sonnet calls per meeting, roughly
$0.15–0.25). Most SaaS has near-zero marginal cost; Signal does not. This drives
pricing, quotas, and unit economics — every feature decision has to respect it.

The unvalidated bet: single-meeting value is proven (by the founder and early
transcripts); the **compounding-retention thesis is not yet proven with real
users**. Validating that a cohort reaches meeting 3–5 and stays is the cheapest,
highest-stakes experiment (see `open-questions.md`).
