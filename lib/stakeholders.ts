const STAKEHOLDERS_KEY = 'signal_stakeholders'

export interface KnownStakeholder {
  name: string
  role: string
  lastSeen: string // ISO date
}

export function getStakeholders(): KnownStakeholder[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STAKEHOLDERS_KEY) || '[]')
  } catch {
    return []
  }
}

export function clearStakeholders(): void {
  localStorage.removeItem(STAKEHOLDERS_KEY)
}

export function upsertStakeholders(participants: { name: string; role: string }[]): void {
  const existing = getStakeholders()
  const now = new Date().toISOString()

  for (const p of participants) {
    if (!p.name.trim()) continue
    const idx = existing.findIndex(s => s.name.toLowerCase() === p.name.toLowerCase())
    if (idx >= 0) {
      // update role if one was provided
      if (p.role) existing[idx].role = p.role
      existing[idx].lastSeen = now
    } else {
      existing.push({ name: p.name.trim(), role: p.role, lastSeen: now })
    }
  }

  localStorage.setItem(STAKEHOLDERS_KEY, JSON.stringify(existing))
}

export function lookupRole(name: string): string {
  const match = getStakeholders().find(
    s => s.name.toLowerCase() === name.toLowerCase()
  )
  return match?.role || ''
}
