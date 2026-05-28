'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Target, MessageSquare, Mic, FileText,
  ChevronDown, ChevronUp, Check, Users, Eye, AlertTriangle,
  MoveRight, Zap
} from 'lucide-react'
import { getSession, saveSession } from '@/lib/storage'
import { getProfile } from '@/lib/profile'
import { formatDate } from '@/lib/utils'
import type {
  Session, GoalScore, CoachingSection, DeterministicAnalysis,
  ContributionLevel, WatchPattern, MomentType, CoachingOutput
} from '@/types'

// ─── Shared helpers ────────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high:   { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'High confidence' },
    medium: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Medium confidence' },
    low:    { color: 'bg-zinc-50 text-zinc-500 border-zinc-200', label: 'Low confidence' },
  }[level]
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}

// ─── Step 1: Deterministic Analysis ───────────────────────────────────────────

const CONTRIBUTION_CONFIG: Record<ContributionLevel, { label: string; width: string; color: string }> = {
  dominant: { label: 'Dominant',  width: 'w-full',   color: 'bg-indigo-500' },
  active:   { label: 'Active',    width: 'w-3/4',    color: 'bg-indigo-400' },
  moderate: { label: 'Moderate',  width: 'w-1/2',    color: 'bg-zinc-400' },
  minimal:  { label: 'Minimal',   width: 'w-1/4',    color: 'bg-zinc-300' },
}

const WATCH_PATTERN_LABELS: Record<WatchPattern, string> = {
  over_explanation: 'Over-explanation',
  interruption:     'Interruption',
  hesitation:       'Hesitation',
  defensiveness:    'Defensiveness',
  filler_language:  'Filler language',
}

