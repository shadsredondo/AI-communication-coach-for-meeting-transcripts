'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Target, MessageSquare, Mic, FileText,
  ChevronDown, ChevronUp, Check, AlertTriangle
} from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type {
  Session, GoalScore, CoachingSection, DeterministicAnalysis,
  ContributionLevel, WatchPattern, CoachingOutput
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONTRIBUTION_ROLE: Record<ContributionLevel, string> = {
  dominant: 'Led the meeting',
  active:   'Active voice',
  moderate: 'Contributing',
  minimal:  'Listening',
}

const WATCH_PATTERN_LABELS: Record<WatchPattern, string> = {
  over_explanation: 'Over-explanation',
  interruption:     'Interruption',
  hesitation:       'Hesitation',
  defensiveness:    'Defensiveness',
  filler_language:  'Filler language',
}

const MOMENT_TYPE_STYLE: Record<string, string> = {
  topic_shift:   'bg-[#F0EBE3] text-[#78716C] border-[#E8DFD3]',
  decision:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  question:      'bg-blue-50 text-blue-700 border-blue-200',
  agreement:     'bg-teal-50 text-teal-700 border-teal-200',
  tension:       'bg-red-50 text-red-700 border-red-200',
  clarification: 'bg-amber-50 text-amber-700 border-amber-200',
}

const MOMENT_TYPE_LABEL: Record<string, string> = {
  topic_shift:   'Shift',
  decision:      'Decision',
  question:      'Question',
  agreement:     'Agreement',
  tension:       'Tension',
  clarification: 'Clarification',
}

// ─── 60-second summary ────────────────────────────────────────────────────────

function SummaryCard({
  coaching,
  analysis,
  loading,
}: {
  coaching: CoachingOutput | undefined
  analysis: DeterministicAnalysis | undefined
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-[#1C1510] rounded-2xl p-7 animate-pulse">
        <div className="h-2.5 bg-white/10 rounded-full w-24 mb-5" />
        <div className="h-5 bg-white/10 rounded-full w-3/4 mb-2" />
        <div className="h-5 bg-white/10 rounded-full w-1/2 mb-8" />
        <div className="h-2.5 bg-white/10 rounded-full w-full mb-2.5" />
        <div className="h-2.5 bg-white/10 rounded-full w-4/5 mb-8" />
        <div className="h-2.5 bg-white/10 rounded-full w-2/3 mb-2.5" />
        <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
      </div>
    )
  }

  if (!coaching) return null

  const { overall_summary, goal_outcome } = coaching

  const outcomeConfig = {
    strong:    { label: 'Strong outcome',  dot: 'bg-emerald-400', text: 'text-emerald-400' },
    partial:   { label: 'Partial outcome', dot: 'bg-amber-400',   text: 'text-amber-400' },
    off_track: { label: 'Off track',       dot: 'bg-red-400',     text: 'text-red-400' },
  }[goal_outcome] ?? { label: 'Partial outcome', dot: 'bg-amber-400', text: 'text-amber-400' }

  const topClear = analysis?.user_signals.clear_moments[0]
  const topWatch = analysis?.user_signals.watch_moments[0]

  return (
    <div className="bg-[#1C1510] rounded-2xl p-7 text-white">

      {/* Outcome */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${outcomeConfig.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-widest ${outcomeConfig.text}`}>
          {outcomeConfig.label}
        </span>
      </div>

      {/* Headline */}
      <p className="text-[17px] font-semibold leading-snug text-white mb-7">
        {overall_summary.headline}
      </p>

      {/* Top observations */}
      {(topClear || topWatch) && (
        <div className="space-y-3 mb-7">
          {topClear && (
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-[7px] flex-shrink-0" />
              <p className="text-sm text-white/75 leading-snug">{topClear.observation}</p>
            </div>
          )}
          {topWatch && (
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
              <p className="text-sm text-white/75 leading-snug">{topWatch.observation}</p>
            </div>
          )}
        </div>
      )}

      {/* Top 2 next moves */}
      {overall_summary.next_moves.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-3">
            Before your next meeting
          </p>
          <div className="space-y-2.5">
            {overall_summary.next_moves.slice(0, 2).map((move, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#C96442] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 leading-none">
                  {i + 1}
                </span>
                <p className="text-sm text-white/80 leading-snug">{move}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── How you showed up ────────────────────────────────────────────────────────

function HowYouShowedUp({ analysis }: { analysis: DeterministicAnalysis }) {
  const { clear_moments, watch_moments } = analysis.user_signals
  if (clear_moments.length === 0 && watch_moments.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8DFD3]">
        <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
          How you showed up
        </p>
      </div>

      <div className="divide-y divide-[#E8DFD3]">
        {clear_moments.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-3">
              What landed
            </p>
            <div className="space-y-3">
              {clear_moments.map((m, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#1C1510] leading-snug">{m.observation}</p>
                  {m.transcript_excerpt && (
                    <p className="text-xs text-[#78716C] italic mt-2 leading-relaxed">
                      "{m.transcript_excerpt}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {watch_moments.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-3">
              Watch moments
            </p>
            <div className="space-y-3">
              {watch_moments.map((m, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                      {WATCH_PATTERN_LABELS[m.pattern]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1C1510] leading-snug">{m.observation}</p>
                  {m.transcript_excerpt && (
                    <p className="text-xs text-[#78716C] italic mt-2 leading-relaxed">
                      "{m.transcript_excerpt}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── The room ─────────────────────────────────────────────────────────────────

function TheRoom({ analysis }: { analysis: DeterministicAnalysis }) {
  const [momentsOpen, setMomentsOpen] = useState(false)

  return (
    <div className="space-y-2">

      {/* Participants */}
      <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8DFD3]">
          <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
            Who drove the room
          </p>
        </div>
        <div className="divide-y divide-[#E8DFD3]">
          {analysis.participation.map((p, i) => (
            <div key={i} className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1C1510]">{p.speaker}</p>
                <div className="flex items-center gap-2">
                  {p.drove_decisions && (
                    <span className="text-[10px] font-semibold text-[#C96442] bg-[#C96442]/10 border border-[#C96442]/20 rounded-full px-2.5 py-0.5">
                      Drove decisions
                    </span>
                  )}
                  <span className="text-[11px] text-[#B8A99A]">
                    {CONTRIBUTION_ROLE[p.contribution_level]}
                  </span>
                </div>
              </div>
              {p.notable_behaviors.length > 0 && (
                <ul className="space-y-1.5">
                  {p.notable_behaviors.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-[#78716C] leading-snug">
                      <span className="text-[#C96442]/50 flex-shrink-0 mt-1">·</span>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key moments — collapsed by default */}
      {analysis.key_moments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
          <button
            className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors"
            onClick={() => setMomentsOpen(!momentsOpen)}
          >
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
                Key dynamics
              </p>
              <span className="text-[10px] text-[#B8A99A] border border-[#E8DFD3] rounded-full px-2 py-0.5">
                {analysis.key_moments.length}
              </span>
            </div>
            {momentsOpen
              ? <ChevronUp size={14} className="text-[#B8A99A]" />
              : <ChevronDown size={14} className="text-[#B8A99A]" />}
          </button>

          {momentsOpen && (
            <div className="border-t border-[#E8DFD3] px-6 py-5 space-y-4">
              {analysis.key_moments.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F0EBE3] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-[#78716C]">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-2 ${MOMENT_TYPE_STYLE[m.type] ?? 'bg-[#F0EBE3] text-[#78716C] border-[#E8DFD3]'}`}>
                      {MOMENT_TYPE_LABEL[m.type] ?? m.type}
                    </span>
                    <p className="text-sm text-[#1C1510] leading-snug">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Deep coaching ────────────────────────────────────────────────────────────

function CoachingCard({
  section,
  icon: Icon,
  title,
}: {
  section: CoachingSection
  icon: React.ElementType
  title: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <button
        className="w-full text-left px-6 py-5 hover:bg-[#FAF7F2] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#C96442]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={14} className="text-[#C96442]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1">{title}</p>
              <p className="text-sm font-semibold text-[#1C1510] leading-snug pr-4">{section.one_line_summary}</p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-1">
            {open
              ? <ChevronUp size={15} className="text-[#B8A99A]" />
              : <ChevronDown size={15} className="text-[#B8A99A]" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[#E8DFD3] px-6 py-6 space-y-6">
          {section.what_went_well.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-3">
                What went well
              </p>
              <div className="space-y-2.5">
                {section.what_went_well.map((item, i) => (
                  <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-sm font-semibold text-[#1C1510] mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-[#78716C] italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.what_could_be_stronger.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-3">
                What could be stronger
              </p>
              <div className="space-y-2.5">
                {section.what_could_be_stronger.map((item, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-sm font-semibold text-[#1C1510] mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-[#78716C] italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.rewrite_suggestions && section.rewrite_suggestions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#C96442] uppercase tracking-widest mb-3">
                Say it stronger
              </p>
              <div className="space-y-3">
                {section.rewrite_suggestions.map((r, i) => (
                  <div key={i} className="rounded-xl border border-[#E8DFD3] overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-[#E8DFD3]">
                      <div className="p-4">
                        <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">
                          What you said
                        </p>
                        <p className="text-sm text-[#78716C] italic leading-relaxed">"{r.original}"</p>
                      </div>
                      <div className="p-4 bg-[#FAF7F2]">
                        <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">
                          Stronger version
                        </p>
                        <p className="text-sm text-[#1C1510] font-medium leading-relaxed">"{r.rewrite}"</p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-[#C96442]/8 border-t border-[#C96442]/15">
                      <p className="text-xs text-[#C96442] leading-relaxed">{r.why}</p>
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

function NextStepsCard({ steps }: { steps: Array<{ action: string; timing: string }> }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <button
        className="w-full text-left px-6 py-5 hover:bg-[#FAF7F2] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#C96442]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={14} className="text-[#C96442]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1">
                Before your next meeting
              </p>
              <p className="text-sm font-semibold text-[#1C1510]">
                {steps.length} specific action{steps.length !== 1 ? 's' : ''} to take
              </p>
            </div>
          </div>
          {open
            ? <ChevronUp size={15} className="text-[#B8A99A] mt-1" />
            : <ChevronDown size={15} className="text-[#B8A99A] mt-1" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[#E8DFD3] px-6 py-6 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 bg-[#FAF7F2] border border-[#E8DFD3] rounded-xl p-4">
              <div className="w-6 h-6 rounded-full bg-[#C96442] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm text-[#1C1510] leading-relaxed mb-1.5">{step.action}</p>
                <div className="flex items-center gap-1.5">
                  <ArrowRight size={10} className="text-[#C96442]" />
                  <p className="text-xs text-[#C96442] font-semibold">{step.timing}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SECTION_CONFIG = {
  strategic_communication: { title: 'Strategic Communication', icon: Target },
  tone_and_presence:       { title: 'Tone & Presence',         icon: Mic },
  clarity:                 { title: 'Clarity',                 icon: FileText },
} as const

// ─── Coaching skeleton ─────────────────────────────────────────────────────────

function CoachingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-[#E8DFD3] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#F0EBE3]" />
            <div className="space-y-2 flex-1">
              <div className="h-2 bg-[#F0EBE3] rounded-full w-20" />
              <div className="h-3 bg-[#F0EBE3] rounded-full w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Save progress banner ──────────────────────────────────────────────────────

function SaveProgressBanner({ session }: { session: Session }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('Please fill in both fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError('')

    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    await saveSessionToSupabase(session)
    const profile = getProfile()
    if (profile) await saveProfileToSupabase(profile)

    setSaved(true)
  }

  if (saved) {
    return (
      <div className="bg-[#F0EBE3] border border-[#E8DFD3] rounded-2xl px-6 py-5 text-center">
        <p className="text-sm font-semibold text-[#1C1510] mb-1">You're all set ✓</p>
        <p className="text-xs text-[#78716C]">
          Your report is saved. Sign in anytime to pick up where you left off.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <p className="text-base font-semibold text-[#1C1510] mb-1">
          Keep this report. Track how you improve.
        </p>
        <p className="text-sm text-[#78716C] mb-5 leading-relaxed">
          Create a free account and every coaching report you generate will be saved — so you can see your growth over time.
        </p>
        <form onSubmit={handleSave} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors"
          />
          <input
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C96442] hover:bg-[#B85839] disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#C96442]/20"
          >
            {loading ? 'Saving…' : 'Save my report'}
          </button>
        </form>
        <p className="text-[11px] text-[#B8A99A] text-center mt-3">
          Already have an account?{' '}
          <a href="/auth" className="underline hover:text-[#78716C] transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest pt-2 pb-1 px-1">
      {children}
    </p>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [coachingLoading, setCoachingLoading] = useState(false)
  const [coachingError, setCoachingError] = useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const id = params.id as string
    const s = getSession(id)
    if (!s) { router.replace('/dashboard'); return }
    setSession(s)
    setLoading(false)

    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setIsSignedIn(!!authSession)
    })
  }, [params.id, router])

  const fetchCoaching = useCallback(async (s: Session) => {
    setCoachingLoading(true)
    setCoachingError(null)

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: s.transcript,
          userGoal: s.userGoal,
          userTitle: s.userTitle,
          userSeniority: s.userSeniority || '',
          meetingTitle: s.meetingTitle,
          participants: s.participants,
          profile: getProfile(),
          deterministicAnalysis: s.deterministicAnalysis,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setCoachingError(data.error || 'Coaching failed — please try again.')
        setCoachingLoading(false)
        return
      }

      const coaching: CoachingOutput = data
      const outcomeToScore = { strong: 'green', partial: 'yellow', off_track: 'red' } as const
      const goalScore = outcomeToScore[coaching.goal_outcome as keyof typeof outcomeToScore] ?? 'yellow'
      const updated: Session = { ...s, coachingOutput: coaching, goalScore }
      saveSession(updated)
      setSession(updated)
    } catch {
      setCoachingError('Network error — please try again.')
    } finally {
      setCoachingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!session || session.coachingOutput) return
    fetchCoaching(session)
  }, [session, fetchCoaching])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#C96442] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = session.coachingOutput
  const d = session.deterministicAnalysis

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="bg-[#FAF7F2] border-b border-[#E8DFD3] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1510] transition-colors"
          >
            <ArrowLeft size={15} />
            All sessions
          </Link>
          <span className="text-sm font-semibold text-[#1C1510]">Signal</span>
          <span className="text-xs text-[#B8A99A]">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-2">

        {/* Meeting context */}
        <div className="px-1 pb-2">
          <h1 className="text-lg font-semibold text-[#1C1510] leading-snug">
            {session.meetingTitle || 'Coaching report'}
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">Goal: {session.userGoal}</p>
        </div>

        {/* 60-second summary */}
        <SummaryCard
          coaching={c}
          analysis={d}
          loading={coachingLoading}
        />

        {coachingError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
            <p className="text-sm text-red-600 mb-3">{coachingError}</p>
            <button
              onClick={() => session && fetchCoaching(session)}
              className="text-xs font-semibold text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* How you showed up */}
        {d && (
          <>
            <SectionLabel>How you showed up</SectionLabel>
            <HowYouShowedUp analysis={d} />
          </>
        )}

        {/* The room */}
        {d && d.participation.length > 0 && (
          <>
            <SectionLabel>The room</SectionLabel>
            <TheRoom analysis={d} />
          </>
        )}

        {/* Deep coaching */}
        {(coachingLoading || c) && (
          <>
            <SectionLabel>Deep coaching</SectionLabel>
            {coachingLoading && <CoachingSkeleton />}
            {c && (
              <div className="space-y-2">
                {c.sections.map((section) => {
                  const config = SECTION_CONFIG[section.id]
                  if (!config) return null
                  return (
                    <CoachingCard key={section.id} section={section} icon={config.icon} title={config.title} />
                  )
                })}
                {c.next_steps && c.next_steps.length > 0 && (
                  <NextStepsCard steps={c.next_steps} />
                )}
              </div>
            )}
          </>
        )}

        {/* Insufficient evidence */}
        {d && d.insufficient_evidence.length > 0 && (
          <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={12} className="text-[#B8A99A]" />
              <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
                What we couldn't determine
              </p>
            </div>
            <ul className="space-y-1.5">
              {d.insufficient_evidence.map((item, i) => (
                <li key={i} className="text-xs text-[#78716C] leading-relaxed flex items-start gap-2">
                  <span className="text-[#E8DFD3] flex-shrink-0 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Save progress banner */}
        {!isSignedIn && c && !coachingLoading && (
          <div className="pt-4">
            <SaveProgressBanner session={session} />
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  )
}
