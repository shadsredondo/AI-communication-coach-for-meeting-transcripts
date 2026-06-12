'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Session, CoachingOutput } from '@/types'

// ─── Outcome config ────────────────────────────────────────────────────────────

function getOutcomeConfig(outcome: string) {
  return (
    {
      strong:    { label: 'On track',  dot: 'bg-emerald-400', text: 'text-emerald-500' },
      partial:   { label: 'Partial',   dot: 'bg-amber-400',   text: 'text-amber-500'   },
      off_track: { label: 'Off track', dot: 'bg-red-400',     text: 'text-red-500'     },
    }[outcome as 'strong' | 'partial' | 'off_track'] ?? {
      label: 'Partial', dot: 'bg-amber-400', text: 'text-amber-500',
    }
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function PageLoadingState() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-3 bg-[#F0EBE3] rounded-full w-48" />
      <div className="bg-[#2D1A0E] rounded-2xl p-7 space-y-3">
        <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
        <div className="h-2.5 bg-white/10 rounded-full w-1/2" />
        <div className="border-t border-white/10 my-4" />
        <div className="h-4 bg-white/10 rounded-full w-full" />
        <div className="h-4 bg-white/10 rounded-full w-5/6" />
        <div className="h-3 bg-white/10 rounded-full w-4/5 mt-2" />
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
      </div>
      <div className="bg-white border border-[#E8DFD3] rounded-2xl p-6 space-y-3">
        <div className="h-3 bg-[#F0EBE3] rounded-full w-56" />
        <div className="h-4 bg-[#F0EBE3] rounded-full w-full" />
        <div className="h-3 bg-[#F0EBE3] rounded-full w-3/5" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="bg-white border border-[#E8DFD3] rounded-2xl p-5 space-y-2">
            <div className="h-3 bg-[#F0EBE3] rounded-full w-40" />
            <div className="h-4 bg-[#F0EBE3] rounded-full w-3/4" />
            <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Q1: Diagnosis card ────────────────────────────────────────────────────────

function DiagnosisCard({ coaching }: { coaching: CoachingOutput }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const { diagnosis } = coaching

  return (
    <div>
      <p className="text-[13px] text-[#78716C] font-medium mb-3 leading-snug">
        Why did this meeting go the way it did?
      </p>
      <div className="bg-[#2D1A0E] rounded-2xl overflow-hidden">
        <div className="p-7">
          <p className="text-[16px] font-semibold text-white leading-snug mb-4">
            {diagnosis.headline}
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            {diagnosis.root_cause}
          </p>
        </div>

        {coaching.evidence.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setEvidenceOpen(o => !o)}
              className="w-full flex items-center gap-2 px-7 py-3.5 border-t border-white/10 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-[11px] text-white/30 flex-1">
                {evidenceOpen ? 'Hide' : 'See'} supporting evidence ({coaching.evidence.length} moment{coaching.evidence.length !== 1 ? 's' : ''})
              </span>
              {evidenceOpen
                ? <ChevronUp size={12} className="text-white/25 flex-shrink-0" />
                : <ChevronDown size={12} className="text-white/25 flex-shrink-0" />}
            </button>

            {evidenceOpen && (
              <div className="px-7 pb-6 space-y-3">
                {coaching.evidence.map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-white/55 italic leading-relaxed mb-2">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <p className="text-xs text-white/35 leading-snug">{item.reveals}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Q2: Next move card ────────────────────────────────────────────────────────

function NextMoveCard({ coaching }: { coaching: CoachingOutput }) {
  return (
    <div>
      <p className="text-[13px] text-[#78716C] font-medium mb-3 leading-snug">
        What should I do differently next time?
      </p>
      <div className="bg-white border-2 border-[#C96442] rounded-2xl p-6">
        <p className="text-[14px] font-semibold text-[#1C1510] leading-snug mb-2.5">
          {coaching.next_move.action}
        </p>
        <p className="text-sm text-[#78716C] leading-relaxed">
          {coaching.next_move.why}
        </p>
      </div>
    </div>
  )
}

// ─── Q3 + Q4: Pattern and next level cards ─────────────────────────────────────

function PatternAndNextLevelCards({ coaching }: { coaching: CoachingOutput }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Q3 */}
      <div>
        <p className="text-[13px] text-[#78716C] font-medium mb-3 leading-snug">
          What pattern keeps showing up?
        </p>
        <div className="bg-white border border-[#E8DFD3] rounded-2xl p-5 h-full">
          <p className="text-[13px] font-semibold text-[#1C1510] leading-snug mb-2">
            {coaching.pattern.name}
          </p>
          <p className="text-sm text-[#78716C] leading-relaxed">
            {coaching.pattern.observation}
          </p>
        </div>
      </div>

      {/* Q4 */}
      <div>
        <p className="text-[13px] text-[#78716C] font-medium mb-3 leading-snug">
          What would someone one level up do?
        </p>
        <div className="bg-white border border-[#E8DFD3] rounded-2xl p-5 h-full">
          <p className="text-[13px] font-semibold text-[#1C1510] leading-snug mb-2">
            {coaching.next_level.capability}
          </p>
          <p className="text-sm text-[#78716C] leading-relaxed">
            {coaching.next_level.in_this_meeting}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Rewrites (collapsed) ──────────────────────────────────────────────────────

function RewritesCard({ coaching }: { coaching: CoachingOutput }) {
  const [open, setOpen] = useState(false)
  const rewrites = coaching.rewrites ?? []
  if (rewrites.length === 0) return null

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F5F0EA] transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-[#1C1510]">Say it stronger</p>
          <p className="text-xs text-[#9E9489] mt-0.5">
            {rewrites.length} rewrite suggestion{rewrites.length !== 1 ? 's' : ''}
          </p>
        </div>
        {open
          ? <ChevronUp size={14} className="text-[#B8A99A] flex-shrink-0" />
          : <ChevronDown size={14} className="text-[#B8A99A] flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-6 pb-5 space-y-3 border-t border-[#E8DFD3]">
          <div className="h-3" />
          {rewrites.map((r, i) => (
            <div key={i} className="rounded-xl border border-[#E8DFD3] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[#E8DFD3]">
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">
                    What you said
                  </p>
                  <p className="text-sm text-[#78716C] italic leading-relaxed">
                    &ldquo;{r.original}&rdquo;
                  </p>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">
                    Stronger version
                  </p>
                  <p className="text-sm text-[#1C1510] font-medium leading-relaxed">
                    &ldquo;{r.rewrite}&rdquo;
                  </p>
                </div>
              </div>
              <div className="px-4 py-2.5 bg-[#C96442]/5 border-t border-[#C96442]/10">
                <p className="text-xs text-[#C96442] leading-relaxed">{r.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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
        <p className="text-sm font-semibold text-[#1C1510] mb-1">You&rsquo;re all set ✓</p>
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
          <a href="/auth" className="underline hover:text-[#78716C] transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
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

  // Re-fetch if session has no coaching or was generated with an old schema
  useEffect(() => {
    if (!session) return
    const hasNewSchema = session.coachingOutput && 'diagnosis' in session.coachingOutput
    if (!hasNewSchema) fetchCoaching(session)
  }, [session, fetchCoaching])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#C96442] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = session.coachingOutput as CoachingOutput | undefined
  const cfg = c ? getOutcomeConfig(c.goal_outcome) : null

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

      <main className="max-w-2xl mx-auto px-6 py-8">

        {/* Outcome dot */}
        {cfg && (
          <div className="flex items-center gap-2 mb-6">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-semibold uppercase tracking-widest ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
        )}

        {/* Loading state */}
        {coachingLoading && <PageLoadingState />}

        {/* Error state */}
        {coachingError && !coachingLoading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
            <p className="text-sm text-red-600 mb-3">{coachingError}</p>
            <button
              type="button"
              onClick={() => fetchCoaching(session)}
              className="text-xs font-semibold text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {c && !coachingLoading && (
          <div className="space-y-6">
            <DiagnosisCard coaching={c} />
            <NextMoveCard coaching={c} />
            <PatternAndNextLevelCards coaching={c} />
            <RewritesCard coaching={c} />
            {!isSignedIn && <SaveProgressBanner session={session} />}
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  )
}
