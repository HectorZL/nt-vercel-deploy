'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface RoundState {
  isOpen: boolean
  isExpired: boolean
  serverNowMs: number
  openedAtMs: number | null
  closesAtMs: number | null
}

interface Round {
  id: string
  status: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  durationMs: number
  openedAt: string | null
  closesAt: string | null
  closedAt: string | null
  state: RoundState
}

interface Results {
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
  }>
}

type Screen = 'join' | 'waiting' | 'question' | 'results'

export default function PlayPage() {
  const [participantId, setParticipantId] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [screen, setScreen] = useState<Screen>('join')
  const [round, setRound] = useState<Round | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const name = participantName.trim()
    if (!name) {
      setError('Name required')
      return
    }

    try {
      const res = await fetch('/api/demo/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        setError('Failed to join')
        return
      }

      const data = await res.json()
      setParticipantId(data.participant.id)
      setScreen('waiting')
    } catch (err) {
      setError(String(err))
    }
  }

  // Poll for round and results
  useEffect(() => {
    if (!participantId) return

    const pollRound = async () => {
      try {
        const res = await fetch('/api/demo/round/current')
        if (!res.ok) return

        const data = await res.json()
        setRound(data.round)

        if (!data.round) {
          setScreen('waiting')
          return
        }

        if (data.round.status === 'CLOSED') {
          setScreen('results')
          // Also fetch results
          const resRes = await fetch(
            `/api/demo/round/results?roundId=${data.round.id}`
          )
          if (resRes.ok) {
            const resData = await resRes.json()
            setResults(resData.results)
          }
        } else if (data.round.state.isOpen) {
          setScreen('question')
        } else {
          setScreen('waiting')
        }
      } catch (err) {
        console.error(err)
      }
    }

    pollRound()
    const interval = setInterval(pollRound, 500)
    return () => clearInterval(interval)
  }, [participantId])

  // Countdown timer
  useEffect(() => {
    if (screen !== 'question' || !round?.state.closesAtMs) return

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = Math.max(0, round.state.closesAtMs! - now)
      setCountdown(Math.ceil(remaining / 1000))

      if (remaining <= 0) {
        setCountdown(0)
        if (countdownRef.current) clearInterval(countdownRef.current)
      }
    }

    updateCountdown()
    countdownRef.current = setInterval(updateCountdown, 250)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [screen, round?.state.closesAtMs])

  // Submit answer
  const handleSubmit = async () => {
    if (!selectedOption || !round) {
      setError('Select an option')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/demo/round/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          option: selectedOption,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to submit')
        setSubmitting(false)
        return
      }

      // Fetch results immediately
      const resRes = await fetch(
        `/api/demo/round/results?roundId=${round.id}`
      )
      if (resRes.ok) {
        const resData = await resRes.json()
        setResults(resData.results)
      }

      setScreen('results')
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Desafío Relámpago</h1>
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:underline"
          >
            Admin Panel
          </Link>
        </div>

        {/* Join Screen */}
        {screen === 'join' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome!</h2>
            <p className="text-gray-600 text-lg">
              Enter your name to join the quiz
            </p>

            <form onSubmit={handleJoin} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Your name"
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                autoFocus
              />

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition text-lg"
              >
                Join Quiz
              </button>
            </form>
          </div>
        )}

        {/* Waiting Screen */}
        {screen === 'waiting' && participantId && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {participantName}!
            </h2>
            <p className="text-gray-600 text-lg">
              Waiting for the quiz to start...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}

        {/* Question Screen */}
        {screen === 'question' && round && (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
            {/* Countdown */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800">
                {round.question}
              </h2>
              <div
                className={`text-4xl font-bold font-mono ${
                  countdown <= 5 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {countdown}s
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const label =
                  {
                    A: round.optionA,
                    B: round.optionB,
                    C: round.optionC,
                    D: round.optionD,
                  }[opt] || ''

                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    disabled={submitting}
                    className={`w-full p-4 border-2 rounded-lg text-lg font-semibold transition ${
                      selectedOption === opt
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="font-bold">{opt}:</span> {label}
                  </button>
                )
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg text-lg transition"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        )}

        {/* Results Screen */}
        {screen === 'results' && round && results && (
          <div className="space-y-8">
            {/* Your Answer */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Answer
              </h2>
              <p className="text-gray-600 mb-4">{round.question}</p>
              <p className="text-lg font-semibold text-gray-800">
                <span className="bg-blue-100 px-4 py-2 rounded-lg">
                  {selectedOption}
                </span>
              </p>
              {results.correctOption && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    selectedOption === results.correctOption
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <p className="font-bold">
                    {selectedOption === results.correctOption ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  {results.correctOption !== selectedOption && (
                    <p>Correct answer: {results.correctOption}</p>
                  )}
                </div>
              )}
            </div>

            {/* Distribution */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Response Distribution
              </h2>
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt}>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-gray-800">
                        {opt}: {results.counts[opt]}
                      </span>
                      <span className="text-gray-600">{results.percents[opt]}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{
                          width: results.total
                            ? `${(results.counts[opt] / results.total) * 100}%`
                            : '0%',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Leaderboard
              </h2>
              <div className="space-y-2">
                {results.top.slice(0, 5).map((resp, idx) => (
                  <div
                    key={resp.participantId}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-lg font-bold text-gray-800">
                      #{idx + 1} {resp.name}
                    </span>
                    <span className="text-gray-600">
                      {resp.latencyMs}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
