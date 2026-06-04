import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { getUserProfile, upsertUserProfile } from '../lib/api'

const REGULATIONS = ['R18', 'R22', 'R24']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML']

export function Profile() {
  const { user, signOut } = useAuthStore()
  const { setRegulation } = useAnalysisStore()
  const [profile, setProfile] = useState<Record<string, any>>({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    // B4 fix: getUserProfile uses `id` column
    getUserProfile(user.id).then(p => { if (p) setProfile(p) }).catch(() => {})
  }, [user])

  function set(key: string, value: unknown) { setProfile(p => ({ ...p, [key]: value })) }

  async function handleSave() {
    if (!user) return
    setSaving(true); setError('')
    try {
      // B4 fix: upsertUserProfile uses `id` as PK
      await upsertUserProfile(user.id, profile)
      if (profile.regulation) setRegulation(profile.regulation)
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'
  const valueCls = 'text-white text-sm'

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-white">Profile</h1>

        {user && (
          <div className="bg-gray-800 rounded-xl p-5 flex items-center gap-4">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
            )}
            <div>
              <div className="text-white font-semibold">{user.user_metadata?.full_name ?? 'User'}</div>
              <div className="text-gray-400 text-sm">{user.email}</div>
            </div>
            <button onClick={signOut} className="ml-auto text-red-400 text-sm hover:text-red-300 transition-colors">
              Sign Out
            </button>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Academic & Learning Profile</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setError('') }}
                  className="bg-gray-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {saved && <p className="text-green-400 text-sm mb-4">Profile saved.</p>}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'regulation', label: 'Regulation', type: 'select', options: REGULATIONS },
              { key: 'current_year', label: 'Year', type: 'select', options: [1,2,3,4].map(y => ({ label: `Year ${y}`, value: y })) },
              { key: 'current_semester', label: 'Semester', type: 'select', options: [1,2,3,4,5,6,7,8].map(s => ({ label: `Sem ${s}`, value: s })) },
              { key: 'preparation_level', label: 'Level', type: 'select', options: ['beginner','intermediate','advanced'] },
              { key: 'target_cgpa', label: 'Target CGPA', type: 'number', min: 0, max: 10, step: 0.1 },
              { key: 'target_marks', label: 'Target Marks %', type: 'number', min: 0, max: 100 },
              { key: 'hours_per_day', label: 'Hours / Day', type: 'number', min: 1, max: 12 },
            ].map(field => (
              <div key={field.key}>
                <label className={labelCls}>{field.label}</label>
                {editing ? (
                  field.type === 'select' ? (
                    <select className={inputCls} value={profile[field.key] ?? ''}
                      onChange={e => set(field.key, e.target.value)}>
                      {(field.options as any[]).map(o => {
                        const val = typeof o === 'object' ? o.value : o
                        const label = typeof o === 'object' ? o.label : o
                        return <option key={val} value={val}>{label}</option>
                      })}
                    </select>
                  ) : (
                    <input type="number" className={inputCls}
                      min={(field as any).min} max={(field as any).max} step={(field as any).step ?? 1}
                      value={profile[field.key] ?? ''}
                      onChange={e => set(field.key, Number(e.target.value))} />
                  )
                ) : (
                  <p className={valueCls}>{profile[field.key] ?? '—'}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
