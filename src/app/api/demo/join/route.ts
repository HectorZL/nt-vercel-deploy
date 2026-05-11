import { storage } from '@/server/storage'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { name?: unknown }
    | null

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'name_required' }, { status: 400 })
  }

  const participant = storage.createParticipant(name.slice(0, 60))

  return NextResponse.json({ participant })
}
