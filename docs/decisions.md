# Decision Log

A running record of concrete product/architecture decisions: **what** we
decided, **why**, and **what we rejected**. Newest at the top. When a decision
changes, add a new entry that supersedes the old one rather than editing history.

---

## D-007 · No scores or grades in coaching
**Decision:** Signal never shows numeric scores, letter grades, or "goal
achievement %". Coaching is qualitative — strength vs. growth, framed as a stage
of development.
**Why:** Signal is a coach, not a report card. The no-grades stance is a
deliberate differentiator and protects the mentor tone.
**Rejected:** The earlier dashboard's red/green score badges and achievement-%
stats block (removed when the growth home was built).

## D-006 · Ingestion is user-controlled; Zoom deferred
**Decision:** The user brings their own transcript (paste now, upload next,
personal recorder later). Do not build work-Zoom integration as consumer
ingestion.
**Why:** Individual-pays means zero-gatekeeper self-serve. Work Zoom is
employer-controlled (admin approval, data governance, consent) and would turn
Signal B2B. See `roadmap.md` for the full reasoning.
**Rejected:** Zoom-first ingestion; a meeting-joining bot (kills privacy
positioning).

## D-005 · RAG deferred in favor of modular docs + theme routing
**Decision:** Organize coaching knowledge into modular docs keyed to the theme
taxonomy. Do not build embedding/vector RAG yet.
**Why:** The playbook fits in the context window; retrieval adds a wrong-chunk
failure mode. Signal already tags `theme_id`, so deterministic theme→module
routing delivers grounding without a vector store.
**Rejected (for now):** pgvector/Pinecone embedding retrieval. Revisit when the
library outgrows context or needs fuzzy semantic matching.

## D-004 · Individual is the payer (consumer / self-serve)
**Decision:** Signal is sold to the individual professional, not their company.
**Why:** The motivation (personal career growth) is individual, so the buyer is
individual. This locks in self-serve, user-controlled ingestion, retention-as-
the-business, and privacy-as-moat.
**Rejected:** B2B-first / company-procured motion (deferred to a possible later
chapter).

## D-003 · Reports are immutable (generate once, cache)
**Decision:** A coaching report is generated once and stored; it is never
auto-regenerated on schema changes. A manual "Regenerate" action exists.
**Why:** An earlier bug silently re-ran the AI (and re-billed) on every schema
change. Users also expect "my report didn't change." Consistency for identical
input comes from **caching**, not from trying to make the LLM deterministic
(which isn't reliably possible even at temperature 0).
**Rejected:** Auto-regenerating when the saved shape looks old.

## D-002 · Verify auth tokens locally (native ES256), not via network
**Decision:** `authenticateRequest` verifies the Supabase JWT locally against
the project's published ES256 public keys (JWKS), using Node's native crypto —
algorithm pinned to ES256, claims validated (exp, iss, aud, sub), JWKS cached.
**Why:** The previous approach called `supabase.auth.getUser(token)` on every
paid request — a ~700ms round-trip that got rate-limited under load and
intermittently rejected valid tokens. Local verification is instant and has no
per-request dependency on the auth server.
**Rejected:** Per-request network `getUser`. **Trade-off accepted:** revocation
is bounded by the ~1h token lifetime; add targeted revocation checks for truly
sensitive actions later.
**Note:** The project uses new-format keys — publishable key (`sb_publishable_…`)
and asymmetric ES256 signing — which is what makes local JWKS verification the
right fit.

## D-001 · Gate paid analysis behind auth + a free-tier quota
**Decision:** Both paid routes (`/api/analyse`, `/api/analyse/step1`) require a
valid signed-in user (401 otherwise). A free-tier quota (`FREE_MEETING_LIMIT`,
currently **1**) returns 402 before any spend once used up. `/new` sends
signed-out visitors to `/auth` first.
**Why:** The routes were unauthenticated — anyone could POST a transcript and
spend Anthropic credits directly. Auth closes the endpoint to strangers; the
quota caps per-user cost and seeds the future paywall.
**Rejected:** Anonymous free trials — an anonymous user can't be metered or
distinguished from an attacker, so "value before signup" was traded for
protection. Friction is mitigated by (planned) Google one-tap OAuth + a
pre-baked example report on the landing page.
