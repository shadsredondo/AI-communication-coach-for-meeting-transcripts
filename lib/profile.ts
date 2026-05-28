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
