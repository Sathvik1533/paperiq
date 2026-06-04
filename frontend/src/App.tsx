import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Search } from './pages/Search'
import { Dashboard } from './pages/Dashboard'
import { Papers } from './pages/Papers'
import { Planner } from './pages/Planner'
import { Profile } from './pages/Profile'

function NavBar() {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return null

  const links = [
    { path: '/search', label: 'Search' },
    { path: '/papers', label: 'Papers' },
    { path: '/planner', label: 'Planner' },
    { path: '/profile', label: 'Profile' },
  ]

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-white font-bold text-lg">PaperIQ</span>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.path}
              href={l.path}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === l.path
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  const { init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="min-h-screen bg-gray-900">
      <NavBar />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute><Search /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/papers" element={
          <ProtectedRoute><Papers /></ProtectedRoute>
        } />
        <Route path="/planner" element={
          <ProtectedRoute><Planner /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}
