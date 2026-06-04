import { useState, useEffect, useRef } from 'react'
import { useAnalysisStore } from '../store/analysisStore'
import { useAuthStore } from '../store/authStore'
import { uploadSyllabus, getSyllabi, getSyllabusTopics, getSyllabusCoverage, mapTopics, getSubjects } from '../lib/api'
import { RegulationBadge } from '../components/ui/RegulationBadge'
import type { Syllabus, SyllabusTopic, CoverageReport } from '../types'

export function SyllabusUpload() {
  const { regulation, currentReport } = useAnalysisStore()
  const { user } = useAuthStore()

  const [subjectId, setSubjectId] = useState(currentReport?.subject_id ?? '')
  const [syllabi, setSyllabi] = useState<Syllabus[]>([])
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null)
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [coverage, setCoverage] = useState<CoverageReport | null>(null)

  const [uploading, setUploading] = useState(false)
  const [mapping, setMapping] = useState(false)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (subjectId && regulation) {
      getSyllabi(subjectId, regulation).then(setSyllabi).catch(() => {})
    }
  }, [subjectId, regulation])

  useEffect(() => {
    if (selectedSyllabus) {
      getSyllabusTopics(selectedSyllabus.id).then(setTopics).catch(() => {})
    }
  }, [selectedSyllabus])

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Select a PDF or DOCX file.'); return }
    if (!subjectId) { setError('Subject ID is required. Run an analysis first.'); return }
    setError(''); setSuccess(''); setUploading(true)
    try {
      const result = await uploadSyllabus(file, subjectId, regulation)
      setSuccess(`Syllabus uploaded — ${result.units_found} units, ${result.total_topics} topics found.`)
      const updated = await getSyllabi(subjectId, regulation)
      setSyllabi(updated)
      if (updated.length > 0) setSelectedSyllabus(updated[0])
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleMapTopics() {
    if (!subjectId) return
    setMapping(true); setError(''); setSuccess('')
    try {
      const result = await mapTopics(subjectId, regulation, selectedSyllabus?.id)
      setSuccess(`Topic mapping done — ${result.mapped} questions mapped, ${result.no_syllabus_match} unmatched.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mapping failed.')
    } finally {
      setMapping(false)
    }
  }

  async function handleCoverage() {
    if (!selectedSyllabus || !subjectId) return
    setLoadingCoverage(true); setError('')
    try {
      const result = await getSyllabusCoverage(selectedSyllabus.id, subjectId, regulation)
      setCoverage(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coverage analysis failed.')
    } finally {
      setLoadingCoverage(false)
    }
  }

  const inputCls = 'w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500'

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Syllabus</h1>
          <RegulationBadge regulation={regulation} />
        </div>

        {/* Upload */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Upload Syllabus</h2>
          <p className="text-gray-400 text-sm">Upload the official syllabus PDF or DOCX. PaperIQ will extract units and topics to map against historical questions.</p>

          {!subjectId && (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-yellow-300 text-sm">
              Run an analysis first to set the subject context, then upload its syllabus here.
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-1">Subject ID</label>
            <input
              className={inputCls}
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              placeholder="Paste subject ID from Search page"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Syllabus File (PDF or DOCX)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc"
              className="w-full text-gray-300 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-700"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading || !subjectId}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Syllabus'}
          </button>
        </div>

        {/* Existing syllabi */}
        {syllabi.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-semibold">Uploaded Syllabi</h2>
            <div className="space-y-2">
              {syllabi.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSyllabus(s)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedSyllabus?.id === s.id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{s.regulation} Syllabus</span>
                    <span className="text-gray-400 text-xs">
                      {s.parsed_units?.length ?? 0} units
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{s.id.slice(0, 8)}... · {s.source_type}</div>
                </button>
              ))}
            </div>

            {selectedSyllabus && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleMapTopics}
                  disabled={mapping}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {mapping ? 'Mapping...' : 'Map Questions → Topics'}
                </button>
                <button
                  onClick={handleCoverage}
                  disabled={loadingCoverage}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {loadingCoverage ? 'Analyzing...' : 'View Coverage'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Topics list */}
        {topics.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Syllabus Topics ({topics.length})</h2>
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
              {topics.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-gray-700 last:border-0">
                  <span className="bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded shrink-0">
                    U{t.unit_number}
                  </span>
                  <span className="text-gray-200 text-sm">{t.topic_name}</span>
                  {t.subtopics && t.subtopics.length > 0 && (
                    <span className="text-gray-500 text-xs">{t.subtopics.join(', ')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coverage report */}
        {coverage && (
          <div className="bg-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Coverage Analysis</h2>
              <span className={`text-2xl font-bold ${
                coverage.overall_coverage_pct >= 70 ? 'text-green-400' :
                coverage.overall_coverage_pct >= 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {coverage.overall_coverage_pct.toFixed(0)}%
              </span>
            </div>

            {coverage.warning && (
              <p className="text-yellow-300 text-sm bg-yellow-900/20 border border-yellow-700 rounded p-3">
                {coverage.warning}
              </p>
            )}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xl font-bold text-white">{coverage.total_topics}</div>
                <div className="text-gray-400 text-xs mt-1">Total Topics</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xl font-bold text-green-400">{coverage.covered_topics}</div>
                <div className="text-gray-400 text-xs mt-1">Covered</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xl font-bold text-red-400">{coverage.total_topics - coverage.covered_topics}</div>
                <div className="text-gray-400 text-xs mt-1">Not in Papers</div>
              </div>
            </div>

            <div className="space-y-3">
              {(coverage.unit_coverage ?? []).map((unit, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Unit {unit.unit_number}: {unit.unit_name}</span>
                    <span className={`font-semibold ${
                      unit.coverage_pct >= 70 ? 'text-green-400' :
                      unit.coverage_pct >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{unit.coverage_pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        unit.coverage_pct >= 70 ? 'bg-green-500' :
                        unit.coverage_pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${unit.coverage_pct}%` }}
                    />
                  </div>
                  {unit.uncovered_topics.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      Not in papers: {unit.uncovered_topics.slice(0, 3).join(', ')}
                      {unit.uncovered_topics.length > 3 && ` +${unit.uncovered_topics.length - 3} more`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
