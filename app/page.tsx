import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const serif = 'font-[family-name:var(--font-newsreader)]'

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
      '"Kind of", "sort of" appeared 8+ times under pressure — signalling uncertainty to senior people in the room.',
  },
  {
    label: 'Clarity',
    teaser:
      'Three key answers ran 25–30% longer than needed. Senior audiences scan for the signal — extra words dilute it.',
  },
]

const DIFFERENTIATORS = [
  {
    lead: 'A notetaker remembers the meeting. Signal remembers ',
    accent: 'you.',
    body: 'Notes are the record of what was said. Signal is the read on how you showed up.',
  },
  {
    lead: 'A chatbot answers what you ask. Signal notices what you’d ',
    accent: 'never think to ask.',
    body: 'It’s built to surface the patterns you missed in the room, not to react to a prompt.',
  },
  {
    lead: 'Notes make you informed. Signal makes you ',
    accent: 'better.',
    body: 'You can have perfect notes and still repeat the same mistake in every meeting.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F1F0EA] text-[#1B211E] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto w-full">
        <span className="font-semibold text-lg tracking-tight text-[#1B211E]">Signal</span>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm text-[#6B6F66] hover:text-[#1B211E] transition-colors">
            My sessions
          </Link>
          <Link href="/auth" className="text-sm font-medium text-[#1B211E] hover:text-[#1F4A3D] transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center px-6 text-center max-w-3xl mx-auto w-full pt-20 pb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1F4A3D]/25 bg-[#1F4A3D]/[0.06] px-4 py-1.5 text-xs text-[#1F4A3D] font-medium mb-9 fade-in">
          For the meetings that shape your career
        </div>

        <h1 className={`${serif} text-5xl sm:text-6xl font-normal tracking-tight leading-[1.06] mb-6 fade-in-1 text-[#1B211E]`}>
          A communication coach for
          <br />
          <span className="italic text-[#1F4A3D]">your real meetings.</span>
        </h1>

        <p className="text-lg text-[#4A4F49] max-w-xl leading-relaxed mb-10 fade-in-2">
          Paste the transcript from a Zoom call, 1:1, or review, and Signal shows you how you came
          across, what the room was really telling you, and exactly what to do differently next
          time — privately, just for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 fade-in-3">
          <Link
            href="/new"
            className="inline-flex items-center gap-2 bg-[#1F4A3D] hover:bg-[#163329] text-[#F1F0EA] font-medium px-6 py-3 rounded-lg transition-all duration-150 text-sm"
          >
            Try your first meeting
            <ArrowRight size={15} />
          </Link>
          <Link href="/dashboard" className="text-sm text-[#6B6F66] hover:text-[#1B211E] transition-colors">
            View past sessions
          </Link>
        </div>

        <p className="text-sm text-[#6B6F66] mt-6 fade-in-3">
          Already have an account?{' '}
          <Link href="/auth" className="text-[#1F4A3D] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </main>

      {/* Emotional bridge */}
      <section className="w-full max-w-xl mx-auto px-6 text-center pb-14 fade-in-4">
        <p className={`${serif} text-2xl italic text-[#1B211E] leading-snug mb-3`}>
          You know the feeling.
        </p>
        <p className="text-base text-[#4A4F49] leading-relaxed">
          A meeting ends and something felt off — but you can&rsquo;t quite place it. You replay it
          on the way home. Signal turns that feeling into something useful.
        </p>
      </section>

      {/* Why it matters */}
      <section className="w-full max-w-2xl mx-auto px-6 pb-16 fade-in-4">
        <div className="bg-[#E8E7DE] rounded-3xl px-9 py-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8C8F86] mb-4">
            Why it matters
          </p>
          <p className="text-xl text-[#1B211E] leading-relaxed">
            Careers move in rooms, not on rubrics. And most of what a meeting is really about never
            gets said out loud — it&rsquo;s in what got repeated, who went quiet, what got taken
            &ldquo;offline.&rdquo; Almost no one gives you honest feedback on how you handle that.{' '}
            <span className="text-[#1F4A3D] font-semibold">Signal does.</span>
          </p>
        </div>
      </section>

      {/* Sample coaching preview */}
      <section className="w-full max-w-3xl mx-auto px-6 pb-2">
        <div className="text-center mb-8 fade-in-5">
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#6B6F66] mb-2">
            A real coaching session looks like this
          </p>
          <p className="text-sm text-[#6B6F66]">
            Senior PM · Q3 roadmap review · Goal: get the onboarding initiative greenlit
          </p>
        </div>

        {/* Main card */}
        <div className="bg-[#FCFCF9] rounded-2xl overflow-hidden mb-4 shadow-xl shadow-[#1B211E]/[0.07] border border-[#DFDED4] fade-in-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#EBEAE1]">
            {/* What landed */}
            <div className="p-7">
              <p className="text-[11px] font-semibold text-[#6B6F66] uppercase tracking-[0.12em] mb-5">
                What landed
              </p>
              <ul className="space-y-4">
                {SAMPLE_STRENGTHS.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#1F4A3D]/[0.12] flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-[#1F4A3D]" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-[#1B211E] leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next moves */}
            <div className="p-7">
              <p className="text-[11px] font-semibold text-[#6B6F66] uppercase tracking-[0.12em] mb-5">
                Your next 3 moves
              </p>
              <ol className="space-y-4">
                {SAMPLE_MOVES.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-[#1F4A3D]/[0.12] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#1F4A3D] leading-none">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#1B211E] leading-snug">{m}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Coaching area teasers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 fade-in-5">
          {SAMPLE_AREAS.map((area, i) => (
            <div key={i} className="bg-[#E8E7DE] border border-[#DBDAD0] rounded-xl p-5">
              <p className="text-xs font-semibold text-[#1F4A3D] mb-2">{area.label}</p>
              <p className="text-xs text-[#6B6F66] leading-relaxed">{area.teaser}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Not notes. Not a chatbot. A coach. */}
      <section className="w-full max-w-5xl mx-auto px-6 pt-24 pb-8">
        <div className="text-center mb-10 fade-in-5">
          <h2 className={`${serif} text-4xl font-normal tracking-tight text-[#1B211E] mb-3`}>
            Not notes. Not a chatbot. A coach.
          </h2>
          <p className="text-[15px] text-[#6B6F66]">
            Keep your notes. Signal is the private layer on top that turns them into growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 fade-in-5">
          {DIFFERENTIATORS.map((d, i) => (
            <div key={i} className="bg-[#FCFCF9] border border-[#DFDED4] rounded-2xl p-7">
              <p className="text-base font-semibold text-[#1B211E] leading-snug mb-2.5">
                {d.lead}
                <span className="text-[#1F4A3D]">{d.accent}</span>
              </p>
              <p className="text-sm text-[#6B6F66] leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="text-center pt-16 pb-24 px-6">
        <p className={`${serif} text-3xl font-normal text-[#1B211E] mb-3`}>
          Your next meeting that matters is coming.
        </p>
        <p className="text-sm text-[#6B6F66] mb-8 max-w-sm mx-auto leading-relaxed">
          See yourself clearly — and walk in sharper than last time.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-[#1F4A3D] hover:bg-[#163329] text-[#F1F0EA] font-medium px-7 py-3.5 rounded-lg transition-all duration-150 text-sm"
        >
          Analyse your first meeting
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-xs text-[#8C8F86] border-t border-[#DBDAD0]">
        Signal — a private communication coach. Only you see it.
      </footer>

    </div>
  )
}
