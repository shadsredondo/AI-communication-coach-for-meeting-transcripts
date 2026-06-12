'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'
import { getDraft, saveSession, clearDraft } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { DeterministicAnalysis } from '@/types'

const STEPS = [
  { label: 'Parsing transcript', duration: 700 },
  { label: 'Identifying participants', duration: 900 },
  { label: 'Extracting meeting signals', duration: 1100 },
  { label: 'Mapping your communication patterns', duration: 1000 },
  { label: 'Building your report', duration: 600 },
]

export default function AnalyzingPage() {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const draft = getDraft()
    if (!draft) { router.replace('/new'); return }

    const safeDraft = draft
    let stepsFinished = false
    let apiFinished = false
    let deterministicResult: DeterministicAnalysis | null = null
    let apiError: string | null = null

    function tryComplete() {
      if (!stepsFinished || !apiFinished) return
      if (apiError || !deterministicResult) {
        setError(apiError || 'Something went wrong — please try again.')
        return
      }
      const sessionId = generateId()
      const session = {
        id: sessionId,
        createdAt: new Date().toISOString(),
        transcript: safeDraft.transcript,
        transcriptFormat: safeDraft.transcriptFormat,
        userTitle: safeDraft.userTitle,
        userFunction: '',
        userSeniority: '',
        meetingTitle: 'Meeting',
        participants: safeDraft.participants,
        deterministicAnalysis: deterministicResult,
        goalScore: 'yellow' as const,
      }
      saveSession(session)
      clearDraft()
      router.push(`/results/${sessionId}`)
    }

    let stepIndex = 0
    function runNextStep() {
      if (stepIndex >= STEPS.length) {
        setTimeout(() => { stepsFinished = true; tryComplete() }, 400)
        return
      }
      setCurrentStep(stepIndex)
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIndex])
        stepIndex++
        setTimeout(runNextStep, 150)
      }, STEPS[stepIndex].duration)
    }
    runNextStep()

    fetch('/api/analyse/step1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: draft.transcript,
        userTitle: draft.userTitle,
        meetingTitle: 'Meeting',
        participants: draft.participants,
      }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) { apiError = data.error || 'Analysis failed — please try again.' }
        else { deterministicResult = data }
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
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6">
        <p className="text-red-500 text-sm mb-6 text-center max-w-sm">{error}</p>
        <Link href="/new" className="text-sm text-[#78716C] hover:text-[#1C1510] transition-colors">
          ← Go back and try again
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col px-6">
      <nav className="py-5 max-w-sm mx-auto w-full">
        <Link
          href="/new"
          className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1510] transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-full text-center">

          {/* Pulse icon */}
          <div className="flex justify-center mb-10">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full bg-[#C96442]/15 animate-ping" />
              <div className="relative w-14 h-14 rounded-full bg-[#C96442]/10 border border-[#C96442]/30 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-[#C96442] animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-[#1C1510] mb-2">Reading the room…</h1>
          <p className="text-sm text-[#78716C] mb-10">
            Extracting what actually happened
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
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isDone
                      ? 'bg-[#C96442] border-[#C96442]'
                      : isActive
                      ? 'border-[#C96442] bg-transparent'
                      : 'border-[#E8DFD3] bg-transparent'
                  }`}>
                    {isDone && <Check size={10} className="text-white" strokeWidth={3} />}
                    {isActive && <div className="w-2 h-2 rounded-full bg-[#C96442] animate-pulse" />}
                  </div>
                  <span className={`text-sm transition-colors duration-300 ${
                    isDone ? 'text-[#B8A99A]' : isActive ? 'text-[#1C1510]' : 'text-[#E8DFD3]'
                  }`}>
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
