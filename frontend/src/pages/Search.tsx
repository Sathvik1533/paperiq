import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import {
  getColleges, getSubjects, getBranches,
  triggerScrape, getJobStatus, runAnalysis, getCachedAnalysis,
} from '../lib/api'
import { JobProgressBar } from '../components/ui/JobProgressBar'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import type { College, Subject } from '../types'

const REGULATIONS   = ['R18', 'R22', 'R24']
const EXAM_CATEGORIES = ['Semester', 'Mid-1', 'Mid-2']
const EXAM_ATTEMPTS   = ['Regular', 'Supplementary']

export function Search() {
  const { user } = useAuthStore()
  const { regulation, setRegulation } = useAnalysisStore()
  const navigate = useNavigate()

  const [colleges, setColleges] = useState<College[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [branches, setBranches] = useState<{ id: string; name: string; short_name: string }[]>([])

  const [form, setForm] = useState({
    college_id: '', branch_id: '', regulation,
    subject_id: '', year_from: '2021', year_to: '2025',
  })

  // Multi-select state for exam category + attempt
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Semester'])
  const [selectedAttempts, setSelectedAttempts]     = useState<string[]>(['Regular', 'Supplementary'])

  const [status, setStatus]           = useState<'idle'|'checking_cache'|'scraping'|'analyzing'|'done'|'error'>('idle')
  const [jobProgress, setJobProgress] = useState(0)
  const [jobStage, setJobStage]       = useState('')
  const [error, setError]             = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { getColleges().then(setColleges).catch(() => {}) }, [])
  useEffect(() => {
    if (form.college_id) {
      getSubjects(form.college_id).then(setSubjects).catch(() => {})
      getBranches(form.college_id).then(setBranches).catch(() => {})
    }
  }, [form.college_id])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    if (key === 'regulation') setRegulation(value)
  }

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function toggleAttempt(att: string) {
    setSelectedAttempts(prev =>
      prev.includes(att) ? prev.filter(a => a !== att) : [...prev, att]
    )
  }

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function handleAnalyze() {
    if (!form.college_id || !form.subject_id) {
      setError('Select a college and subject.'); return
    }
    if (selectedCategories.length === 0) {
      setError('Select at least one exam category.'); return
    }
    setError(''); setStatus('checking_cache'); setJobProgress(2); setJobStage('Checking cache')

    const cached = await getCachedAnalysis(
      form.subject_id, form.regulation, form.branch_id || undefined,
      Number(form.year_from), Number(form.year_to)
    )
    if (cached) {
      const id = cached.id ?? (cached as any).report_id
      navigate(`/dashboard?report=${id}&subject_id=${form.subject_id}`)
      return
    }

    setStatus('scraping'); setJobProgress(5); setJobStage('Discovering syllabus & papers')

    try {
      const job = await triggerScrape(
        form.college_id,
        form.subject_id,
        Number(form.year_from),
        Number(form.year_to),
        form.regulation,
        selectedCategories,
        selectedAttempts,
      )

      pollRef.current = setInterval(async () => {
        try {
          const updated = await getJobStatus(job.job_id)
          const pct = updated.progress_pct ?? updated.progress ?? 50
          setJobStage(updated.stage ?? 'Processing')
          setJobProgress(Math.min(75, Number(pct) * 0.75))

          if (updated.status === 'completed') {
            stopPoll()
            setStatus('analyzing'); setJobStage('Generating analysis'); setJobProgress(80)
            const { report_id } = await runAnalysis(
              form.subject_id, form.regulation,
              form.branch_id || undefined,
              Number(form.year_from), Number(form.year_to),
            )
            setJobProgress(100); setStatus('done')
            navigate(`/dashboard?report=${report_id}&subject_id=${form.subject_id}`)
          } else if (updated.status === 'failed') {
            stopPoll(); setStatus('error')
            setError('Scraping failed. Check Settings → Pipeline Status.')
          }
        } catch {
          stopPoll(); setStatus('error'); setError('Lost connection to backend.')
        }
      }, 2000)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to start scraping.')
    }
  }

  useEffect(() => () => stopPoll(), [])

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'
  const isRunning = status === 'scraping' || status === 'analyzing' || status === 'checking_cache'

  const chipCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer select-none transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
    }`

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Analyze Papers</h1>
            <p className="text-gray-400 text-sm mt-1">Select subject, regulation and exam type to run AI analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <RegulationBadge regulation={form.regulation} />
            {user && <span className="text-gray-500 text-xs">{user.email}</span>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 space-y-5">
          {/* College + Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>College</label>
              <select className={inputCls} value={form.college_id} onChange={e => set('college_id', e.target.value)}>
                <option value="">Select college</option>
                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <select className={inputCls} value={form.branch_id} onChange={e => set('branch_id', e.target.value)}>
                <option value="">All branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.short_name}</option>)}
              </select>
            </div>
          </div>

          {/* Regulation + Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Regulation</label>
              <select className={inputCls} value={form.regulation} onChange={e => set('regulation', e.target.value)}>
                {REGULATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>

          {/* Year range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Year From</label>
              <input type="number" min="2015" max="2025" className={inputCls}
                value={form.year_from} onChange={e => set('year_from', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Year To</label>
              <input type="number" min="2015" max="2025" className={inputCls}
                value={form.year_to} onChange={e => set('year_to', e.target.value)} />
            </div>
          </div>

          {/* Exam Category — new Fix B field */}
          <div>
            <label className={labelCls}>Exam Category</label>
            <div className="flex gap-2 flex-wrap">
              {EXAM_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={chipCls(selectedCategories.includes(cat))}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-1">Select which exams to analyze</p>
          </div>

          {/* Exam Attempt — new Fix B field */}
          <div>
            <label className={labelCls}>Exam Attempt</label>
            <div className="flex gap-2">
              {EXAM_ATTEMPTS.map(att => (
                <button
                  key={att}
                  type="button"
                  onClick={() => toggleAttempt(att)}
                  className={chipCls(selectedAttempts.includes(att))}
                >
                  {att}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isRunning && (
            <div className="pt-1">
              <JobProgressBar stage={jobStage} progress={jobProgress} message={jobStage} />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isRunning}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'checking_cache' ? 'Checking cache...' :
             status === 'scraping'       ? 'Scraping papers...' :
             status === 'analyzing'      ? 'Running analysis...' :
             'Analyze Papers'}
          </button>

          <p className="text-gray-500 text-xs text-center">
            PaperIQ automatically discovers the syllabus, downloads papers, parses questions, and generates insights.
            First run takes ~2–5 minutes. Subsequent runs use cache.
          </p>
        </div>
      </div>
    </div>
  )
}
