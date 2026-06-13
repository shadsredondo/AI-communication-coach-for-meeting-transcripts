'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { getCurrentArchetype, getHeroArchetype } from '@/lib/personas'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Session, CoachingOutput } from '@/types'

// ─── Outcome config ────────────────────────────────────────────────────────────

function getOutcomeConfig(outcome: string) {
  return (
    {
      strong:    { label: 'On track',  dot: 'bg-emerald-400', text: 'text-emerald-600' },
      partial:   { label: 'Partial',   dot: 'bg-amber-400',   text: 'text-amber-600'   },
      off_track: { label: 'Off track', dot: 'bg-red-400',     text: 'text-red-600'     },
    }[outcome as 'strong' | 'partial' | 'off_track'] ?? {
      label: 'Partial', dot: 'bg-amber-400', text: 'text-amber-600',
    }
  )
}

// ─── Avatar SVGs ───────────────────────────────────────────────────────────────

function CurrentAvatar() {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="58" width="44" height="28" rx="12" fill="#C9B89A"/>
      <rect x="29" y="49" width="14" height="12" rx="4" fill="#C9B89A"/>
      <circle cx="36" cy="33" r="22" fill="#D4C4A8"/>
      <path d="M15 29 Q17 11 36 9 Q55 11 57 29 Q52 18 36 16 Q20 18 15 29Z" fill="#6B5F52"/>
      <ellipse cx="28" cy="33" rx="3.5" ry="4" fill="#fff"/>
      <ellipse cx="44" cy="33" rx="3.5" ry="4" fill="#fff"/>
      <circle cx="29" cy="34" r="2" fill="#4A3F35"/>
      <circle cx="45" cy="34" r="2" fill="#4A3F35"/>
      <path d="M29 44 Q36 46 43 44" stroke="#8B7B6B" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <path d="M30 27 Q33 25 36 27" stroke="#8B7B6B" stroke-width="1" stroke-linecap="round" fill="none" opacity=".4"/>
      <path d="M36 27 Q39 25 42 27" stroke="#8B7B6B" stroke-width="1" stroke-linecap="round" fill="none" opacity=".4"/>
    </svg>
  )
}

function HeroAvatar() {
  return (
    <svg width="72" height="88" viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 63 Q36 78 60 63 L56 88 H16 Z" fill="#2E6B52" opacity=".5"/>
      <rect x="14" y="56" width="44" height="30" rx="12" fill="#2E6B52"/>
      <rect x="29" y="47" width="14" height="12" rx="4" fill="#3D8A68"/>
      <circle cx="36" cy="32" r="22" fill="#3D8A68"/>
      <path d="M15 28 Q17 10 36 8 Q55 10 57 28 Q52 17 36 15 Q20 17 15 28Z" fill="#1C4A35"/>
      <ellipse cx="28" cy="32" rx="3.5" ry="4" fill="#fff"/>
      <ellipse cx="44" cy="32" rx="3.5" ry="4" fill="#fff"/>
      <circle cx="28" cy="32" r="2" fill="#1C3328"/>
      <circle cx="44" cy="32" r="2" fill="#1C3328"/>
      <path d="M27 43 Q36 50 45 43" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M50 10 L51.2 14 L55.5 14 L52 16.8 L53.2 21 L50 18.5 L46.8 21 L48 16.8 L44.5 14 L48.8 14 Z" fill="#F59E0B"/>
    </svg>
  )
}

// ─── Persona sidebar ───────────────────────────────────────────────────────────

