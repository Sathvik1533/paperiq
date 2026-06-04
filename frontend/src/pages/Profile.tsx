import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types'

const REGULATIONS = ['R18', 'R22', 'R24']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML']

export function Profile() {
  const { user, signOut } = useAuthStore()
  const { setRegulation } = useAnalysisStore()
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  function setField(key: string, value: string | number) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('user_profiles').upsert({ ...profile, user_id: user.id })
      if (profile.regulation) setRegulation(profile.regulation)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'
  const valueCls = 'text-white text-sm'

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <button
            onClick={signOut}
            className="text-red-400 text-sm hover:text-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {user && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
              )}
              <div>
                <div className="text-white font-semibold">{user.user_metadata?.full_name ?? 'User'}</div>
                <div className="text-gray-400 text-sm">{user.email}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Academic & Learning Profile</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {saved && <p className="text-green-400 text-sm mb-4">Profile saved successfully.</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Branch</label>
              {editing ? (
                <select className={inputCls} value={profile.branch ?? ''} onChange={(e) => setField('branch', e.target.value)}>
                  <option value="">Select</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <p className={valueCls}>{profile.branch ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Regulation</label>
              {editing ? (
                <select className={inputCls} value={profile.regulation ?? 'R22'} onChange={(e) => setField('regulation', e.target.value)}>
                  {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <p className={valueCls}>{profile.regulation ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Current Year</label>
              {editing ? (
                <select className={inputCls} value={profile.current_year ?? ''} onChange={(e) => setField('current_year', Number(e.target.value))}>
                  {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              ) : (
                <p className={valueCls}>Year {profile.current_year ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Semester</label>
              {editing ? (
                <select className={inputCls} value={profile.semester ?? ''} onChange={(e) => setField('semester', Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              ) : (
                <p className={valueCls}>Sem {profile.semester ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Target CGPA</label>
              {editing ? (
                <input type="number" min="0" max="10" step="0.1" className={inputCls}
                  value={profile.target_cgpa ?? ''} onChange={(e) => setField('target_cgpa', Number(e.target.value))} />
              ) : (
                <p className={valueCls}>{profile.target_cgpa ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Target Marks</label>
              {editing ? (
                <input type="number" min="0" max="100" className={inputCls}
                  value={profile.target_marks ?? ''} onChange={(e) => setField('target_marks', Number(e.target.value))} />
              ) : (
                <p className={valueCls}>{profile.target_marks ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Hours / Day</label>
              {editing ? (
                <input type="number" min="1" max="12" className={inputCls}
                  value={profile.hours_per_day ?? ''} onChange={(e) => setField('hours_per_day', Number(e.target.value))} />
              ) : (
                <p className={valueCls}>{profile.hours_per_day ?? '—'}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Preparation Level</label>
              {editing ? (
                <select className={inputCls} value={profile.preparation_level ?? 'intermediate'} onChange={(e) => setField('preparation_level', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              ) : (
                <p className={valueCls}>{profile.preparation_level ?? '—'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
