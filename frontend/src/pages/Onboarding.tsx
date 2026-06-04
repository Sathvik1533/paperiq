import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { upsertUserProfile } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { College, Subject } from '../types'

const REGULATIONS = ['R18', 'R22', 'R24']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML']

export function Onboarding() {
  const { user } = useAuthStore()
  const { setRegulation } = useAnalysisStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [colleges, setColleges] = useState<College[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingColleges, setLoadingColleges] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    college_id: '', branch: '', regulation: 'R22',
    current_year: '2', current_semester: '3',
    target_cgpa: '7.5', target_marks: '70',
    hours_per_day: '4', preparation_level: 'intermediate',
  })

  // Load colleges directly from Supabase (public read — no backend dependency)
  useEffect(() => {
    supabase
      .from('colleges')
      .select('id, name, short_name')
      .eq('is_active', true)
      .then(({ data, error: err }) => {
        if (err) {
          setError(`Could not load colleges: ${err.message}`)
        } else {
          setColleges((data as College[]) ?? [])
        }
        setLoadingColleges(false)
      })
  }, [])

  useEffect(() => {
    if (!form.college_id) return
    supabase
      .from('subjects')
      .select('id, name, code, regulation')
      .eq('college_id', form.college_id)
      .then(({ data }) => setSubjects((data as Subject[]) ?? []))
  }, [form.college_id])

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit() {
    if (!user) {
      setError('Not logged in. Please sign in first.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await upsertUserProfile(user.id, {
        full_name: user.user_metadata?.full_name ?? user.email ?? '',
        college_id: form.college_id || undefined,
        regulation: form.regulation,
        current_year: Number(form.current_year),
        current_semester: Number(form.current_semester),
        target_cgpa: Number(form.target_cgpa),
        target_marks: Number(form.target_marks),
        hours_per_day: Number(form.hours_per_day),
        preparation_level: form.preparation_level,
        onboarding_complete: true,
      })
      setRegulation(form.regulation)
      navigate('/search', { replace: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      // Surface the actual Supabase error so we can debug
      setError(`Failed to save profile: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-xl">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step ? 'bg-blue-600 text-white'
                : s < step  ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400'
              }`}>{s < step ? '✓' : s}</div>
              {s < 2 && <div className={`h-0.5 w-12 ${s < step ? 'bg-green-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <h2 className="text-white text-xl font-bold mb-1">
          {step === 1 ? 'Academic Profile' : 'Learning Goals'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">Step {step} of 2 — takes 30 seconds</p>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>College</label>
              {loadingColleges ? (
                <div className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 border border-gray-600">
                  Loading colleges...
                </div>
              ) : colleges.length === 0 ? (
                <div className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm text-yellow-400 border border-yellow-700">
                  No colleges found — make sure the backend is running
                </div>
              ) : (
                <select className={inputCls} value={form.college_id} onChange={e => set('college_id', e.target.value)}>
                  <option value="">Select college</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Branch</label>
                <select className={inputCls} value={form.branch} onChange={e => set('branch', e.target.value)}>
                  <option value="">Select</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Regulation</label>
                <select className={inputCls} value={form.regulation} onChange={e => set('regulation', e.target.value)}>
                  {REGULATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Year</label>
                <select className={inputCls} value={form.current_year} onChange={e => set('current_year', e.target.value)}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <select className={inputCls} value={form.current_semester} onChange={e => set('current_semester', e.target.value)}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Target CGPA (0–10)</label>
                <input type="number" min="0" max="10" step="0.1" className={inputCls}
                  value={form.target_cgpa} onChange={e => set('target_cgpa', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Target Marks (%)</label>
                <input type="number" min="0" max="100" className={inputCls}
                  value={form.target_marks} onChange={e => set('target_marks', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Study Hours / Day</label>
                <input type="number" min="1" max="12" className={inputCls}
                  value={form.hours_per_day} onChange={e => set('hours_per_day', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Preparation Level</label>
                <select className={inputCls} value={form.preparation_level} onChange={e => set('preparation_level', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-600 transition-colors">
            Back
          </button>
          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Start Using PaperIQ'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
