export type GoalScore = 'red' | 'yellow' | 'green'
export type Importance = 'high' | 'medium' | 'low'
export type TranscriptFormat = 'zoom' | 'raw'
export type Confidence = 'high' | 'medium' | 'low'

export interface Participant {
  id: string
  name: string
  role: string
  importance: Importance
  isUser: boolean
}

export interface DraftSession {
  transcript: string
  transcriptFormat: TranscriptFormat
  participants: Participant[]
  userTitle: string
  userGoal: string
}

// Agent 1: Meeting Analyst output
export interface MeetingAnalysis {
  meeting_summary: string
  inferred_meeting_purpose: string
  discussion_sections: Array<{
    section_title: string
    summary: string
    key_moments: string[]
  }>
  decisions_made: Array<{
    decision: string
    owner_or_decider: string
    confidence: Confidence
  }>
  open_questions: string[]
  action_items: Array<{
    owner: string
    task: string
    due_date: string | null
    confidence: Confidence
  }>
  participant_positions: Array<{
    participant: string
    observed_position: string
    evidence: string
  }>
  notable_moments: Array<{
    moment: string
    why_it_matters: string
    transcript_evidence: string
  }>
  missing_context: string[]
  analyst_flags: string[]
}

export interface Session {
  id: string
  createdAt: string
  transcript: string
  transcriptFormat: TranscriptFormat
  userGoal: string
  userTitle: string
  userFunction: string
  userSeniority: string
  meetingTitle: string
  participants: Participant[]
  meetingAnalysis?: MeetingAnalysis
  coachingOutput: CoachingOutput
  goalScore: GoalScore
}

export interface CoachingSection {
  id: 'strategic_communication' | 'tone_and_presence' | 'clarity'
  one_line_summary: string
  what_went_well: Array<{ point: string; evidence: string }>
  what_could_be_stronger: Array<{ point: string; evidence: string }>
  rewrite_suggestions?: Array<{ original: string; rewrite: string; why: string }>
}

export interface CoachingOutput {
  goal_outcome: 'strong' | 'partial' | 'off_track'
  overall_summary: {
    headline: string
    what_landed: string[]
    next_moves: string[]
  }
  sections: CoachingSection[]
  next_steps: Array<{ action: string; timing: string }>
}
