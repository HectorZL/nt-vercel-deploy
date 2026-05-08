import { isOption, computeRoundState } from '@/server/quiz-utils'

// Standalone unit tests that don't require Prisma connection
describe('quiz utilities (unit tests)', () => {
  describe('isOption', () => {
    it('should return true for valid options A, B, C, D', () => {
      expect(isOption('A')).toBe(true)
      expect(isOption('B')).toBe(true)
      expect(isOption('C')).toBe(true)
      expect(isOption('D')).toBe(true)
    })

    it('should return false for invalid string options', () => {
      expect(isOption('E')).toBe(false)
      expect(isOption('a')).toBe(false)
      expect(isOption('1')).toBe(false)
      expect(isOption('')).toBe(false)
    })

    it('should return false for non-string types', () => {
      expect(isOption(null)).toBe(false)
      expect(isOption(undefined)).toBe(false)
      expect(isOption(1)).toBe(false)
      expect(isOption({})).toBe(false)
      expect(isOption([])).toBe(false)
    })
  })

  describe('computeRoundState', () => {
    it('should mark round as open when within open/close window', () => {
      const now = new Date()
      const openedAt = new Date(now.getTime() - 5000)
      const closesAt = new Date(now.getTime() + 5000)

      const state = computeRoundState({
        status: 'OPEN',
        openedAt,
        closesAt,
        closedAt: null,
      })

      expect(state.isOpen).toBe(true)
      expect(state.isExpired).toBe(false)
    })

    it('should mark round as expired when past closesAt', () => {
      const now = new Date()
      const openedAt = new Date(now.getTime() - 20000)
      const closesAt = new Date(now.getTime() - 5000)

      const state = computeRoundState({
        status: 'OPEN',
        openedAt,
        closesAt,
        closedAt: null,
      })

      expect(state.isOpen).toBe(false)
      expect(state.isExpired).toBe(true)
    })

    it('should mark round as closed regardless of time when status is not OPEN', () => {
      const now = new Date()
      const openedAt = new Date(now.getTime() - 5000)
      const closesAt = new Date(now.getTime() + 5000)

      const state = computeRoundState({
        status: 'CLOSED' as any,
        openedAt,
        closesAt,
        closedAt: now,
      })

      expect(state.isOpen).toBe(false)
      expect(state.isExpired).toBe(false)
    })

    it('should handle null dates (DRAFT status)', () => {
      const state = computeRoundState({
        status: 'DRAFT' as any,
        openedAt: null,
        closesAt: null,
        closedAt: null,
      })

      expect(state.isOpen).toBe(false)
      expect(state.isExpired).toBe(false)
    })

    it('should return correct server timestamps', () => {
      const now = new Date()
      const openedAt = new Date(now.getTime() - 10000)
      const closesAt = new Date(now.getTime() + 10000)

      const state = computeRoundState({
        status: 'OPEN',
        openedAt,
        closesAt,
        closedAt: null,
      })

      expect(state.openedAtMs).toBe(openedAt.getTime())
      expect(state.closesAtMs).toBe(closesAt.getTime())
      expect(typeof state.serverNowMs).toBe('number')
      expect(state.serverNowMs).toBeGreaterThan(0)
    })
  })
})
