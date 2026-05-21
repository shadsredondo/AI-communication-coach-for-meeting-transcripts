'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Target, MessageSquare, Mic, FileText,
  ChevronDown, ChevronUp, Brain, ListTodo, AlertCircle, CheckCircle2,
  Check, Users
} from 'lucide-react'
import { getSession } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import type { Session, GoalScore, CoachingSection, MeetingAnalysis } from '@/types'

// ─── Goal Indicator ────────────────────────────────────────────────────────────

function GoalIndicator({ score, headline }: { score: GoalScore; headline: string }) {
  const config = {
    green: {
      bar: 'bg-emerald-400',
      dot: 'bg-emerald-400',
      label: 'Strong',
      labelColor: 'text-emerald-600',
    },
    yellow: {
      bar: 'bg-amber-400',
      dot: 'bg-amber-400',
      label: 'Partial',
      labelColor: 'text-amber-600',
    },
    red: {
      bar: 'bg-red-400',
      dot: 'bg-red-400',
      label: 'Off track',
      labelColor: 'text-red-500',
    },
  }[score]

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className={`h-[3px] w-full ${config.bar}`} />
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${config.labelColor}`}>
            {config.label}
          </span>
        </div>
        <p className="text-base font-semibold text-zinc-900 leading-snug">{headline}</p>
      </div>
    </div>
  )
}

// ─── Signal Summary ────────────────────────────────────────────────────────────

function SignalSummary({
  whatLanded,
  nextMoves,
}: {
  whatLanded: string[]
  nextMoves: string[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Signal Summary</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-4">What landed</p>
          <ul className="space-y-3.5">
            {whatLanded.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-emerald-600" strokeWidth={3} />
                </span>
                <span className="text-sm text-zinc-700 leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-4">Your next 3 moves</p>
          <ol className="space-y-3.5">
            {nextMoves.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-600 leading-none">
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-700 leading-snug">{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

// ─── Coaching Section ──────────────────────────────────────────────────────────

function CoachingCard({
  section,
  icon: Icon,
  title,
  index,
}: {
  section: CoachingSection
  icon: React.ElementType
  title: string
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left px-6 py-5 hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={14} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-1">{title}</p>
              <p className="text-sm font-semibold text-zinc-900 leading-snug pr-4">
                {section.one_line_summary}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-1">
            {open
              ? <ChevronUp size={15} className="text-zinc-400" />
              : <ChevronDown size={15} className="text-zinc-400" />
            }
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-6 space-y-6">

          {section.what_went_well.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.1em] mb-3">What went well</p>
              <div className="space-y-2.5">
                {section.what_went_well.map((item, i) => (
                  <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-sm font-semibold text-zinc-900 mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.what_could_be_stronger.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.1em] mb-3">What could be stronger</p>
              <div className="space-y-2.5">
                {section.what_could_be_stronger.map((item, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-sm font-semibold text-zinc-900 mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.rewrite_suggestions && section.rewrite_suggestions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-[0.1em] mb-3">Rewrite suggestions</p>
              <div className="space-y-3">
                {section.rewrite_suggestions.map((r, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-zinc-100">
                      <div className="p-4">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">What you said</p>
                        <p className="text-sm text-zinc-500 italic leading-relaxed">"{r.original}"</p>
                      </div>
                      <div className="p-4 bg-zinc-50/50">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Stronger version</p>
                        <p className="text-sm text-zinc-900 font-medium leading-relaxed">"{r.rewrite}"</p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-100">
                      <p className="text-xs text-indigo-700 leading-relaxed">{r.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Meeting Intelligence ──────────────────────────────────────────────────────

function ConfidencePip({ level }: { level: 'high' | 'medium' | 'low' }) {
  const color = { high: 'bg-emerald-400', medium: 'bg-amber-400', low: 'bg-zinc-400' }[level]
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} mr-1.5 flex-shrink-0 mt-[5px]`} />
}

