'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, ListTodo, Users, AlertCircle } from 'lucide-react'
import { getSession } from '@/lib/storage'
import type { Session } from '@/types'

export default function MeetingAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  const sessionId = params.id as string

  useEffect(() => {
    const s = getSession(sessionId)
    if (!s || !s.meetingAnalysis) {
      router.replace(`/results/${sessionId}`)
      return
    }
    setSession(s)
  }, [sessionId, router])

  if (!session || !session.meetingAnalysis) {
    return (
      <div className="min-h-screen bg-[#1B211E] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const m = session.meetingAnalysis
  const topDecisions = m.decisions_made.slice(0, 4)
  const topActions = m.action_items.slice(0, 4)

  const confidenceColor = (c: string) => ({
    high: 'bg-emerald-500',
    medium: 'bg-amber-400',
    low: 'bg-zinc-500',
  }[c] ?? 'bg-zinc-500')

  return (
    <div className="min-h-screen bg-[#1B211E] text-white flex flex-col">

      {/* Top bar */}
      <div className="border-b border-white/[0.06] px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-white tracking-tight">Signal</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Meeting Intelligence</span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 flex flex-col">

        {/* Header */}
        <div className="mb-12 fade-in">
          <p className="text-[11px] text-zinc-600 uppercase tracking-[0.12em] font-semibold mb-5">
            Agent 1 · Factual Analysis
          </p>
          <h1 className="text-3xl font-semibold text-white tracking-tight leading-tight mb-4">
            Here&apos;s what Signal<br />understood about your meeting.
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
            {m.meeting_summary}
          </p>
          {m.inferred_meeting_purpose && m.inferred_meeting_purpose !== m.meeting_summary && (
            <p className="text-xs text-zinc-600 mt-3 leading-relaxed">
              <span className="text-zinc-500 font-medium">Inferred purpose: </span>
              {m.inferred_meeting_purpose}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 fade-in-1">
          {[
            { value: m.decisions_made.length, label: 'Decisions' },
            { value: m.action_items.length, label: 'Action items' },
            { value: m.open_questions.length, label: 'Open questions' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 text-center">
              <p className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 fade-in-2">

          {/* Decisions */}
          {topDecisions.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={13} className="text-indigo-400" />
                <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest">Decisions made</p>
              </div>
              <ul className="space-y-3">
                {topDecisions.map((d, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidenceColor(d.confidence)}`} />
                    <div>
                      <p className="text-sm text-zinc-200 leading-snug">{d.decision}</p>
                      {d.owner_or_decider && d.owner_or_decider !== 'unclear' && (
                        <p className="text-xs text-zinc-600 mt-0.5">{d.owner_or_decider}</p>
                      )}
                    </div>
                  </li>
                ))}
                {m.decisions_made.length > 4 && (
                  <p className="text-xs text-zinc-700 pl-4">+{m.decisions_made.length - 4} more in full report</p>
                )}
              </ul>
            </div>
          )}

          {/* Action items */}
          {topActions.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-4">
                <ListTodo size={13} className="text-emerald-400" />
                <p className="text-[11px] font-semibold text-emerald-300 uppercase tracking-widest">Action items</p>
              </div>
              <ul className="space-y-3">
                {topActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidenceColor(a.confidence)}`} />
                    <div>
                      <p className="text-sm text-zinc-200 leading-snug">{a.task}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {a.owner !== 'unclear' ? a.owner : 'Owner unclear'}
                        {a.due_date ? ` · ${a.due_date}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
                {m.action_items.length > 4 && (
                  <p className="text-xs text-zinc-700 pl-4">+{m.action_items.length - 4} more in full report</p>
                )}
              </ul>
            </div>
          )}

          {/* In the room */}
          {m.participant_positions.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={13} className="text-amber-400" />
                <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-widest">In the room</p>
              </div>
              <ul className="space-y-3">
                {m.participant_positions.slice(0, 4).map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                    <p className="text-sm text-zinc-300 leading-snug">
                      <span className="font-medium text-zinc-200">{p.participant}</span>
                      <span className="text-zinc-500"> — </span>
                      {p.observed_position}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analyst flags */}
          {m.analyst_flags.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={13} className="text-amber-400" />
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Analyst notes</p>
              </div>
              <ul className="space-y-1.5">
                {m.analyst_flags.map((flag, i) => (
                  <li key={i} className="text-xs text-amber-200/50 leading-relaxed">· {flag}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* CTA */}
        <div className="mt-14 fade-in-3">
          <div className="border-t border-white/[0.06] pt-8 flex flex-col items-center gap-4">
            <p className="text-xs text-zinc-600 text-center">
              Your coaching is based on this analysis
            </p>
            <button
              onClick={() => router.push(`/results/${sessionId}`)}
              className="group inline-flex items-center gap-3 bg-white text-zinc-900 font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-zinc-100 transition-all duration-150 shadow-lg shadow-black/30"
            >
              See your coaching
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
