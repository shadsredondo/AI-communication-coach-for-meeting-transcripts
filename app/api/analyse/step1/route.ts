import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { DETERMINISTIC_PROMPT } from '@/lib/deterministic-prompt'
import type { Participant } from '@/types'

export const maxDuration = 60

const client = new Anthropic()

function extractJSON(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error(`No JSON object found. Raw: ${text.slice(0, 300)}`)
  return text.slice(start, end + 1)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      transcript,
      userGoal,
      userTitle,
      meetingTitle,
      participants,
    }: {
      transcript: string
      userGoal: string
      userTitle: string
      meetingTitle: string
      participants: Participant[]
    } = body

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
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

    const userMessage = `## Meeting transcript
${transcript}

## Meeting context
Title: ${meetingTitle}
Goal: ${userGoal}

## Participants
${participantList}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: DETERMINISTIC_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from model' }, { status: 500 })
    }

    let analysis
    try {
      analysis = JSON.parse(extractJSON(textBlock.text))
    } catch (e) {
      console.error('Failed to parse deterministic analysis:', e)
      console.error('Raw text:', textBlock.text)
      return NextResponse.json({ error: 'Failed to parse analysis output' }, { status: 500 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'Rate limited — please wait a moment' }, { status: 429 })
    }
    console.error('Step 1 analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed — please try again' }, { status: 500 })
  }
}
