import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getAnalysis } from '../lib/api'
import { useAnalysisStore } from '../store/analysisStore'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import { EvidencePanel } from '../components/ui/EvidencePanel'
import type { AnalysisReport } from '../types'

const PROB_COLORS: Record<string, string> = {
  'Very High': 'bg-red-600 text-white',
  'High':      'bg-orange-500 text-white',
  'Medium':    'bg-yellow-500 text-gray-900',
  'Low':       'bg-gray-600 text-gray-300',
}

export function Dashboard() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setReport } = useAnalysisStore()

  const [report, setLocalReport] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<'frequency' | 'topic'>('frequency')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  // B2 fix: backend returns `id` (not `report_id`) — URL param is `report`
  const reportId = params.get('report')

  useEffect(() => {
    if (!reportId) { setError('No report ID. Run an analysis first.'); setLoading(false); return }
    getAnalysis(reportId)
      .then(r => {
        setLocalReport(r)
        setReport(r)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load analysis.'); setLoading(false) })
  }, [reportId, setReport])

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white">Loading analysis...</div>
    </div>
  )
  if (error || !report) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center flex-col gap-4">
      <div className="text-red-400">{error || 'Report not found.'}</div>
      <a href="/search" className="text-blue-400 text-sm underline">← Run a new analysis</a>
    </div>
  )

  const topicFreq = report.topic_frequency ?? []
  const unitDist  = report.unit_distribution ?? []
  const repeated  = report.repeated_questions ?? []
  const highProb  = report.high_probability_topics ?? []
  const predicted = report.predicted_questions ?? []

  const sorted = [...topicFreq].sort((a, b) =>
    sortKey === 'frequency'
      ? (sortDir === 'desc' ? b.frequency - a.frequency : a.frequency - b.frequency)
      : (sortDir === 'desc' ? b.topic.localeCompare(a.topic) : a.topic.localeCompare(b.topic))
  )

  const maxFreq = Math.max(...unitDist.map(u => u.question_count), 1)
  // B3 fix: use question_count if total_questions undefined
  const totalQ = report.total_questions ?? (report as any).question_count ?? 0

  function toggleSort(key: 'frequency' | 'topic') {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {(report as any).subject_name ?? 'Analysis Report'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {report.year_from ?? '—'} – {report.year_to ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RegulationBadge regulation={report.regulation} />
            <button
              onClick={() => navigate(`/planner?report=${reportId}&subject_id=${report.subject_id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Generate Study Plan
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Papers', value: (report as any).total_papers ?? '—' },
            { label: 'Total Questions', value: totalQ || '—' },
            { label: 'Year Range', value: `${report.year_from ?? '—'}–${report.year_to ?? '—'}` },
            { label: 'Regulation', value: report.regulation },
          ].map(card => (
            <div key={card.label} className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-gray-400 text-xs mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Topic Frequency */}
        {sorted.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Topic Frequency</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 cursor-pointer hover:text-white select-none"
                      onClick={() => toggleSort('topic')}>
                      Topic {sortKey === 'topic' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-left py-2">Unit</th>
                    <th className="text-left py-2 cursor-pointer hover:text-white select-none"
                      onClick={() => toggleSort('frequency')}>
                      Frequency {sortKey === 'frequency' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-left py-2">Years</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 25).map((t, i) => (
                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-2 text-white pr-4">{t.topic}</td>
                      <td className="py-2 text-gray-400">{t.unit ?? t.unit_number ?? '—'}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-700 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${(t.frequency / (sorted[0]?.frequency || 1)) * 100}%` }} />
                          </div>
                          <span className="text-white font-medium">{t.frequency}</span>
                        </div>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">{(t.years ?? []).slice(0, 5).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unit Distribution */}
        {unitDist.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Unit Distribution</h2>
            <div className="space-y-3">
              {unitDist.map((u, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{u.unit}</span>
                    <span className="text-gray-400">{u.question_count} questions ({u.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${(u.question_count / maxFreq) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Repeated Questions */}
        {repeated.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Repeated Questions</h2>
            <div className="space-y-3">
              {repeated.slice(0, 15).map((q, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-gray-200 text-sm flex-1">{q.question_text}</p>
                    <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full shrink-0">×{q.frequency}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    {q.marks && <span>{q.marks} marks</span>}
                    <EvidencePanel years={q.years ?? []} paperIds={q.paper_ids} evidenceCount={q.frequency} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* High Probability Topics */}
        {highProb.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">High Probability Topics</h2>
            <div className="space-y-2">
              {highProb.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <span className="text-gray-200 text-sm">{t.topic}</span>
                    {t.unit && <span className="text-gray-500 text-xs ml-2">(Unit {t.unit})</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PROB_COLORS[t.probability] ?? 'bg-gray-600 text-white'}`}>
                    {t.probability}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predicted Questions */}
        {predicted.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Predicted Questions</h2>
            <div className="space-y-3">
              {predicted.map((q, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-200 text-sm mb-2">{q.question_text}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Confidence: <span className="text-blue-400">{(q.confidence * 100).toFixed(0)}%</span></span>
                    <span>Appeared in <span className="text-white">{q.evidence_count}</span> papers</span>
                    {q.unit && <span>Unit {q.unit}</span>}
                    {q.marks && <span>{q.marks} marks</span>}
                  </div>
                  {(q.years ?? []).length > 0 && (
                    <div className="mt-2">
                      <EvidencePanel years={(q.years ?? []).map(Number)} evidenceCount={q.evidence_count} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!topicFreq.length && !repeated.length && !highProb.length && (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-2">No analysis data yet.</p>
            <p className="text-gray-500 text-sm">Papers may need extraction and parsing. Check <a href="/settings" className="text-blue-400 underline">Settings → Pipeline Status</a>.</p>
          </div>
        )}

      </div>
    </div>
  )
}
