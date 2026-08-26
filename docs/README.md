# Signal — Decision Docs

This folder is the **"why we chose this" layer** for Signal. It is written for
humans (and coding agents) picking the project back up — not for the coaching
model. Nothing here is ever sent to Sage.

If you have been away from the project and forgotten the reasoning behind a
choice, start here.

## What's in here

| Doc | What it answers |
|---|---|
| [product-strategy.md](product-strategy.md) | Who Signal is for, who pays, and the philosophy that shapes every feature |
| [roadmap.md](roadmap.md) | What we're building next and, more importantly, what we've deliberately deferred and why |
| [decisions.md](decisions.md) | A running log of concrete product/architecture decisions — what, why, and what we rejected |
| [open-questions.md](open-questions.md) | Known gaps, unverified assumptions, and risks we're carrying |

## How to use these

- **Making a real decision?** Add an entry to `decisions.md` (what / why / rejected).
- **A decision changed?** Don't delete the old entry — add a new one that supersedes it, so the history of *why* survives.
- **These are not model instructions.** Coaching content (Sage's prompt, the
  theme taxonomy, the coaching playbook modules) lives in code, not here.

## The three-layer model these docs belong to

1. **Runtime prompt modules** — content the LLM receives (`lib/system-prompt.ts`, `lib/deterministic-prompt.ts`, `lib/growth-hypotheses.ts`). *Code.*
2. **Coaching knowledge modules** — the curated playbook, keyed to the theme taxonomy (e.g. a future "Perception Gap" module). *Structured docs, model-facing.*
3. **Product / decision context** — this folder. *Human-facing, never sent to the model.*
