'use client'

import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveProfile } from '@/lib/profile'
import type { UserProfile } from '@/lib/profile'

const SENIORITY_OPTIONS = [
  'Individual Contributor',
  'Senior IC',
  'Lead / Staff',
  'Manager',
  'Senior Manager',
  'Director',
  'VP',
  'C-Suite / Executive',
]

const COMPANY_SIZE_OPTIONS = [
  'Startup (1–50)',
  'Growth (51–200)',
  'Mid-size (201–1,000)',
  'Large (1,001–5,000)',
  'Enterprise (5,000+)',
]

const CHALLENGE_OPTIONS = [
  'Being too detailed — struggle to be concise',
  'Not assertive enough in senior rooms',
  'Hard to influence without direct authority',
  'Reading the room politically',
  'Turning data into a compelling story',
  'Getting buy-in for my ideas',
]

const GOAL_OPTIONS = [
  'Get promoted to the next level',
  'Build trust with senior leadership',
  'Increase cross-functional influence',
  'Improve executive presence',
  'Become a stronger people manager',
  'Be seen as a strategic thinker',
]

const EMPTY: UserProfile = {
  name: '',
  role: '',
  seniority: '',
  companyName: '',
  companySize: '',
  workEnvironment: '',
  communicationChallenge: '',
  goal: '',
}

export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfile, string>>>({})

  function set(field: keyof UserProfile, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validateStep1() {
    const e: typeof errors = {}
    if (!profile.name.trim()) e.name = 'Required'
    if (!profile.role.trim()) e.role = 'Required'
    if (!profile.seniority) e.seniority = 'Required'
    return e
  }

  function validateStep2() {
    const e: typeof errors = {}
    if (!profile.communicationChallenge) e.communicationChallenge = 'Select one'
    if (!profile.goal) e.goal = 'Select one'
    return e
  }

  function handleNext() {
    const e = validateStep1()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setStep(2)
  }

  function handleFinish() {
    const e = validateStep2()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    saveProfile(profile)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step > s
                    ? 'bg-indigo-600 text-white'
                    : step === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-indigo-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 1 ? 'Tell us about you' : 'Your communication'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {step === 1
              ? 'Signal uses this to personalize every coaching report to your context.'
              : 'This shapes how Signal frames feedback and what it prioritises for you.'}
          </p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="px-8 py-6 space-y-4">
            <Input
              label="Your name"
              placeholder="e.g. Shradha"
              value={profile.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Your role</label>
              <input
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.role ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="e.g. Senior Product Manager"
                value={profile.role}
                onChange={e => set('role', e.target.value)}
              />
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Seniority level</label>
              <select
                value={profile.seniority}
                onChange={e => set('seniority', e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.seniority ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">Select level…</option>
                {SENIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {errors.seniority && <p className="text-xs text-red-500 mt-1">{errors.seniority}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company name (optional)"
                placeholder="e.g. Acme Corp"
                value={profile.companyName}
                onChange={e => set('companyName', e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Company size <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={profile.companySize}
                  onChange={e => set('companySize', e.target.value)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 bg-white transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.companySize ? 'border-red-400' : 'border-gray-300'}`}
                >
                  <option value="">Select…</option>
                  {COMPANY_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.companySize && <p className="text-xs text-red-500 mt-1">{errors.companySize}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="px-8 py-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                What's your biggest communication challenge?
              </label>
              <div className="flex flex-wrap gap-2">
                {CHALLENGE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('communicationChallenge', opt)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all text-left ${
                      profile.communicationChallenge === opt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.communicationChallenge && (
                <p className="text-xs text-red-500 mt-2">{errors.communicationChallenge}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                What's your high-level goal right now?
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('goal', opt)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all text-left ${
                      profile.goal === opt
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.goal && <p className="text-xs text-red-500 mt-2">{errors.goal}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 pb-8">
          {step === 1 ? (
            <Button size="lg" onClick={handleNext} className="w-full flex items-center justify-center gap-2">
              Next <ArrowRight size={15} />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button size="lg" variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button size="lg" onClick={handleFinish} className="flex-2 flex items-center justify-center gap-2 flex-1">
                Start coaching <ArrowRight size={15} />
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
