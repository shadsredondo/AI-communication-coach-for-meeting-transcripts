'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSession, saveSession, saveSessionToSupabase } from '@/lib/storage'
import { getProfile, saveProfileToSupabase } from '@/lib/profile'
import { getCurrentArchetype, getHeroArchetype } from '@/lib/personas'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { Session, CoachingOutput } from '@/types'

const serif = 'font-[family-name:var(--font-fraunces)]'

// ─── Section eyebrow ─────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A89A86] mb-5">
      {children}
    </p>
  )
}

// ─── Where you are — the journey frame ──────────────────────────────────────────

function JourneyHeader({
  currentArchetype,
  heroArchetype,
  strengths,
  challenge,
}: {
  currentArchetype: string | null
  heroArchetype: string | null
  strengths?: string
  challenge?: string
}) {
  if (!heroArchetype && !strengths && !challenge) return null

  return (
    <header>
      <Eyebrow>Your path</Eyebrow>
      {heroArchetype && (
        <h1 className={`${serif} text-[40px] leading-[1.1] font-semibold text-[#1C1510] mb-4`}>
          Becoming {heroArchetype}
        </h1>
      )}
      {currentArchetype && (
        <p className="text-[17px] text-[#6B6259] leading-relaxed mb-8">
          Today you show up as <span className="text-[#1C1510] font-medium">{currentArchetype}</span>.
          The work below is how you grow from one into the other — one meeting at a time.
        </p>
      )}

      {(strengths || challenge) && (
        <div className="flex flex-col sm:flex-row gap-x-12 gap-y-5 border-t border-[#EAE3D8] pt-7">
          {strengths && (
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3D7A5E] mb-2">
                Your strength
              </p>
              <p className="text-[15px] text-[#1C1510] leading-snug">{strengths}</p>
            </div>
          )}
          {challenge && (
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C96442] mb-2">
                You&rsquo;re growing
              </p>
              <p className="text-[15px] text-[#1C1510] leading-snug">{challenge}</p>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

// ─── This meeting in 30 seconds — the observations ──────────────────────────────

function SnapshotSection({ snapshot }: { snapshot: CoachingOutput['snapshot'] }) {
  const items = snapshot.slice(0, 3)
  if (items.length === 0) return null

  return (
    <section>
      <Eyebrow>This meeting, in 30 seconds</Eyebrow>
      <ul className="space-y-7">
        {items.map((item, i) => (
          <li key={i} className="flex gap-5">
            <span className={`${serif} text-3xl text-[#C96442]/35 leading-none w-7 flex-shrink-0`}>
              {i + 1}
            </span>
            <p className="text-[20px] text-[#1C1510] leading-snug font-medium pt-0.5">
              {item.observation}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── What to do differently — the actions, mapped 1:1 ───────────────────────────

function ActionsSection({ snapshot }: { snapshot: CoachingOutput['snapshot'] }) {
  const items = snapshot.slice(0, 3)
  if (items.length === 0) return null

  return (
    <section>
      <Eyebrow>What to do differently next time</Eyebrow>
      <ul className="space-y-7">
        {items.map((item, i) => (
          <li key={i} className="flex gap-5">
            <span className={`${serif} text-3xl text-[#C96442]/35 leading-none w-7 flex-shrink-0`}>
              {i + 1}
            </span>
            <p className="text-[18px] text-[#1C1510] leading-snug pt-1">
              {item.action}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─── The capability you're building → the path to your future self ──────────────

function NextLevelSection({
  coaching,
  heroArchetype,
}: {
  coaching: CoachingOutput
  heroArchetype: string | null
}) {
  return (
    <section className="bg-[#F4EFE6] rounded-3xl p-8">
      <Eyebrow>The capability you&rsquo;re building</Eyebrow>
      <h2 className={`${serif} text-[26px] leading-tight font-semibold text-[#1C1510] mb-3`}>
        {coaching.next_level.capability}
      </h2>
      <p className="text-[16px] text-[#6B6259] leading-relaxed">
        {coaching.next_level.in_this_meeting}
      </p>
      {heroArchetype && (
        <p className="text-[14px] text-[#3D7A5E] mt-6 pt-5 border-t border-[#E3DACB] font-medium">
          This is the work that turns you into {heroArchetype}.
        </p>
      )}
    </section>
  )
}

// ─── Remember — the compass line ────────────────────────────────────────────────

function RememberLine({ remember }: { remember: string }) {
  return (
    <section className="text-center">
      <Eyebrow>Carry this with you</Eyebrow>
      <p className={`${serif} text-[28px] leading-snug font-semibold text-[#1C1510]`}>
        &ldquo;{remember}&rdquo;
      </p>
    </section>
  )
}

// ─── Loading skeleton ────────────────────────────────────────────────────────────

function CoachingLoadingState() {
  return (
    <div className="space-y-16 animate-pulse">
      <div>
        <div className="h-3 bg-[#EAE3D8] rounded-full w-24 mb-5" />
        <div className="h-10 bg-[#EAE3D8] rounded-2xl w-3/4 mb-4" />
        <div className="h-4 bg-[#F0EBE3] rounded-full w-full mb-2" />
        <div className="h-4 bg-[#F0EBE3] rounded-full w-2/3" />
      </div>
      <div>
        <div className="h-3 bg-[#EAE3D8] rounded-full w-44 mb-6" />
        <div className="space-y-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-5 bg-[#F0EBE3] rounded-full w-full" />
          ))}
        </div>
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
      <div className="bg-[#F0EBE3] rounded-3xl px-6 py-5 text-center">
        <p className="text-sm font-semibold text-[#1C1510] mb-1">You&rsquo;re all set ✓</p>
        <p className="text-xs text-[#78716C]">Saved. Sign in anytime to pick up where you left off.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#F4EFE6] rounded-3xl px-6 pt-6 pb-5">
      <p className="text-base font-semibold text-[#1C1510] mb-1">Keep this. Watch yourself grow.</p>
      <p className="text-sm text-[#78716C] mb-5 leading-relaxed">
        Create a free account — every report is saved, so your path builds over time.
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
    const co = session.coachingOutput
    const hasNewSchema = co
      && 'diagnosis' in co
      && Array.isArray(co.snapshot)
      && co.snapshot.length > 0
      && typeof co.snapshot[0] === 'object'
      && 'action' in co.snapshot[0]
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
  const profile = getProfile()
  const currentArchetype = profile?.communicationChallenge
    ? getCurrentArchetype(profile.communicationChallenge)
    : null
  const heroArchetype = profile?.goal ? getHeroArchetype(profile.goal) : null

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="px-6 py-5">
        <div className="max-w-[640px] mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1510] transition-colors">
            <ArrowLeft size={15} />
            All sessions
          </Link>
          <span className="text-xs text-[#B8A99A]">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-[640px] mx-auto px-6 pt-6 pb-24">

        <JourneyHeader
          currentArchetype={currentArchetype}
          heroArchetype={heroArchetype}
          strengths={profile?.strengths}
          challenge={profile?.communicationChallenge}
        />

        <div className="mt-16">
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
            <div className="space-y-16">
              {c.snapshot?.length > 0 && <SnapshotSection snapshot={c.snapshot} />}
              {c.snapshot?.length > 0 && <ActionsSection snapshot={c.snapshot} />}
              <NextLevelSection coaching={c} heroArchetype={heroArchetype} />
              {c.remember && <RememberLine remember={c.remember} />}
              {!isSignedIn && <SaveProgressBanner session={session} />}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
