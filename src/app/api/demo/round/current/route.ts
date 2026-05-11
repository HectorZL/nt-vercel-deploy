import { storage } from '@/server/storage'
import { computeRoundState } from '@/server/quiz-utils'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const participantId = url.searchParams.get('participantId') ?? ''

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

  // Determine answered questions for this participant
  const answeredIds = new Set<string>()
  if (participantId) {
    const participantResponses = storage.getParticipantResponses(round.id, participantId)
    for (const resp of participantResponses) {
      answeredIds.add(resp.questionId)
    }
  }

  // Find current question: first unanswered, or first if all answered
  let currentQuestion = round.questions[0] ?? null
  for (const q of round.questions) {
    if (!answeredIds.has(q.id)) {
      currentQuestion = q
      break
    }
  }

  // Build question list with answered status
  const questions = round.questions.map((q) => ({
    id: q.id,
    question: q.question,
    answered: answeredIds.has(q.id),
  }))

  return NextResponse.json({
    round: {
      id: round.id,
      status: round.status,
      questionCount: round.questions.length,
      durationMs: round.durationMs,
      openedAt: round.openedAt,
      closesAt: round.closesAt,
      closedAt: round.closedAt,
      state,
    },
    currentQuestion: currentQuestion
      ? {
          id: currentQuestion.id,
          question: currentQuestion.question,
          optionA: currentQuestion.optionA,
          optionB: currentQuestion.optionB,
          optionC: currentQuestion.optionC,
          optionD: currentQuestion.optionD,
          answered: answeredIds.has(currentQuestion.id),
        }
      : null,
    questions,
  })
}
