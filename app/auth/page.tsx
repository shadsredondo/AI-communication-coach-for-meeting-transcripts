'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hasProfile, loadProfileFromSupabase } from '@/lib/profile'
import { loadSessionsFromSupabase } from '@/lib/storage'

/** Resolve to null if the promise takes longer than ms — so sign-in can never hang. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ])
}

/** Pull the user's profile + meetings down from their account into localStorage. */
async function hydrateUserData(): Promise<boolean> {
  try {
    const [profile] = await Promise.all([
      loadProfileFromSupabase(),
      loadSessionsFromSupabase(),
    ])
    return !!profile || hasProfile()
  } catch {
    return hasProfile()
  }
}

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already signed in, hydrate their data then redirect
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const hasData = (await withTimeout(hydrateUserData(), 6000)) ?? true
        router.replace(hasData ? '/new' : '/setup')
      }
    })
  }, [router])

  function clearError() {
    if (error) setError('')
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    // Cap the sign-in call itself so a stalled network/Supabase response can
    // never leave the button spinning forever.
    const result = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      12000,
    )

    if (result === null) {
      setError('Sign-in is taking too long — check your connection and try again.')
      setLoading(false)
      return
    }

    if (result.error) {
      setError(result.error.message === 'Invalid login credentials'
        ? 'Wrong email or password. Try again.'
        : result.error.message)
      setLoading(false)
      return
    }

    // Pull their profile + past meetings down before deciding where to send them.
    // Capped at 6s so a slow/stalled load can never freeze sign-in; default to /new.
    const hasData = (await withTimeout(hydrateUserData(), 6000)) ?? true
    router.push(hasData ? '/new' : '/setup')
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/setup')
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">

      {/* Top bar */}
      <div className="px-6 py-5 flex justify-center">
        <span className="text-base font-semibold text-[#1C1510]">Signal</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-[#1C1510] mb-2">
              {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
            </h1>
            <p className="text-sm text-[#78716C]">
              {mode === 'signin'
                ? 'Your coaching history is waiting.'
                : 'Your private space to get better at what matters.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-[#F0EBE3] rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-[#1C1510] shadow-sm'
                    : 'text-[#78716C] hover:text-[#1C1510]'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
            className="space-y-4"
          >
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-[#78716C] uppercase tracking-widest block mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shradha"
                  value={name}
                  onChange={e => { setName(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#78716C] uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError() }}
                autoComplete="email"
                className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#78716C] uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearError() }}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl border border-[#E8DFD3] bg-white px-4 py-3 text-sm text-[#1C1510] placeholder:text-[#B8A99A] focus:outline-none focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/15 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C96442] hover:bg-[#B85839] disabled:opacity-60 text-white font-medium py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#C96442]/20"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-[#B8A99A]">
            Your conversations are private and never shared.
          </p>

        </div>
      </div>
    </div>
  )
}
