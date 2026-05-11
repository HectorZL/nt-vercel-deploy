import { storage, type Option } from '@/server/storage'
import { computeRoundState } from '@/server/quiz-utils'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function computeQuestionResults(roundId: string, questionId: string, correctOption: Option | null) {
  const responses = storage.getResponsesByQuestion(roundId, questionId)

  const counts: Record<Option, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const resp of responses) {
    counts[resp.option]++
  }

  const total = counts.A + counts.B + counts.C + counts.D

  // Top 10 sorted by latency (correct answers first, then all)
  const topResponses = responses
    .sort((a, b) => {
      const aCorrect = correctOption ? (a.option === correctOption ? 0 : 1) : 0
      const bCorrect = correctOption ? (b.option === correctOption ? 0 : 1) : 0
      if (aCorrect !== bCorrect) return aCorrect - bCorrect
      const aLatency = a.latencyMs ?? Infinity
      const bLatency = b.latencyMs ?? Infinity
      return aLatency - bLatency
    })
    .slice(0, 10)

  return {
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
        correct: r.option === correctOption,
      }
    }),
  }
}

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
      storage.updateRound(roundId, {
        status: 'CLOSED',
        closedAt: new Date(),
      })
      round.status = 'CLOSED'
      round.closedAt = new Date()
    }
  }

  // Compute results per question
  const questions = round.questions.map((q) => ({
    id: q.id,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    results: computeQuestionResults(roundId, q.id, q.correctOption),
  }))

  return NextResponse.json({
    round: {
      id: round.id,
      status: round.status,
      questionCount: round.questions.length,
      openedAt: round.openedAt,
      closesAt: round.closesAt,
      closedAt: round.closedAt,
    },
    questions,
  })
}
