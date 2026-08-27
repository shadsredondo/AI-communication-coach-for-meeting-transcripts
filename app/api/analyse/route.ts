import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { authenticateRequest } from '@/lib/auth-server'
import { ALL_HYPOTHESES, isValidThemeId } from '@/lib/growth-hypotheses'
import type { Participant, DeterministicAnalysis } from '@/types'
import type { UserProfile } from '@/lib/profile'

export const maxDuration = 60

const client = new Anthropic()

function extractJSON(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found. Raw response: ${text.slice(0, 300)}`)
  return text.slice(start, end + 1)
}

export async function POST(request: NextRequest) {
  try {
    // Gate the paid endpoint: only a signed-in user can spend. Quota is
    // enforced upstream at step1 (the first call in the chain), so we don't
    // re-check it here — that would wrongly block manual regeneration of an
    // existing meeting the user has already paid for.
    const caller = await authenticateRequest(request)
    if (!caller) {
      return NextResponse.json({ error: 'Please sign in to analyse a meeting.', code: 'unauthenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      transcript,
      userTitle,
      userSeniority,
      meetingTitle,
      participants,
      profile,
      deterministicAnalysis,
    }: {
      transcript: string
      userTitle: string
      userSeniority: string
      meetingTitle: string
      participants: Participant[]
      profile: UserProfile | null
      deterministicAnalysis?: DeterministicAnalysis
    } = body

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcript is required and cannot be empty' }, { status: 400 })
    }
    if (!Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: 'At least one participant is required' }, { status: 400 })
    }

    const userParticipant = participants.find(p => p.isUser)
    const otherParticipants = participants.filter(p => !p.isUser)

    const participantList = [
      userParticipant
        ? `- ${userParticipant.name} (YOU) — ${userParticipant.role || userTitle}`
        : null,
      ...otherParticipants.map(p => `- ${p.name}${p.role ? ` — ${p.role}` : ''}`),
    ].filter(Boolean).join('\n')

    const hypothesesSection = profile?.growth_hypotheses?.length
      ? `\n\n## Growth hypotheses\nAreas of focus based on this user's stated goal. Treat as priorities when transcript evidence exists — not as facts.\n${profile.growth_hypotheses.map(h => `- ${h.label}: ${h.rationale}`).join('\n')}`
      : ''

    const profileSection = profile
      ? [
          `Name: ${profile.name}`,
          `Role: ${profile.role || userTitle}`,
          `Seniority: ${profile.seniority || userSeniority}`,
          profile.companyName ? `Company: ${profile.companyName}${profile.companySize ? ` (${profile.companySize})` : ''}` : null,
          profile.communicationChallenge ? `Communication challenge: ${profile.communicationChallenge}` : null,
          profile.goal ? `Career goal: ${profile.goal}` : null,
        ].filter(Boolean).join('\n') + hypothesesSection
      : `Role: ${userTitle}\nSeniority: ${userSeniority}`

    const deterministicSection = deterministicAnalysis
      ? `## Step 1 Observational Analysis\n${JSON.stringify(deterministicAnalysis, null, 2)}\n\n`
      : ''

    const taxonomySection = `## Theme taxonomy
Tag each snapshot pair with exactly one theme_id from this list (match on the rationale, not the label), or null if none honestly fits:
${ALL_HYPOTHESES.map(h => `- ${h.id}: ${h.rationale}`).join('\n')}`

    const userMessage = `${deterministicSection}## Meeting transcript
${transcript}

## Meeting context
Title: ${meetingTitle}

## Participants
${participantList}

## Your profile
${profileSection}

${taxonomySection}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      temperature: 0.4,
      system: SYSTEM_PROMPT || undefined,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from model' }, { status: 500 })
    }

    let coaching
    try {
      coaching = JSON.parse(extractJSON(textBlock.text))
    } catch (e) {
      console.error('Failed to parse coaching response:', e)
      console.error('Raw coaching text:', textBlock.text)
      return NextResponse.json({ error: 'Failed to parse coaching output' }, { status: 500 })
    }

    // Guard the growth tags: reject off-list theme_ids, coerce bad valence.
    if (Array.isArray(coaching?.snapshot)) {
      coaching.snapshot = coaching.snapshot.map((item: Record<string, unknown>) => ({
        ...item,
        theme_id: isValidThemeId(item?.theme_id) ? item.theme_id : null,
        valence: item?.valence === 'strength' || item?.valence === 'growth' ? item.valence : 'growth',
      }))
    }

    return NextResponse.json(coaching)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Invalid API key — check your .env.local file' }, { status: 401 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Rate limited — please wait a moment and try again' }, { status: 429 })
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error('Bad request to Anthropic API:', error.message)
      return NextResponse.json({ error: `Invalid request: ${error.message}` }, { status: 400 })
    }
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed — please try again' }, { status: 500 })
  }
}
