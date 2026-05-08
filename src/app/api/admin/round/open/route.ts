import { storage } from '@/server/storage'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { roundId?: unknown } | null

  const roundId = typeof body?.roundId === 'string' ? body.roundId : ''

  if (!roundId) {
    return NextResponse.json({ error: 'roundId_required' }, { status: 400 })
  }

  const round = storage.getRound(roundId)

  if (!round) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (round.status !== 'DRAFT') {
    return NextResponse.json({ error: 'invalid_status' }, { status: 409 })
  }

  const now = new Date()
  const closesAt = new Date(now.getTime() + round.durationMs)

  storage.updateRound(roundId, {
    status: 'OPEN',
    openedAt: now,
    closesAt,
  })

  return NextResponse.json({
    round: storage.getRound(roundId),
  })
}
