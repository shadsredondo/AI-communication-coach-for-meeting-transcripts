'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Session, CoachingOutput } from '@/types'

// ─── Outcome config ────────────────────────────────────────────────────────────

function getOutcomeConfig(outcome: string) {
  return (
    {
      strong: {
        label: 'On track',
        dot: 'bg-emerald-400',
        text: 'text-emerald-400',
        badge: 'bg-emerald-950/40 border-emerald-700/40 text-emerald-400',
      },
      partial: {
        label: 'Partial',
        dot: 'bg-amber-400',
        text: 'text-amber-400',
        badge: 'bg-amber-950/40 border-amber-700/40 text-amber-400',
      },
      off_track: {
        label: 'Off track',
        dot: 'bg-red-400',
        text: 'text-red-400',
        badge: 'bg-red-950/40 border-red-700/40 text-red-400',
      },
    }[outcome as 'strong' | 'partial' | 'off_track'] ?? {
      label: 'Partial',
      dot: 'bg-amber-400',
      text: 'text-amber-400',
      badge: 'bg-amber-950/40 border-amber-700/40 text-amber-400',
    }
  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function CoachingLoadingState() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="bg-[#2D1A0E] rounded-2xl p-7">
        <div className="h-2.5 bg-white/10 rounded-full w-40 mb-5" />
        <div className="h-3 bg-white/10 rounded-full w-3/5 mb-6" />
        <div className="border-t border-white/10 mb-5" />
        <div className="h-5 bg-white/10 rounded-full w-4/5 mb-3" />
        <div className="h-3 bg-white/10 rounded-full w-full mb-2" />
        <div className="h-3 bg-white/10 rounded-full w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded-full w-4/5" />
      </div>
      <div className="bg-white rounded-2xl border border-[#E8DFD3] p-6">
        <div className="h-2.5 bg-[#F0EBE3] rounded-full w-36 mb-4" />
        <div className="h-3 bg-[#F0EBE3] rounded-full w-full mb-2" />
        <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5 mb-5" />
        <div className="h-2.5 bg-[#F0EBE3] rounded-full w-28 mb-4" />
        <div className="h-3 bg-[#F0EBE3] rounded-full w-full mb-2" />
        <div className="h-3 bg-[#F0EBE3] rounded-full w-3/4" />
      </div>
    </div>
  )
}