function PersonaSidebar({ coaching }: { coaching: CoachingOutput }) {
  const profile = getProfile()
  const currentArchetype = profile?.communicationChallenge
    ? getCurrentArchetype(profile.communicationChallenge)
    : null
  const heroArchetype = profile?.goal
    ? getHeroArchetype(profile.goal)
    : null

  return (
    <div className="flex flex-col gap-3">

      {/* Profile context */}
      {(profile?.goal || profile?.communicationChallenge) && (
        <div className="bg-white border border-[#E8DFD3] rounded-2xl px-4 py-4">
          {profile.goal && (
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1">
                Working on
              </p>
              <p className="text-xs font-medium text-[#1C1510] leading-snug">{profile.goal}</p>
            </div>
          )}
          {profile.communicationChallenge && (
            <div>
              <p className="text-[9px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-1">
                Stated challenge
              </p>
              <p className="text-xs font-medium text-[#1C1510] leading-snug">
                {profile.communicationChallenge}
              </p>
            </div>
          )}
          {coaching.profile_check && (
            <p className="text-xs text-[#78716C] leading-relaxed mt-3 pt-3 border-t border-[#F0EBE3] italic">
              {coaching.profile_check}
            </p>
          )}
        </div>
      )}

      {/* Current persona only */}
      {currentArchetype && (
        <div className="bg-[#F5F1EB] border border-[#DDD5C8] rounded-2xl px-4 pt-5 pb-5 flex flex-col items-center text-center">
          <p className="text-[9px] font-semibold text-[#B8A99A] uppercase tracking-widest mb-3">
            Current you
          </p>
          <CurrentAvatar />
          <p className="text-[13px] font-bold text-[#1C1510] leading-snug mt-3">
            {currentArchetype}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Future You card ───────────────────────────────────────────────────────────

function FutureYouCard({ heroArchetype }: { heroArchetype: string }) {
  return (
    <div className="bg-[#1C3328] rounded-2xl px-4 pt-5 pb-5 flex flex-col items-center text-center">
      <p className="text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-3">
        Future you
      </p>
      <HeroAvatar />
      <p className="text-[13px] font-bold text-white leading-snug mt-3">
        {heroArchetype}
      </p>
      <p className="text-[11px] text-white/40 leading-relaxed mt-2">
        The coaching above is your path.
      </p>
    </div>
  )
}

// ─── Q1: Diagnosis card ────────────────────────────────────────────────────────

function DiagnosisCard({ coaching }: { coaching: CoachingOutput }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  return (
    <div>
      <p className="text-[14px] font-semibold text-[#1C1510] mb-3">
        Why did this meeting go the way it did?
      </p>
      <div className="bg-[#1C3328] rounded-2xl overflow-hidden">
        <div className="p-6">
          <p className="text-[15px] font-semibold text-white leading-snug mb-3">
            {coaching.diagnosis.headline}
          </p>
          <p className="text-sm text-white/65 leading-relaxed">
            {coaching.diagnosis.root_cause}
          </p>
        </div>

        {coaching.evidence.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setEvidenceOpen(o => !o)}
              className="w-full flex items-center gap-2 px-6 py-3 border-t border-white/10 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-[11px] text-white/30 flex-1">
                {evidenceOpen ? 'Hide' : 'See'} supporting evidence ({coaching.evidence.length} moment{coaching.evidence.length !== 1 ? 's' : ''})
              </span>
              {evidenceOpen
                ? <ChevronUp size={12} className="text-white/20 flex-shrink-0" />
                : <ChevronDown size={12} className="text-white/20 flex-shrink-0" />}
            </button>

            {evidenceOpen && (
              <div className="px-6 pb-5 space-y-2.5">
                {coaching.evidence.map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3.5">
                    <p className="text-xs text-white/50 italic leading-relaxed mb-1.5">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <p className="text-xs text-white/30 leading-snug">{item.reveals}</p>
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

// ─── Q2: Next move ─────────────────────────────────────────────────────────────

function NextMoveCard({ coaching }: { coaching: CoachingOutput }) {
  return (
    <div>
      <p className="text-[14px] font-semibold text-[#1C1510] mb-3">
        What should I do differently next time?
      </p>
      <div className="bg-white border-2 border-[#C96442] rounded-2xl p-5">
        <p className="text-[14px] font-semibold text-[#1C1510] leading-snug mb-2">
          {coaching.next_move.action}
        </p>
        <p className="text-sm text-[#78716C] leading-relaxed">
          {coaching.next_move.why}
        </p>
      </div>
    </div>
  )
}

// ─── Q3 + Q4 ───────────────────────────────────────────────────────────────────

function PatternAndNextLevelCards({ coaching }: { coaching: CoachingOutput }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[14px] font-semibold text-[#1C1510] mb-3">
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
      <div>
        <p className="text-[14px] font-semibold text-[#1C1510] mb-3">
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

// ─── Loading skeleton for coaching content ─────────────────────────────────────

function CoachingLoadingState() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-3.5 bg-[#E8DFD3] rounded-full w-64 mb-3" />
        <div className="bg-[#1C3328]/20 rounded-2xl p-6 space-y-2.5">
          <div className="h-4 bg-white/30 rounded-full w-full" />
          <div className="h-4 bg-white/30 rounded-full w-5/6" />
          <div className="h-3 bg-white/20 rounded-full w-full mt-2" />
          <div className="h-3 bg-white/20 rounded-full w-4/5" />
        </div>
      </div>
      <div>
        <div className="h-3.5 bg-[#E8DFD3] rounded-full w-56 mb-3" />
        <div className="bg-white border-2 border-[#E8DFD3] rounded-2xl p-5 space-y-2">
          <div className="h-4 bg-[#F0EBE3] rounded-full w-4/5" />
          <div className="h-3 bg-[#F0EBE3] rounded-full w-3/5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i}>
            <div className="h-3.5 bg-[#E8DFD3] rounded-full w-40 mb-3" />
            <div className="bg-white border border-[#E8DFD3] rounded-2xl p-5 space-y-2">
              <div className="h-4 bg-[#F0EBE3] rounded-full w-3/4" />
              <div className="h-3 bg-[#F0EBE3] rounded-full w-full" />
              <div className="h-3 bg-[#F0EBE3] rounded-full w-4/5" />
            </div>
          </div>
        ))}
      </div>
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
      <div className="bg-[#F0EBE3] border border-[#E8DFD3] rounded-2xl px-5 py-4 text-center">
        <p className="text-sm font-semibold text-[#1C1510] mb-1">You&rsquo;re all set ✓</p>
        <p className="text-xs text-[#78716C]">Saved. Sign in anytime to pick up where you left off.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="text-sm font-semibold text-[#1C1510] mb-1">Keep this. Track how you improve.</p>
        <p className="text-xs text-[#78716C] mb-4 leading-relaxed">
          Create a free account — every report is saved so you can see your growth over time.
        </p>
        <form onSubmit={handleSave} className="space-y-2.5">
          <input type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-3.5 py-2.5 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors" />
          <input type="password" placeholder="Password (6+ characters)" value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            className="w-full rounded-xl border border-[#E8DFD3] bg-white px-3.5 py-2.5 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#C96442] hover:bg-[#B85839] disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-all">
            {loading ? 'Saving…' : 'Save my report'}
          </button>
        </form>
        <p className="text-[11px] text-[#B8A99A] text-center mt-2.5">
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
  const profile = getProfile()
  const heroArchetype = profile?.goal ? getHeroArchetype(profile.goal) : null

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

        {/* Outcome dot */}
        {cfg && (
          <div className="flex items-center gap-2 mb-6">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-semibold uppercase tracking-widest ${cfg.text}`}>
              {cfg.label}
            </span>
          </div>
        )}

        {/* Three-column layout: current persona | coaching | future persona */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-6 items-start">

          {/* ── Left: current persona (sticky) ── */}
          <div className="lg:sticky lg:top-[73px] lg:self-start">
            {c && <PersonaSidebar coaching={c} />}
          </div>

          {/* ── Center: coaching questions ── */}
          <div>
            {coachingLoading && <CoachingLoadingState />}

            {coachingError && !coachingLoading && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
                <p className="text-sm text-red-600 mb-3">{coachingError}</p>
                <button type="button" onClick={() => fetchCoaching(session)}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 underline">
                  Try again
                </button>
              </div>
            )}

            {c && !coachingLoading && (
              <div className="space-y-6">
                <DiagnosisCard coaching={c} />
                <NextMoveCard coaching={c} />
                <PatternAndNextLevelCards coaching={c} />
                {!isSignedIn && <SaveProgressBanner session={session} />}
              </div>
            )}
          </div>

          {/* ── Right: future persona (sticky) ── */}
          <div className="lg:sticky lg:top-[73px] lg:self-start">
            {heroArchetype && <FutureYouCard heroArchetype={heroArchetype} />}
          </div>

        </div>

        <div className="h-10" />
      </main>
    </div>
  )
}
