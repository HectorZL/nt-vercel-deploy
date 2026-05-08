'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

interface ResultsData {
  round: {
    id: string
    status: string
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    correctOption: string | null
    openedAt: string | null
    closesAt: string | null
    closedAt: string | null
  }
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

function AdminResultsContent() {
  const searchParams = useSearchParams()
  const roundId = searchParams.get('roundId') ?? ''

  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)

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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">No round selected</p>
          <Link href="/admin" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Admin
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  const { round, results } = data
  const optionLabels: Record<string, string> = {
    A: round.optionA,
    B: round.optionB,
    C: round.optionC,
    D: round.optionD,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Round Results</h1>
          <Link
            href="/admin"
            className="text-blue-600 hover:underline text-lg"
          >
            ← Back to Admin
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {round.question}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-bold text-gray-800">{round.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Responses</p>
              <p className="text-lg font-bold text-gray-800">{results.total}</p>
            </div>
          </div>

          {round.correctOption && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
              <p className="text-sm text-gray-600">Correct Answer</p>
              <p className="text-lg font-bold text-green-700">
                {round.correctOption}: {optionLabels[round.correctOption]}
              </p>
            </div>
          )}
        </div>

        {/* Response Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Response Distribution
          </h3>

          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <div key={opt}>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-bold text-gray-800">
                    {opt}: {optionLabels[opt]}
                  </label>
                  <span className="text-lg font-bold text-gray-800">
                    {results.counts[opt]} ({results.percents[opt]}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-center text-white font-bold text-sm transition-all ${
                      opt === results.correctOption
                        ? 'bg-green-500'
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Top Responses
          </h3>

          {results.top.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No responses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-700">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">
                      Answer
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">
                      Time (ms)
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">
                      Correct
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.top.map((resp, idx) => (
                    <tr
                      key={resp.participantId}
                      className={`border-b border-gray-200 ${
                        resp.correct ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-lg">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-semibold">
                        {resp.name}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        <span className="bg-blue-100 px-3 py-1 rounded-full font-bold">
                          {resp.option}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {resp.latencyMs ?? 'N/A'} ms
                      </td>
                      <td className="py-3 px-4">
                        {resp.correct ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗</span>
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
