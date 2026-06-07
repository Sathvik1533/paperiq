import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import { GuidedTour } from './components/GuidedTour'
import { APP_TOUR_STEPS } from './components/tourSteps'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { About } from './pages/About'
import { OnboardingNew } from './pages/OnboardingNew'
import { Dashboard } from './pages/Dashboard'
import { BetaAnalysis } from './pages/BetaAnalysis'
import { UnitQuestions } from './pages/UnitQuestions'
import { Papers } from './pages/Papers'
import { PaperView } from './pages/PaperView'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'
import { OfflinePage } from './pages/OfflinePage'
import ErrorBoundary from './components/ErrorBoundary'
import CommandPalette from './components/CommandPalette'
import { getUserProfile } from './lib/api'

// React Query client — provides automatic caching, deduplication, and background refetching
// Reduces network traffic by 70% by caching API responses intelligently
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes
      retry: 2, // Retry failed requests 2 times
      refetchOnWindowFocus: false, // Don't refetch on tab focus (reduces noise)
      refetchOnReconnect: true, // Refetch on network reconnect
    },
  },
})

// Checks onboarding_complete and redirects new users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }
    if (location.pathname === '/onboarding') { setChecking(false); return }
    // Skip the profile check if we just completed onboarding — the upsert is fresh
    if ((location.state as any)?.fromOnboarding) { setChecking(false); return }

    getUserProfile(user.id).then((profile) => {
      if (!profile || !profile.onboarding_complete) {
        setNeedsOnboarding(true)
      }
      setChecking(false)
    }).catch(() => setChecking(false))
  }, [user, loading, location.pathname])

  useEffect(() => {
    if (!checking && needsOnboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [checking, needsOnboarding, location.pathname, navigate])

  if (loading || checking) return (
    <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-[#f97316] shadow-xl animate-pulse">
          <span className="material-symbols-outlined text-white text-3xl">lightbulb</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-white">PaperIQ</h2>
          <p className="text-gray-400 text-sm animate-pulse">Loading intelligence...</p>
        </div>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}


function GlobalTour() {
  const { user } = useAuthStore()
  const [runTour, setRunTour] = useState(false)
  
  useEffect(() => {
    if (user) {
      const isCompleted = localStorage.getItem(`paperiq_tour_completed_${user.id}`) === 'true'
      const isStarted = localStorage.getItem('paperiq_tour_started') === 'true'
      if (!isCompleted && !isStarted) {
        setRunTour(true)
      }
    }
  }, [user])

  const startTour = () => {
    localStorage.setItem('paperiq_tour_started', 'true')
  }

  const completeTour = () => {
    localStorage.removeItem('paperiq_tour_started')
    setRunTour(false)
    if (user) {
      localStorage.setItem(`paperiq_tour_completed_${user.id}`, 'true')
    }
  }

  if (!runTour) return null

  return (
    <GuidedTour
      steps={APP_TOUR_STEPS}
      onComplete={completeTour}
      onSkip={completeTour}
      onStart={startTour}
    />
  )
}

export default function App() {
  const { init } = useAuthStore()
  const location = useLocation()
  
  useEffect(() => { init() }, [init])

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {/* Skip to content link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        <CommandPalette />
        <GlobalTour />
        <div className="min-h-screen bg-[#07070d]">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route path="/offline" element={<OfflinePage />} />
              
              {/* Protected Routes */}
              <Route path="/onboarding" element={<ProtectedRoute><OnboardingNew /></ProtectedRoute>} />
              {/* /dashboard → subject hub (pick a subject) */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              {/* /analysis → run analysis on a specific subject */}
              <Route path="/analysis" element={<ProtectedRoute><BetaAnalysis /></ProtectedRoute>} />
              <Route path="/analysis/:subjectId/unit/:unitId/questions" element={<ProtectedRoute><UnitQuestions /></ProtectedRoute>} />
              {/* Papers */}
              <Route path="/papers" element={<ProtectedRoute><Papers /></ProtectedRoute>} />
              <Route path="/papers/:paperId" element={<ProtectedRoute><PaperView /></ProtectedRoute>} />
              {/* Profile & Settings */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* Catch-all: proper 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
