import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Companion } from '../Companion'

vi.mock('../../lib/api', () => ({
  getCompanionConversations: vi.fn().mockResolvedValue([
    {
      id: 'conv-123',
      title: 'OS Process Scheduling',
      subject_code: 'A6CS09',
      regulation: 'R22',
      message_count: 2,
      last_message_preview: 'Banker algorithm trace',
      created_at: '2026-11-14T10:00:00Z',
      updated_at: '2026-11-14T10:05:00Z',
    },
  ]),
  getCompanionConversation: vi.fn().mockResolvedValue({
    id: 'conv-123',
    user_id: 'alice',
    title: 'OS Process Scheduling',
    subject_code: 'A6CS09',
    regulation: 'R22',
    created_at: '2026-11-14T10:00:00Z',
    updated_at: '2026-11-14T10:05:00Z',
    messages: [
      {
        id: 'msg-1',
        conversation_id: 'conv-123',
        role: 'student',
        content: 'Explain Deadlock',
        citations: [],
        suggested_actions: [],
        created_at: '2026-11-14T10:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-123',
        role: 'assistant',
        content: '### Deadlock Avoidance\n- Key Invariant',
        intent: 'academic_tutor',
        specialist: 'academic_tutor',
        citations: [],
        suggested_actions: [],
        created_at: '2026-11-14T10:01:00Z',
      },
    ],
  }),
  sendCompanionMessage: vi.fn().mockResolvedValue({
    conversation_id: 'conv-123',
    message: {
      id: 'msg-2',
      conversation_id: 'conv-123',
      role: 'assistant',
      content: '### Deadlock Avoidance\n- Key Invariant',
      intent: 'academic_tutor',
      specialist: 'academic_tutor',
      citations: [],
      suggested_actions: [],
      created_at: '2026-11-14T10:01:00Z',
    },
    specialist_badge: 'AI Academic Tutor',
    specialist_description: 'Exam-grade walkthroughs',
    suggested_actions: [],
  }),
  deleteCompanionConversation: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock NavBar to isolate Companion page
vi.mock('../../components/NavBar', () => ({
  NavBar: () => <nav data-testid="mock-navbar">NavBar</nav>,
}))

function renderCompanion() {
  return render(
    <MemoryRouter>
      <Companion />
    </MemoryRouter>
  )
}

describe('Companion Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header bar and active subject indicator', async () => {
    renderCompanion()
    expect(screen.getByText('PaperIQ AI Companion')).toBeInTheDocument()
    expect(screen.getByText('R22 Autonomous')).toBeInTheDocument()
    expect(screen.getByText('Target Course (R22)')).toBeInTheDocument()
  })

  it('renders starter prompt cards in empty conversation state', async () => {
    renderCompanion()
    expect(screen.getByText('How can I assist your exam preparation?')).toBeInTheDocument()
    expect(screen.getByText('Explain Banker’s Algorithm')).toBeInTheDocument()
    expect(screen.getByText('7-Day Study Masterplan')).toBeInTheDocument()
    expect(screen.getByText('Unit 3 Syllabus Deep Dive')).toBeInTheDocument()
  })

  it('loads and displays recent sessions in sidebar', async () => {
    renderCompanion()
    await waitFor(() => {
      expect(screen.getByText('OS Process Scheduling')).toBeInTheDocument()
    })
  })
})
