import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { getColleges, getSubjects, triggerScrape, getJobStatus, runAnalysis } from '../lib/api'
import { JobProgressBar } from '../components/ui/JobProgressBar'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import type { College, Subject } from '../types'

const REGULATIONS = ['R18', 'R22', 'R24']
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML']

export function Search() {
  const { user } = useAuthStore()
  const { regulation, setRegulation } = useAnalysisStore()
  const navigate = useNavigate()

  const [colleges, setColleges] = useState<College[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [form, setForm] = useState({
    college_id: '',
    branch: '',
    regulation: regulation,
    subject_id: '',
    year_from: '2019',
    year_to: '2024',
    exam_type: 'regular',
  })
  const [status, setStatus] = useState<'idle' | 'scraping' | 'analyzing' | 'done' | 'error'>('idle')
  const [jobProgress, setJobProgress] = useState(0)
  const [jobStage, setJobStage] = useState('')
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    if (key === 'regulation') setRegulation(value)
  }

  function stopPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  async function handleAnalyze() {
    if (!form.college_id || !form.subject_id) {
      setError('Please select a college and subject.')
      return
    }
    setError('')
    setStatus('scraping')
    setJobProgress(5)
    setJobStage('Downloading papers')

    try {
      const job = await triggerScrape(
        Number(form.college_id),
        Number(form.subject_id),
        Number(form.year_from),
        Number(form.year_to)
      )

      pollRef.current = setInterval(async () => {
        try {
          const updated = await getJobStatus(job.job_id)
          setJobStage(updated.stage ?? 'Processing')
          setJobProgress(updated.progress ?? 50)

          if (updated.status === 'completed') {
            stopPoll()
            setStatus('analyzing')
            setJobStage('Analyzing')
            setJobProgress(80)

            const { report_id } = await runAnalysis(
              Number(form.subject_id),
              form.regulation,
              undefined,
              Number(form.year_from),
              Number(form.year_to)
            )
            setJobProgress(100)
            setStatus('done')
            navigate(`/dashboard?report=${report_id}`)
          } else if (updated.status === 'failed') {
            stopPoll()
            setStatus('error')
            setError(updated.message ?? 'Scraping failed.')
          }
        } catch {
          stopPoll()
          setStatus('error')
          setError('Failed to get job status.')
        }
      }, 2000)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to start scraping.')
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'
  const labelCls = 'block text-gray-300 text-sm mb-1'
  const isRunning = status === 'scraping' || status === 'analyzing'

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Analyze Papers</h1>
            <p className="text-gray-400 text-sm mt-1">Select a subject and year range to run AI analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <RegulationBadge regulation={form.regulation} />
            {user && <span className="text-gray-400 text-xs">{user.email}</span>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>College</label>
              <select className={inputCls} value={form.college_id} onChange={(e) => setField('college_id', e.target.value)}>
                <option value="">Select college</option>
                {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Branch</label>
              <select className={inputCls} value={form.branch} onChange={(e) => setField('branch', e.target.value)}>
                <option value="">Select branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Regulation</label>
              <select className={inputCls} value={form.regulation} onChange={(e) => setField('regulation', e.target.value)}>
                {REGULATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={form.subject_id} onChange={(e) => setField('subject_id', e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Year From</label>
              <input type="number" min="2010" max="2024" className={inputCls} value={form.year_from}
                onChange={(e) => setField('year_from', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Year To</label>
              <input type="number" min="2010" max="2024" className={inputCls} value={form.year_to}
                onChange={(e) => setField('year_to', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Exam Type</label>
              <select className={inputCls} value={form.exam_type} onChange={(e) => setField('exam_type', e.target.value)}>
                <option value="regular">Regular</option>
                <option value="supplementary">Supplementary</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isRunning && (
            <div className="pt-2">
              <JobProgressBar stage={jobStage} progress={jobProgress} message={jobStage} />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isRunning}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Processing...' : 'Analyze Papers'}
          </button>
        </div>
      </div>
    </div>
  )
}
