import { storage, type Option } from '@/server/storage'
import { computeRoundState } from '@/server/quiz-utils'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const roundId = url.searchParams.get('roundId') ?? ''
  if (!roundId) {
    return NextResponse.json({ error: 'roundId_required' }, { status: 400 })
  }

  const round = storage.getRound(roundId)
  if (!round) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

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

  // Compute results
  const responses = storage.getResponsesByRound(roundId)

  const counts: Record<Option, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const resp of responses) {
    counts[resp.option]++
  }

  const total = counts.A + counts.B + counts.C + counts.D

  const correctOption = round.correctOption

  // Top 10: only those who got it right
  const topResponses = responses
    .filter((r) => (correctOption ? r.option === correctOption : true))
    .sort((a, b) => {
      const aLatency = a.latencyMs ?? Infinity
      const bLatency = b.latencyMs ?? Infinity
      return aLatency - bLatency
    })
    .slice(0, 10)

  const results = {
    counts,
    total,
    percents: {
      A: total ? Math.round((counts.A / total) * 1000) / 10 : 0,
      B: total ? Math.round((counts.B / total) * 1000) / 10 : 0,
      C: total ? Math.round((counts.C / total) * 1000) / 10 : 0,
      D: total ? Math.round((counts.D / total) * 1000) / 10 : 0,
    },
    correctOption,
    top: topResponses.map((r) => {
      const participant = storage.getParticipant(r.participantId)
      return {
        participantId: r.participantId,
        name: participant?.name ?? 'Unknown',
        option: r.option,
        latencyMs: r.latencyMs,
        submittedAt: r.submittedAt,
      }
    }),
  }

  return NextResponse.json({
    round: {
      id: round.id,
      status: round.status,
      question: round.question,
      correctOption: round.correctOption,
      openedAt: round.openedAt,
      closesAt: round.closesAt,
      closedAt: round.closedAt,
    },
    results,
  })
}
