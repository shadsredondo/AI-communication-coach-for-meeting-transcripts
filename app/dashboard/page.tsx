'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, ArrowRight, ChevronRight } from 'lucide-react'
import { getSessions, deleteSession, deleteSessionFromSupabase } from '@/lib/storage'
import { getProfile } from '@/lib/profile'
import { getCurrentArchetype, getHeroArchetype } from '@/lib/personas'
import { computeGrowth, type GrowthSummary, type ThemePattern } from '@/lib/growth'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import type { Session } from '@/types'

const serif = 'font-[family-name:var(--font-newsreader)]'

function Eyebrow({ children, color = '#8C8F86' }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color }}>
      {children}
    </p>
  )
}

// ─── The standout line up top ────────────────────────────────────────────────

function standoutLine(g: GrowthSummary): string | null {
  const h = g.headline
  if (h) {
    if (h.category === 'becoming_strength')
      return `${h.label} is turning into a strength — it has come up across ${h.meetingCount} meetings, and you're shifting it.`
    if (h.category === 'recurring_growth')
      return `${h.label} keeps showing up across ${h.meetingCount} meetings — it's your current edge.`
    return `${h.label} is a consistent strength — steady across ${h.meetingCount} meetings.`
  }
  const remember = (g.lastMeeting?.coachingOutput as { remember?: string } | undefined)?.remember
  return remember ? `Last time: “${remember}”` : null
}

// ─── A growth lens (one of the three) ────────────────────────────────────────

function Lens({
  label,
  color,
  patterns,
}: {
  label: string
  color: string
  patterns: ThemePattern[]
}) {
  if (patterns.length === 0) return null
  return (
    <div>
      <Eyebrow color={color}>{label}</Eyebrow>
      <ul className="space-y-3">
        {patterns.map(p => (
          <li
            key={p.themeId}
            className="flex items-baseline justify-between gap-4 border-b border-[#E5E4DB] pb-3"
          >
            <span className="text-[17px] font-semibold text-[#1B211E] leading-snug">
              {p.label}
            </span>
            <span className="text-xs text-[#8C8F86] flex-shrink-0">
              {p.meetingCount} meetings
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── A meeting row in the list ───────────────────────────────────────────────

function MeetingRow({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const others = session.participants.filter(p => !p.isUser)
  return (
    <div className="group flex items-center justify-between gap-4 border-b border-[#E5E4DB] py-4">
      <Link href={`/results/${session.id}`} className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1B211E] truncate group-hover:text-[#1F4A3D] transition-colors">
          {session.meetingTitle || 'Meeting'}
        </p>
        <p className="text-xs text-[#8C8F86] truncate mt-0.5">
          {formatDate(session.createdAt)}
          {others.length > 0 && ` · ${others.map(p => p.name).join(', ')}`}
        </p>
      </Link>
      <button
        type="button"
        onClick={() => { if (confirm('Delete this meeting?')) onDelete() }}
        className="text-xs text-[#8C8F86] hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        Delete
      </button>
      <ChevronRight size={15} className="text-[#DBDAD0] flex-shrink-0" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loaded, setLoaded] = useState(false)

  // Re-read once auth settles: the AuthProvider hydrates localStorage from
  // Supabase asynchronously, so reading only on mount can miss that write
  // (e.g. on a direct load or refresh of /dashboard).
  useEffect(() => {
    if (loading) return
    setSessions(getSessions())
    setLoaded(true)
  }, [loading, user])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  function handleDelete(id: string) {
    deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
    void deleteSessionFromSupabase(id).catch(() => {})
  }

  const profile = getProfile()
  const firstName = profile?.name?.trim().split(' ')[0]
  const heroArchetype = profile?.goal ? getHeroArchetype(profile.goal) : null
  const currentArchetype = profile?.communicationChallenge
    ? getCurrentArchetype(profile.communicationChallenge)
    : null

  const growth = computeGrowth(sessions)
  const standout = standoutLine(growth)

  return (
    <div className="min-h-screen bg-[#F1F0EA]">

      {/* Nav */}
      <nav className="px-6 py-5 border-b border-[#E5E4DB]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1B211E]">Signal</span>
          <div className="flex items-center gap-4">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-[#6B6F66] hover:text-[#1B211E] transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            )}
            <Link
              href="/new"
              className="flex items-center gap-1.5 text-sm font-medium bg-[#1F4A3D] hover:bg-[#163329] text-white px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={14} />
              New meeting
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-14">

        {/* ── Welcome + your path ── */}
        <header className="mb-16">
          <Eyebrow color="#1F4A3D">Welcome back</Eyebrow>
          <h1 className={`${serif} text-[40px] leading-[1.1] font-semibold text-[#1B211E] mb-4`}>
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
          {heroArchetype && (
            <p className="text-[17px] text-[#4A4F49] leading-relaxed">
              You&rsquo;re on your way to becoming{' '}
              <span className="text-[#1B211E] font-medium">{heroArchetype}</span>
              {currentArchetype && <> — from {currentArchetype}</>}.
            </p>
          )}
          {standout && (
            <p className="text-[17px] text-[#1B211E] leading-relaxed mt-4 pt-4 border-t border-[#E2E1D7]">
              {standout}
            </p>
          )}
        </header>

        {/* ── Growth ── */}
        {loaded && growth.totalMeetings === 0 ? (
          <section className="mb-16 text-center bg-[#E8E7DE] rounded-3xl px-6 py-12">
            <h2 className={`${serif} text-2xl font-semibold text-[#1B211E] mb-2`}>
              Your growth starts with one meeting
            </h2>
            <p className="text-[15px] text-[#4A4F49] mb-6 max-w-sm mx-auto leading-relaxed">
              Bring in a conversation that mattered, and Signal will start tracking what you&rsquo;re building.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 bg-[#1F4A3D] hover:bg-[#163329] text-white font-medium px-6 py-3 rounded-xl text-sm transition-all"
            >
              Add your first meeting <ArrowRight size={15} />
            </Link>
          </section>
        ) : growth.hasPatterns ? (
          <section className="mb-16 space-y-12">
            <Lens label="Becoming a strength" color="#1F4A3D" patterns={growth.becomingStrength} />
            <Lens label="Keeps showing up" color="#1F4A3D" patterns={growth.recurringGrowth} />
            <Lens label="Your consistent strengths" color="#1F4A3D" patterns={growth.consistentStrengths} />
          </section>
        ) : growth.totalMeetings > 0 ? (
          <section className="mb-16 bg-[#E8E7DE] rounded-3xl px-7 py-8">
            <Eyebrow color="#8C8F86">Your patterns are forming</Eyebrow>
            <p className="text-[16px] text-[#1B211E] leading-relaxed">
              You&rsquo;re {growth.totalMeetings === 1 ? 'one meeting' : `${growth.totalMeetings} meetings`} in.
              Add a couple more and Signal will start showing what keeps coming up and what&rsquo;s
              turning into a strength.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 text-[#1F4A3D] font-medium text-sm mt-5 hover:underline"
            >
              Add another meeting <ArrowRight size={14} />
            </Link>
          </section>
        ) : null}

        {/* ── Your meetings ── */}
        {loaded && sessions.length > 0 && (
          <section>
            <Eyebrow>Your meetings</Eyebrow>
            <div>
              {sessions.map(session => (
                <MeetingRow
                  key={session.id}
                  session={session}
                  onDelete={() => handleDelete(session.id)}
                />
              ))}
            </div>
          </section>
        )}

        {!loaded && (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#1F4A3D] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </main>
    </div>
  )
}
