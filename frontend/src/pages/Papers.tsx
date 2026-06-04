import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPapers } from '../lib/api'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import { useAnalysisStore } from '../store/analysisStore'
import type { Paper } from '../types'

export function Papers() {
  const [searchParams] = useSearchParams()
  const { regulation } = useAnalysisStore()

  const subjectId = searchParams.get('subject_id') ?? ''
  const reg = searchParams.get('regulation') ?? regulation

  const [papers, setPapers]     = useState<Paper[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) return
    setLoading(true)
    getPapers(subjectId, reg)
      .then(setPapers)
      .catch(() => setError('Failed to load papers.'))
      .finally(() => setLoading(false))
  }, [subjectId, reg])

  const statusColor: Record<string, string> = {
    success: 'text-green-400',
    pending: 'text-yellow-400',
    failed:  'text-red-400',
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold text-white">Question Papers</h1>
          <RegulationBadge regulation={reg} />
        </div>

        {!subjectId && (
          <div className="bg-gray-800 rounded-xl p-6 text-gray-400 text-center">
            Navigate here from the Dashboard — click "Generate Study Plan" then browse papers via the navbar.
            <br />
            <a href="/search" className="text-blue-400 underline text-sm mt-2 inline-block">← Run an analysis first</a>
          </div>
        )}

        {loading && <div className="text-gray-400 text-center py-12">Loading papers...</div>}
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

        <div className="space-y-4">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-gray-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setExpanded(expanded === paper.id ? null : paper.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{paper.title}</span>
                    <RegulationBadge regulation={paper.regulation} />
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                      {paper.exam_type}
                    </span>
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                      {paper.exam_year}
                    </span>
                    {paper.max_marks && (
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {paper.max_marks}M
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-xs ${statusColor[paper.extraction_status] ?? 'text-gray-400'}`}>
                      {paper.extraction_status}
                    </span>
                    {paper.parsed_questions && paper.parsed_questions.length > 0 && (
                      <span className="text-gray-500 text-xs">
                        · {paper.parsed_questions.length} questions
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-400 text-sm ml-4">
                  {expanded === paper.id ? '▲' : '▼'}
                </span>
              </div>

              {expanded === paper.id && (
                <div className="border-t border-gray-700 p-4">
                  {paper.parsed_questions && paper.parsed_questions.length > 0 ? (
                    <div className="space-y-2">
                      {paper.parsed_questions.map((q, i) => (
                        <div key={q.id} className="flex gap-3 py-2 border-b border-gray-700 last:border-0">
                          <span className="text-gray-500 text-sm shrink-0">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="text-gray-200 text-sm">{q.question_text}</p>
                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                              {q.unit_number != null && <span>Unit {q.unit_number}</span>}
                              {q.marks        != null && <span>{q.marks} marks</span>}
                              {q.question_type       && <span>{q.question_type}</span>}
                              {q.part                && <span>Part {q.part}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No parsed questions yet.
                      {paper.extraction_status === 'pending' && ' Paper is still being processed.'}
                      {paper.extraction_status === 'failed'  && ' Extraction failed — check Settings.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && papers.length === 0 && subjectId && (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400">No papers found for this subject and regulation.</p>
            <p className="text-gray-500 text-sm mt-2">Try running an analysis from the <a href="/search" className="text-blue-400 underline">Search page</a>.</p>
          </div>
        )}
      </div>
    </div>
  )
}
