# Brand & Visual System

_Adopted Aug 2026, replacing the earlier terracotta/cream + Fraunces look (which
read as generic "AI startup"). Direction chosen from a 4-way exploration._

## The brief this system serves

Intimate & private · light & airy · **premium / refined** (Aesop / Kinfolk) ·
**one bold signature color**. The point of view: a private confidant, not a
dashboard. Restrained, quiet ground with a single confident color used
decisively — and deliberately *not* the ubiquitous warm-AI palette.

## Signature color

**Deep Pine `#1F4A3D`** — the one bold color. Everything accent-worthy unifies
under it: buttons, links, active states, checkmarks, numbered markers, dots,
accents in headlines. Discipline: **no second accent color.** Distinction
between things (e.g. the three growth lenses) comes from labels and layout, not
from extra hues. Semantic status colors (error red, and any goal-outcome
green/amber) are the only exception — they carry meaning, not brand.

## Palette tokens

| Role | Hex |
|---|---|
| Page ground | `#F1F0EA` |
| Tonal beats (results page) | `#EDECE4` · `#E8E7DE` · `#E3E1D6` |
| Tint surface (cards, blocks) | `#E8E7DE` |
| Raised surface (elevated cards) | `#FCFCF9` (or white) |
| Ink (headings) | `#1B211E` |
| Body text | `#4A4F49` |
| Muted / captions | `#6B6F66` |
| Faint (eyebrows, footer) | `#8C8F86` |
| **Signature (pine)** | `#1F4A3D` |
| Signature hover / pressed | `#163329` |
| Signature tints | `rgba(31,74,61, 0.06 – 0.12)` |
| Borders / hairlines | `#DBDAD0` · `#DFDED4` · `#EBEAE1` |

## Typography

- **Newsreader** — serif, headlines and editorial moments (often *italic* for
  the accent phrase). The refined, Kinfolk-ish voice. Loaded as
  `--font-newsreader`; used via `font-[family-name:var(--font-newsreader)]`.
- **Hanken Grotesk** — the UI/body sans. Loaded as `--font-hanken`; the app
  `<body>` default.
- Both are set up in `app/layout.tsx` via `next/font/google`; the Tailwind
  theme maps `--font-sans` → Hanken and `--font-serif` → Newsreader in
  `app/globals.css`.

## Where it lives

Colors are currently hardcoded as Tailwind arbitrary values (`bg-[#1F4A3D]`,
etc.) across the app — there is no token layer yet. **When changing the
palette, update every page; this doc is the source of truth for the values.**
A future improvement is to lift these into CSS custom properties so a reskin is
one file. Until then, grep the old hex → new hex across `app/` and `components/`.

## Not this

Terracotta `#C96442`, cream `#FAF7F2`, Fraunces. The look we deliberately moved
away from.
