'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, HelpCircle, ListTodo, Users } from 'lucide-react'
import { getSession } from '@/lib/storage'
import type { Session } from '@/types'

const AUTO_ADVANCE_MS = 6000

export default function MeetingAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [progress, setProgress] = useState(0)

  const sessionId = params.id as string

  useEffect(() => {
    const s = getSession(sessionId)
    if (!s || !s.meetingAnalysis) {
      router.replace(`/results/${sessionId}`)
      return
    }
    setSession(s)
  }, [sessionId, router])

  // Auto-advance progress bar
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (AUTO_ADVANCE_MS / 50))
        if (next >= 100) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, 50)
    return () => clearInterval(interval)
  }, [session])

  // Navigate when progress hits 100
  useEffect(() => {
    if (progress >= 100) {
      router.push(`/results/${sessionId}`)
    }
  }, [progress, sessionId, router])

  if (!session || !session.meetingAnalysis) {
    return (
      <div className="min-h-screen bg-[#06060f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const m = session.meetingAnalysis
  const topDecisions = m.decisions_made.slice(0, 3)
  const topActions = m.action_items.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#06060f] text-white flex flex-col">

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/5 z-50">
        <div
          className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 flex flex-col">

        {/* Header */}
        <div className="mb-10 fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-400 mb-5 uppercase tracking-widest">
            Meeting Intelligence · Agent 1
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">
            Here&apos;s what happened
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
            {m.meeting_summary}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8 fade-in-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white mb-0.5">{m.decisions_made.length}</p>
            <p className="text-xs text-gray-500">Decisions</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white mb-0.5">{m.action_items.length}</p>
            <p className="text-xs text-gray-500">Action items</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white mb-0.5">{m.open_questions.length}</p>
            <p className="text-xs text-gray-500">Open questions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 fade-in-2">

          {/* Decisions */}
          {topDecisions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={14} className="text-indigo-400" />
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Decisions made</p>
              </div>
              <ul className="space-y-2.5">
                {topDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-200 leading-snug">{d.decision}</p>
                      {d.owner_or_decider && d.owner_or_decider !== 'unclear' && (
                        <p className="text-xs text-gray-500 mt-0.5">{d.owner_or_decider}</p>
                      )}
                    </div>
                  </li>
                ))}
                {m.decisions_made.length > 3 && (
                  <p className="text-xs text-gray-600 pl-4">+{m.decisions_made.length - 3} more in full report</p>
                )}
              </ul>
            </div>
          )}

          {/* Action items */}
          {topActions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListTodo size={14} className="text-emerald-400" />
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Action items</p>
              </div>
              <ul className="space-y-2.5">
                {topActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-200 leading-snug">{a.task}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.owner !== 'unclear' ? a.owner : 'Owner unclear'}
                        {a.due_date ? ` · ${a.due_date}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
                {m.action_items.length > 3 && (
                  <p className="text-xs text-gray-600 pl-4">+{m.action_items.length - 3} more in full report</p>
                )}
              </ul>
            </div>
          )}

          {/* Participant positions (compact) */}
          {m.participant_positions.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={14} className="text-amber-400" />
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest">In the room</p>
              </div>
              <ul className="space-y-2.5">
                {m.participant_positions.slice(0, 4).map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-300 font-medium">{p.participant}</span>
                      <span className="text-sm text-gray-500"> — {p.observed_position}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analyst flags */}
          {m.analyst_flags.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={13} className="text-amber-400" />
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Analyst notes</p>
              </div>
              <ul className="space-y-1">
                {m.analyst_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-amber-200/60 leading-relaxed">· {flag}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex items-center justify-between fade-in-3">
          <p className="text-xs text-gray-600">
            Your coaching is ready
          </p>
          <button
            onClick={() => router.push(`/results/${sessionId}`)}
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            See your coaching
            <ArrowRight size={14} />
          </button>
        </div>

      </main>
    </div>
  )
}
