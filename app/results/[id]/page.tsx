'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Session, GoalScore, CoachingSection, CoachingOutput } from '@/types'

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  coaching,
  loading,
}: {
  coaching: CoachingOutput | undefined
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="bg-[#2D1A0E] rounded-2xl p-7 animate-pulse">
        <div className="h-2.5 bg-white/10 rounded-full w-24 mb-5" />
        <div className="h-5 bg-white/10 rounded-full w-3/4 mb-2" />
        <div className="h-5 bg-white/10 rounded-full w-1/2 mb-8" />
        <div className="h-2.5 bg-white/10 rounded-full w-20 mb-3" />
        <div className="h-3 bg-white/10 rounded-full w-full mb-2" />
        <div className="h-3 bg-white/10 rounded-full w-4/5" />
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

  return (
    <div className="bg-[#2D1A0E] rounded-2xl p-7 text-white">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${outcomeConfig.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-widest ${outcomeConfig.text}`}>
          {outcomeConfig.label}
        </span>
      </div>

      <p className="text-[17px] font-semibold leading-snug text-white mb-7">
        {overall_summary.headline}
      </p>

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

// ─── Coaching section ──────────────────────────────────────────────────────────

function CoachingLoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="bg-white rounded-2xl border border-[#E8DFD3] p-6">
        <div className="h-2.5 bg-[#F0EBE3] rounded-full w-28 mb-5" />
        <div className="space-y-2.5">
          <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
          <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5" />
          <div className="h-3 bg-[#F0EBE3] rounded-full w-3/4" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-[#E8DFD3] p-6">
        <div className="h-2.5 bg-[#F0EBE3] rounded-full w-32 mb-5" />
        <div className="space-y-2.5">
          <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
          <div className="h-3 bg-[#F0EBE3] rounded-full w-3/5" />
          <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5" />
        </div>
      </div>
    </div>
  )
}

function StrengthCard({ summary, sections }: {
  summary: string[]
  sections: CoachingSection[]
}) {
  const [open, setOpen] = useState(false)
  const allDetail = sections.flatMap(s => s.what_went_well)

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-6 py-5">
        <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-4">
          What you did well
        </p>
        <ul className="space-y-3">
          {summary.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-[7px]" />
              <p className="text-sm text-[#1C1510] leading-snug">{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {allDetail.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 px-6 py-3 border-t border-[#F0EBE3] text-xs text-[#78716C] hover:text-[#1C1510] hover:bg-[#FAF7F2] transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {open ? 'Hide detailed notes' : 'See detailed notes'}
          </button>

          {open && (
            <div className="border-t border-[#E8DFD3] px-6 py-5 space-y-3 bg-[#FAF7F2]">
              {allDetail.map((item, i) => (
                <div key={i} className="bg-white border border-emerald-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#1C1510] leading-snug mb-2">{item.point}</p>
                  <p className="text-xs text-[#78716C] italic leading-relaxed">"{item.evidence}"</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ImprovementCard({ summary, sections }: {
  summary: string[]
  sections: CoachingSection[]
}) {
  const [open, setOpen] = useState(false)
  const allDetail = sections.flatMap(s => s.what_could_be_stronger)

  if (summary.length === 0 && allDetail.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-6 py-5">
        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-4">
          What to strengthen
        </p>
        <ul className="space-y-3">
          {summary.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-[7px]" />
              <p className="text-sm text-[#1C1510] leading-snug">{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {allDetail.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 px-6 py-3 border-t border-[#F0EBE3] text-xs text-[#78716C] hover:text-[#1C1510] hover:bg-[#FAF7F2] transition-colors"
          >
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {open ? 'Hide detailed notes' : 'See detailed notes'}
          </button>

          {open && (
            <div className="border-t border-[#E8DFD3] px-6 py-5 space-y-3 bg-[#FAF7F2]">
              {allDetail.map((item, i) => (
                <div key={i} className="bg-white border border-amber-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#1C1510] leading-snug mb-2">{item.point}</p>
                  <p className="text-xs text-[#78716C] italic leading-relaxed">"{item.evidence}"</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RewritesCard({ sections }: { sections: CoachingSection[] }) {
  const [open, setOpen] = useState(false)
  const rewrites = sections.flatMap(s => s.rewrite_suggestions ?? [])
  if (rewrites.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors"
      >
        <div>
          <p className="text-[11px] font-semibold text-[#C96442] uppercase tracking-widest mb-1">
            Say it stronger
          </p>
          <p className="text-sm text-[#78716C]">{rewrites.length} rewrite suggestion{rewrites.length !== 1 ? 's' : ''}</p>
        </div>
        {open ? <ChevronUp size={15} className="text-[#B8A99A]" /> : <ChevronDown size={15} className="text-[#B8A99A]" />}
      </button>

      {open && (
        <div className="border-t border-[#E8DFD3] px-6 py-5 space-y-3">
          {rewrites.map((r, i) => (
            <div key={i} className="rounded-xl border border-[#E8DFD3] overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-[#E8DFD3]">
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">What you said</p>
                  <p className="text-sm text-[#78716C] italic leading-relaxed">"{r.original}"</p>
                </div>
                <div className="p-4 bg-[#FAF7F2]">
                  <p className="text-[10px] font-semibold text-[#B8A99A] uppercase tracking-wider mb-2">Stronger version</p>
                  <p className="text-sm text-[#1C1510] font-medium leading-relaxed">"{r.rewrite}"</p>
                </div>
              </div>
              <div className="px-4 py-2.5 bg-[#C96442]/8 border-t border-[#C96442]/15">
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
        <p className="text-sm font-semibold text-[#1C1510] mb-1">You're all set ✓</p>
        <p className="text-xs text-[#78716C]">Your report is saved. Sign in anytime to pick up where you left off.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <p className="text-base font-semibold text-[#1C1510] mb-1">Keep this report. Track how you improve.</p>
        <p className="text-sm text-[#78716C] mb-5 leading-relaxed">
          Create a free account and every coaching report you generate will be saved — so you can see your growth over time.
        </p>
        <form onSubmit={handleSave} className="space-y-3">
          <input type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors" />
          <input type="password" placeholder="Password (6+ characters)" value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#C96442] hover:bg-[#B85839] disabled:opacity-60 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-lg shadow-[#C96442]/20">
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

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="bg-[#FAF7F2] border-b border-[#E8DFD3] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1510] transition-colors">
            <ArrowLeft size={15} />
            All sessions
          </Link>
          <span className="text-sm font-semibold text-[#1C1510]">Signal</span>
          <span className="text-xs text-[#B8A99A]">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Meeting context — full width */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#1C1510] leading-snug">
            {session.meetingTitle || 'Coaching report'}
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">Goal: {session.userGoal}</p>
        </div>

        {/* Summary card — full width */}
        <div className="mb-6">
          <SummaryCard coaching={c} loading={coachingLoading} />
          {coachingError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mt-3">
              <p className="text-sm text-red-600 mb-3">{coachingError}</p>
              <button type="button" onClick={() => fetchCoaching(session)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 underline">
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Left: what you did well + what to strengthen ── */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest px-1">
              Your coaching
            </p>

            {coachingLoading && <CoachingLoadingState />}

            {c && (
              <>
                <StrengthCard
                  summary={c.overall_summary.what_landed}
                  sections={c.sections}
                />
                <ImprovementCard
                  summary={c.overall_summary.what_to_work_on ?? []}
                  sections={c.sections}
                />
              </>
            )}

            {/* Insufficient evidence — bottom of left col */}
            {(session.deterministicAnalysis?.insufficient_evidence ?? []).length > 0 && (
              <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={12} className="text-[#B8A99A]" />
                  <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
                    What we couldn't determine
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {(session.deterministicAnalysis?.insufficient_evidence ?? []).map((item, i) => (
                    <li key={i} className="text-xs text-[#78716C] leading-relaxed flex items-start gap-2">
                      <span className="text-[#E8DFD3] flex-shrink-0 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>{/* end left column */}

          {/* ── Right: concrete actions + say it stronger (sticky) ── */}
          <div className="space-y-3 lg:sticky lg:top-[73px] lg:self-start">

            {/* Concrete actions */}
            {coachingLoading && (
              <div className="bg-white border border-[#E8DFD3] rounded-2xl p-5 animate-pulse space-y-3">
                <div className="h-2.5 bg-[#F0EBE3] rounded-full w-28" />
                <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
                <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5" />
                <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
              </div>
            )}

            {c?.next_steps && c.next_steps.length > 0 && (
              <div className="bg-white border border-[#E8DFD3] rounded-2xl px-5 py-5">
                <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-4">
                  Concrete actions
                </p>
                <div className="space-y-3">
                  {c.next_steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 leading-none">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm text-[#1C1510] leading-snug">{step.action}</p>
                        <p className="text-xs text-[#C96442] font-medium mt-1">{step.timing}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Say it stronger */}
            {c && <RewritesCard sections={c.sections} />}

            {/* Save banner */}
            {!isSignedIn && c && !coachingLoading && (
              <SaveProgressBanner session={session} />
            )}

          </div>{/* end right column */}

        </div>{/* end grid */}

        <div className="h-10" />
      </main>
    </div>
  )
}
