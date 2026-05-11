import { storage, isOption, type Option } from '@/server/storage'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface QuestionInput {
  question?: unknown
  optionA?: unknown
  optionB?: unknown
  optionC?: unknown
  optionD?: unknown
  correctOption?: unknown
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null

  // Guard: body is required
  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const durationMs = typeof body?.durationMs === 'number' ? body.durationMs : 0

  // Guard: duration must be positive
  if (durationMs <= 0) {
    return NextResponse.json({ error: 'durationMs_required' }, { status: 400 })
  }

  const rawQuestions = body?.questions
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    return NextResponse.json({ error: 'questions_required' }, { status: 400 })
  }

  const questions: Array<{
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctOption: Option
  }> = []

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i] as QuestionInput

    const question = typeof q?.question === 'string' ? q.question.trim() : ''
    const optionA = typeof q?.optionA === 'string' ? q.optionA.trim() : ''
    const optionB = typeof q?.optionB === 'string' ? q.optionB.trim() : ''
    const optionC = typeof q?.optionC === 'string' ? q.optionC.trim() : ''
    const optionD = typeof q?.optionD === 'string' ? q.optionD.trim() : ''
    const correctOption = q?.correctOption

    if (!question || !optionA || !optionB || !optionC || !optionD) {
      return NextResponse.json(
        { error: `question_${i + 1}_missing_fields` },
        { status: 400 }
      )
    }

    if (!isOption(correctOption)) {
      return NextResponse.json(
        { error: `question_${i + 1}_invalid_correctOption` },
        { status: 400 }
      )
    }

    questions.push({ question, optionA, optionB, optionC, optionD, correctOption })
  }

  const round = storage.createRound({
    questions,
    durationMs,
  })

  return NextResponse.json({ round })
}
