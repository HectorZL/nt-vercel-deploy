import { storage } from '@/server/storage'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const rounds = storage.getAllRounds()

  return NextResponse.json({
    rounds: rounds.map((r) => ({
      id: r.id,
      status: r.status,
      question: r.question,
      durationMs: r.durationMs,
      createdAt: r.createdAt,
      openedAt: r.openedAt,
      closesAt: r.closesAt,
      closedAt: r.closedAt,
    })),
  })
}
