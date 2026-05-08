import { storage, type Option } from '@/server/storage'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  const optionA = typeof body?.optionA === 'string' ? body.optionA.trim() : ''
  const optionB = typeof body?.optionB === 'string' ? body.optionB.trim() : ''
  const optionC = typeof body?.optionC === 'string' ? body.optionC.trim() : ''
  const optionD = typeof body?.optionD === 'string' ? body.optionD.trim() : ''
  const correctOption = body?.correctOption
  const durationMs = typeof body?.durationMs === 'number' ? body.durationMs : 0

  if (!question || !optionA || !optionB || !optionC || !optionD || durationMs <= 0) {
    return NextResponse.json(
      { error: 'missing_fields' },
      { status: 400 }
    )
  }

  const isValidCorrect =
    correctOption === 'A' ||
    correctOption === 'B' ||
    correctOption === 'C' ||
    correctOption === 'D'

  if (!isValidCorrect) {
    return NextResponse.json(
      { error: 'invalid_correctOption' },
      { status: 400 }
    )
  }

  const round = storage.createRound({
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption: correctOption as Option,
    durationMs,
  })

  return NextResponse.json({ round })
}
