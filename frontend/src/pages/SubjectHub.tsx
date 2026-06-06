import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getUserProfile, getSubjectsForSemester } from '../lib/api'
import type { Subject } from '../types'

/**
 * Subject Hub — Screen 07 from stitch-screens.md
 * Route: /dashboard
 * Goal: Show user's subjects, let them pick one to analyze
 * This is the default landing after onboarding
 */
export function SubjectHub() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    
    // Load user profile + subjects
    getUserProfile(user.id)
      .then(async (prof) => {
        setProfile(prof)
        
        if (prof?.current_semester && prof?.regulation) {
          // Load subjects for this semester + regulation
          const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)
          setSubjects(subs)
        }
        
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <div className="text-gray-400">Loading your subjects...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md">
          <h2 className="font-heading text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            {error || 'Please complete onboarding first.'}
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] rounded-xl font-semibold transition-colors"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07070d]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Paper<span className="text-[#f97316]">IQ</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Profile
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Settings
            </button>
            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h2 className="font-heading text-4xl font-bold mb-2">
            Your Subjects
          </h2>
          <p className="text-gray-400 text-lg">
            {profile.regulation} · Semester {profile.current_semester}
          </p>
        </div>

        {/* Subjects Grid */}
        {subjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="glass-card rounded-2xl p-6 space-y-4 hover:border-[#f97316] transition-all group cursor-pointer"
                onClick={() => navigate(`/analysis?subject_id=${subject.id}`)}
              >
                {/* Subject Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>menu_book</span>
                </div>
                
                {/* Subject Info */}
                <div>
                  <h3 className="font-heading text-xl font-semibold mb-1 group-hover:text-[#f97316] transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{subject.code}</p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Semester {subject.semester}</span>
                  {subject.regulation && <span>·</span>}
                  {subject.regulation && <span>{subject.regulation}</span>}
                </div>

                {/* CTA */}
                <button className="w-full px-4 py-2 bg-white/5 hover:bg-[#f97316] rounded-lg text-sm font-semibold transition-colors group-hover:bg-[#f97316]">
                  Analyze →
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-card rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[40px]" style={{fontVariationSettings:"'FILL' 1"}}>menu_book</span>
            </div>
            <h3 className="font-heading text-2xl font-semibold mb-2">No Subjects Found</h3>
            <p className="text-gray-400 mb-6">
              No subjects available for {profile.regulation} Semester {profile.current_semester}.
              This might be because the data hasn't been loaded yet.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl font-semibold transition-colors"
              >
                Update Profile
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] rounded-xl font-semibold transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>info</span>
            Analysis uses 10 years of exam papers from MLRIT
          </p>
        </div>
      </div>
    </div>
  )
}
