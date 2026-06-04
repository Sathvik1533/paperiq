import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Search } from './pages/Search'
import { Dashboard } from './pages/Dashboard'
import { Papers } from './pages/Papers'
import { Planner } from './pages/Planner'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { SyllabusUpload } from './pages/SyllabusUpload'
import { getUserProfile } from './lib/api'

function NavBar() {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return null

  const links = [
    { path: '/search', label: 'Analyze' },
    { path: '/papers', label: 'Papers' },
    { path: '/planner', label: 'Planner' },
    { path: '/syllabus', label: 'Syllabus' },
    { path: '/profile', label: 'Profile' },
    { path: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <a href="/search" className="text-white font-bold text-lg tracking-tight">
          Paper<span className="text-blue-400">IQ</span>
        </a>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.path}
              href={l.path}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname.startsWith(l.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

// B8 fix: checks onboarding_complete and redirects new users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) { setChecking(false); return }
    if (location.pathname === '/onboarding') { setChecking(false); return }

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/papers" element={<ProtectedRoute><Papers /></ProtectedRoute>} />
        <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
        <Route path="/syllabus" element={<ProtectedRoute><SyllabusUpload /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
