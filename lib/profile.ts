import { supabase } from '@/lib/supabase'

const PROFILE_KEY = 'signal_user_profile'

export interface UserProfile {
  name: string
  role: string
  seniority: string
  companyName: string
  companySize: string
  workEnvironment: string
  communicationChallenge: string
  goal: string
}

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function hasProfile(): boolean {
  return getProfile() !== null
}

/** Save profile to Supabase (called after setup is complete) */
export async function saveProfileToSupabase(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').upsert({
    id: user.id,
    name: profile.name,
    role: profile.role,
    seniority: profile.seniority,
    company_name: profile.companyName,
    company_size: profile.companySize,
    work_environment: profile.workEnvironment,
    communication_challenge: profile.communicationChallenge,
    goal: profile.goal,
    updated_at: new Date().toISOString(),
  })
}
