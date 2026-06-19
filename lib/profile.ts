import { supabase } from '@/lib/supabase'
import type { GrowthHypothesis } from '@/lib/growth-hypotheses'

export type { GrowthHypothesis }

const PROFILE_KEY = 'signal_user_profile'

export interface UserProfile {
  name: string
  role: string
  seniority: string
  companyName: string
  companySize: string
  workEnvironment: string
  communicationChallenge: string
  strengths?: string
  goal: string
  growth_hypotheses?: GrowthHypothesis[]
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

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY)
}

/** Load the signed-in user's profile from Supabase into localStorage. Returns it, or null. */
export async function loadProfileFromSupabase(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null

  const profile: UserProfile = {
    name: data.name ?? '',
    role: data.role ?? '',
    seniority: data.seniority ?? '',
    companyName: data.company_name ?? '',
    companySize: data.company_size ?? '',
    workEnvironment: data.work_environment ?? '',
    communicationChallenge: data.communication_challenge ?? '',
    strengths: data.strengths ?? undefined,
    goal: data.goal ?? '',
    growth_hypotheses: data.growth_hypotheses ?? undefined,
  }
  saveProfile(profile)
  return profile
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
    strengths: profile.strengths ?? null,
    goal: profile.goal,
    growth_hypotheses: profile.growth_hypotheses ?? null,
    updated_at: new Date().toISOString(),
  })
}
