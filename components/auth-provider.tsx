'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { loadProfileFromSupabase, clearProfile } from '@/lib/profile'
import { loadSessionsFromSupabase, clearSessions, clearDraft } from '@/lib/storage'
import { clearStakeholders } from '@/lib/stakeholders'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

/** Pull the signed-in user's profile + meetings down into localStorage. */
async function hydrate() {
  await Promise.all([loadProfileFromSupabase(), loadSessionsFromSupabase()])
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) await hydrate()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) await hydrate()
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    // Wipe local data so accounts don't bleed into each other on a shared browser
    clearSessions()
    clearProfile()
    clearStakeholders()
    clearDraft()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
