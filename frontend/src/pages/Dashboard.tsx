import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getAnalysis } from '../lib/api'
import { useAnalysisStore } from '../store/analysisStore'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import { EvidencePanel } from '../components/ui/EvidencePanel'
import type { AnalysisReport } from '../types'

const PROB_COLORS: Record<string, string> = {
  'Very High': 'bg-red-600 text-white',
  'High': 'bg-orange-500 text-white',
  'Medium': 'bg-yellow-500 text-gray-900',
  'Low': 'bg-gray-600 text-gray-300',
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

  const reportId = params.get('report')

  useEffect(() => {
    if (!reportId) { setError('No report ID provided.'); setLoading(false); return }
    getAnalysis(reportId)
      .then((r) => { setLocalReport(r); setReport(r); setLoading(false) })
      .catch(() => { setError('Failed to load analysis.'); setLoading(false) })
  }, [reportId, setReport])

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-lg">Loading analysis...</div>
    </div>
  )

  if (error || !report) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-red-400">{error || 'Report not found.'}</div>
    </div>
  )

  const sortedTopics = [...report.topic_frequency].sort((a, b) => {
    if (sortKey === 'frequency') return sortDir === 'desc' ? b.frequency - a.frequency : a.frequency - b.frequency
    return sortDir === 'desc' ? b.topic.localeCompare(a.topic) : a.topic.localeCompare(b.topic)
  })

  const maxFreq = Math.max(...report.unit_distribution.map((u) => u.question_count), 1)

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {report.subject_name ?? 'Analysis Report'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{report.year_from} – {report.year_to}</p>
          </div>
          <div className="flex items-center gap-3">
            <RegulationBadge regulation={report.regulation} />
            <button
              onClick={() => navigate(`/planner?report=${reportId}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Generate Study Plan
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Papers', value: report.total_papers },
            { label: 'Total Questions', value: report.total_questions },
            { label: 'Year Range', value: `${report.year_from}–${report.year_to}` },
            { label: 'Regulation', value: report.regulation },
          ].map((card) => (
            <div key={card.label} className="bg-gray-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-gray-400 text-xs mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Topic Frequency Table */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Topic Frequency</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 cursor-pointer hover:text-white" onClick={() => { setSortKey('topic'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                    Topic {sortKey === 'topic' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-left py-2">Unit</th>
                  <th className="text-left py-2 cursor-pointer hover:text-white" onClick={() => { setSortKey('frequency'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                    Frequency {sortKey === 'frequency' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-left py-2">Years</th>
                </tr>
              </thead>
              <tbody>
                {sortedTopics.slice(0, 20).map((t, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-2 text-white pr-4">{t.topic}</td>
                    <td className="py-2 text-gray-400">{t.unit ?? '—'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(t.frequency / (sortedTopics[0]?.frequency || 1)) * 100}%` }} />
                        </div>
                        <span className="text-white">{t.frequency}</span>
                      </div>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">{t.years.slice(0, 5).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unit Distribution */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Unit Distribution</h2>
          <div className="space-y-3">
            {report.unit_distribution.map((u, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{u.unit}</span>
                  <span className="text-gray-400">{u.question_count} questions ({u.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${(u.question_count / maxFreq) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeated Questions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Repeated Questions</h2>
          <div className="space-y-3">
            {report.repeated_questions.slice(0, 15).map((q, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-gray-200 text-sm flex-1">{q.question_text}</p>
                  <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
                    ×{q.frequency}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  {q.marks && <span className="text-gray-500 text-xs">{q.marks} marks</span>}
                  <EvidencePanel years={q.years} paperIds={q.paper_ids} evidenceCount={q.frequency} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Probability Topics */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">High Probability Topics</h2>
          <div className="space-y-2">
            {report.high_probability_topics.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div>
                  <span className="text-gray-200 text-sm">{t.topic}</span>
                  {t.unit && <span className="text-gray-500 text-xs ml-2">({t.unit})</span>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PROB_COLORS[t.probability] ?? 'bg-gray-600 text-white'}`}>
                  {t.probability}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Predicted Questions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Predicted Questions</h2>
          <div className="space-y-3">
            {report.predicted_questions.map((q, i) => (
              <div key={i} className="border border-gray-700 rounded-lg p-4">
                <p className="text-gray-200 text-sm mb-2">{q.question_text}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Confidence: <span className="text-blue-400">{(q.confidence * 100).toFixed(0)}%</span></span>
                  <span>Appeared in <span className="text-white">{q.evidence_count}</span> papers</span>
                  {q.unit && <span>Unit: {q.unit}</span>}
                  {q.marks && <span>{q.marks} marks</span>}
                </div>
                {q.years.length > 0 && (
                  <div className="mt-2">
                    <EvidencePanel years={q.years} evidenceCount={q.evidence_count} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
