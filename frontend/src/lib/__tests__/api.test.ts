import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

import { getStats, submitFeedback, getSubjectsByFilter, getQuestionsBatch } from '../../lib/api'

describe('API functions', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('getStats', () => {
    it('returns paper/question/subject counts', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { papers: 72, questions: 5730, subjects: 10 } }),
      } as Response)

      const result = await getStats()
      expect(result).toEqual({ papers: 72, questions: 5730, subjects: 10 })
    })

    it('throws on non-ok response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response)

      await expect(getStats()).rejects.toThrow('API 500')
    })
  })

  describe('submitFeedback', () => {
    it('sends feedback with correct body', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      await submitFeedback({ page: 'dashboard', rating: 3, hours_saved: '1-2 hours' })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/feedback'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ page: 'dashboard', rating: 3, hours_saved: '1-2 hours' }),
        })
      )
    })
  })

  describe('getSubjectsByFilter', () => {
    it('fetches subjects with semester and regulation params', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [{ id: '1', name: 'DSA' }] }),
      } as Response)

      const result = await getSubjectsByFilter(3, 'R22')
      expect(result).toEqual([{ id: '1', name: 'DSA' }])
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subjects/filter?semester=3&regulation=R22'),
        expect.anything()
      )
    })
  })

  describe('getQuestionsBatch', () => {
    it('sends paper_ids in request body', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [{ id: 'q1' }] }),
      } as Response)

      const result = await getQuestionsBatch(['paper1', 'paper2'])
      expect(result).toEqual([{ id: 'q1' }])
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/questions/batch'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ paper_ids: ['paper1', 'paper2'] }),
        })
      )
    })
  })
})
