'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react'
import { saveDraft } from '@/lib/storage'
import { hasProfile, getProfile } from '@/lib/profile'
import { parseTranscript, extractRolesFromTranscript } from '@/lib/transcript-parser'
import { lookupRole } from '@/lib/stakeholders'
import { ROLE_GROUPS, getAllRoles, addCustomRole } from '@/lib/default-roles'
import { generateId } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'
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

const TRANSCRIPT_PLACEHOLDER = `Sarah: Good morning everyone. Thanks for joining the roadmap review.\n\nMark: Morning. I wanted to raise a concern about the Q3 timeline before we get started...\n\nYou: Absolutely, let's address that first. I've actually prepared some data on that.`

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

// ─── Role autocomplete ─────────────────────────────────────────────────────────

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
        className="w-full px-3 py-2 text-sm bg-transparent border-0 border-b border-[#E8DFD3] focus:border-[#C96442] focus:outline-none text-[#1C1510] placeholder-[#B8A99A] transition-colors"
        placeholder="Their role…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
      />
      {open && (filtered.length > 0 || (query.trim() && !allRoles.includes(query.trim()))) && (
        <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-[#E8DFD3] shadow-lg overflow-hidden">
          {filtered.map(r => (
            <li key={r}>
              <button
                type="button"
                onMouseDown={() => select(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#1C1510] hover:bg-[#FAF7F2] transition-colors"
              >
                {r}
              </button>
            </li>
          ))}
          {query.trim() && !allRoles.includes(query.trim()) && (
            <li className={filtered.length > 0 ? 'border-t border-[#E8DFD3]' : ''}>
              <button
                type="button"
                onMouseDown={() => select(query.trim())}
                className="w-full text-left px-4 py-2.5 text-sm text-[#C96442] hover:bg-[#FAF7F2] transition-colors"
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

// ─── Participant row ───────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-2xl border border-[#E8DFD3] hover:border-[#C96442]/30 transition-colors">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#C96442]/10 flex items-center justify-center">
        <span className="text-xs font-semibold text-[#C96442]">
          {getInitials(participant.name)}
        </span>
      </div>
      <input
        className="w-0 flex-[2] px-0 py-1 text-sm font-medium text-[#1C1510] bg-transparent border-0 border-b border-[#E8DFD3] focus:border-[#C96442] focus:outline-none placeholder-[#B8A99A] transition-colors min-w-0"
        placeholder="Name"
        value={participant.name}
        onChange={e => onUpdate({ ...participant, name: e.target.value })}
      />
      <div className="flex-shrink-0 w-px h-5 bg-[#E8DFD3]" />
      <RoleInput
        value={participant.role}
        onChange={role => onUpdate({ ...participant, role })}
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[#B8A99A] hover:text-[#78716C] hover:bg-[#F0EBE3] transition-all"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewMeetingPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [transcript, setTranscript] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [userTitle, setUserTitle] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Analysing a meeting spends credits, so it requires an account. Send a
  // signed-out visitor to sign in before they invest effort in a transcript.
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth')
      return
    }
    if (!hasProfile()) {
      router.replace('/setup')
      return
    }
    const profile = getProfile()
    if (profile?.role) setUserTitle(profile.role)
  }, [router, user, loading])

  // Auto-detect participants from transcript
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
    if (!transcript.trim()) e.transcript = 'Paste your transcript to get started.'
    if (participants.filter(p => p.name.trim()).length === 0) e.participants = 'Add at least one participant.'
    if (!userTitle.trim()) e.userTitle = 'Your title helps us frame the coaching.'
    return e
  }

  function handleGenerate() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    const filledParticipants = participants.filter(p => p.name.trim())
    const { format } = parseTranscript(transcript)

    saveDraft({
      transcript: transcript.trim(),
      transcriptFormat: format,
      participants: filledParticipants,
      userTitle: userTitle.trim(),
    })

    router.push('/analyzing')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Nav */}
      <nav className="px-6 py-4 border-b border-[#E8DFD3] bg-[#FAF7F2]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1510] transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
          <span className="text-sm font-semibold text-[#1C1510]">Signal</span>
          <div className="w-16" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 fade-in">
          <h1 className="text-2xl font-semibold text-[#1C1510] mb-2">
            Bring in a conversation that mattered
          </h1>
          <p className="text-sm text-[#78716C]">
            The more context you share, the sharper your coaching.
          </p>
        </div>

        {/* Transcript */}
        <div className="mb-10 fade-in-1">
          <label className="text-sm font-semibold text-[#1C1510] block mb-2">
            Transcript
          </label>
          <textarea
            placeholder={TRANSCRIPT_PLACEHOLDER}
            value={transcript}
            rows={12}
            onChange={e => {
              setTranscript(e.target.value)
              if (errors.transcript) setErrors(prev => ({ ...prev, transcript: '' }))
            }}
            className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-[#1C1510] placeholder:text-[#B8A99A] transition-colors resize-none focus:outline-none focus:ring-2 ${
              errors.transcript
                ? 'border-red-300 focus:ring-red-200'
                : 'border-[#E8DFD3] focus:border-[#C96442] focus:ring-[#C96442]/15'
            }`}
          />
          {errors.transcript && (
            <p className="text-xs text-red-500 mt-1.5">{errors.transcript}</p>
          )}
        </div>

        <div className="border-t border-[#E8DFD3] mb-10" />

        {/* Participants */}
        <div className="mb-10 fade-in-2">
          <h2 className="text-base font-semibold text-[#1C1510] mb-1">Who was in the room?</h2>
          <p className="text-sm text-[#78716C] mb-5">
            {transcript.trim()
              ? 'Detected from your transcript — edit as needed.'
              : 'Paste your transcript above and participants will be auto-detected.'}
          </p>

          {participants.length > 0 && (
            <div className="flex items-center gap-4 px-4 mb-2">
              <div className="w-9 flex-shrink-0" />
              <span className="flex-[2] text-[10px] font-semibold text-[#78716C] uppercase tracking-widest">Name</span>
              <div className="w-px flex-shrink-0" />
              <span className="flex-1 text-[10px] font-semibold text-[#78716C] uppercase tracking-widest">Role</span>
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
            <p className="text-xs text-red-500 mb-3">{errors.participants}</p>
          )}

          <button
            type="button"
            onClick={addParticipant}
            className="flex items-center gap-1.5 text-sm text-[#C96442] hover:text-[#B85839] font-medium transition-colors"
          >
            <Plus size={14} />
            Add someone
          </button>
        </div>

        <div className="border-t border-[#E8DFD3] mb-10" />

        {/* Your title */}
        <div className="mb-10 fade-in-3">
          <h2 className="text-base font-semibold text-[#1C1510] mb-1">Your title</h2>
          <p className="text-sm text-[#78716C] mb-4">
            Helps us frame the coaching from your perspective.
          </p>
          <input
            type="text"
            placeholder="e.g. Senior Product Manager"
            value={userTitle}
            onChange={e => {
              setUserTitle(e.target.value)
              if (errors.userTitle) setErrors(prev => ({ ...prev, userTitle: '' }))
            }}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] transition-colors focus:outline-none focus:ring-2 ${
              errors.userTitle
                ? 'border-red-300 focus:ring-red-200'
                : 'border-[#E8DFD3] focus:border-[#C96442] focus:ring-[#C96442]/15'
            }`}
          />
          {errors.userTitle && (
            <p className="text-xs text-red-500 mt-1.5">{errors.userTitle}</p>
          )}
        </div>

        {/* CTA */}
        <div className="fade-in-3">
          <button
            onClick={handleGenerate}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-6 py-4 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-[#C96442]/20"
          >
            Generate my coaching
            <ArrowRight size={16} />
          </button>
        </div>

      </main>
    </div>
  )
}
