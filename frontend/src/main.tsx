import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App'
import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: import.meta.env.PROD ? 0.0 : 0.1,
  replaysOnErrorSampleRate: 1.0,
})

function FallbackError({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6 text-center">
      <span className="material-symbols-outlined text-red-500 text-6xl mb-4">error</span>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-neutral-400 mb-6 max-w-md">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-[#ff6600] text-white rounded-lg font-medium hover:bg-[#ff6600]/80 transition-colors"
      >
        Reload Application
      </button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={FallbackError} onReset={() => window.location.href = '/'}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
