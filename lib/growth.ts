import type { Session } from '@/types'
import { ALL_HYPOTHESES, isValidThemeId } from '@/lib/growth-hypotheses'

// theme_id → human label, from the taxonomy
const LABELS: Record<string, string> = Object.fromEntries(
  ALL_HYPOTHESES.map(h => [h.id, h.label]),
)
export function themeLabel(id: string): string {
  return LABELS[id] ?? id
}

type Valence = 'strength' | 'growth'

interface Instance {
  valence: Valence
  at: string
  sessionId: string
}

export type ThemeCategory = 'becoming_strength' | 'recurring_growth' | 'consistent_strength'

export interface ThemePattern {
  themeId: string
  label: string
  meetingCount: number
  latestValence: Valence
  category: ThemeCategory
}

export interface GrowthSummary {
  totalMeetings: number
  hasPatterns: boolean
  becomingStrength: ThemePattern[]
  recurringGrowth: ThemePattern[]
  consistentStrengths: ThemePattern[]
  headline: ThemePattern | null // the single standout to feature up top
  lastMeeting: Session | null
}

interface TaggedCoaching {
  snapshot?: Array<{ theme_id: string | null; valence?: Valence }>
  diagnosis?: { hypothesis_tags?: string[] }
  remember?: string
}

/** Roll a user's meetings' theme tags into cross-meeting growth patterns. Pure read — no API calls. */
export function computeGrowth(sessions: Session[]): GrowthSummary {
  const withCoaching = sessions
    .filter(s => {
      const co = s.coachingOutput as TaggedCoaching | undefined
      return !!co && Array.isArray(co.snapshot)
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)) // oldest → newest

  const byTheme = new Map<string, Instance[]>()
  for (const s of withCoaching) {
    const co = s.coachingOutput as TaggedCoaching
    const snap = co.snapshot ?? []
    const seenThisMeeting = new Set<string>()
    for (const item of snap) {
      if (!item?.theme_id) continue
      if (item.valence !== 'strength' && item.valence !== 'growth') continue
      if (seenThisMeeting.has(item.theme_id)) continue // one record per (meeting, theme)
      seenThisMeeting.add(item.theme_id)
      const arr = byTheme.get(item.theme_id) ?? []
      arr.push({ valence: item.valence, at: s.createdAt, sessionId: s.id })
      byTheme.set(item.theme_id, arr)
    }

    // Backfill: reports generated before snapshot theme-tagging have no
    // theme_id, but they carry diagnosis.hypothesis_tags from the same
    // taxonomy. Treat those as growth-area signals so historical meetings
    // still feed cross-meeting patterns — no regeneration, no AI call.
    if (seenThisMeeting.size === 0) {
      for (const tag of co.diagnosis?.hypothesis_tags ?? []) {
        if (!isValidThemeId(tag)) continue
        if (seenThisMeeting.has(tag)) continue
        seenThisMeeting.add(tag)
        const arr = byTheme.get(tag) ?? []
        arr.push({ valence: 'growth', at: s.createdAt, sessionId: s.id })
        byTheme.set(tag, arr)
      }
    }
  }

  const becomingStrength: ThemePattern[] = []
  const recurringGrowth: ThemePattern[] = []
  const consistentStrengths: ThemePattern[] = []

  for (const [themeId, instances] of byTheme) {
    const meetingCount = new Set(instances.map(i => i.sessionId)).size
    if (meetingCount < 2) continue // a single appearance isn't a cross-meeting pattern

    const sorted = [...instances].sort((a, b) => (a.at < b.at ? -1 : 1))
    const earliest = sorted[0].valence
    const latest = sorted[sorted.length - 1].valence
    const base = { themeId, label: themeLabel(themeId), meetingCount, latestValence: latest }

    if (earliest === 'growth' && latest === 'strength') {
      becomingStrength.push({ ...base, category: 'becoming_strength' })
    } else if (latest === 'growth') {
      recurringGrowth.push({ ...base, category: 'recurring_growth' })
    } else {
      consistentStrengths.push({ ...base, category: 'consistent_strength' })
    }
  }

  const byCount = (a: ThemePattern, b: ThemePattern) => b.meetingCount - a.meetingCount
  becomingStrength.sort(byCount)
  recurringGrowth.sort(byCount)
  consistentStrengths.sort(byCount)

  const hasPatterns =
    becomingStrength.length + recurringGrowth.length + consistentStrengths.length > 0

  // Feature a flip first (most motivating), then a live edge, then a steady strength.
  const headline =
    becomingStrength[0] ?? recurringGrowth[0] ?? consistentStrengths[0] ?? null

  return {
    totalMeetings: withCoaching.length,
    hasPatterns,
    becomingStrength,
    recurringGrowth,
    consistentStrengths,
    headline,
    lastMeeting: withCoaching.length ? withCoaching[withCoaching.length - 1] : null,
  }
}
