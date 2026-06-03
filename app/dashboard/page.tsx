'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Plus, ChevronRight, Trash2, LogOut } from 'lucide-react'
import { getSessions, deleteSession } from '@/lib/storage'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
import type { Session, GoalScore } from '@/types'

function ScoreDot({ score }: { score: GoalScore }) {
  const colors = { green: 'bg-emerald-500', yellow: 'bg-amber-400', red: 'bg-red-500' }
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${colors[score]}`} />
}

function ScoreBadge({ score }: { score: GoalScore }) {
  const config = {
    green:  { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Strong' },
    yellow: { style: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Partial' },
    red:    { style: 'bg-red-50 text-red-700 border-red-200',             label: 'Off track' },
  }[score]
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.style}`}>
      {config.label}
    </span>
  )
}

function SessionCard({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const otherParticipants = session.participants.filter(p => !p.isUser)

  return (
    <div className="group bg-white rounded-2xl border border-[#E8DFD3] hover:border-[#C96442]/30 hover:shadow-sm transition-all duration-150">
      <Link href={`/results/${session.id}`} className="block px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ScoreDot score={session.goalScore} />
              <h3 className="text-sm font-semibold text-[#1C1510] truncate">{session.meetingTitle}</h3>
            </div>
            <p className="text-xs text-[#78716C] mb-3 truncate">{session.userGoal}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <ScoreBadge score={session.goalScore} />
              {otherParticipants.slice(0, 3).map(p => (
                <span key={p.id} className="text-xs text-[#78716C]">
                  {p.name}{p.role ? ` · ${p.role}` : ''}
                </span>
              ))}
              {otherParticipants.length > 3 && (
                <span className="text-xs text-[#B8A99A]">+{otherParticipants.length - 3} more</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-[#B8A99A]">{formatDate(session.createdAt)}</span>
            <ChevronRight size={14} className="text-[#E8DFD3] group-hover:text-[#C96442] transition-colors" />
          </div>
        </div>
      </Link>
      <div className="px-5 pb-4 flex justify-end border-t border-[#F0EBE3]">
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            if (confirm('Delete this session?')) onDelete()
          }}
          className="text-xs text-[#B8A99A] hover:text-red-500 flex items-center gap-1 transition-colors mt-3"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSessions(getSessions())
    setLoaded(true)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  function handleDelete(id: string) {
    deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const greenCount = sessions.filter(s => s.goalScore === 'green').length
  const yellowCount = sessions.filter(s => s.goalScore === 'yellow').length
  const redCount = sessions.filter(s => s.goalScore === 'red').length

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="bg-[#FAF7F2] border-b border-[#E8DFD3] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#1C1510]">
            Signal
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1510] transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            )}
            <Link
              href="/new"
              className="flex items-center gap-1.5 text-sm font-medium bg-[#C96442] hover:bg-[#B85839] text-white px-4 py-2 rounded-lg transition-all shadow-sm shadow-[#C96442]/20"
            >
              <Plus size={13} />
              New session
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1C1510] mb-1">My sessions</h1>
          <p className="text-sm text-[#78716C]">Your coaching history across past conversations.</p>
        </div>

        {/* Stats */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 text-center">
              <div className="text-2xl font-bold text-[#1C1510] mb-1">{sessions.length}</div>
              <div className="text-xs text-[#78716C]">Sessions analyzed</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-2xl font-bold text-emerald-600">{greenCount}</span>
                <span className="text-sm text-[#E8DFD3]">/</span>
                <span className="text-lg font-semibold text-amber-500">{yellowCount}</span>
                <span className="text-sm text-[#E8DFD3]">/</span>
                <span className="text-lg font-semibold text-red-500">{redCount}</span>
              </div>
              <div className="text-xs text-[#78716C]">Strong / Partial / Off track</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E8DFD3] p-4 text-center">
              <div className="text-2xl font-bold text-[#C96442] mb-1">
                {Math.round((greenCount / sessions.length) * 100)}%
              </div>
              <div className="text-xs text-[#78716C]">Goal achievement rate</div>
            </div>
          </div>
        )}

        {/* Sessions */}
        {!loaded ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#C96442] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[#C96442]/10 border border-[#C96442]/20 flex items-center justify-center mx-auto mb-4">
              <ArrowRight size={20} className="text-[#C96442]" />
            </div>
            <h2 className="text-base font-semibold text-[#1C1510] mb-2">No sessions yet</h2>
            <p className="text-sm text-[#78716C] mb-6 max-w-xs mx-auto">
              Paste your first meeting transcript to get personalized coaching.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#C96442]/20"
            >
              Try your first meeting
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
