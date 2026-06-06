/**
 * ErrorBoundary — catches any unhandled React render errors and shows Screen 22 (ErrorPage).
 * Used at the app root in App.tsx.
 */
import React from 'react'
import { ErrorPage } from '../pages/ErrorPage'

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected error occurred.' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; in production wire this to an error reporting service
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage message={this.state.message} />
    }
    return this.props.children
  }
}
