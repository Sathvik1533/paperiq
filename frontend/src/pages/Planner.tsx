import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { generatePlan, calculateReadiness, generateMock, getSubjectsForSemester, getUserProfile } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { NavBar } from '../components/NavBar'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import { ReadinessGauge } from '../components/ui/ReadinessGauge'
import { Icon } from '../components/Icon'
import type { StudyPlan, ReadinessScore, MockExam, Subject } from '../types'

const PRIORITY_COLORS: Record<string, string> = {
  must_study: 'border-l-primary-container bg-primary-container/10',
  high: 'border-l-primary bg-primary/10',
  medium: 'border-l-yellow-500 bg-yellow-500/10',
  low: 'border-l-outline-variant bg-surface-container-high/40',
}
const PRIORITY_LABELS: Record<string, string> = {
  must_study: 'Must Study', high: 'High', medium: 'Medium', low: 'Low',
}
const PRIORITY_TAG: Record<string, string> = {
  must_study: 'bg-primary-container text-white font-bold',
  high: 'bg-primary text-on-primary font-bold',
  medium: 'bg-yellow-500 text-gray-900 font-bold',
  low: 'bg-surface-container-highest text-on-surface-variant',
}

export function Planner() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { currentReport, regulation } = useAnalysisStore()

  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    searchParams.get('subject_id') ?? currentReport?.subject_id ?? ''
  )
  const reportId = searchParams.get('report') ?? currentReport?.id ?? 'default-report'
  const subjectId = selectedSubjectId

  const [form, setForm] = useState({ exam_date: '', hours_per_day: '4', target_grade: 'B' })
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null)
  const [mock, setMock] = useState<MockExam | null>(null)
  const [loading, setLoading] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const [error, setError] = useState('')

  // Load available subjects if not already passed
  useEffect(() => {
    async function loadSubjects() {
      try {
        let sem = 1
        if (user?.id) {
          const profile = await getUserProfile(user.id)
          if (profile?.semester) sem = profile.semester
        }
        const subjects = await getSubjectsForSemester(sem, regulation || 'R22')
        setAvailableSubjects(subjects)
        if (!selectedSubjectId && subjects.length > 0) {
          setSelectedSubjectId(subjects[0].id)
        }
      } catch (err) {
        console.warn('Could not load subjects for planner:', err)
      }
    }
    loadSubjects()
  }, [user, regulation, selectedSubjectId])

  function setField(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleGeneratePlan() {
    if (!subjectId) { setError('Please select a subject to plan for.'); return }
    if (!form.exam_date) { setError('Please set an exam date.'); return }
    setError(''); setLoading(true)
    try {
      const result = await generatePlan(
        reportId || 'default-report', form.exam_date, Number(form.hours_per_day),
        form.target_grade, regulation || 'R22',
        undefined,
        subjectId,
      )
      setPlan(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReadiness() {
    if (!user || !subjectId) return
    setReadinessLoading(true)
    try {
      const r = await calculateReadiness(user.id, subjectId, regulation || 'R22', plan?.plan_id)
      setReadiness(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to calculate readiness.')
    } finally {
      setReadinessLoading(false)
    }
  }

  async function handleMock() {
    if (!subjectId) return
    setMockLoading(true)
    try {
      const m = await generateMock(reportId || 'default-report', regulation || 'R22', subjectId)
      setMock(m)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate mock exam.')
    } finally {
      setMockLoading(false)
    }
  }

  const inputCls = 'w-full bg-surface-container-high text-on-surface rounded-xl px-3.5 py-2.5 text-sm border border-outline-variant focus:outline-none focus:border-primary-container transition-colors'
  const labelCls = 'block text-on-surface-variant text-xs font-semibold mb-1.5'

  return (
    <div className="min-h-screen bg-[#030303] text-on-surface">
      <NavBar activeTab="planner" />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-28 pb-16 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
          <div>
            <h1 className="font-headline text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary-container/15 text-primary-container">
                <Icon name="event" size={24} />
              </span>
              Study Planner
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Data-backed daily schedules and readiness predictions aligned with R22 syllabus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RegulationBadge regulation={regulation || 'R22'} />
          </div>
        </div>

        {/* Subject selector banner if multiple subjects available */}
        {availableSubjects.length > 0 && (
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">Active Subject:</span>
              <select
                value={selectedSubjectId}
                onChange={e => {
                  setSelectedSubjectId(e.target.value)
                  setSearchParams({ subject_id: e.target.value })
                }}
                className="bg-surface-container-high text-on-surface border border-outline-variant rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-primary-container"
              >
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Link
              to="/analysis"
              className="text-xs text-primary-container hover:underline flex items-center gap-1 font-semibold"
            >
              Run deep pattern analysis
              <Icon name="arrow_right" size={14} />
            </Link>
          </div>
        )}

        {/* Plan Form */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Icon name="settings" size={20} className="text-primary-container" />
            Plan Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Target Exam Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.exam_date}
                onChange={e => setField('exam_date', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Dedicated Hours / Day</label>
              <input
                type="number"
                min="1"
                max="12"
                className={inputCls}
                value={form.hours_per_day}
                onChange={e => setField('hours_per_day', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Target Goal / Grade</label>
              <select
                className={inputCls}
                value={form.target_grade}
                onChange={e => setField('target_grade', e.target.value)}
              >
                {['A+', 'A', 'B+', 'B', 'C', 'Pass'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-error text-sm mt-3">{error}</p>}
          <button
            onClick={handleGeneratePlan}
            disabled={loading || !subjectId}
            className="mt-6 bg-primary-container text-on-primary-container font-bold px-6 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50 glow-orange flex items-center gap-2"
          >
            <Icon name="bolt" size={18} />
            {loading ? 'Building Plan...' : 'Generate Daily Study Plan'}
          </button>
        </div>

        {/* Readiness + Mock */}
        {plan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="insights" size={20} className="text-primary" />
                Exam Readiness
              </h2>
              {readiness ? (
                <ReadinessGauge score={readiness.score} gradePrediction={readiness.grade_prediction} weakAreas={readiness.weak_areas} />
              ) : (
                <div className="space-y-4">
                  <p className="text-on-surface-variant text-sm">Calculate your current exam readiness based on historical pattern mastery.</p>
                  <button
                    onClick={handleReadiness}
                    disabled={readinessLoading}
                    className="bg-surface-container-high border border-outline-variant text-on-surface font-semibold px-4 py-2 rounded-xl text-sm hover:border-primary-container hover:text-primary-container transition-all disabled:opacity-50"
                  >
                    {readinessLoading ? 'Calculating...' : 'Calculate Readiness Score'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-surface-container border border-outline-variant rounded-2xl p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="assignment" size={20} className="text-primary-container" />
                Predicted Mock Paper
              </h2>
              {mock ? (
                <div className="space-y-3">
                  <p className="text-on-surface-variant text-sm">
                    {mock.questions.length} questions · {mock.total_marks} marks
                    {mock.duration_minutes ? ` · ${mock.duration_minutes} min` : ''}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {mock.questions.map((q, i) => (
                      <div key={i} className="border border-outline-variant/60 bg-surface-container-low rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold shrink-0 mt-0.5 ${q.part === 'A' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container/20 text-primary-container'}`}>
                            {q.part ?? (i < (mock.part_a_count ?? 10) ? 'Part A' : 'Part B')}
                          </span>
                          <p className="text-on-surface text-sm leading-relaxed">{q.question_text}</p>
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-on-surface-variant/70 pl-7">
                          <span className="font-mono text-primary-container">{q.marks}M</span>
                          {q.unit && <span>Unit {q.unit}</span>}
                          {q.confidence !== undefined && (
                            <span className="text-primary font-mono">
                              {(typeof q.confidence === 'number' && q.confidence <= 1
                                ? (q.confidence * 100).toFixed(0)
                                : q.confidence)}% pattern probability
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-on-surface-variant text-sm">Generate a predicted exam paper grounded in university question frequency.</p>
                  <button
                    onClick={handleMock}
                    disabled={mockLoading}
                    className="bg-surface-container-high border border-outline-variant text-on-surface font-semibold px-4 py-2 rounded-xl text-sm hover:border-primary-container hover:text-primary-container transition-all disabled:opacity-50"
                  >
                    {mockLoading ? 'Synthesizing...' : 'Generate Predicted Mock'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Schedule Display */}
        {plan && (
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-outline-variant/50">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Icon name="event" size={20} className="text-primary-container" />
                Daily Schedule Breakdown
              </h2>
              <div className="flex gap-2 text-xs">
                <span className="bg-primary-container text-white px-2.5 py-0.5 rounded-full font-bold">Must Study</span>
                <span className="bg-primary text-on-primary px-2.5 py-0.5 rounded-full font-bold">High</span>
                <span className="bg-yellow-500 text-gray-900 px-2.5 py-0.5 rounded-full font-bold">Medium</span>
              </div>
            </div>
            {plan.warnings && plan.warnings.length > 0 && (
              <div className="mb-4 bg-primary-container/10 border border-primary-container/30 rounded-xl p-3 text-primary-fixed text-sm">
                {plan.warnings.join(' · ')}
              </div>
            )}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {(plan.daily_plan ?? []).map((day, i) => (
                <div key={i} className={`border-l-4 rounded-r-xl p-4 bg-surface-container-low border border-outline-variant/40 ${PRIORITY_COLORS[day.priority] ?? 'border-l-outline'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-bold flex items-center gap-2">
                      <Icon name="event" size={16} className="text-on-surface-variant" />
                      {day.date}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant text-xs font-mono">{day.hours}h study block</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${PRIORITY_TAG[day.priority] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                        {PRIORITY_LABELS[day.priority] ?? day.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(day.topics ?? []).map((t, ti) => (
                      <span key={ti} className="bg-surface-container-high text-on-surface text-xs px-2.5 py-1 rounded-lg border border-outline-variant/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
