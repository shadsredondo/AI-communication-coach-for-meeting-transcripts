'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { saveProfile, hasProfile } from '@/lib/profile'

// ─── Data ──────────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  'IC',
  'Senior IC',
  'Manager / Lead',
  'Director',
  'VP or above',
  'Founder / Executive',
]

const WORK_ENV_OPTIONS = [
  'Startup',
  'Scale-up',
  'Enterprise',
  'Consulting / Agency',
  'Other',
]

const CHALLENGE_OPTIONS = [
  'Being heard in senior rooms',
  'Influencing without direct authority',
  'Staying concise under pressure',
  'Navigating difficult stakeholders',
  'Projecting confidence',
  'Turning complexity into a clear story',
]

const GOAL_OPTIONS = [
  'Build executive presence',
  'Increase strategic influence',
  'Lead difficult conversations',
  'Be more direct and decisive',
  'Grow into a leadership role',
  'Strengthen key relationships',
]

// ─── Inference ────────────────────────────────────────────────────────────────

function inferLevel(role: string): string {
  const r = role.toLowerCase().trim()
  if (!r) return ''
  if (/\b(chief|cto|ceo|coo|cpo|cmo|c-suite|founder|co-founder|cofounder)\b/.test(r)) return 'Founder / Executive'
  if (/\b(vp|vice president|vice-president|svp|evp|group vice)\b/.test(r)) return 'VP or above'
  if (/\b(director|head of|gm|general manager)\b/.test(r)) return 'Director'
  if (/\b(senior manager|group manager|principal manager|group lead)\b/.test(r)) return 'Director'
  if (/\b(manager|engineering manager|\bem\b|team lead|tech lead|group lead|people lead)\b/.test(r)) return 'Manager / Lead'
  if (/\b(lead|staff engineer|staff pm|staff designer)\b/.test(r)) return 'Manager / Lead'
  if (/\b(senior|sr\b|sr\.|staff|principal)\b/.test(r)) return 'Senior IC'
  if (/\b(junior|jr\b|jr\.|associate|coordinator|analyst|entry.level|graduate)\b/.test(r)) return 'IC'
  // Bare titles with no modifier default to IC
  if (/\b(product manager|engineer|designer|analyst|developer|scientist|researcher|consultant|marketer|writer)\b/.test(r)) return 'IC'
  return ''
}