function RightColumnLoadingState() {
  return (
    <div className="bg-white border border-[#E8DFD3] rounded-2xl p-5 animate-pulse space-y-4">
      <div className="h-2.5 bg-[#F0EBE3] rounded-full w-24" />
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[#F0EBE3] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
            <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Diagnosis card ────────────────────────────────────────────────────────────

function DiagnosisCard({ coaching }: { coaching: CoachingOutput }) {
  const cfg = getOutcomeConfig(coaching.goal_outcome)
  const { core_diagnosis, profile_goal_connection } = coaching

  return (
    <div className="bg-[#2D1A0E] rounded-2xl p-7 text-white">
      {/* Header row: working toward + outcome badge */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-1.5">
            Working toward
          </p>
          <p className="text-sm text-white/55 leading-snug">
            {profile_goal_connection.stated_goal}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 my-5" />

      {/* Core diagnosis */}
      <p className="text-[17px] font-semibold text-white leading-snug mb-4">
        {core_diagnosis.label}
      </p>
      <p className="text-sm text-white/65 leading-relaxed mb-5">
        {core_diagnosis.explanation}
      </p>

      {/* Goal assessment */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-[10px] font-semibold text-white/35 uppercase tracking-widest mb-2">
          This meeting
        </p>
        <p className="text-sm text-white/55 leading-relaxed">
          {profile_goal_connection.assessment}
        </p>
      </div>
    </div>
  )
}

// ─── Professional coaching card ────────────────────────────────────────────────

function ProfessionalCoachingCard({ coaching }: { coaching: CoachingOutput }) {
  const { professional_coaching } = coaching

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#F0EBE3]">
        <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1.5">
          Professional coaching
        </p>
        <p className="text-sm text-[#78716C] leading-snug">
          {professional_coaching.summary}
        </p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {professional_coaching.what_worked.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-3">
              What you did well
            </p>
            <ul className="space-y-3">
              {professional_coaching.what_worked.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-sm text-[#1C1510] leading-snug">{item.point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {professional_coaching.what_to_strengthen.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-3">
              What to strengthen
            </p>
            <ul className="space-y-3">
              {professional_coaching.what_to_strengthen.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-sm text-[#1C1510] leading-snug">{item.point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Communication card ────────────────────────────────────────────────────────

function CommunicationCard({ coaching }: { coaching: CoachingOutput }) {
  const { communication } = coaching
  const rewrites = communication.rewrite_suggestions ?? []

  return (
    <div className="bg-white rounded-2xl border border-[#E8DFD3] overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#F0EBE3]">
        <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1.5">
          Communication
        </p>
        <p className="text-sm text-[#78716C] leading-snug">{communication.summary}</p>
      </div>

      <div className="px-6 py-5 space-y-6">
        {communication.what_worked.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-3">
              What landed
            </p>
            <ul className="space-y-3">
              {communication.what_worked.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-sm text-[#1C1510] leading-snug">{item.point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {communication.what_to_strengthen.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-widest mb-3">
              What to sharpen
            </p>
            <ul className="space-y-3">
              {communication.what_to_strengthen.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-[7px]" />
                  <p className="text-sm text-[#1C1510] leading-snug">{item.point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rewrites.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[#C96442] uppercase tracking-widest mb-3">
              Say it stronger
            </p>
            <div className="space-y-3">
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
                    <div className="p-4 bg-[#FAF7F2]">
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
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Next moves card ───────────────────────────────────────────────────────────

function NextMovesCard({ coaching }: { coaching: CoachingOutput }) {
  if (!coaching.next_moves?.length) return null

  return (
    <div className="bg-white border border-[#E8DFD3] rounded-2xl px-5 py-5">
      <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-4">
        Next moves
      </p>
      <div className="space-y-4">
        {coaching.next_moves.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#C96442] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5 leading-none">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-[#1C1510] leading-snug">{item.move}</p>
              <p className="text-xs text-[#78716C] leading-relaxed mt-1">{item.rationale}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Evidence section (collapsible, bottom of page) ───────────────────────────

function EvidenceSection({ coaching }: { coaching: CoachingOutput }) {
  const [open, setOpen] = useState(false)

  const items = [
    ...coaching.professional_coaching.what_worked
      .filter(i => i.evidence)
      .map(i => ({ label: i.point, quote: i.evidence })),
    ...coaching.professional_coaching.what_to_strengthen
      .filter(i => i.evidence)
      .map(i => ({ label: i.point, quote: i.evidence })),
    ...coaching.communication.what_worked
      .filter(i => i.evidence)
      .map(i => ({ label: i.point, quote: i.evidence })),
    ...coaching.communication.what_to_strengthen
      .filter(i => i.evidence)
      .map(i => ({ label: i.point, quote: i.evidence })),
  ]

  if (items.length === 0) return null

  return (
    <div className="mt-8 border border-[#E8DFD3] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#F5F0EA] transition-colors bg-[#FAF7F2]"
      >
        <div className="flex items-center gap-2.5">
          <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
            Transcript references
          </p>
          <span className="text-[11px] text-[#B8A99A]">({items.length})</span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-[#B8A99A] flex-shrink-0" />
          : <ChevronDown size={14} className="text-[#B8A99A] flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-6 py-5 space-y-3 bg-white">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-[#E8DFD3] p-4">
              <p className="text-[11px] text-[#B8A99A] font-medium mb-2 leading-snug line-clamp-2">
                {item.label}
              </p>
              <p className="text-sm text-[#78716C] italic leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
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

  // Fetch if no coaching, or if coaching was generated with the old schema
  useEffect(() => {
    if (!session) return
    const hasNewSchema = session.coachingOutput && 'core_diagnosis' in session.coachingOutput
    if (!hasNewSchema) {
      fetchCoaching(session)
    }
  }, [session, fetchCoaching])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#C96442] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = session.coachingOutput as CoachingOutput | undefined

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="bg-[#FAF7F2] border-b border-[#E8DFD3] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* Meeting header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-[#1C1510] leading-snug">
            {session.meetingTitle || 'Coaching report'}
          </h1>
        </div>

        {/* Diagnosis card — full width */}
        <div className="mb-6">
          {coachingLoading && (
            <div className="bg-[#2D1A0E] rounded-2xl p-7 animate-pulse">
              <div className="h-2.5 bg-white/10 rounded-full w-40 mb-4" />
              <div className="h-3 bg-white/10 rounded-full w-3/5 mb-5" />
              <div className="border-t border-white/10 mb-5" />
              <div className="h-5 bg-white/10 rounded-full w-4/5 mb-3" />
              <div className="h-3 bg-white/10 rounded-full w-full mb-2" />
              <div className="h-3 bg-white/10 rounded-full w-3/4" />
            </div>
          )}
          {c && !coachingLoading && <DiagnosisCard coaching={c} />}
          {coachingError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 mt-3">
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
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── Left: professional coaching + communication ── */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest px-1">
              Your coaching
            </p>

            {coachingLoading && <CoachingLoadingState />}

            {c && !coachingLoading && (
              <>
                <ProfessionalCoachingCard coaching={c} />
                <CommunicationCard coaching={c} />
              </>
            )}

            {/* What we couldn't determine */}
            {(session.deterministicAnalysis?.insufficient_evidence ?? []).length > 0 && (
              <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={12} className="text-[#B8A99A]" />
                  <p className="text-[11px] font-semibold text-[#B8A99A] uppercase tracking-widest">
                    What we couldn&rsquo;t determine
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
          </div>

          {/* ── Right: next moves + save banner (sticky) ── */}
          <div className="space-y-3 lg:sticky lg:top-[73px] lg:self-start">
            {/* Aligns with "YOUR COACHING" label */}
            <div className="h-[20px] hidden lg:block" />

            {coachingLoading && <RightColumnLoadingState />}

            {c && !coachingLoading && <NextMovesCard coaching={c} />}

            {!isSignedIn && c && !coachingLoading && (
              <SaveProgressBanner session={session} />
            )}
          </div>

        </div>{/* end grid */}

        {/* Evidence — full width, collapsible, at bottom */}
        {c && !coachingLoading && <EvidenceSection coaching={c} />}

        <div className="h-10" />
      </main>
    </div>
  )
}
