import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
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
import { getUserProfile } from './lib/api'

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
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  const { init } = useAuthStore()
  useEffect(() => { init() }, [init])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#07070d]">
        <Routes>
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
      </div>
    </ErrorBoundary>
  )
}
