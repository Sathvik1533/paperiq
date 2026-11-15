import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}))

import {
  getStats,
  submitFeedback,
  getSubjectsByFilter,
  getQuestionsBatch,
  sendCompanionMessage,
  getCompanionConversations,
  getCompanionConversation,
  deleteCompanionConversation,
  getCompanionSpecialists,
} from '../../lib/api'

describe('API functions', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear()
    }
    originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn() as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('getStats', () => {
    it('returns live database stats when backend succeeds with is_live=true', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { papers: 123, questions: 980, subjects: 11, is_live: true },
        }),
      } as Response)

      const result = await getStats()
      expect(result).toEqual({
        papers: 123,
        questions: 980,
        subjects: 11,
        is_live: true,
        is_demo: false,
        label: 'Live',
      })
    })

    it('handles backend HTTP 500 failure without returning fabricated live numbers', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response)

      const result = await getStats()
      expect(result.is_live).toBe(false)
      expect(result.papers).toBeNull()
      expect(result.questions).toBeNull()
      expect(result.subjects).toBeNull()
    })

    it('handles network timeout without crashing', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

      const result = await getStats()
      expect(result.is_live).toBe(false)
      expect(result.papers).toBeNull()
      expect(result.label).toBe('Unavailable')
    })

    it('handles invalid malformed JSON payload gracefully', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Unexpected token in JSON') },
      } as unknown as Response)

      const result = await getStats()
      expect(result.is_live).toBe(false)
      expect(result.papers).toBeNull()
    })

    it('retrieves verified cached snapshot from localStorage on backend failure', async () => {
      const mockCached = {
        papers: 123,
        questions: 980,
        subjects: 11,
        is_live: true,
        label: 'Live',
      }
      localStorage.setItem('paperiq_verified_stats', JSON.stringify(mockCached))

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      } as Response)

      const result = await getStats()
      expect(result.papers).toBe(123)
      expect(result.questions).toBe(980)
      expect(result.subjects).toBe(11)
      expect(result.is_live).toBe(false)
      expect(result.label).toBe('Verified Cache')

      localStorage.removeItem('paperiq_verified_stats')
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
      const mockSubject = {
        id: 'A6CS15',
        code: 'A6CS15',
        name: 'Design and Analysis of Algorithms',
        short: 'DAA',
        semester: 1,
        year: 3,
        regulation: 'R22',
        branch: 'CSE',
        category: 'PCC',
      }
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [mockSubject] }),
      } as Response)

      const result = await getSubjectsByFilter(1, 'R22')
      expect(result).toEqual([mockSubject])
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/subjects/filter?semester=1&regulation=R22'),
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

  describe('Companion API', () => {
    it('sends a chat message to the companion endpoint', async () => {
      const mockResponse = {
        message_id: 'msg-1',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'B-Trees are balanced search trees.',
        intent: 'academic_tutor',
        specialist: {
          id: 'academic_tutor',
          name: 'Academic Tutor',
          description: 'Explains complex topics',
          badge: 'Academic Tutor',
          color: 'blue',
        },
        confidence: 0.95,
        citations: [{ title: 'DBMS Unit 3', source_type: 'syllabus' }],
        action_pills: [{ label: 'Explain B+ Trees', action_type: 'prompt', payload: 'Explain B+ Trees' }],
        created_at: '2026-11-14T12:00:00Z',
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await sendCompanionMessage({
        message: 'Explain B-Trees',
        subject_code: 'CS301',
      })

      expect(result).toEqual(mockResponse)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/companion/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ message: 'Explain B-Trees', subject_code: 'CS301' }),
        })
      )
    })

    it('fetches companion conversations list', async () => {
      const mockConvs = [
        {
          id: 'conv-1',
          title: 'DBMS Indexing Discussion',
          subject_id: 'sub-1',
          created_at: '2026-11-14T10:00:00Z',
          updated_at: '2026-11-14T10:05:00Z',
          message_count: 4,
          last_message_preview: 'B-Trees ensure log n lookup',
        },
      ]

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockConvs,
      } as Response)

      const result = await getCompanionConversations()
      expect(result).toEqual(mockConvs)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/companion/conversations'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('deletes a companion conversation', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const result = await deleteCompanionConversation('conv-1')
      expect(result).toEqual({ success: true })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/companion/conversations/conv-1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('fetches companion specialists list', async () => {
      const mockSpecialists = [
        { id: 'academic_tutor', name: 'Academic Tutor', description: 'Tutor', badge: 'Tutor', color: 'blue' },
      ]

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockSpecialists,
      } as Response)

      const result = await getCompanionSpecialists()
      expect(result).toEqual(mockSpecialists)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/companion/specialists'),
        expect.anything()
      )
    })
  })
})
