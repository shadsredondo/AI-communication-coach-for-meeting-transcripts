import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const HOW_IT_WORKS = [
  {
    number: '1',
    title: 'Understand what happened',
    description:
      'Signal maps only what\'s observable — who drove the conversation, where it shifted, what was actually decided. No assumptions. No invented politics.',
  },
  {
    number: '2',
    title: 'See how you came across',
    description:
      'Using your role, your goal, and the dynamics in the room, Signal coaches you on what landed and what missed — grounded in evidence from the transcript.',
  },
  {
    number: '3',
    title: 'Know what to do next',
    description:
      'Concrete moves, specific to this meeting. A message to send. A framing to sharpen. A communication habit to start building before the next conversation.',
  },
]

const SAMPLE_STRENGTHS = [
  'Strong framing — established why Q3 timing mattered before asking for resources',
  'Led with business impact, not feature detail, which aligned the room early',
]

const SAMPLE_MOVES = [
  'Send Marcus a 3-bullet follow-up anchoring the decision and your ask — within 24 hours',
  'Address the "why now?" objection head-on before it resurfaces at the leadership level',
  'Replace "I think we should" with "I recommend" — same idea, significantly more authority',
]

const SAMPLE_AREAS = [
  {
    label: 'Strategic Communication',
    teaser:
      'You closed without a named owner or next step — giving opponents of your proposal time to reframe offline.',
  },
  {
    label: 'Tone & Presence',
    teaser:
      '"Kind of", "sort of" appeared 8+ times under pressure — signalling uncertainty to senior stakeholders.',
  },
  {
    label: 'Clarity',
    teaser:
      'Three key answers ran 25–30% longer than needed. Senior audiences scan for the signal — extra words dilute it.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1510] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto w-full">
        <span className="font-semibold text-lg tracking-tight text-[#1C1510]">Signal</span>
        <Link
          href="/dashboard"
          className="text-sm text-[#78716C] hover:text-[#1C1510] transition-colors"
        >
          My sessions
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center px-6 text-center max-w-3xl mx-auto w-full pt-20 pb-16">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C96442]/30 bg-[#C96442]/8 px-4 py-1.5 text-xs text-[#C96442] font-medium mb-10 fade-in">
          Your private communication coach
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6 fade-in-1 text-[#1C1510]">
          The coach most
          <br />
          <span className="text-[#C96442]">professionals never had.</span>
        </h1>

        {/* Subhead */}
        <p className="text-lg text-[#78716C] max-w-xl leading-relaxed mb-4 fade-in-2">
          After every important workplace conversation, Signal helps you understand
          what really happened, how you came across, and what to say differently
          next time.
        </p>
        <p className="text-base text-[#78716C] max-w-md leading-relaxed mb-12 fade-in-2">
          So you can build influence, earn trust, and grow.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 fade-in-3">
          <Link
            href="/new"
            className="inline-flex items-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-[#C96442]/20"
          >
            Try your first meeting
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-[#78716C] hover:text-[#1C1510] transition-colors"
          >
            View past sessions
          </Link>
        </div>
      </main>

      {/* How it works */}
      <section className="w-full max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12 fade-in-3">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#78716C]">
            How it works
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 fade-in-4">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.number}
              className="bg-[#F0EBE3] rounded-2xl p-7 flex flex-col gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-[#C96442] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{step.number}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C1510] mb-2 leading-snug">
                  {step.title}
                </p>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Emotional bridge */}
      <section className="w-full max-w-2xl mx-auto px-6 text-center pb-14 fade-in-4">
        <p className="text-xl font-medium text-[#1C1510] leading-relaxed mb-2">
          You know the feeling.
        </p>
        <p className="text-base text-[#78716C] leading-relaxed">
          A meeting ends and something felt off — but you can't quite place it.
          You replay it on the way home. Signal turns that feeling into something useful.
        </p>
      </section>

      {/* Sample coaching preview */}
      <section className="w-full max-w-3xl mx-auto px-6 pb-0">

        <div className="text-center mb-8 fade-in-5">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#78716C] mb-2">
            A real coaching session looks like this
          </p>
          <p className="text-sm text-[#78716C]">
            Senior PM · Q3 roadmap review · Goal: gain approval for the onboarding initiative
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl overflow-hidden mb-4 shadow-xl shadow-[#1C1510]/8 border border-[#E8DFD3] fade-in-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EBE3]">

            {/* What landed */}
            <div className="p-7">
              <p className="text-[11px] font-semibold text-[#78716C] uppercase tracking-[0.12em] mb-5">
                What landed
              </p>
              <ul className="space-y-4">
                {SAMPLE_STRENGTHS.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#4A7C59]/15 flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-[#4A7C59]" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-[#1C1510] leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next moves */}
            <div className="p-7">
              <p className="text-[11px] font-semibold text-[#78716C] uppercase tracking-[0.12em] mb-5">
                Your next 3 moves
              </p>
              <ol className="space-y-4">
                {SAMPLE_MOVES.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#C96442]/15 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#C96442] leading-none">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#1C1510] leading-snug">{m}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Coaching area teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-0 fade-in-5">
          {SAMPLE_AREAS.map((area, i) => (
            <div
              key={i}
              className="bg-[#F0EBE3] border border-[#E8DFD3] rounded-xl p-5"
            >
              <p className="text-xs font-semibold text-[#C96442] mb-2">{area.label}</p>
              <p className="text-xs text-[#78716C] leading-relaxed">{area.teaser}</p>
            </div>
          ))}
        </div>

        {/* Gradient fade to page bg */}
        <div className="relative h-36 -mt-2 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FAF7F2]" />
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="text-center pb-24 px-6">
        <p className="text-2xl font-semibold text-[#1C1510] mb-3">
          Your next important meeting is coming.
        </p>
        <p className="text-sm text-[#78716C] mb-8 max-w-sm mx-auto leading-relaxed">
          Start building the communication habits that compound over time.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-7 py-3.5 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-[#C96442]/20"
        >
          Analyse your first meeting
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs text-[#B8A99A] border-t border-[#E8DFD3]">
        Signal — Communication coaching for ambitious professionals
      </footer>

    </div>
  )
}
