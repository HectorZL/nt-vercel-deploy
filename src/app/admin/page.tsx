'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Round {
  id: string
  status: string
  question: string
  durationMs: number
  createdAt: string
  openedAt: string | null
  closesAt: string | null
  closedAt: string | null
}

export default function AdminPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'create' | 'manage'>('create')

  // Form state
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionC, setOptionC] = useState('')
  const [optionD, setOptionD] = useState('')
  const [correctOption, setCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [durationSeconds, setDurationSeconds] = useState(10)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Load rounds
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const res = await fetch('/api/admin/round/list')
        const data = await res.json()
        setRounds(data.rounds || [])
      } catch (err) {
        console.error(err)
      }
    }

    fetchRounds()
    const interval = setInterval(fetchRounds, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/round/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption,
          durationMs: durationSeconds * 1000,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Error creating round')
        return
      }

      // Clear form
      setQuestion('')
      setOptionA('')
      setOptionB('')
      setOptionC('')
      setOptionD('')
      setCorrectOption('A')
      setDurationSeconds(10)
      setTab('manage')

      // Reload rounds
      const listRes = await fetch('/api/admin/round/list')
      const listData = await listRes.json()
      setRounds(listData.rounds || [])
    } catch (err) {
      setError(String(err))
    } finally {
      setCreating(false)
    }
  }

  const handleOpen = async (roundId: string) => {
    try {
      const res = await fetch('/api/admin/round/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error opening round')
        return
      }

      // Reload rounds
      const listRes = await fetch('/api/admin/round/list')
      const listData = await listRes.json()
      setRounds(listData.rounds || [])
    } catch (err) {
      alert(String(err))
    }
  }

  const handleClose = async (roundId: string) => {
    try {
      const res = await fetch('/api/admin/round/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Error closing round')
        return
      }

      // Reload rounds
      const listRes = await fetch('/api/admin/round/list')
      const listData = await listRes.json()
      setRounds(listData.rounds || [])
    } catch (err) {
      alert(String(err))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
          <Link
            href="/play"
            className="text-blue-600 hover:underline text-lg"
          >
            → Go to Student View
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('create')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Create Round
          </button>
          <button
            onClick={() => setTab('manage')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === 'manage'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Manage Rounds ({rounds.length})
          </button>
        </div>

        {/* Create Tab */}
        {tab === 'create' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleCreate} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the quiz question"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {opt}
                    </label>
                    <input
                      type="text"
                      value={
                        {
                          A: optionA,
                          B: optionB,
                          C: optionC,
                          D: optionD,
                        }[opt]
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        if (opt === 'A') setOptionA(val)
                        if (opt === 'B') setOptionB(val)
                        if (opt === 'C') setOptionC(val)
                        if (opt === 'D') setOptionD(val)
                      }}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Option ${opt}`}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Option
                  </label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    min="1"
                    max="300"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
              >
                {creating ? 'Creating...' : 'Create Round'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
        {tab === 'manage' && (
          <div className="space-y-4">
            {rounds.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No rounds created yet
              </div>
            ) : (
              rounds.map((round) => (
                <div
                  key={round.id}
                  className="bg-white rounded-lg shadow-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {round.question}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        ID: {round.id.slice(0, 8)}... • Duration: {round.durationMs / 1000}s
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        round.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : round.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {round.status}
                    </span>
                  </div>

                  {round.status === 'DRAFT' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleOpen(round.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        Open Round
                      </button>
                    </div>
                  )}

                  {round.status === 'OPEN' && (
                    <div className="space-y-2">
                      <div className="text-sm text-blue-600 font-semibold">
                        ⏱ Opens: {new Date(round.openedAt!).toLocaleTimeString()}
                        &nbsp;| Closes: {new Date(round.closesAt!).toLocaleTimeString()}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleClose(round.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                          Close Round
                        </button>
                        <Link
                          href={`/admin/results?roundId=${round.id}`}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-center transition"
                        >
                          View Results
                        </Link>
                      </div>
                    </div>
                  )}

                  {round.status === 'CLOSED' && (
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/results?roundId=${round.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-center transition"
                      >
                        View Results
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
