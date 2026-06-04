import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { generatePlan, calculateReadiness, generateMock } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import { ReadinessGauge } from '../components/ui/ReadinessGauge'
import type { StudyPlan, ReadinessScore, MockExam } from '../types'

const PRIORITY_COLORS: Record<string, string> = {
  must_study: 'border-l-red-500 bg-red-900/20',
  high: 'border-l-orange-500 bg-orange-900/20',
  medium: 'border-l-yellow-500 bg-yellow-900/20',
  low: 'border-l-gray-500 bg-gray-700/20',
}

const PRIORITY_LABELS: Record<string, string> = {
  must_study: 'Must Study',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function Planner() {
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { currentReport, regulation } = useAnalysisStore()

  const reportId = searchParams.get('report') ?? currentReport?.report_id ?? ''
  const subjectId = currentReport?.subject_id ?? 0

  const [form, setForm] = useState({
    exam_date: '',
    hours_per_day: '4',
    target_grade: 'B',
  })

  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null)
  const [mock, setMock] = useState<MockExam | null>(null)
  const [loading, setLoading] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const [error, setError] = useState('')

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function handleGeneratePlan() {
    if (!reportId || !subjectId) { setError('No report loaded. Run an analysis first.'); return }
    if (!form.exam_date) { setError('Please set an exam date.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await generatePlan(
        reportId, form.exam_date, Number(form.hours_per_day),
        form.target_grade, regulation, undefined, subjectId
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
      const r = await calculateReadiness(user.id, subjectId, regulation, plan?.plan_id)
      setReadiness(r)
    } catch {
      setError('Failed to calculate readiness.')
    } finally {
      setReadinessLoading(false)
    }
  }

  async function handleMock() {
    if (!reportId || !subjectId) return
    setMockLoading(true)
    try {
      const m = await generateMock(reportId, regulation, subjectId)
      setMock(m)
    } catch {
      setError('Failed to generate mock exam.')
    } finally {
      setMockLoading(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Study Planner</h1>
          <RegulationBadge regulation={regulation} />
        </div>

        {/* Plan Form */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Generate Study Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Exam Date</label>
              <input type="date" className={inputCls} value={form.exam_date}
                onChange={(e) => setField('exam_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hours per Day</label>
              <input type="number" min="1" max="12" className={inputCls} value={form.hours_per_day}
                onChange={(e) => setField('hours_per_day', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Target Grade</label>
              <select className={inputCls} value={form.target_grade} onChange={(e) => setField('target_grade', e.target.value)}>
                {['A+', 'A', 'B', 'C', 'D'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Study Plan'}
          </button>
        </div>

        {/* Readiness + Mock row */}
        {plan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Readiness Score</h2>
              {readiness ? (
                <ReadinessGauge
                  score={readiness.score}
                  gradePrediction={readiness.grade_prediction}
                  weakAreas={readiness.weak_areas}
                />
              ) : (
                <button
                  onClick={handleReadiness}
                  disabled={readinessLoading}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {readinessLoading ? 'Calculating...' : 'Calculate Readiness'}
                </button>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Mock Exam</h2>
              {mock ? (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">{mock.questions.length} questions · {mock.total_marks} marks · {mock.duration_minutes} min</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {mock.questions.map((q, i) => (
                      <div key={q.id} className="border border-gray-700 rounded p-3">
                        <p className="text-gray-200 text-sm"><span className="text-gray-500 mr-2">{i + 1}.</span>{q.question_text}</p>
                        <span className="text-xs text-gray-500 mt-1 block">{q.marks} marks{q.unit ? ` · Unit ${q.unit}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleMock}
                  disabled={mockLoading}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {mockLoading ? 'Generating...' : 'Generate Mock Exam'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Daily Plan Calendar */}
        {plan && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Daily Study Plan</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {plan.daily_plan.map((day, i) => (
                <div
                  key={i}
                  className={`border-l-4 rounded-r-lg p-3 ${PRIORITY_COLORS[day.priority] ?? 'border-l-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{day.hours}h</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        day.priority === 'must_study' ? 'bg-red-600 text-white' :
                        day.priority === 'high' ? 'bg-orange-500 text-white' :
                        day.priority === 'medium' ? 'bg-yellow-500 text-gray-900' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {PRIORITY_LABELS[day.priority] ?? day.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {day.topics.map((t, ti) => (
                      <span key={ti} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
