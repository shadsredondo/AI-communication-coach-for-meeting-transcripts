export interface GrowthHypothesis {
  id: string
  label: string
  rationale: string
}

// ─── Master hypothesis definitions ────────────────────────────────────────────

const HYPOTHESES: Record<string, GrowthHypothesis> = {
  strategic_framing: {
    id: 'strategic_framing',
    label: 'Strategic Framing',
    rationale: 'Positioning ideas in terms of business outcomes, tradeoffs, and long-term impact rather than execution detail.',
  },
  executive_presence: {
    id: 'executive_presence',
    label: 'Executive Presence',
    rationale: 'Communicating with clarity, confidence, and composure — particularly under pressure or in senior rooms.',
  },
  recommendation_conviction: {
    id: 'recommendation_conviction',
    label: 'Recommendation Conviction',
    rationale: 'Making explicit recommendations with a clear point of view, rather than presenting options without direction.',
  },
  stakeholder_influence: {
    id: 'stakeholder_influence',
    label: 'Stakeholder Influence',
    rationale: 'Building alignment and gaining buy-in from people without formal authority over them.',
  },
  objection_handling: {
    id: 'objection_handling',
    label: 'Objection Handling',
    rationale: 'Responding to pushback by engaging with the substance of the challenge rather than defending or over-explaining.',
  },
  clarity: {
    id: 'clarity',
    label: 'Clarity',
    rationale: 'Communicating ideas in a way that is easy to follow, with a clear structure and a single main point.',
  },
  conciseness: {
    id: 'conciseness',
    label: 'Conciseness',
    rationale: 'Saying what needs to be said without repetition, filler, or unnecessary qualification.',
  },
  active_listening: {
    id: 'active_listening',
    label: 'Active Listening',
    rationale: 'Demonstrating that you have heard and understood others before responding — building trust and reducing misalignment.',
  },
  difficult_conversations: {
    id: 'difficult_conversations',
    label: 'Difficult Conversations',
    rationale: 'Navigating tension, disagreement, or sensitive topics with directness and care.',
  },
  conflict_navigation: {
    id: 'conflict_navigation',
    label: 'Conflict Navigation',
    rationale: 'Managing competing interests or open friction without escalation or avoidance.',
  },
  alignment_building: {
    id: 'alignment_building',
    label: 'Alignment Building',
    rationale: 'Moving a group toward a shared understanding or decision, especially across different interests.',
  },
  coaching_others: {
    id: 'coaching_others',
    label: 'Coaching Others',
    rationale: 'Helping others develop through questions, feedback, and space — rather than directing or solving for them.',
  },
}

// ─── Goal → hypothesis mapping ────────────────────────────────────────────────
// Keys must match the GOAL_OPTIONS strings in app/setup/page.tsx exactly.

const GOAL_HYPOTHESIS_MAP: Record<string, string[]> = {
  'Build executive presence': [
    'executive_presence',
    'strategic_framing',
    'recommendation_conviction',
    'conciseness',
  ],
  'Increase strategic influence': [
    'stakeholder_influence',
    'strategic_framing',
    'recommendation_conviction',
    'objection_handling',
  ],
  'Lead difficult conversations': [
    'difficult_conversations',
    'conflict_navigation',
    'active_listening',
    'objection_handling',
  ],
  'Be more direct and decisive': [
    'recommendation_conviction',
    'conciseness',
    'executive_presence',
    'clarity',
  ],
  'Grow into a leadership role': [
    'strategic_framing',
    'executive_presence',
    'stakeholder_influence',
    'coaching_others',
  ],
  'Strengthen key relationships': [
    'stakeholder_influence',
    'active_listening',
    'alignment_building',
    'conflict_navigation',
  ],
}

const DEFAULT_HYPOTHESES = ['clarity', 'executive_presence', 'stakeholder_influence']

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getHypothesesForGoal(goal: string): GrowthHypothesis[] {
  const ids = GOAL_HYPOTHESIS_MAP[goal] ?? DEFAULT_HYPOTHESES
  return ids.map(id => HYPOTHESES[id]).filter(Boolean)
}

// ─── Theme taxonomy — the closed list snapshot bullets are tagged against ───────

/** Every theme in the taxonomy, for injecting into the prompt and validating tags. */
export const ALL_HYPOTHESES: GrowthHypothesis[] = Object.values(HYPOTHESES)

const VALID_THEME_IDS = new Set(Object.keys(HYPOTHESES))

/** True if id is a real theme in the taxonomy. Used to reject off-list tags. */
export function isValidThemeId(id: unknown): id is string {
  return typeof id === 'string' && VALID_THEME_IDS.has(id)
}