// ─── Chip component ───────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  highlighted,
  onClick,
}: {
  label: string
  selected: boolean
  highlighted?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 text-sm rounded-full border transition-all duration-150 text-left ${
        selected
          ? 'bg-[#C96442] text-white border-[#C96442] shadow-sm shadow-[#C96442]/20'
          : highlighted
          ? 'bg-[#F0EBE3] text-[#C96442] border-[#C96442]/40'
          : 'bg-white text-[#78716C] border-[#E8DFD3] hover:border-[#C96442]/40 hover:text-[#C96442]'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [role, setRole] = useState('')
  const [inferredLevel, setInferredLevel] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [hasManualLevel, setHasManualLevel] = useState(false)
  const [workEnv, setWorkEnv] = useState('')

  // Step 2
  const [challenges, setChallenges] = useState<string[]>([])
  const [goal, setGoal] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if profile already exists
  useEffect(() => {
    if (hasProfile()) router.replace('/new')
  }, [router])

  // Re-infer level when role changes (unless user manually overrode)
  useEffect(() => {
    if (hasManualLevel) return
    const inferred = inferLevel(role)
    setInferredLevel(inferred)
    setSelectedLevel(inferred)
  }, [role, hasManualLevel])

  function handleLevelSelect(level: string) {
    setSelectedLevel(level)
    setHasManualLevel(level !== inferredLevel)
    setErrors(e => ({ ...e, level: '' }))
  }

  function handleRoleChange(value: string) {
    setRole(value)
    // Reset manual override when role is retyped
    setHasManualLevel(false)
    setErrors(e => ({ ...e, role: '' }))
  }

  function toggleChallenge(c: string) {
    setChallenges(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c)
      if (prev.length >= 2) return prev
      return [...prev, c]
    })
    setErrors(e => ({ ...e, challenges: '' }))
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!role.trim()) e.role = 'Tell us your role so we can personalise your coaching.'
    if (!selectedLevel) e.level = 'Pick the level that fits best.'
    if (!workEnv) e.workEnv = 'Pick one.'
    return e
  }

  function validateStep2() {
    const e: Record<string, string> = {}
    if (challenges.length === 0) e.challenges = 'Pick at least one.'
    if (!goal) e.goal = 'Pick one.'
    return e
  }

  function handleNext() {
    const e = validateStep1()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setStep(2)
    setErrors({})
  }

  function handleFinish() {
    const e = validateStep2()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    saveProfile({
      name: '',
      role: role.trim(),
      seniority: selectedLevel,
      companyName: '',
      companySize: '',
      workEnvironment: workEnv,
      communicationChallenge: challenges.join(', '),
      goal,
    })

    router.push('/new')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* Nav */}
      <nav className="px-8 py-6 max-w-2xl mx-auto w-full">
        <Link href="/" className="font-semibold text-lg tracking-tight text-[#1C1510]">
          Signal
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-8 pb-20">
        <div className="w-full max-w-lg">

          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  s === step ? 'bg-[#C96442] w-6' : s < step ? 'bg-[#C96442]' : 'bg-[#E8DFD3]'
                }`} />
              </div>
            ))}
            <span className="text-xs text-[#78716C] ml-1">Step {step} of 2</span>
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="fade-in">
              <h1 className="text-2xl font-semibold text-[#1C1510] mb-2">
                Before we start, tell us about yourself.
              </h1>
              <p className="text-sm text-[#78716C] mb-10 leading-relaxed">
                This shapes every coaching report we give you. Takes 60 seconds.
              </p>

              {/* Role */}
              <div className="mb-8">
                <label className="text-sm font-semibold text-[#1C1510] block mb-2">
                  What's your role?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Product Manager, Engineering Lead…"
                  value={role}
                  onChange={e => handleRoleChange(e.target.value)}
                  className={`w-full px-4 py-3 text-sm text-[#1C1510] bg-white border rounded-xl placeholder:text-[#B8A99A] focus:outline-none focus:ring-2 transition-all ${
                    errors.role
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-[#E8DFD3] focus:ring-[#C96442]/20 focus:border-[#C96442]'
                  }`}
                />
                {errors.role && <p className="text-xs text-red-500 mt-1.5">{errors.role}</p>}
              </div>

              {/* Level */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-3">
                  <label className="text-sm font-semibold text-[#1C1510]">
                    Your level
                  </label>
                  {inferredLevel && !hasManualLevel && (
                    <span className="text-xs text-[#78716C]">
                      — we inferred this from your role
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map(level => (
                    <Chip
                      key={level}
                      label={level}
                      selected={selectedLevel === level}
                      onClick={() => handleLevelSelect(level)}
                    />
                  ))}
                </div>
                {errors.level && <p className="text-xs text-red-500 mt-2">{errors.level}</p>}
              </div>

              {/* Work environment */}
              <div className="mb-10">
                <label className="text-sm font-semibold text-[#1C1510] block mb-3">
                  What kind of company do you work at?
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORK_ENV_OPTIONS.map(env => (
                    <Chip
                      key={env}
                      label={env}
                      selected={workEnv === env}
                      onClick={() => {
                        setWorkEnv(env)
                        setErrors(e => ({ ...e, workEnv: '' }))
                      }}
                    />
                  ))}
                </div>
                {errors.workEnv && <p className="text-xs text-red-500 mt-2">{errors.workEnv}</p>}
              </div>

              <button
                onClick={handleNext}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-6 py-3.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-[#C96442]/20"
              >
                Next
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="fade-in">
              <h1 className="text-2xl font-semibold text-[#1C1510] mb-2">
                Now let's talk about communication.
              </h1>
              <p className="text-sm text-[#78716C] mb-10 leading-relaxed">
                This tells Signal what to watch for and what to coach you on.
              </p>

              {/* Challenge */}
              <div className="mb-8">
                <label className="text-sm font-semibold text-[#1C1510] block mb-1">
                  What's your biggest challenge in meetings?
                </label>
                <p className="text-xs text-[#78716C] mb-3">Pick up to two.</p>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGE_OPTIONS.map(c => (
                    <Chip
                      key={c}
                      label={c}
                      selected={challenges.includes(c)}
                      onClick={() => toggleChallenge(c)}
                    />
                  ))}
                </div>
                {errors.challenges && <p className="text-xs text-red-500 mt-2">{errors.challenges}</p>}
              </div>

              {/* Goal */}
              <div className="mb-10">
                <label className="text-sm font-semibold text-[#1C1510] block mb-3">
                  What do you most want to get better at?
                </label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <Chip
                      key={g}
                      label={g}
                      selected={goal === g}
                      onClick={() => {
                        setGoal(g)
                        setErrors(e => ({ ...e, goal: '' }))
                      }}
                    />
                  ))}
                </div>
                {errors.goal && <p className="text-xs text-red-500 mt-2">{errors.goal}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setErrors({}) }}
                  className="px-5 py-3.5 text-sm font-medium text-[#78716C] hover:text-[#1C1510] border border-[#E8DFD3] rounded-xl transition-colors bg-white"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#C96442] hover:bg-[#B85839] text-white font-medium px-6 py-3.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-[#C96442]/20"
                >
                  Start coaching
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
