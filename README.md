# Signal
AI Communication Coach for Meeting Transcripts

Signal helps professionals reflect on meetings and improve how they communicate, influence, and navigate stakeholder dynamics.

## The Problem

After important meetings, most people leave with uncertainty:

- Did I land my message?
- Did I miss political signals?
- Was my tone effective?
- What should I say next?

Existing tools summarize transcripts, but they rarely help people improve strategic communication.

## Product Hypothesis

Professionals want coaching, not summaries.

By combining meeting context, stakeholder dynamics, communication goals, and transcript analysis, Signal helps users reflect more strategically after meetings.

## Who This Is For

- Product leaders
- Managers
- Cross-functional stakeholders
- Professionals navigating high-stakes communication

## How It Works

1. Upload a meeting transcript
2. Add meeting context
3. Signal analyzes:
   - Communication effectiveness
   - Stakeholder signals
   - Strategic positioning
   - Tone and clarity
4. Receive personalized coaching and next-step recommendations

## Why I Built This

As a product leader, I noticed that post-meeting reflection is often reactive and emotional rather than structured. I wanted to explore whether AI could act as a thoughtful communication coach — helping professionals improve influence, clarity, and presence over time.

## Product Decisions & Tradeoffs

### V1 Scope
- Transcript upload first
- No Zoom integration initially
- Focus on actionable coaching over meeting summaries

### Design Principles
- Coaching > summarization
- Structured feedback > generic AI advice
- Context-aware analysis > transcript-only outputs

## Tech Stack

- Next.js
- TypeScript
- Claude API
- Supabase
- Vercel

## Demo

https://signal-puce-eight.vercel.app/

## What’s Next

- Zoom/Google Meet integrations
- Meeting memory over time
- Personalized communication patterns
- Goal-based coaching
