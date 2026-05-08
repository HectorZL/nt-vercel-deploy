import { storage, isOption, type Option } from '@/server/storage'
import { computeRoundState } from '@/server/quiz-utils'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { participantId?: unknown; option?: unknown }
    | null

  const participantId =
    typeof body?.participantId === 'string' ? body.participantId : ''
  const option = body?.option

  if (!participantId || !isOption(option)) {
    return NextResponse.json(
      { error: 'participantId_and_option_required' },
      { status: 400 }
    )
  }

  const round = storage.getActiveRound()
  if (!round) {
    return NextResponse.json({ error: 'no_open_round' }, { status: 409 })
  }

  // Check if expired
  const state = computeRoundState(round)
  if (state.isExpired) {
    storage.updateRound(round.id, {
      status: 'CLOSED',
      closedAt: new Date(),
    })
    return NextResponse.json({ error: 'round_closed' }, { status: 409 })
  }

  if (!state.isOpen) {
    return NextResponse.json({ error: 'round_closed' }, { status: 409 })
  }

  const response = storage.createResponse({
    roundId: round.id,
    participantId,
    option,
  })

  if (!response) {
    return NextResponse.json({ error: 'already_answered' }, { status: 409 })
  }

  return NextResponse.json({ ok: true, responseId: response.id })
}
