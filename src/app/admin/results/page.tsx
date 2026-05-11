'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface QuestionResult {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string | null
  results: {
    counts: Record<string, number>
    total: number
    percents: Record<string, number>
    correctOption: string | null
    top: Array<{
      participantId: string
      name: string
      option: string
      latencyMs: number | null
      submittedAt: string
      correct: boolean
    }>
  }
}

interface ResultsData {
  round: {
    id: string
    status: string
    questionCount: number
    openedAt: string | null
    closesAt: string | null
    closedAt: string | null
  }
  questions: QuestionResult[]
}

function AdminResultsContent() {
  const searchParams = useSearchParams()
  const roundId = searchParams.get('roundId') ?? ''

  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)

  useEffect(() => {
    if (!roundId) return

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/admin/round/results?roundId=${roundId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
    const interval = setInterval(fetchResults, 1000)
    return () => clearInterval(interval)
  }, [roundId])

  if (!roundId) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-slate-300">No round selected</p>
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
            ← Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-300">Loading results...</p>
        </div>
      </div>
    )
  }

  const { round, questions } = data
  const activeQuestion = questions[activeQuestionIndex]
  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-slate-300">No questions found</p>
          <Link href="/admin" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
            ← Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  const { results } = activeQuestion
  const optionLabels: Record<string, string> = {
    A: activeQuestion.optionA,
    B: activeQuestion.optionB,
    C: activeQuestion.optionC,
    D: activeQuestion.optionD,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100">Round Results</h1>
          <Link
            href="/admin"
            className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Question Navigation */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
              Questions:
            </span>
            <div className="flex gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    idx === activeQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-slate-400 ml-auto">
              {results.total} response{results.total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Question Detail */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">
            {activeQuestion.question}
          </h2>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-slate-300">Status</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{round.status}</p>
          </div>

          {activeQuestion.correctOption && (
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-400 p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-slate-300">Correct Answer</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {activeQuestion.correctOption}: {optionLabels[activeQuestion.correctOption]}
              </p>
            </div>
          )}
        </div>

        {/* Response Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">
            Response Distribution
          </h3>

          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt}>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-gray-800 dark:text-slate-100">
                    {opt}: {optionLabels[opt]}
                  </label>
                  <span className="text-lg font-bold text-gray-800 dark:text-slate-100">
                    {results.counts[opt]} ({results.percents[opt]}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-center text-white font-bold text-sm transition-all ${
                      opt === results.correctOption
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width: results.total
                        ? `${(results.counts[opt] / results.total) * 100}%`
                        : '0%',
                    }}
                  >
                    {results.percents[opt] > 5 && `${results.percents[opt]}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">
            Top Responses
          </h3>

          {results.top.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-center py-8">No responses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-slate-600">
                    <th className="text-left py-3 px-4 font-bold text-gray-700 dark:text-slate-200">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 dark:text-slate-200">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 dark:text-slate-200">
                      Answer
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 dark:text-slate-200">
                      Time (ms)
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700 dark:text-slate-200">
                      Correct
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.top.map((resp, idx) => (
                    <tr
                      key={resp.participantId}
                      className={`border-b border-gray-200 dark:border-slate-700 ${
                        resp.correct ? 'bg-green-50 dark:bg-green-900/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-lg">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-slate-100 font-semibold">
                        {resp.name}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-slate-100">
                        <span className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full font-bold">
                          {resp.option}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-slate-100">
                        {resp.latencyMs ?? 'N/A'} ms
                      </td>
                      <td className="py-3 px-4">
                        {resp.correct ? (
                          <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 font-bold">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminResultsContent />
    </Suspense>
  )
}
