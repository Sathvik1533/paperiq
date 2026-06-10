import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from '../ErrorBoundary'

const originalError = console.error
beforeAll(() => { console.error = vi.fn() })
afterAll(() => { console.error = originalError })

function ThrowingComponent(): React.ReactElement {
  throw new Error('Test error')
}

function WorkingComponent() {
  return <div>Working</div>
}

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    renderWithRouter(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Working')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    renderWithRouter(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('renders retry button', () => {
    renderWithRouter(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
  })
})
