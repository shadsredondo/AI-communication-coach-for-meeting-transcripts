'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveDraft } from '@/lib/storage'
import { hasProfile } from '@/lib/profile'
import { parseTranscript, extractRolesFromTranscript } from '@/lib/transcript-parser'
import { lookupRole } from '@/lib/stakeholders'
import { ROLE_GROUPS, getAllRoles, addCustomRole } from '@/lib/default-roles'
import { generateId } from '@/lib/utils'
import type { Participant } from '@/types'

const ALL_ROLES = ROLE_GROUPS.flatMap(g => g.roles)

const DEFAULT_DISPLAY_ROLES = [
  'Product Manager',
  'Director of Product',
  'Software Engineer',
  'Engineering Manager',
  'Product Designer',
  'Marketing Manager',
  'Data Analyst',
  'Chief of Staff',
  'Skip-Level Manager',
  'VP of Engineering',
]

const GOAL_SUGGESTIONS = [
  'Gain approval',
  'Influence decision',
  'Build trust',
  'Align on roadmap',
  'Resolve conflict',
  'Present findings',
]

const TRANSCRIPT_PLACEHOLDER = `Sarah: Good morning everyone. Thanks for joining the roadmap review.\n\nMark: Morning. I wanted to raise a concern about the Q3 timeline before we get started...\n\nYou: Absolutely, let's address that first. I've actually prepared some data on that.`

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

function RoleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const allRoles = getAllRoles()

  useEffect(() => { setQuery(value) }, [value])

  const filtered = query.trim()
    ? allRoles.filter(r => r.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : [...DEFAULT_DISPLAY_ROLES, ...allRoles.filter(r => !ALL_ROLES.includes(r))]

  function select(role: string) {
    onChange(role)
    setQuery(role)
    setOpen(false)
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150)
    if (query.trim() && !allRoles.includes(query.trim())) {
      addCustomRole(query.trim())
      onChange(query.trim())
    } else if (!query.trim()) {
      onChange('')
    }
  }

  return (
    <div className="relative flex-1">
      <input
        className="w-full px-3 py-2 text-sm bg-transparent border-0 border-b border-gray-200 focus:border-indigo-400 focus:outline-none text-gray-700 placeholder-gray-400 transition-colors"
        placeholder="Their role…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {open && (filtered.length > 0 || (query.trim() && !allRoles.includes(query.trim()))) && (
        <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
          {filtered.map(r => (
            <li key={r}>
              <button
                type="button"
                onMouseDown={() => select(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {r}
              </button>
            </li>
          ))}
          {query.trim() && !allRoles.includes(query.trim()) && (
            <li className={filtered.length > 0 ? 'border-t border-gray-100' : ''}>
              <button
                type="button"
                onMouseDown={() => select(query.trim())}
                className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Use &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function ParticipantRow({
  participant,
  onUpdate,
  onRemove,
}: {
  participant: Participant
  onUpdate: (p: Participant) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
        <span className="text-xs font-semibold text-indigo-600">
          {getInitials(participant.name)}
        </span>
      </div>
      <input
        className="w-0 flex-[2] px-0 py-1 text-sm font-medium text-gray-900 bg-transparent border-0 border-b border-gray-200 focus:border-indigo-400 focus:outline-none placeholder-gray-400 transition-colors min-w-0"
        placeholder="Name"
        value={participant.name}
        onChange={e => onUpdate({ ...participant, name: e.target.value })}
      />
      <div className="flex-shrink-0 w-px h-5 bg-gray-200" />
      <RoleInput
        value={participant.role}
        onChange={role => onUpdate({ ...participant, role })}
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')
  const [userTitle, setUserTitle] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect to setup if no profile
  useEffect(() => {
    if (!hasProfile()) router.replace('/setup')
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!transcript.trim()) {
        setParticipants([])
        return
      }
      const { format, speakers } = parseTranscript(transcript)
      const roleMap = extractRolesFromTranscript(transcript)
      const detected = speakers.map(name => ({
        id: generateId(),
        name,
        role: roleMap.get(name) || lookupRole(name),
        importance: 'high' as const,
        isUser: false,
      }))
      setParticipants(
        detected.length > 0
          ? detected
          : [
              { id: generateId(), name: '', role: '', importance: 'high', isUser: true },
              { id: generateId(), name: '', role: '', importance: 'high', isUser: false },
            ]
      )
    }, 600)
    return () => clearTimeout(timer)
  }, [transcript])

  const updateParticipant = useCallback((id: string, updated: Participant) => {
    setParticipants(prev => prev.map(p => p.id === id ? updated : p))
  }, [])

  const removeParticipant = useCallback((id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
  }, [])

  function addParticipant() {
    setParticipants(prev => [
      ...prev,
      { id: generateId(), name: '', role: '', importance: 'high', isUser: false },
    ])
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!transcript.trim()) e.transcript = 'Please add your transcript.'
    if (participants.filter(p => p.name.trim()).length === 0) e.participants = 'Add at least one participant.'
    if (selectedGoals.length === 0 && !customGoal.trim()) e.goal = 'Select or enter a goal.'
    if (!userTitle.trim()) e.userTitle = 'Your title is required.'
    return e
  }

  function handleGenerate() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const goal = [...selectedGoals, customGoal.trim()].filter(Boolean).join(', ')
    const filledParticipants = participants.filter(p => p.name.trim())
    const { format } = parseTranscript(transcript)

    saveDraft({
      transcript: transcript.trim(),
      transcriptFormat: format,
      participants: filledParticipants,
      userGoal: goal,
      userTitle: userTitle.trim(),
    })

    router.push('/analyzing')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} />
            Back
          </Link>
          <span className="text-sm font-medium text-gray-900">Signal</span>
          <div className="w-16" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10 fade-in">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Bring in a conversation that mattered
          </h1>
          <p className="text-sm text-gray-500">
            The more context you share, the sharper your coaching.
          </p>
        </div>

        {/* Transcript */}
        <div className="mb-10 fade-in-1">
          <Textarea
            label="Transcript"
            placeholder={TRANSCRIPT_PLACEHOLDER}
            value={transcript}
            onChange={e => {
              setTranscript(e.target.value)
              if (errors.transcript) setErrors(prev => ({ ...prev, transcript: '' }))
            }}
            rows={12}
            error={errors.transcript}
          />
        </div>

        <div className="border-t border-gray-100 mb-10" />

        {/* Goal */}
        <div className="mb-10 fade-in-2">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            What did you want from this meeting?
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Be specific — this shapes your entire coaching report.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {GOAL_SUGGESTIONS.map(suggestion => {
              const active = selectedGoals.includes(suggestion)
              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setSelectedGoals(prev =>
                      active ? prev.filter(g => g !== suggestion) : [...prev, suggestion]
                    )
                    if (errors.goal) setErrors(prev => ({ ...prev, goal: '' }))
                  }}
                  className={`px-3.5 py-1.5 text-sm rounded-full border transition-all ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {suggestion}
                </button>
              )
            })}
          </div>

          <Input
            placeholder="Add your own goal…"
            value={customGoal}
            onChange={e => {
              setCustomGoal(e.target.value)
              if (errors.goal) setErrors(prev => ({ ...prev, goal: '' }))
            }}
            error={errors.goal}
          />
        </div>

        <div className="border-t border-gray-100 mb-10" />

        {/* Participants */}
        <div className="mb-10 fade-in-3">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Who was in the room?</h2>
          <p className="text-sm text-gray-400 mb-5">
            {transcript.trim()
              ? 'Detected from your transcript — edit as needed.'
              : 'Paste your transcript above and participants will be auto-detected.'}
          </p>

          {participants.length > 0 && (
            <div className="flex items-center gap-4 px-4 mb-2">
              <div className="w-9 flex-shrink-0" />
              <span className="flex-[2] text-xs font-medium text-gray-400 uppercase tracking-wide">Name</span>
              <div className="w-px flex-shrink-0" />
              <span className="flex-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Role</span>
              <div className="w-7 flex-shrink-0" />
            </div>
          )}

          <div className="space-y-2 mb-4">
            {participants.map(p => (
              <ParticipantRow
                key={p.id}
                participant={p}
                onUpdate={updated => updateParticipant(p.id, updated)}
                onRemove={() => removeParticipant(p.id)}
              />
            ))}
          </div>

          {errors.participants && (
            <p className="text-xs text-red-400 mb-3 px-1">{errors.participants}</p>
          )}

          <button
            type="button"
            onClick={addParticipant}
            className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 font-medium px-1"
          >
            <Plus size={14} />
            Add someone
          </button>
        </div>

        <div className="border-t border-gray-100 mb-10" />

        {/* Your title */}
        <div className="mb-10 fade-in-4">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Your title</h2>
          <p className="text-sm text-gray-400 mb-5">
            Helps us frame coaching from your perspective.
          </p>
          <Input
            placeholder="e.g. Senior Product Manager"
            value={userTitle}
            onChange={e => {
              setUserTitle(e.target.value)
              if (errors.userTitle) setErrors(prev => ({ ...prev, userTitle: '' }))
            }}
            error={errors.userTitle}
          />
        </div>

        {/* CTA */}
        <div className="fade-in-4">
          <Button
            size="lg"
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2"
          >
            Generate my coaching
            <ArrowRight size={16} />
          </Button>
        </div>
      </main>
    </div>
  )
}
