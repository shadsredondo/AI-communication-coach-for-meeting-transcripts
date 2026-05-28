import { Session, DraftSession } from '@/types'
import { upsertStakeholders } from '@/lib/stakeholders'
import { supabase } from '@/lib/supabase'

const SESSIONS_KEY = 'signal_sessions'
const DRAFT_KEY = 'signal_draft'

export function getSessions(): Session[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function getSession(id: string): Session | null {
  return getSessions().find(s => s.id === id) || null
}

export function saveSession(session: Session): void {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  upsertStakeholders(session.participants.filter(p => !p.isUser))
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getDraft(): DraftSession | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveDraft(data: DraftSession): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
}

/** Save a session to Supabase (called when user signs up from results page) */
export async function saveSessionToSupabase(session: Session): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('sessions').upsert({
    id: session.id,
    user_id: user.id,
    created_at: session.createdAt,
    transcript: session.transcript,
    transcript_format: session.transcriptFormat,
    user_goal: session.userGoal,
    user_title: session.userTitle,
    user_function: session.userFunction || '',
    user_seniority: session.userSeniority || '',
    meeting_title: session.meetingTitle || '',
    goal_score: session.goalScore,
    participants: session.participants,
    meeting_analysis: session.meetingAnalysis ?? null,
    deterministic_analysis: session.deterministicAnalysis ?? null,
    coaching_output: session.coachingOutput ?? null,
  })
}