function MeetingIntelligence({ analysis }: { analysis: MeetingAnalysis }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <Brain size={13} className="text-zinc-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-700">Meeting Intelligence</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {analysis.decisions_made.length} decisions · {analysis.action_items.length} actions · {analysis.open_questions.length} open questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5 font-medium uppercase tracking-wider">
            Agent 1
          </span>
          {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-6 space-y-6">

          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-2">Summary</p>
            <p className="text-sm text-zinc-600 leading-relaxed">{analysis.meeting_summary}</p>
            {analysis.inferred_meeting_purpose && (
              <p className="text-xs text-zinc-400 italic mt-2">Purpose: {analysis.inferred_meeting_purpose}</p>
            )}
          </div>

          {analysis.decisions_made.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={12} className="text-indigo-400" />
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Decisions made</p>
              </div>
              <div className="space-y-2">
                {analysis.decisions_made.map((d, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ConfidencePip level={d.confidence} />
                    <div className="text-sm text-zinc-700">
                      {d.decision}
                      {d.owner_or_decider && d.owner_or_decider !== 'unclear' && (
                        <span className="text-zinc-400 text-xs ml-1.5">· {d.owner_or_decider}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.action_items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListTodo size={12} className="text-emerald-500" />
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Action items</p>
              </div>
              <div className="space-y-2">
                {analysis.action_items.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ConfidencePip level={a.confidence} />
                    <div className="text-sm text-zinc-700">
                      {a.task}
                      <span className="text-zinc-400 text-xs ml-1.5">
                        · {a.owner !== 'unclear' ? a.owner : 'Owner unclear'}
                        {a.due_date ? ` · ${a.due_date}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.open_questions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-3">Open questions</p>
              <ul className="space-y-1.5">
                {analysis.open_questions.map((q, i) => (
                  <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                    <span className="text-zinc-300 mt-0.5 flex-shrink-0">·</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.participant_positions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={12} className="text-zinc-400" />
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Participant positions</p>
              </div>
              <div className="space-y-3">
                {analysis.participant_positions.map((p, i) => (
                  <div key={i}>
                    <p className="text-sm text-zinc-700">
                      <span className="font-semibold text-zinc-900">{p.participant}</span>
                      <span className="text-zinc-500"> — {p.observed_position}</span>
                    </p>
                    {p.evidence && (
                      <p className="text-xs text-zinc-400 italic mt-0.5 leading-relaxed">"{p.evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.notable_moments.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-3">Notable moments</p>
              <div className="space-y-2.5">
                {analysis.notable_moments.map((n, i) => (
                  <div key={i} className="bg-zinc-50 rounded-xl border border-zinc-100 p-4">
                    <p className="text-sm font-semibold text-zinc-800 mb-1">{n.moment}</p>
                    <p className="text-xs text-zinc-500 mb-1.5 leading-relaxed">{n.why_it_matters}</p>
                    {n.transcript_evidence && (
                      <p className="text-xs text-zinc-400 italic">"{n.transcript_evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.analyst_flags.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={12} className="text-amber-500" />
                <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.1em]">Analyst flags</p>
              </div>
              <ul className="space-y-1">
                {analysis.analyst_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-amber-700 leading-relaxed">· {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.missing_context.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-2">Missing context</p>
              <ul className="space-y-1">
                {analysis.missing_context.map((ctx, i) => (
                  <li key={i} className="text-xs text-zinc-500">· {ctx}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Next Steps ────────────────────────────────────────────────────────────────

function NextSteps({ steps }: { steps: Array<{ action: string; timing: string }> }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left px-6 py-5 hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={14} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-1">Before your next meeting</p>
              <p className="text-sm font-semibold text-zinc-900">
                {steps.length} specific action{steps.length !== 1 ? 's' : ''} to take
              </p>
            </div>
          </div>
          {open ? <ChevronUp size={15} className="text-zinc-400 mt-1" /> : <ChevronDown size={15} className="text-zinc-400 mt-1" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-6">
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm text-zinc-800 leading-relaxed mb-1.5">{step.action}</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight size={10} className="text-indigo-400" />
                    <p className="text-xs text-indigo-600 font-semibold">{step.timing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section config ────────────────────────────────────────────────────────────

const SECTION_CONFIG = {
  strategic_communication: { title: 'Strategic Communication', icon: Target },
  tone_and_presence: { title: 'Tone & Presence', icon: Mic },
  clarity: { title: 'Clarity', icon: FileText },
} as const

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    const s = getSession(id)
    if (!s) {
      router.replace('/dashboard')
      return
    }
    setSession(s)
    setLoading(false)
  }, [params.id, router])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { coachingOutput: c } = session

  if (!c.overall_summary) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">This session uses an older format.</p>
          <Link href="/dashboard" className="text-indigo-600 text-sm">Back to sessions</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5]">

      {/* Nav */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={15} />
            All sessions
          </Link>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">Signal</span>
          <span className="text-xs text-zinc-400">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-4">

        {/* Header */}
        <div className="fade-in">
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold mb-1">Coaching report</p>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{session.meetingTitle}</h1>
          <p className="text-sm text-zinc-500 mt-1">Goal: {session.userGoal}</p>
        </div>

        {/* Goal indicator */}
        <div className="fade-in-1">
          <GoalIndicator score={session.goalScore} headline={c.overall_summary.headline} />
        </div>

        {/* Signal Summary */}
        <div className="fade-in-2">
          <SignalSummary
            whatLanded={c.overall_summary.what_landed}
            nextMoves={c.overall_summary.next_moves}
          />
        </div>

        {/* Meeting Intelligence */}
        {session.meetingAnalysis && (
          <div className="fade-in-2">
            <MeetingIntelligence analysis={session.meetingAnalysis} />
          </div>
        )}

        {/* Divider label */}
        <div className="flex items-center gap-3 py-2 fade-in-3">
          <div className="flex-1 h-px bg-zinc-200" />
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold">Coaching breakdown</p>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {/* Coaching sections */}
        {c.sections.map((section, i) => {
          const config = SECTION_CONFIG[section.id]
          if (!config) return null
          return (
            <div key={section.id} className={`fade-in-${i + 3}`}>
              <CoachingCard
                section={section}
                icon={config.icon}
                title={config.title}
                index={i}
              />
            </div>
          )
        })}

        {/* Next Steps */}
        {c.next_steps.length > 0 && (
          <div className="fade-in-5">
            <NextSteps steps={c.next_steps} />
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  )
}
