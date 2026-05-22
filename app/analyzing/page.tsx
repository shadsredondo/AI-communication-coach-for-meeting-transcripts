'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import { getDraft, saveSession, clearDraft } from '@/lib/storage'
import { getProfile } from '@/lib/profile'
import { generateId } from '@/lib/utils'
import type { CoachingOutput } from '@/types'

const STEPS = [
  { label: 'Identifying speakers', duration: 800 },
  { label: 'Detecting tone shifts', duration: 1000 },
  { label: 'Mapping stakeholder dynamics', duration: 1200 },
  { label: 'Finding missed opportunities', duration: 900 },
  { label: 'Preparing your coaching', duration: 700 },
]

export default function AnalyzingPage() {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const draft = getDraft()
    if (!draft) {
      router.replace('/new')
      return
    }

    const safeDraft = draft
    let stepsFinished = false
    let apiFinished = false
    let coachingResult: CoachingOutput | null = null
    let apiError: string | null = null

    function tryComplete() {
      if (!stepsFinished || !apiFinished) return
      if (apiError || !coachingResult) {
        setError(apiError || 'Something went wrong — please try again.')
        return
      }

      const outcomeToScore = { strong: 'green', partial: 'yellow', off_track: 'red' } as const
      const goalScore = outcomeToScore[coachingResult.goal_outcome as keyof typeof outcomeToScore] ?? 'yellow'

      const session = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        transcript: safeDraft.transcript,
        transcriptFormat: safeDraft.transcriptFormat,
        userGoal: safeDraft.userGoal,
        userTitle: safeDraft.userTitle,
        userFunction: '',
        userSeniority: '',
        meetingTitle: 'Meeting',
        participants: safeDraft.participants,
        coachingOutput: coachingResult,
        goalScore,
      }

      saveSession(session)
      clearDraft()
      router.push(`/results/${session.id}`)
    }

    // Fake steps animation
    let stepIndex = 0
    function runNextStep() {
      if (stepIndex >= STEPS.length) {
        setTimeout(() => {
          stepsFinished = true
          tryComplete()
        }, 400)
        return
      }
      setCurrentStep(stepIndex)
      const duration = STEPS[stepIndex].duration
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIndex])
        stepIndex++
        setTimeout(runNextStep, 150)
      }, duration)
    }
    runNextStep()

    // Real API call in parallel
    fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: draft.transcript,
        transcriptFormat: draft.transcriptFormat,
        userGoal: draft.userGoal,
        userTitle: draft.userTitle,
        userSeniority: '',
        userFunction: '',
        meetingTitle: 'Meeting',
        participants: draft.participants,
        profile: getProfile(),
      }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          apiError = data.error || 'Analysis failed — please try again.'
        } else {
          coachingResult = data
        }
        apiFinished = true
        tryComplete()
      })
      .catch(() => {
        apiError = 'Network error — please try again.'
        apiFinished = true
        tryComplete()
      })
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center px-6">
        <p className="text-red-400 text-sm mb-6 text-center max-w-sm">{error}</p>
        <Link href="/new" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Go back and try again
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col px-6">
      <nav className="py-4 max-w-sm mx-auto w-full">
        <Link href="/new" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={16} />
          Back
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">
          <div className="flex justify-center mb-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-indigo-600/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-indigo-500 animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-white mb-2 fade-in">Reading the room…</h1>
          <p className="text-sm text-gray-500 mb-10 fade-in-1">
            Analyzing your conversation
          </p>

          <div className="text-left space-y-3">
            {STEPS.map((step, i) => {
              const isDone = completedSteps.includes(i)
              const isActive = currentStep === i && !isDone

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-300 ${
                    i > currentStep && !isDone ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isDone
                        ? 'bg-indigo-600 border-indigo-600'
                        : isActive
                        ? 'border-indigo-500 bg-transparent'
                        : 'border-gray-700 bg-transparent'
                    }`}
                  >
                    {isDone && <Check size={11} className="text-white" strokeWidth={3} />}
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      isDone ? 'text-gray-400' : isActive ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
