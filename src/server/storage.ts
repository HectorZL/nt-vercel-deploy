// In-memory storage for demo (NO DATABASE)
// All data is lost on server restart (perfect for demo/tarea)

import { nanoid } from 'nanoid'

export type Option = 'A' | 'B' | 'C' | 'D'

export function isOption(v: unknown): v is Option {
  return v === 'A' || v === 'B' || v === 'C' || v === 'D'
}

export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

export interface Question {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: Option | null
}

export interface QuizRound {
  id: string
  createdAt: Date
  status: RoundStatus
  questions: Question[]
  durationMs: number
  openedAt: Date | null
  closesAt: Date | null
  closedAt: Date | null
}

export interface Participant {
  id: string
  createdAt: Date
  name: string
}

export interface QuizResponse {
  id: string
  roundId: string
  participantId: string
  questionId: string
  option: Option
  submittedAt: Date
  latencyMs: number | null
}

// In-memory collections
const rounds = new Map<string, QuizRound>()
const participants = new Map<string, Participant>()
const responses = new Map<string, QuizResponse>()

export const storage = {
  // Rounds
  createRound(data: {
    questions: Array<{
      question: string
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      correctOption: Option | null
    }>
    durationMs: number
  }): QuizRound {
    const round: QuizRound = {
      id: nanoid(),
      createdAt: new Date(),
      status: 'DRAFT',
      questions: data.questions.map((q) => ({
        id: nanoid(),
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
      })),
      durationMs: data.durationMs,
      openedAt: null,
      closesAt: null,
      closedAt: null,
    }
    rounds.set(round.id, round)
    return round
  },

  getRound(id: string): QuizRound | null {
    return rounds.get(id) ?? null
  },

  getActiveRound(): QuizRound | null {
    for (const round of rounds.values()) {
      if (round.status === 'OPEN') return round
    }
    return null
  },

  getRecentRound(): QuizRound | null {
    let recent: QuizRound | null = null
    for (const round of rounds.values()) {
      if (!recent || round.createdAt > recent.createdAt) {
        recent = round
      }
    }
    return recent
  },

  getAllRounds(): QuizRound[] {
    return Array.from(rounds.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
  },

  updateRound(id: string, updates: Partial<QuizRound>): QuizRound | null {
    const round = rounds.get(id)
    if (!round) return null
    Object.assign(round, updates)
    return round
  },

  // Participants
  createParticipant(name: string): Participant {
    const participant: Participant = {
      id: nanoid(),
      createdAt: new Date(),
      name,
    }
    participants.set(participant.id, participant)
    return participant
  },

  getParticipant(id: string): Participant | null {
    return participants.get(id) ?? null
  },

  // Questions
  getQuestion(roundId: string, questionId: string): Question | null {
    const round = rounds.get(roundId)
    if (!round) return null
    return round.questions.find((q) => q.id === questionId) ?? null
  },

  // Responses
  createResponse(data: {
    roundId: string
    participantId: string
    questionId: string
    option: Option
  }): QuizResponse | null {
    // Guard: round must exist
    const round = rounds.get(data.roundId)
    if (!round) return null

    // Guard: question must exist in round
    const question = round.questions.find((q) => q.id === data.questionId)
    if (!question) return null

    // Guard: no duplicate answer per participant per question
    for (const resp of responses.values()) {
      if (
        resp.roundId === data.roundId &&
        resp.participantId === data.participantId &&
        resp.questionId === data.questionId
      ) {
        return null // Already answered this question
      }
    }

    const now = new Date()
    const latencyMs = round.openedAt
      ? Math.max(0, now.getTime() - round.openedAt.getTime())
      : null

    const response: QuizResponse = {
      id: nanoid(),
      roundId: data.roundId,
      participantId: data.participantId,
      questionId: data.questionId,
      option: data.option,
      submittedAt: now,
      latencyMs,
    }
    responses.set(response.id, response)
    return response
  },

  getResponsesByRound(roundId: string, questionId?: string): QuizResponse[] {
    return Array.from(responses.values()).filter(
      (r) => r.roundId === roundId && (!questionId || r.questionId === questionId)
    )
  },

  getResponsesByQuestion(roundId: string, questionId: string): QuizResponse[] {
    return Array.from(responses.values()).filter(
      (r) => r.roundId === roundId && r.questionId === questionId
    )
  },

  getParticipantResponses(roundId: string, participantId: string): QuizResponse[] {
    return Array.from(responses.values()).filter(
      (r) => r.roundId === roundId && r.participantId === participantId
    )
  },

  // Utilities
  reset() {
    rounds.clear()
    participants.clear()
    responses.clear()
  },
}
