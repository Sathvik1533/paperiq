import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { getColleges, getSubjects } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { College, Subject } from '../types'

const REGULATIONS = ['R18', 'R22', 'R24']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML']
const YEARS = [1, 2, 3, 4]
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

export function Onboarding() {
  const { user } = useAuthStore()
  const { setRegulation } = useAnalysisStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [colleges, setColleges] = useState<College[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    college_id: '',
    branch: '',
    regulation: 'R22',
    current_year: '2',
    semester: '3',
    target_cgpa: '7.5',
    target_marks: '70',
    hours_per_day: '4',
    preparation_level: 'intermediate',
    subject_id: '',
  })

  useEffect(() => {
    getColleges().then(setColleges).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.college_id) {
      getSubjects(Number(form.college_id)).then(setSubjects).catch(() => {})
    }
  }, [form.college_id])

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!user) return
    setSaving(true)
    try {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        college_id: form.college_id ? Number(form.college_id) : null,
        branch: form.branch,
        regulation: form.regulation,
        current_year: Number(form.current_year),
        semester: Number(form.semester),
        target_cgpa: Number(form.target_cgpa),
        target_marks: Number(form.target_marks),
        hours_per_day: Number(form.hours_per_day),
        preparation_level: form.preparation_level,
        subject_id: form.subject_id ? Number(form.subject_id) : null,
      })
      setRegulation(form.regulation)
      navigate('/search')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg shadow-xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-8 ${s < step ? 'bg-green-600' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>
          <h2 className="text-white text-xl font-bold">
            {step === 1 && 'Academic Profile'}
            {step === 2 && 'Learning Profile'}
            {step === 3 && 'Subject Setup'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>College</label>
              <select className={inputCls} value={form.college_id} onChange={(e) => setField('college_id', e.target.value)}>
                <option value="">Select college</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <select className={inputCls} value={form.branch} onChange={(e) => setField('branch', e.target.value)}>
                <option value="">Select branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Regulation</label>
              <select className={inputCls} value={form.regulation} onChange={(e) => setField('regulation', e.target.value)}>
                {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Current Year</label>
                <select className={inputCls} value={form.current_year} onChange={(e) => setField('current_year', e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <select className={inputCls} value={form.semester} onChange={(e) => setField('semester', e.target.value)}>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Target CGPA (0–10)</label>
              <input
                type="number" min="0" max="10" step="0.1"
                className={inputCls} value={form.target_cgpa}
                onChange={(e) => setField('target_cgpa', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Target Marks (0–100)</label>
              <input
                type="number" min="0" max="100"
                className={inputCls} value={form.target_marks}
                onChange={(e) => setField('target_marks', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Study Hours per Day (1–12)</label>
              <input
                type="number" min="1" max="12"
                className={inputCls} value={form.hours_per_day}
                onChange={(e) => setField('hours_per_day', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Preparation Level</label>
              <select className={inputCls} value={form.preparation_level} onChange={(e) => setField('preparation_level', e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={form.subject_id} onChange={(e) => setField('subject_id', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
              {subjects.length === 0 && form.college_id && (
                <p className="text-gray-500 text-xs mt-1">No subjects found for this college.</p>
              )}
              {!form.college_id && (
                <p className="text-gray-500 text-xs mt-1">Select a college in step 1 to load subjects.</p>
              )}
            </div>
            <p className="text-gray-400 text-sm">You can change your subject anytime from the search page.</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Get Started'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