const MOMENT_TYPE_CONFIG: Record<MomentType, { label: string; color: string }> = {
  topic_shift:    { label: 'Topic shift',    color: 'bg-purple-50 text-purple-700 border-purple-200' },
  decision:       { label: 'Decision',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  question:       { label: 'Question',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  agreement:      { label: 'Agreement',      color: 'bg-teal-50 text-teal-700 border-teal-200' },
  tension:        { label: 'Tension',        color: 'bg-red-50 text-red-700 border-red-200' },
  clarification:  { label: 'Clarification',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function MeetingSnapshot({ analysis }: { analysis: DeterministicAnalysis }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Meeting snapshot</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        <div className="px-6 py-5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-2">Type</p>
          <p className="text-sm font-semibold text-zinc-900 mb-2">{analysis.meeting_type.inferred}</p>
          <ConfidenceBadge level={analysis.meeting_type.confidence} />
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-2">Goal</p>
          <p className="text-sm font-semibold text-zinc-900 mb-2">{analysis.meeting_goal.inferred}</p>
          <ConfidenceBadge level={analysis.meeting_goal.confidence} />
        </div>
      </div>
    </div>
  )
}

function ParticipationBreakdown({ analysis }: { analysis: DeterministicAnalysis }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
        <Users size={13} className="text-zinc-400" />
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Who drove the room</p>
      </div>
      <div className="px-6 py-5 space-y-5">
        {analysis.participation.map((p, i) => {
          const contrib = CONTRIBUTION_CONFIG[p.contribution_level]
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-zinc-900">{p.speaker}</span>
                <div className="flex items-center gap-2">
                  {p.drove_decisions && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                      Drove decisions
                    </span>
                  )}
                  {p.asked_questions && (
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                      Asked questions
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400">{contrib.label}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${contrib.width} ${contrib.color} transition-all`} />
              </div>
              {p.notable_behaviors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.notable_behaviors.map((b, j) => (
                    <span key={j} className="text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-full px-2 py-0.5">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KeyMoments({ analysis }: { analysis: DeterministicAnalysis }) {
  const [open, setOpen] = useState(false)
  if (analysis.key_moments.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-zinc-400" />
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Key moments</p>
          <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
            {analysis.key_moments.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-5 space-y-4">
          {analysis.key_moments.map((m, i) => {
            const typeConfig = MOMENT_TYPE_CONFIG[m.type]
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-zinc-500">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <ConfidenceBadge level={m.confidence} />
                  </div>
                  <p className="text-sm text-zinc-800 mb-1.5 leading-snug">{m.description}</p>
                  {m.transcript_excerpt && (
                    <p className="text-xs text-zinc-400 italic leading-relaxed">"{m.transcript_excerpt}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UserSignals({ analysis }: { analysis: DeterministicAnalysis }) {
  const { clear_moments, watch_moments } = analysis.user_signals
  if (clear_moments.length === 0 && watch_moments.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-2">
        <Eye size={13} className="text-zinc-400" />
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Your signals</p>
      </div>

      <div className="divide-y divide-zinc-100">
        {clear_moments.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.1em] mb-3">What was clear</p>
            <div className="space-y-3">
              {clear_moments.map((m, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-zinc-900 mb-1.5 leading-snug">{m.observation}</p>
                  {m.transcript_excerpt && (
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{m.transcript_excerpt}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {watch_moments.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.1em] mb-3">Watch moments</p>
            <div className="space-y-3">
              {watch_moments.map((m, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 uppercase tracking-wider">
                      {WATCH_PATTERN_LABELS[m.pattern]}
                    </span>
                    <ConfidenceBadge level={m.confidence} />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 mb-1.5 leading-snug">{m.observation}</p>
                  {m.transcript_excerpt && (
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{m.transcript_excerpt}"</p>
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

function ConversationShifts({ analysis }: { analysis: DeterministicAnalysis }) {
  const [open, setOpen] = useState(false)
  if (analysis.conversation_shifts.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <MoveRight size={13} className="text-zinc-400" />
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Where the conversation shifted</p>
          <span className="text-[10px] text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
            {analysis.conversation_shifts.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-5 space-y-4">
          {analysis.conversation_shifts.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-zinc-500">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <span className="text-zinc-500 line-through decoration-zinc-300">{s.from_topic}</span>
                  <ArrowRight size={12} className="text-zinc-400 flex-shrink-0" />
                  <span className="font-semibold text-zinc-900">{s.to_topic}</span>
                </div>
                {s.triggered_by && s.triggered_by !== 'unclear' && (
                  <p className="text-xs text-zinc-400 mb-1">Triggered by: {s.triggered_by}</p>
                )}
                {s.transcript_excerpt && (
                  <p className="text-xs text-zinc-400 italic leading-relaxed">"{s.transcript_excerpt}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InsufficientEvidence({ analysis }: { analysis: DeterministicAnalysis }) {
  if (analysis.insufficient_evidence.length === 0) return null

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={12} className="text-zinc-400" />
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">What we couldn't determine</p>
      </div>
      <ul className="space-y-1.5">
        {analysis.insufficient_evidence.map((item, i) => (
          <li key={i} className="text-xs text-zinc-500 leading-relaxed flex items-start gap-2">
            <span className="text-zinc-300 flex-shrink-0 mt-0.5">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeterministicStep({ analysis }: { analysis: DeterministicAnalysis }) {
  return (
    <div className="space-y-3">
      <MeetingSnapshot analysis={analysis} />
      <ParticipationBreakdown analysis={analysis} />
      <KeyMoments analysis={analysis} />
      <UserSignals analysis={analysis} />
      <ConversationShifts analysis={analysis} />
      <InsufficientEvidence analysis={analysis} />
    </div>
  )
}

// ─── Step 2: Coaching ──────────────────────────────────────────────────────────

function GoalIndicator({ score, headline }: { score: GoalScore; headline: string }) {
  const config = {
    green: { bar: 'bg-emerald-400', dot: 'bg-emerald-400', label: 'Strong',    labelColor: 'text-emerald-600' },
    yellow:{ bar: 'bg-amber-400',   dot: 'bg-amber-400',   label: 'Partial',   labelColor: 'text-amber-600' },
    red:   { bar: 'bg-red-400',     dot: 'bg-red-400',     label: 'Off track', labelColor: 'text-red-500' },
  }[score]

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className={`h-[3px] w-full ${config.bar}`} />
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${config.labelColor}`}>{config.label}</span>
        </div>
        <p className="text-base font-semibold text-zinc-900 leading-snug">{headline}</p>
      </div>
    </div>
  )
}

function SignalSummary({ whatLanded, nextMoves }: { whatLanded: string[]; nextMoves: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-100">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em]">Signal Summary</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-4">What landed</p>
          <ul className="space-y-3.5">
            {whatLanded.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-emerald-600" strokeWidth={3} />
                </span>
                <span className="text-sm text-zinc-700 leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 py-6">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-4">Your next 3 moves</p>
          <ol className="space-y-3.5">
            {nextMoves.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-indigo-600 leading-none">
                  {i + 1}
                </span>
                <span className="text-sm text-zinc-700 leading-snug">{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

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
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left px-6 py-5 hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={14} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-1">{title}</p>
              <p className="text-sm font-semibold text-zinc-900 leading-snug pr-4">{section.one_line_summary}</p>
            </div>
          </div>
          <div className="flex-shrink-0 mt-1">
            {open ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-6 space-y-6">
          {section.what_went_well.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-[0.1em] mb-3">What went well</p>
              <div className="space-y-2.5">
                {section.what_went_well.map((item, i) => (
                  <div key={i} className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                    <p className="text-sm font-semibold text-zinc-900 mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.what_could_be_stronger.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-[0.1em] mb-3">What could be stronger</p>
              <div className="space-y-2.5">
                {section.what_could_be_stronger.map((item, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-sm font-semibold text-zinc-900 mb-2 leading-snug">{item.point}</p>
                    <p className="text-xs text-zinc-500 italic leading-relaxed">"{item.evidence}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.rewrite_suggestions && section.rewrite_suggestions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-[0.1em] mb-3">Rewrite suggestions</p>
              <div className="space-y-3">
                {section.rewrite_suggestions.map((r, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-zinc-100">
                      <div className="p-4">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">What you said</p>
                        <p className="text-sm text-zinc-500 italic leading-relaxed">"{r.original}"</p>
                      </div>
                      <div className="p-4 bg-zinc-50/50">
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Stronger version</p>
                        <p className="text-sm text-zinc-900 font-medium leading-relaxed">"{r.rewrite}"</p>
                      </div>
                    </div>
                    <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-100">
                      <p className="text-xs text-indigo-700 leading-relaxed">{r.why}</p>
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

function NextSteps({ steps }: { steps: Array<{ action: string; timing: string }> }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <button
        className="w-full text-left px-6 py-5 hover:bg-zinc-50/60 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={14} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-[0.1em] mb-1">Before your next meeting</p>
              <p className="text-sm font-semibold text-zinc-900">
                {steps.length} specific action{steps.length !== 1 ? 's' : ''} to take
              </p>
            </div>
          </div>
          {open ? <ChevronUp size={15} className="text-zinc-400 mt-1" /> : <ChevronDown size={15} className="text-zinc-400 mt-1" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-6 py-6">
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm text-zinc-800 leading-relaxed mb-1.5">{step.action}</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight size={10} className="text-indigo-400" />
                    <p className="text-xs text-indigo-600 font-semibold">{step.timing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Coaching loading skeleton ─────────────────────────────────────────────────

function CoachingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-100" />
            <div className="space-y-2 flex-1">
              <div className="h-2.5 bg-zinc-100 rounded w-24" />
              <div className="h-3.5 bg-zinc-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section config ────────────────────────────────────────────────────────────

const SECTION_CONFIG = {
  strategic_communication: { title: 'Strategic Communication', icon: Target },
  tone_and_presence:       { title: 'Tone & Presence',         icon: Mic },
  clarity:                 { title: 'Clarity',                 icon: FileText },
} as const

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [coachingLoading, setCoachingLoading] = useState(false)
  const [coachingError, setCoachingError] = useState<string | null>(null)

  useEffect(() => {
    const id = params.id as string
    const s = getSession(id)
    if (!s) {
      router.replace('/dashboard')
      return
    }
    setSession(s)
    setLoading(false)
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

  // Trigger Step 2 coaching if not yet loaded
  useEffect(() => {
    if (!session) return
    if (session.coachingOutput) return
    fetchCoaching(session)
  }, [session, fetchCoaching])

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const c = session.coachingOutput

  return (
    <div className="min-h-screen bg-[#f4f4f5]">

      {/* Nav */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={15} />
            All sessions
          </Link>
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">Signal</span>
          <span className="text-xs text-zinc-400">{formatDate(session.createdAt)}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-4">

        {/* Header */}
        <div className="fade-in">
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold mb-1">Coaching report</p>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">{session.meetingTitle}</h1>
          <p className="text-sm text-zinc-500 mt-1">Goal: {session.userGoal}</p>
        </div>

        {/* ── Step 1: What Happened ── */}
        {session.deterministicAnalysis && (
          <>
            <div className="flex items-center gap-3 py-2 fade-in-1">
              <div className="flex-1 h-px bg-zinc-200" />
              <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold whitespace-nowrap">
                Step 1 · What happened
              </p>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <div className="fade-in-1">
              <DeterministicStep analysis={session.deterministicAnalysis} />
            </div>
          </>
        )}

        {/* ── Step 2: Coaching ── */}
        <div className="flex items-center gap-3 py-2 fade-in-2">
          <div className="flex-1 h-px bg-zinc-200" />
          <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold whitespace-nowrap">
            Step 2 · Coaching
          </p>
          <div className="flex-1 h-px bg-zinc-200" />
        </div>

        {coachingLoading && (
          <div className="fade-in-2 space-y-3">
            <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-6 py-4">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-zinc-500">Generating your coaching…</p>
            </div>
            <CoachingSkeleton />
          </div>
        )}

        {coachingError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 fade-in-2">
            <p className="text-sm text-red-600 mb-3">{coachingError}</p>
            <button
              onClick={() => session && fetchCoaching(session)}
              className="text-xs font-semibold text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {c && c.overall_summary && (
          <div className="space-y-3 fade-in-2">
            <GoalIndicator score={session.goalScore} headline={c.overall_summary.headline} />
            <SignalSummary whatLanded={c.overall_summary.what_landed} nextMoves={c.overall_summary.next_moves} />

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-zinc-200" />
              <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold">Coaching breakdown</p>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            {c.sections.map((section) => {
              const config = SECTION_CONFIG[section.id]
              if (!config) return null
              return (
                <CoachingCard key={section.id} section={section} icon={config.icon} title={config.title} />
              )
            })}

            {c.next_steps && c.next_steps.length > 0 && (
              <NextSteps steps={c.next_steps} />
            )}
          </div>
        )}

        {/* Legacy sessions without deterministicAnalysis or coachingOutput */}
        {!session.deterministicAnalysis && !c && !coachingLoading && !coachingError && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm mb-4">This session uses an older format.</p>
            <Link href="/dashboard" className="text-indigo-600 text-sm">Back to sessions</Link>
          </div>
        )}

        <div className="h-10" />
      </main>
    </div>
  )
}
