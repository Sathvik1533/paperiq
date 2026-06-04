/**
 * Search page — R22 2-2 focused.
 * User picks a subject. PaperIQ does everything automatically:
 *   crawl → extract → parse → analyze → show dashboard.
 * No file uploads. No manual pipeline steps.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'
import { JobProgressBar } from '../components/ui/JobProgressBar'
import { RegulationBadge } from '../components/ui/RegulationBadge'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

interface R22Subject {
  code: string
  name: string
  branch: string
  short: string
}

interface JobStatus {
  status: string
  stage?: string
  progress_pct?: number
  papers_found?: number
  papers_new?: number
  report_id?: string
}

const BRANCH_LABELS: Record<string, string> = {
  CSE: 'Computer Science',
  IT:  'Information Technology',
  ECE: 'Electronics & Communication',
  EEE: 'Electrical & Electronics',
  MECH:'Mechanical',
  AI:  'Artificial Intelligence',
  DS:  'Data Science',
  CY:  'Cyber Security',
  ALL: 'Common',
}

const STAGE_LABELS: Record<string, string> = {
  discovering: 'Finding papers...',
  downloading: 'Downloading archives...',
  extracting:  'Extracting documents...',
  parsing:     'Parsing questions...',
  analysing:   'Running analysis...',
  done:        'Complete',
  running:     'Processing...',
}

export function Search() {
  const { user } = useAuthStore()
  const { setRegulation } = useAnalysisStore()
  const navigate = useNavigate()

  const [subjects, setSubjects]     = useState<R22Subject[]>([])
  const [branch, setBranch]         = useState<string>('CSE')
  const [selected, setSelected]     = useState<string>('')
  const [status, setStatus]         = useState<'idle'|'running'|'done'|'error'>('idle')
  const [jobStatus, setJobStatus]   = useState<JobStatus | null>(null)
  const [error, setError]           = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load R22 subjects from backend
  useEffect(() => {
    fetch(`${BASE_URL}/r22/subjects`)
      .then(r => r.json())
      .then(j => setSubjects(j.data ?? []))
      .catch(() => setError('Cannot connect to backend. Is it running on port 8000?'))
  }, [])

  // Filtered subjects for selected branch
  const filtered = subjects.filter(s =>
    s.branch === branch || s.branch === 'ALL'
  )

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function handleAnalyze() {
    if (!selected) { setError('Select a subject first.'); return }
    setError(''); setStatus('running')
    setRegulation('R22')

    try {
      const res = await fetch(`${BASE_URL}/r22/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_code: selected, year_from: 2021, year_to: 2025 }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.detail ?? 'Failed to start analysis')

      const jobId = j.data?.job_id
      if (!jobId) throw new Error('No job ID returned')

      // Poll until complete
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${BASE_URL}/r22/job/${jobId}`)
          const statusJson = await statusRes.json()
          const data: JobStatus = statusJson.data ?? {}
          setJobStatus(data)

          if (data.status === 'completed') {
            stopPoll(); setStatus('done')
            if (data.report_id) {
              navigate(`/dashboard?report=${data.report_id}&subject_id=${selected}`)
            }
          } else if (data.status === 'failed') {
            stopPoll(); setStatus('error')
            setError('Analysis failed. Check Settings → Pipeline Status for details.')
          }
        } catch {
          stopPoll(); setStatus('error'); setError('Lost connection to backend.')
        }
      }, 2000)

    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to start.')
    }
  }

  useEffect(() => () => stopPoll(), [])

  const selectedSubject = subjects.find(s => s.code === selected)
  const branches = [...new Set(subjects.map(s => s.branch).filter(b => b !== 'ALL'))]

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Analyze Subject</h1>
            <p className="text-gray-400 text-sm mt-1">
              MLRIT · 2nd Year 2nd Semester · R22
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RegulationBadge regulation="R22" />
            {user && <span className="text-gray-500 text-xs truncate max-w-32">{user.email}</span>}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 space-y-5">

          {/* Branch filter */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Branch</label>
            <div className="flex flex-wrap gap-2">
              {branches.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => { setBranch(b); setSelected('') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    branch === b
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {BRANCH_LABELS[b] ?? b}
                </button>
              ))}
            </div>
          </div>

          {/* Subject selector */}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Subject</label>
            {filtered.length === 0 ? (
              <div className="text-gray-500 text-sm py-2">
                {subjects.length === 0 ? 'Loading subjects...' : 'No subjects for this branch'}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filtered.map(s => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setSelected(s.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selected === s.code
                        ? 'border-blue-500 bg-blue-900/20 text-white'
                        : 'border-gray-700 hover:border-gray-500 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.name}</span>
                      <span className="text-gray-500 text-xs font-mono">{s.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected subject summary */}
          {selectedSubject && (
            <div className="bg-gray-700/50 rounded-lg px-4 py-3 text-sm text-gray-300">
              <span className="text-white font-medium">{selectedSubject.name}</span>
              <span className="text-gray-500 ml-2">·</span>
              <span className="text-gray-400 ml-2">{selectedSubject.code}</span>
              <span className="text-gray-500 ml-2">·</span>
              <span className="text-gray-400 ml-2">R22 · Sem 2-2</span>
            </div>
          )}

          {/* Progress */}
          {status === 'running' && jobStatus && (
            <div className="space-y-1">
              <JobProgressBar
                stage={STAGE_LABELS[jobStatus.stage ?? 'running'] ?? 'Processing...'}
                progress={jobStatus.progress_pct ?? 30}
                message={STAGE_LABELS[jobStatus.stage ?? 'running'] ?? 'Processing...'}
              />
              {jobStatus.papers_found != null && (
                <p className="text-gray-500 text-xs">
                  {jobStatus.papers_new ?? 0} new papers · {jobStatus.papers_found} total found
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!selected || status === 'running'}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'running'
              ? 'Analyzing — this may take 1–3 minutes...'
              : selected
                ? `Analyze ${selectedSubject?.name ?? selected}`
                : 'Select a subject above'}
          </button>

          <p className="text-gray-600 text-xs text-center">
            PaperIQ automatically downloads papers from 2021–2025, extracts questions, and generates insights.
            No uploads required.
          </p>
        </div>
      </div>
    </div>
  )
}
