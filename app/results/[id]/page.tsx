'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Target, MessageSquare, Mic, FileText,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Minus, Check,
  Brain, ListTodo, HelpCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSession } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import type { Session, GoalScore, CoachingSection, MeetingAnalysis } from '@/types'

function GoalIndicator({ score, headline }: { score: GoalScore; headline: string }) {
  const config = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-500', label: 'Strong', badge: 'success' as const },
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', icon: Minus, iconColor: 'text-amber-500', label: 'Partial', badge: 'warning' as const },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500', label: 'Off track', badge: 'danger' as const },
  }[score]

  const Icon = config.icon

  return (
    <div className={`rounded-xl border p-5 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div>
          <Badge variant={config.badge} className="mb-2">{config.label}</Badge>
          <p className="text-sm text-gray-700 leading-relaxed">{headline}</p>
        </div>
      </div>
    </div>
  )
}

function ExpandableCard({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card>
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-indigo-600" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </CardHeader>
      </button>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

function SectionContent({ section }: { section: CoachingSection }) {
  return (
    <div className="space-y-5">
      {section.what_went_well.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">What went well</p>
          <div className="space-y-2">
            {section.what_went_well.map((item, i) => (
              <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-1.5">{item.point}</p>
                <p className="text-xs text-gray-500 italic leading-relaxed">"{item.evidence}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {section.what_could_be_stronger.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">What could be stronger</p>
          <div className="space-y-2">
            {section.what_could_be_stronger.map((item, i) => (
              <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-1.5">{item.point}</p>
                <p className="text-xs text-gray-500 italic leading-relaxed">"{item.evidence}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {section.rewrite_suggestions && section.rewrite_suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">Rewrite suggestions</p>
          <div className="space-y-3">
            {section.rewrite_suggestions.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What you said</p>
                    <p className="text-sm text-gray-600 italic leading-relaxed">"{r.original}"</p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stronger version</p>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">"{r.rewrite}"</p>
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
  )
}

function ConfidencePip({ level }: { level: 'high' | 'medium' | 'low' }) {
  const color = { high: 'bg-emerald-400', medium: 'bg-amber-400', low: 'bg-red-400' }[level]
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color} mr-1.5`} />
}

function MeetingIntelligence({ analysis }: { analysis: MeetingAnalysis }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
            <Brain size={14} className="text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Meeting Intelligence</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {analysis.decisions_made.length} decisions · {analysis.action_items.length} action items · {analysis.open_questions.length} open questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest border border-slate-200 rounded-full px-2 py-0.5">Agent 1</span>
          {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-6">

          {/* Summary */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Meeting summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.meeting_summary}</p>
            {analysis.inferred_meeting_purpose && (
              <p className="text-xs text-gray-400 mt-2 italic">Purpose: {analysis.inferred_meeting_purpose}</p>
            )}
          </div>

          {/* Decisions */}
          {analysis.decisions_made.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={13} className="text-indigo-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Decisions made</p>
              </div>
              <div className="space-y-2">
                {analysis.decisions_made.map((d, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <ConfidencePip level={d.confidence} />
                    <div>
                      <span className="text-gray-800">{d.decision}</span>
                      {d.owner_or_decider && d.owner_or_decider !== 'unclear' && (
                        <span className="text-gray-400 text-xs ml-1.5">· {d.owner_or_decider}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action items */}
          {analysis.action_items.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListTodo size={13} className="text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action items</p>
              </div>
              <div className="space-y-2">
                {analysis.action_items.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <ConfidencePip level={a.confidence} />
                    <div>
                      <span className="text-gray-800">{a.task}</span>
                      <span className="text-gray-400 text-xs ml-1.5">
                        · {a.owner !== 'unclear' ? a.owner : 'Owner unclear'}
                        {a.due_date ? ` · ${a.due_date}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Open questions */}
          {analysis.open_questions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Open questions</p>
              <ul className="space-y-1.5">
                {analysis.open_questions.map((q, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">·</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Participant positions */}
          {analysis.participant_positions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Participant positions</p>
              <div className="space-y-3">
                {analysis.participant_positions.map((p, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-800">{p.participant}</span>
                    <span className="text-gray-500"> — {p.observed_position}</span>
                    {p.evidence && (
                      <p className="text-xs text-gray-400 italic mt-0.5">"{p.evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notable moments */}
          {analysis.notable_moments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notable moments</p>
              <div className="space-y-3">
                {analysis.notable_moments.map((n, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800 mb-1">{n.moment}</p>
                    <p className="text-xs text-gray-500 mb-1.5">{n.why_it_matters}</p>
                    {n.transcript_evidence && (
                      <p className="text-xs text-gray-400 italic">"{n.transcript_evidence}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst flags */}
          {analysis.analyst_flags.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={13} className="text-amber-500" />
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Analyst flags</p>
              </div>
              <ul className="space-y-1">
                {analysis.analyst_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-amber-700 leading-relaxed">· {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing context */}
          {analysis.missing_context.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Missing context</p>
              <ul className="space-y-1">
                {analysis.missing_context.map((m, i) => (
                  <li key={i} className="text-xs text-gray-500">· {m}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

const SECTION_CONFIG = {
  strategic_communication: { title: 'Strategic Communication', icon: Target },
  tone_and_presence: { title: 'Tone & Presence', icon: Mic },
  clarity: { title: 'Clarity', icon: FileText },
} as const

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { coachingOutput: c } = session

  if (!c.overall_summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">This session uses an older format.</p>
          <Link href="/dashboard" className="text-indigo-600 text-sm">Back to sessions</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />
            All sessions
          </Link>
          <span className="text-sm font-medium text-gray-900">Signal</span>
          <span className="text-xs text-gray-400">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        {/* Header */}
        <div className="fade-in">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">Coaching report</p>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{session.meetingTitle}</h1>
          <p className="text-sm text-gray-500">Goal: {session.userGoal}</p>
        </div>

        {/* Goal indicator */}
        <div className="fade-in-1">
          <GoalIndicator score={session.goalScore} headline={c.overall_summary.headline} />
        </div>

        {/* Meeting Intelligence (Agent 1 output) */}
        {session.meetingAnalysis && (
          <div className="fade-in-1">
            <MeetingIntelligence analysis={session.meetingAnalysis} />
          </div>
        )}

        {/* Signal Summary */}
        <div className="fade-in-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What landed</p>
              <ul className="space-y-3">
                {c.overall_summary.what_landed.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check size={9} className="text-emerald-600" />
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Your next 3 moves</p>
              <ol className="space-y-3">
                {c.overall_summary.next_moves.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 leading-snug">{m}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Coaching sections */}
        {c.sections.map((section, i) => {
          const config = SECTION_CONFIG[section.id]
          if (!config) return null
          return (
            <div key={section.id} className={`fade-in-${i + 2}`}>
              <ExpandableCard
                title={config.title}
                description={section.one_line_summary}
                icon={config.icon}
              >
                <SectionContent section={section} />
              </ExpandableCard>
            </div>
          )
        })}

        {/* Next Steps */}
        {c.next_steps.length > 0 && (
          <div className="fade-in-4">
            <ExpandableCard
              title="Before Your Next Meeting"
              description="Specific actions to build on this session"
              icon={MessageSquare}
            >
              <div className="space-y-3">
                {c.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 leading-relaxed mb-1">{step.action}</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight size={11} className="text-indigo-400" />
                        <p className="text-xs text-indigo-600 font-medium">{step.timing}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          </div>
        )}

        <div className="h-8" />
      </main>
    </div>
  )
}
