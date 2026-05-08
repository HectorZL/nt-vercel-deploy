import { storage } from '@/server/storage'
import { computeRoundState } from '@/server/quiz-utils'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const round = storage.getRecentRound()

  if (!round) return NextResponse.json({ round: null })

  // Auto-close if expired
  if (round.status === 'OPEN') {
    const state = computeRoundState(round)
    if (state.isExpired) {
      storage.updateRound(round.id, {
        status: 'CLOSED',
        closedAt: new Date(),
      })
      round.status = 'CLOSED'
      round.closedAt = new Date()
    }
  }

  const state = computeRoundState(round)

  return NextResponse.json({
    round: {
      id: round.id,
      status: round.status,
      question: round.question,
      optionA: round.optionA,
      optionB: round.optionB,
      optionC: round.optionC,
      optionD: round.optionD,
      durationMs: round.durationMs,
      openedAt: round.openedAt,
      closesAt: round.closesAt,
      closedAt: round.closedAt,
      state,
    },
  })
}
