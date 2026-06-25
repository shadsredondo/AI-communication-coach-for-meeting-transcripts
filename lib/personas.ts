// Static persona name mapping — derived from profile setup answers.
// Current archetype reflects the challenge the user named.
// Hero archetype reflects the goal they are working toward.

const CHALLENGE_TO_CURRENT: Record<string, string> = {
  'Being heard in senior rooms':          'The Background Expert',
  'Influencing without direct authority': 'The Invisible Mover',
  'Staying concise under pressure':       'The Momentum Carrier',
  'Navigating difficult stakeholders':    'The Careful Navigator',
  'Projecting confidence':                'The Quiet Achiever',
  'Turning complexity into a clear story':'The Deep Thinker',
}

const GOAL_TO_HERO: Record<string, string> = {
  'Build executive presence':       'The Room Holder',
  'Increase strategic influence':   'The Strategic Force',
  'Lead difficult conversations':   'The Prepared Challenger',
  'Be more direct and decisive':    'The Decisive Voice',
  'Grow into a leadership role':    'The Emerging Leader',
  'Strengthen key relationships':   'The Trusted Ally',
}

export function getCurrentArchetype(challenge: string): string {
  // challenge may be a comma-separated list if user picked two
  const first = challenge.split(',')[0].trim()
  return CHALLENGE_TO_CURRENT[first] ?? 'The Current You'
}

export function getHeroArchetype(goal: string): string {
  return GOAL_TO_HERO[goal] ?? 'The Future You'
}
