import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Companion } from '../Companion'

vi.mock('../../lib/api', () => ({
  getCompanionConversations: vi.fn().mockResolvedValue([
    {
      id: 'conv-123',
      title: 'DAA 0/1 Knapsack Branch & Bound',
      subject_code: 'A6CS15',
      regulation: 'R22',
      message_count: 2,
      last_message_preview: 'Branch and Bound state-space tree trace',
      created_at: '2026-11-14T10:00:00Z',
      updated_at: '2026-11-14T10:05:00Z',
    },
  ]),
  getCompanionConversation: vi.fn().mockResolvedValue({
    id: 'conv-123',
    user_id: 'alice',
    title: 'DAA 0/1 Knapsack Branch & Bound',
    subject_code: 'A6CS15',
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
    expect(screen.getByText('PaperIQ Study Assistant')).toBeInTheDocument()
    expect(screen.getByText('MLRIT R22')).toBeInTheDocument()
    expect(screen.getByText('Active Subject')).toBeInTheDocument()
  })

  it('renders starter prompt cards in empty conversation state', async () => {
    renderCompanion()
    expect(screen.getByText('What would you like help with today?')).toBeInTheDocument()
    expect(screen.getByText('0/1 Knapsack Problem (DAA)')).toBeInTheDocument()
    expect(screen.getByText('Distance Vector vs Link State (CN)')).toBeInTheDocument()
    expect(screen.getByText('CI/CD Pipeline Architecture (CD)')).toBeInTheDocument()
  })

  it('loads and displays recent sessions in sidebar', async () => {
    renderCompanion()
    await waitFor(() => {
      expect(screen.getByText('DAA 0/1 Knapsack Branch & Bound')).toBeInTheDocument()
    })
  })
})
