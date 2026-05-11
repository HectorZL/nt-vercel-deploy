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

interface QuestionBrief {
  id: string
  question: string
  answered: boolean
}

interface CurrentQuestion {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  answered: boolean
}

interface RoundData {
  id: string
  status: string
  questionCount: number
  durationMs: number
  openedAt: string | null
  closesAt: string | null
  closedAt: string | null
  state: RoundState
}

interface CurrentResponse {
  round: RoundData | null
  currentQuestion: CurrentQuestion | null
  questions: QuestionBrief[]
}

interface QuestionResults {
  id: string
  question: string
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
  questions: QuestionResults[]
}

type Screen = 'join' | 'waiting' | 'question' | 'results'

export default function PlayPage() {
  const [participantId, setParticipantId] = useState('')
  const [participantName, setParticipantName] = useState('')
  const [screen, setScreen] = useState<Screen>('join')
  const [roundData, setRoundData] = useState<CurrentResponse | null>(null)
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set())
  const [viewingQuestionIndex, setViewingQuestionIndex] = useState(0)
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
        const res = await fetch(`/api/demo/round/current?participantId=${participantId}`)
        if (!res.ok) return

        const data: CurrentResponse = await res.json()
        setRoundData(data)

        if (!data.round) {
          setScreen('waiting')
          return
        }

        // Track which questions are answered
        const answered = new Set(data.questions.filter((q) => q.answered).map((q) => q.id))
        setAnsweredQuestionIds(answered)

        if (data.round.status === 'CLOSED') {
          // Fetch results
          const resRes = await fetch(
            `/api/demo/round/results?roundId=${data.round.id}`
          )
          if (resRes.ok) {
            const resData: ResultsData = await resRes.json()
            setResultsData(resData)
          }
          setScreen('results')
        } else if (data.round.state.isOpen) {
          setScreen('question')
          // Set the viewing question to the current (first unanswered)
          if (data.currentQuestion) {
            const currentIdx = data.questions.findIndex((q) => q.id === data.currentQuestion!.id)
            if (currentIdx >= 0) {
              setViewingQuestionIndex(currentIdx)
            }
          }
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
    if (screen !== 'question' || !roundData?.round?.state.closesAtMs) return

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = Math.max(0, roundData.round!.state.closesAtMs! - now)
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
  }, [screen, roundData])

  // Get current viewing question details
  const viewingQuestion = roundData?.questions[viewingQuestionIndex]

  // Navigate questions
  const canGoPrev = viewingQuestionIndex > 0
  const canGoNext = viewingQuestionIndex < (roundData?.questions.length ?? 1) - 1

  const handlePrevQuestion = () => {
    if (canGoPrev) {
      setViewingQuestionIndex(viewingQuestionIndex - 1)
      setSelectedOption('')
      setError('')
    }
  }

  const handleNextQuestion = () => {
    if (canGoNext) {
      setViewingQuestionIndex(viewingQuestionIndex + 1)
      setSelectedOption('')
      setError('')
    }
  }

  // Submit answer
  const handleSubmit = async () => {
    if (!selectedOption || !roundData?.round || !viewingQuestion) {
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
          questionId: viewingQuestion.id,
          option: selectedOption,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to submit')
        setSubmitting(false)
        return
      }

      // Mark this question as answered
      setAnsweredQuestionIds((prev) => {
        const next = new Set(prev)
        next.add(viewingQuestion.id)
        return next
      })

      // Check if all questions are answered
      const allQuestions = roundData.questions
      const allAnswered = allQuestions.every(
        (q) => answeredQuestionIds.has(q.id) || q.id === viewingQuestion.id
      )

      if (allAnswered) {
        // Fetch results
        const resRes = await fetch(
          `/api/demo/round/results?roundId=${roundData.round.id}`
        )
        if (resRes.ok) {
          const resData: ResultsData = await resRes.json()
          setResultsData(resData)
        }
        setScreen('results')
      } else {
        // Move to next unanswered question
        const nextUnanswered = allQuestions.find(
          (q) => !answeredQuestionIds.has(q.id) && q.id !== viewingQuestion.id
        )
        if (nextUnanswered) {
          const nextIdx = allQuestions.findIndex((q) => q.id === nextUnanswered.id)
          setViewingQuestionIndex(nextIdx)
        }
        setSelectedOption('')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100">Desafío Relámpago</h1>
          <Link
            href="/admin"
            className="text-blue-600 dark:text-blue-400 hover:underline text-lg"
          >
            Admin Panel
          </Link>
        </div>

        {/* Join Screen */}
        {screen === 'join' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Welcome!</h2>
            <p className="text-gray-600 dark:text-slate-300 text-lg">
              Enter your name to join the quiz
            </p>

            <form onSubmit={handleJoin} className="space-y-4">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              Welcome, {participantName}!
            </h2>
            <p className="text-gray-600 dark:text-slate-300 text-lg">
              Waiting for the quiz to start...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}

        {/* Question Screen */}
        {screen === 'question' && roundData?.round && roundData.currentQuestion && viewingQuestion && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 dark:text-slate-300 mb-2">
                  <span>Question {viewingQuestionIndex + 1} of {roundData.questions.length}</span>
                  <span>
                    {answeredQuestionIds.size} answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width: `${((viewingQuestionIndex + 1) / roundData.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Question Navigation Dots */}
            <div className="flex justify-center gap-2">
              {roundData.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setViewingQuestionIndex(idx)
                    setSelectedOption('')
                    setError('')
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                    idx === viewingQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answeredQuestionIds.has(q.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-500'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Countdown */}
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100">
                {viewingQuestion.question}
              </h2>
              <div
                className={`text-4xl font-bold font-mono ${
                  countdown <= 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {countdown}s
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                // Only show full options for the current question
                const isCurrentQuestion = roundData.currentQuestion!.id === viewingQuestion.id
                const label = isCurrentQuestion
                  ? ({
                      A: roundData.currentQuestion!.optionA,
                      B: roundData.currentQuestion!.optionB,
                      C: roundData.currentQuestion!.optionC,
                      D: roundData.currentQuestion!.optionD,
                    }[opt] || '')
                  : ''

                const isAnswered = answeredQuestionIds.has(viewingQuestion.id)

                return (
                  <button
                    key={opt}
                    onClick={() => !isAnswered && setSelectedOption(opt)}
                    disabled={submitting || isAnswered}
                    className={`w-full p-4 border-2 rounded-lg text-lg font-semibold transition ${
                      selectedOption === opt
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:border-gray-400 dark:hover:border-slate-500'
                    } ${(submitting || isAnswered) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="font-bold">{opt}:</span> {isCurrentQuestion ? label : '(view only)'}
                  </button>
                )
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Navigation and Submit */}
            <div className="flex gap-4">
              <button
                onClick={handlePrevQuestion}
                disabled={!canGoPrev}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg text-lg transition"
              >
                ← Previous
              </button>

              {!answeredQuestionIds.has(viewingQuestion.id) ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOption || submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg text-lg transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-green-600 text-white font-bold py-4 rounded-lg text-lg opacity-75 cursor-not-allowed"
                >
                  ✓ Answered
                </button>
              )}

              <button
                onClick={handleNextQuestion}
                disabled={!canGoNext}
                className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg text-lg transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {screen === 'results' && roundData?.round && resultsData && (
          <div className="space-y-8">
            {resultsData.questions.map((qResult, qIdx) => {
              const results = qResult.results

              return (
                <div key={qResult.id} className="space-y-4">
                  {/* Question Result Header */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                      Question {qIdx + 1}: {qResult.question}
                    </h3>

                    {results.correctOption && (
                      <div className="mb-4">
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          Correct answer: {results.correctOption}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Distribution */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">
                      Response Distribution
                    </h4>
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt}>
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-gray-800 dark:text-slate-100">
                              {opt}: {results.counts[opt]}
                            </span>
                            <span className="text-gray-600 dark:text-slate-300">{results.percents[opt]}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                opt === results.correctOption ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{
                                width: results.total
                                  ? `${(results.counts[opt] / results.total) * 100}%`
                                  : '0%',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">
                      Leaderboard
                    </h4>
                    <div className="space-y-2">
                      {results.top.slice(0, 5).map((resp, idx) => (
                        <div
                          key={resp.participantId}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                          <span className="text-lg font-bold text-gray-800 dark:text-slate-100">
                            #{idx + 1} {resp.name}
                          </span>
                          <span className="text-gray-600 dark:text-slate-300">
                            {resp.latencyMs}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
