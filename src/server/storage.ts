// In-memory storage for demo (NO DATABASE)
// All data is lost on server restart (perfect for demo/tarea)

import { nanoid } from 'nanoid'

export type Option = 'A' | 'B' | 'C' | 'D'

export function isOption(v: unknown): v is Option {
  return v === 'A' || v === 'B' || v === 'C' || v === 'D'
}

export type RoundStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

export interface QuizRound {
  id: string
  createdAt: Date
  status: RoundStatus
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: Option | null
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
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctOption: Option | null
    durationMs: number
  }): QuizRound {
    const round: QuizRound = {
      id: nanoid(),
      createdAt: new Date(),
      status: 'DRAFT',
      question: data.question,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      correctOption: data.correctOption,
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

  // Responses
  createResponse(data: {
    roundId: string
    participantId: string
    option: Option
  }): QuizResponse | null {
    const round = rounds.get(data.roundId)
    if (!round) return null

    // Check for duplicate
    for (const resp of responses.values()) {
      if (
        resp.roundId === data.roundId &&
        resp.participantId === data.participantId
      ) {
        return null // Already answered
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
      option: data.option,
      submittedAt: now,
      latencyMs,
    }
    responses.set(response.id, response)
    return response
  },

  getResponsesByRound(roundId: string): QuizResponse[] {
    return Array.from(responses.values()).filter((r) => r.roundId === roundId)
  },

  // Utilities
  reset() {
    rounds.clear()
    participants.clear()
    responses.clear()
  },
}
