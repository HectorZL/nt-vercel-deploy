'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Round {
  id: string
  status: string
  questionCount: number
  firstQuestion: string
  durationMs: number
  createdAt: string
  openedAt: string | null
  closesAt: string | null
  closedAt: string | null
}

interface QuestionForm {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
}

const emptyQuestion = (): QuestionForm => ({
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
})

export default function AdminPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [tab, setTab] = useState<'create' | 'manage'>('create')

  // Form state
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()])
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

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()])
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return // Keep at least one
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const updated = questions.map((q, i) => {
      if (i !== index) return q
      return { ...q, [field]: value }
    })
    setQuestions(updated)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/admin/round/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.map((q) => ({
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
          })),
          durationMs: durationSeconds * 1000,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Error creating round')
        return
      }

      // Clear form
      setQuestions([emptyQuestion()])
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100">Admin Panel</h1>
          <Link
            href="/play"
            className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
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
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Create Round
          </button>
          <button
            onClick={() => setTab('manage')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === 'manage'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            Manage Rounds ({rounds.length})
          </button>
        </div>

        {/* Create Tab */}
        {tab === 'create' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleCreate} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Questions */}
              <div className="space-y-8">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="border border-gray-300 dark:border-slate-600 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                        Question {index + 1}
                      </h3>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                        Question Text
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                        placeholder="Enter the quiz question"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <div key={opt}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Option {opt}
                          </label>
                          <input
                            type="text"
                            value={
                              {
                                A: q.optionA,
                                B: q.optionB,
                                C: q.optionC,
                                D: q.optionD,
                              }[opt]
                            }
                            onChange={(e) => {
                              const fieldMap = { A: 'optionA', B: 'optionB', C: 'optionC', D: 'optionD' } as const
                              updateQuestion(index, fieldMap[opt], e.target.value)
                            }}
                            required
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            placeholder={`Option ${opt}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                        Correct Option
                      </label>
                      <select
                        value={q.correctOption}
                        onChange={(e) => updateQuestion(index, 'correctOption', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      >
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <button
                type="button"
                onClick={addQuestion}
                className="w-full border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 font-semibold py-3 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                + Add Another Question
              </button>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Duration per Round (seconds)
                </label>
                <input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
              >
                {creating ? 'Creating...' : `Create Round (${questions.length} question${questions.length !== 1 ? 's' : ''})`}
              </button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
        {tab === 'manage' && (
          <div className="space-y-4">
            {rounds.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-slate-400">
                No rounds created yet
              </div>
            ) : (
              rounds.map((round) => (
                <div
                  key={round.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">
                        {round.firstQuestion}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        ID: {round.id.slice(0, 8)}... • {round.questionCount} question{round.questionCount !== 1 ? 's' : ''} • Duration: {round.durationMs / 1000}s
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        round.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                          : round.status === 'OPEN'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-100'
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
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
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
