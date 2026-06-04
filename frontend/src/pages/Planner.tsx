import { useState, useEffect } from 'react'
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
  must_study: 'Must Study', high: 'High', medium: 'Medium', low: 'Low',
}
const PRIORITY_TAG: Record<string, string> = {
  must_study: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-gray-900',
  low: 'bg-gray-600 text-gray-300',
}

export function Planner() {
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { currentReport, regulation } = useAnalysisStore()

  // B6 fix: pull subject_id and report_id from URL params with fallback to store
  const reportId = searchParams.get('report') ?? currentReport?.id ?? ''
  const subjectId = searchParams.get('subject_id') ?? currentReport?.subject_id ?? ''

  const [form, setForm] = useState({ exam_date: '', hours_per_day: '4', target_grade: 'B' })
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null)
  const [mock, setMock] = useState<MockExam | null>(null)
  const [loading, setLoading] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)
  const [readinessLoading, setReadinessLoading] = useState(false)
  const [error, setError] = useState('')

  function setField(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleGeneratePlan() {
    if (!reportId) { setError('No analysis loaded. Run an analysis from the Search page first.'); return }
    if (!subjectId) { setError('Subject ID missing. Return to the Dashboard and use the Study Plan button.'); return }
    if (!form.exam_date) { setError('Set an exam date.'); return }
    setError(''); setLoading(true)
    try {
      // B5 fix: syllabus_id is optional — api.ts only sends it when defined
      const result = await generatePlan(
        reportId, form.exam_date, Number(form.hours_per_day),
        form.target_grade, regulation,
        undefined,  // syllabus_id optional
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
      const r = await calculateReadiness(user.id, subjectId, regulation, plan?.plan_id)
      setReadiness(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to calculate readiness.')
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate mock exam.')
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

        {/* Context info */}
        {(!reportId || !subjectId) && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-yellow-300 text-sm">
            No analysis loaded. Go to <a href="/search" className="underline">Search</a> → run analysis → click "Generate Study Plan" from the Dashboard.
          </div>
        )}

        {/* Plan form */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Generate Study Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Exam Date</label>
              <input type="date" className={inputCls} value={form.exam_date}
                onChange={e => setField('exam_date', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Hours per Day</label>
              <input type="number" min="1" max="12" className={inputCls} value={form.hours_per_day}
                onChange={e => setField('hours_per_day', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Target Grade</label>
              <select className={inputCls} value={form.target_grade} onChange={e => setField('target_grade', e.target.value)}>
                {['A+', 'A', 'B+', 'B', 'C', 'Pass'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button onClick={handleGeneratePlan} disabled={loading || !reportId || !subjectId}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Study Plan'}
          </button>
        </div>

        {/* Readiness + Mock */}
        {plan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Readiness Score</h2>
              {readiness ? (
                <ReadinessGauge score={readiness.score} gradePrediction={readiness.grade_prediction} weakAreas={readiness.weak_areas} />
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">Calculate your current readiness based on study activities.</p>
                  <button onClick={handleReadiness} disabled={readinessLoading}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50">
                    {readinessLoading ? 'Calculating...' : 'Calculate Readiness'}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Mock Exam</h2>
              {mock ? (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">
                    {mock.questions.length} questions · {mock.total_marks} marks
                    {mock.duration_minutes ? ` · ${mock.duration_minutes} min` : ''}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {mock.questions.map((q, i) => (
                      <div key={i} className="border border-gray-700 rounded p-3">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${q.part === 'A' ? 'bg-gray-600 text-gray-300' : 'bg-blue-900 text-blue-300'}`}>
                            {q.part ?? (i < (mock.part_a_count ?? 10) ? 'A' : 'B')}
                          </span>
                          <p className="text-gray-200 text-sm">{q.question_text}</p>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-gray-500 pl-7">
                          <span>{q.marks}M</span>
                          {q.unit && <span>Unit {q.unit}</span>}
                          {q.confidence !== undefined && (
                            <span className="text-blue-400">
                              {(typeof q.confidence === 'number' && q.confidence <= 1
                                ? (q.confidence * 100).toFixed(0)
                                : q.confidence)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">Generate a predicted exam paper based on historical patterns.</p>
                  <button onClick={handleMock} disabled={mockLoading}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50">
                    {mockLoading ? 'Generating...' : 'Generate Mock Exam'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Plan */}
        {plan && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Daily Study Plan</h2>
              <div className="flex gap-2 text-xs">
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-full">Must Study</span>
                <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full">High</span>
                <span className="bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full">Medium</span>
              </div>
            </div>
            {plan.warnings && plan.warnings.length > 0 && (
              <div className="mb-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
                {plan.warnings.join(' · ')}
              </div>
            )}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {(plan.daily_plan ?? []).map((day, i) => (
                <div key={i} className={`border-l-4 rounded-r-lg p-3 ${PRIORITY_COLORS[day.priority] ?? 'border-l-gray-600'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm font-medium">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{day.hours}h</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_TAG[day.priority] ?? 'bg-gray-600 text-gray-300'}`}>
                        {PRIORITY_LABELS[day.priority] ?? day.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(day.topics ?? []).map((t, ti) => (
                      <span key={ti} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">{t}</span>
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
