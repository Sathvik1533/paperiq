import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePrefsStore } from '../store/prefsStore'
import { getUserProfile, getSubjectsForSemester, generateAnalysis } from '../lib/api'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { AnalysisLoadingState } from '../components/AnalysisLoadingState'
import type { Subject } from '../types'

interface AnalysisReport {
  unit_distribution_classified: Record<string, { count: number; percentage: number }>
  most_asked_topics: Array<{ topic: string; count: number; unit: string; percentage: number; priority: string }>
  high_probability_topics_classified: Array<{ topic: string; question_count: number; paper_count: number; probability: string; confidence: number }>
  study_priority_order: Array<{ unit: string; priority: number; question_count: number; percentage: number; top_topics: Array<{ topic: string; count: number }>; recommendation: string }>
  repeated_questions: Array<{ question_text: string; frequency: number; paper_ids: string[] }>
  question_count: number
  coverage_analysis: { classification_coverage: number; total_questions: number; classified_questions: number }
  marks_distribution: {
    one_mark: { count: number; percentage: number }
    five_mark: { count: number; percentage: number }
    ten_mark: { count: number; percentage: number }
    other: { count: number; percentage: number }
  } | null
}

type Filter = 'all' | 'mid1' | 'mid2' | 'semester'

const FILTERS: { value: Filter; label: string; comingSoon?: boolean }[] = [
  { value: 'all',      label: 'All Papers' },
  { value: 'semester', label: 'Semester' },
]

export function BetaAnalysis() {
  const { user } = useAuthStore()
  const { prefs } = usePrefsStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [profile, setProfile] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get('subject_id') || '')
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>(prefs.defaultExamFilter)
  const [showAllQ, setShowAllQ] = useState(false)

  // "Run New Analysis" button sets ?reset=1 in the URL.
  // This effect detects it, clears all state, and removes the param so
  // refreshing the page doesn't reset again.
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      setSelectedSubject('')
      setAnalysis(null)
      setError('')
      setFilter('semester')
      setShowAllQ(false)
      setSearchParams({}, { replace: true })   // clean the URL: /analysis?reset=1 → /analysis
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [searchParams])

  // Load profile → subjects
  useEffect(() => {
    if (!user) return
    getUserProfile(user.id).then(async (prof) => {
      setProfile(prof)
      if (prof?.current_semester && prof?.regulation) {
        const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)

        // ── Canonical subject guarantee ───────────────────────────────────────
        // Always show all 5 subjects for the semester regardless of DB gaps.
        // Map: profile semester (1 or 2) → canonical subject list
        const CANONICAL: Record<string, Array<{ id: string; name: string; code: string; semester: number; regulation: string }>> = {
          '1-R22': [
            { id: 'A6CS05', name: 'Data Structures',                               code: 'A6CS05', semester: 1, regulation: 'R22' },
            { id: 'A6IT02', name: 'Object Oriented Programming through Java',      code: 'A6IT02', semester: 1, regulation: 'R22' },
            { id: 'A6CS02', name: 'Digital Electronics and Computer Organization', code: 'A6CS02', semester: 1, regulation: 'R22' },
            { id: 'A6CS07', name: 'Software Engineering',                          code: 'A6CS07', semester: 1, regulation: 'R22' },
            { id: 'A6BS03', name: 'Computer Oriented Statistical Methods',         code: 'A6BS03', semester: 1, regulation: 'R22' },
          ],
          '2-R22': [
            { id: 'A6HS08', name: 'Business Economics and Financial Analysis',     code: 'A6HS08', semester: 2, regulation: 'R22' },
            { id: 'A6CS08', name: 'Discrete Mathematics',                          code: 'A6CS08', semester: 2, regulation: 'R22' },
            { id: 'A6CS09', name: 'Database Management Systems',                   code: 'A6CS09', semester: 2, regulation: 'R22' },
            { id: 'A6CS11', name: 'Operating System',                              code: 'A6CS11', semester: 2, regulation: 'R22' },
            { id: 'A6CS13', name: 'Software Testing Fundamentals',                 code: 'A6CS13', semester: 2, regulation: 'R22' },
          ],
        }

        const fallbackKey = `${prof.current_semester}-${prof.regulation}`
        const canonical = CANONICAL[fallbackKey]
        let finalSubs = subs || []

        if (canonical) {
          // Merge: DB UUIDs take priority, canonical fills any gaps
          const dbByCode = new Map(finalSubs.map(s => [s.code, s]))
          finalSubs = canonical.map(f => {
            const live = dbByCode.get(f.code)
            // Use real DB row (preserves UUID needed for API calls) + canonical name
            return live ? { ...live, name: f.name } : f
          })
        }

        setSubjects(finalSubs)
      }
    }).finally(() => setProfileLoading(false))
  }, [user])

  // Auto-analyze if subject_id came from URL
  useEffect(() => {
    const id = searchParams.get('subject_id')
    if (id && subjects.length > 0 && !analysis && !loading) {
      setSelectedSubject(id)
      runAnalysis(id)
    }
  }, [subjects])

  async function runAnalysis(subjectId?: string) {
    const id = subjectId || selectedSubject
    if (!id) return
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const report = await generateAnalysis(id, profile?.regulation || 'R22', filter !== 'all' ? filter : undefined)
      setAnalysis(report)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed'
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('connect')) {
        setError('Backend server is not running. Start it with: cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || ''

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <AnalysisLoadingState subjectName="your profile" />
      </div>
    )
  }

  if (loading && !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <AnalysisLoadingState subjectName={selectedSubjectName} />
      </div>
    )
  }

  if (!profile?.current_semester) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <main className="flex items-center justify-center min-h-[60vh] px-lg">
          <div className="glass-card rounded-2xl p-xl text-center max-w-md">
            <span className="material-symbols-outlined text-[64px] text-primary mb-base block">school</span>
            <h2 className="font-headline text-headline-md text-on-surface mb-sm">Complete Your Profile</h2>
            <p className="text-on-surface-variant text-body-md mb-xl">
              Set up your semester and regulation to access analysis
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-lg py-md bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all"
            >
              Complete Onboarding
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <NavBar activeTab="analysis" />

      <div className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
        {/* Page title */}
        <div className="mb-xl">
          <h1 className="font-headline text-headline-lg text-on-surface mb-xs">Exam Analysis</h1>
          <p className="text-on-surface-variant text-body-md">
            Smart insights from MLRIT past papers — know what's coming before you walk in
          </p>
        </div>

        {/* Control panel */}
        <div className="glass-card rounded-2xl p-lg mb-xl" data-tour="tour-analysis-subject">
          <div className="grid sm:grid-cols-2 gap-lg mb-lg">
            <div>
              <label className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider block mb-sm">Semester</label>
              <div className="px-md py-md bg-surface-container border border-outline-variant rounded-xl text-on-surface font-body-md">
                Semester {profile.current_semester} · {profile.regulation}
              </div>
            </div>
            <div>
              <label className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider block mb-sm">Subject</label>
              <SubjectDropdown
                subjects={subjects}
                value={selectedSubject}
                onChange={setSelectedSubject}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-sm mb-lg">
            {FILTERS.map(f => (
              <button
                key={f.value}
                disabled={!!f.comingSoon}
                onClick={() => {
                  if (f.comingSoon) return
                  setFilter(f.value)
                  if (selectedSubject) {
                    const id = selectedSubject
                    setLoading(true)
                    setError('')
                    setAnalysis(null)
                    generateAnalysis(
                      id,
                      profile?.regulation || 'R22',
                      f.value !== 'all' ? f.value : undefined
                    )
                      .then(report => setAnalysis(report))
                      .catch(e => setError(e instanceof Error ? e.message : 'Analysis failed'))
                      .finally(() => setLoading(false))
                  }
                }}
                className={`relative px-md py-xs rounded-xl text-body-sm font-bold border transition-all
                  ${f.comingSoon
                    ? 'opacity-40 cursor-not-allowed bg-surface-container border-outline-variant text-on-surface-variant'
                    : filter === f.value && f.value === 'semester'
                      ? 'bg-primary text-on-primary border-primary shadow-[0_0_12px_2px_rgba(var(--primary-rgb),0.45)]'
                      : filter === f.value
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline'
                  }`}
              >
                {f.label}
                {/* Glow ring on Semester when selected */}
                {f.value === 'semester' && filter === 'semester' && (
                  <span className="absolute inset-0 rounded-xl animate-pulse ring-2 ring-primary/40 pointer-events-none" />
                )}
                {/* Coming Soon badge on Mid chips */}
                {f.comingSoon && (
                  <span className="ml-xs text-[9px] font-bold uppercase tracking-wider bg-outline-variant text-on-surface-variant px-[5px] py-[1px] rounded-full">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => runAnalysis()}
            disabled={!selectedSubject || loading}
            className="w-full py-md bg-primary text-on-primary rounded-xl font-bold text-body-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-md hover:brightness-110 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analysing papers…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                Analyse Papers
              </>
            )}
          </button>

          {error && (
            <div className="mt-md px-md py-sm bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-body-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Subject name header */}
            {selectedSubjectName && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-gray-400 text-sm px-3">{selectedSubjectName}</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Total Questions"
                value={analysis.question_count}
                color="orange"
              />
              <StatCard
                label="Topics Identified"
                value={analysis.most_asked_topics.length}
                color="green"
              />
              <StatCard
                label="Coverage"
                value={`${Math.round(analysis.coverage_analysis.classification_coverage * 100)}%`}
                color="blue"
              />
            </div>

            {/* Unit Distribution */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#f97316] text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>bar_chart</span> Unit Distribution
              </h2>
              <div className="space-y-4">
                {Object.entries(analysis.unit_distribution_classified)
                  .sort((a, b) => b[1].percentage - a[1].percentage)
                  .map(([unit, data]) => (
                    <div key={unit}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-300 font-medium">{unit}</span>
                        <span className="text-gray-400 font-mono text-xs">{data.count}q · {data.percentage}%</span>
                      </div>
                      <div className="bg-white/8 rounded-full h-2">
                        <div
                          className="bg-[#f97316] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(data.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 2-col grid: Most Asked + High Probability */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Most Asked Topics */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f97316] text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>target</span> Most Asked Topics
                </h2>
                <div className="space-y-2.5">
                  {analysis.most_asked_topics.slice(0, 8).map((topic, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/4 hover:bg-white/7 rounded-xl transition-colors">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="text-white text-sm font-medium truncate">{topic.topic}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{topic.unit}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={topic.priority} />
                        <span className="text-gray-400 text-xs font-mono w-10 text-right">{topic.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Probability Topics */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#10b981] text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>trending_up</span> High Probability
                </h2>
                <div className="space-y-3">
                  {analysis.high_probability_topics_classified.slice(0, 6).map((topic, idx) => (
                    <div key={idx} className="p-3 bg-white/4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white text-sm font-medium">{topic.topic}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2 ${
                          topic.probability === 'Very High' ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                          : topic.probability === 'High' ? 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30'
                          : 'bg-white/8 text-gray-300 border border-white/10'
                        }`}>
                          {topic.probability}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs mb-2">
                        {topic.question_count}q · {topic.paper_count} papers
                      </div>
                      <div className="bg-white/8 rounded-full h-1">
                        <div
                          className="bg-[#10b981] h-1 rounded-full"
                          style={{ width: `${topic.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Priority Order */}
            <div className="space-y-0">
              {/* Section header */}
              <div className="relative py-8 text-center mb-2">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div style={{ width: 600, height: 200, background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }} />
                </div>
                <h2 className="relative font-heading text-3xl font-bold text-white flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-[#f97316] text-[30px]" style={{fontVariationSettings:"'FILL' 1"}}>bolt</span> Study Priority Order
                </h2>
                <p className="relative text-gray-400 mt-1 text-base">Ranked by exam frequency — start from #1 and work down</p>
              </div>

              {/* Intelligence banner — dynamic */}
              <div className="px-5 py-4 rounded-xl border border-[#f97316]/30 mb-6" style={{ background: 'rgba(249,115,22,0.07)' }}>
                <p className="text-white text-sm leading-relaxed">
                  <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[#f97316] text-[16px] align-middle" style={{fontVariationSettings:"'FILL' 1"}}>bolt</span></span>{' '}PaperIQ analysed <span className="font-bold text-[#f97316]">{analysis.question_count} questions</span> from past papers — here's{' '}
                  <span className="text-[#f97316] font-semibold">exactly</span> where to focus. {(() => {
                    const top = analysis.study_priority_order[0]
                    const top2 = analysis.study_priority_order[1]
                    const topPct = (top?.percentage ?? 0) + (top2?.percentage ?? 0)
                    return top && top2
                      ? `${top.unit} and ${top2.unit} account for ${topPct.toFixed(0)}% of all exam questions — start there.`
                      : top
                      ? `${top.unit} is your highest-weight unit at ${top.percentage}%.`
                      : ''
                  })()}
                </p>
              </div>

              {/* Sticky priority nav */}
              <div className="sticky top-[57px] z-20 py-2 px-4 rounded-full border border-white/8 mb-6 overflow-x-auto"
                style={{ background: 'rgba(7,7,13,0.92)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center gap-5 whitespace-nowrap justify-center">
                  <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Priority:</span>
                  {analysis.study_priority_order.slice(0, 5).map((item, i) => (
                    <span key={item.unit} className={`font-mono text-sm font-bold transition-colors ${
                      i === 0 ? 'text-[#f97316]' : i === 1 ? 'text-white/80' : i === 2 ? 'text-white/60' : 'text-white/35'
                    }`}>
                      #{item.priority} {item.unit}
                    </span>
                  ))}
                </div>
              </div>

              {/* Priority cards */}
              <div className="space-y-5">
                {analysis.study_priority_order.slice(0, 5).map((item) => {
                  const isTop = item.priority === 1
                  const isSecond = item.priority === 2
                  const borderColor = isTop
                    ? '#f97316'
                    : isSecond
                    ? 'rgba(249,115,22,0.6)'
                    : item.priority === 3
                    ? 'rgba(255,255,255,0.25)'
                    : item.priority === 4
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.08)'
                  const cardBg = isTop
                    ? 'linear-gradient(90deg, rgba(249,115,22,0.07) 0%, rgba(15,15,15,0.75) 60%)'
                    : 'rgba(15,15,15,0.75)'
                  const glowStyle = isTop
                    ? { boxShadow: '0 0 20px rgba(249,115,22,0.18)', borderColor: '#f97316' }
                    : {}

                  return (
                    <div
                      key={item.unit}
                      className="rounded-2xl overflow-hidden border transition-all duration-200 hover:border-white/20 group"
                      style={{
                        borderLeft: `6px solid ${borderColor}`,
                        background: cardBg,
                        backdropFilter: 'blur(16px)',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        borderRight: '1px solid rgba(255,255,255,0.07)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        ...glowStyle,
                      }}
                    >
                      <div className="p-6 space-y-5">
                        {/* Row 1: badge + name + % */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {/* Priority badge */}
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 ${
                              isTop
                                ? 'bg-[#f97316] text-white'
                                : isSecond
                                ? 'border-2 border-[#f97316] text-[#f97316]'
                                : 'border-2 border-white/20 text-gray-400'
                            }`}
                            style={isTop ? { boxShadow: '0 0 14px rgba(249,115,22,0.5)' } : {}}>
                              {item.priority}
                            </div>
                            <div>
                              <h3 className="font-heading text-xl font-bold text-white">{item.unit}</h3>
                              <p className="text-gray-300 text-[15px] leading-relaxed mt-0.5">{item.recommendation}</p>
                            </div>
                          </div>
                          {/* Big % */}
                          <div className="text-right shrink-0 sm:pl-6">
                            <div className={`font-mono font-bold leading-none ${
                              isTop ? 'text-5xl text-[#f97316]'
                              : isSecond ? 'text-4xl text-[#f97316]/80'
                              : 'text-3xl text-white/60'
                            }`}>
                              {item.percentage.toFixed(1)}%
                            </div>
                            <div className="font-mono text-xs text-gray-500 mt-1">of exam</div>
                            <div className="font-mono text-xs text-gray-500">{item.question_count} questions</div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/6" />

                        {/* Focus topics */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-[#f97316]" style={{fontVariationSettings:"'FILL' 1"}}>target</span> Focus Topics</p>
                          <div className="flex flex-wrap gap-2.5">
                            {item.top_topics.map((t, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-0 rounded-lg overflow-hidden border transition-all hover:border-[#f97316]/40"
                                style={{
                                  background: isTop ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.06)',
                                  borderColor: isTop ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.12)',
                                }}
                              >
                                <span className="px-4 py-2 text-[14px] font-medium text-white leading-snug"
                                  style={{ maxWidth: 320, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                  {t.topic}
                                </span>
                                <div className="h-8 w-px mx-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
                                <span className="px-3 py-2 font-mono text-[13px] font-bold text-[#f97316]">{t.count}</span>
                              </div>
                            ))}
                            {/* CTA */}
                            <button
                              onClick={() => navigate(`/analysis/${selectedSubject}/unit/${encodeURIComponent(item.unit)}/questions`)}
                              className="px-4 py-2 text-sm font-semibold text-[#f97316] border border-[#f97316]/30 rounded-lg hover:bg-[#f97316]/10 transition-all"
                            >
                              View Important Questions ({item.question_count}) →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Marks Distribution — 1M / 5M / 10M */}
            {analysis.marks_distribution && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-heading text-xl font-bold mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f97316] text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>grade</span>
                  Marks Distribution
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: '1-Mark', key: 'one_mark', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
                    { label: '5-Mark', key: 'five_mark', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
                    { label: '10-Mark', key: 'ten_mark', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
                    { label: 'Other', key: 'other', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
                  ].map(({ label, key, color, bg, border }) => {
                    const d = analysis.marks_distribution![key as keyof typeof analysis.marks_distribution] as { count: number; percentage: number }
                    return (
                      <div key={key} className="rounded-xl p-4 border" style={{ background: bg, borderColor: border }}>
                        <div className="font-heading text-2xl font-bold mb-0.5" style={{ color }}>{d.count}</div>
                        <div className="text-xs text-gray-400 mb-2">{label} Questions</div>
                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(d.percentage, 100)}%`, background: color }} />
                        </div>
                        <div className="text-[10px] font-mono mt-1" style={{ color }}>{d.percentage}%</div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-500">
                  Breakdown of question types by marks. Focus on <span className="text-[#f97316] font-semibold">10-mark</span> long-answers for maximum score — they carry the highest weight.
                </p>
              </div>
            )}

            {/* Repeated Questions */}
            {analysis.repeated_questions?.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f97316] text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>replay</span> Repeated Questions
                  </h2>
                  <button
                    onClick={() => setShowAllQ(!showAllQ)}
                    className="text-sm text-[#f97316] hover:text-[#ea580c] transition-colors font-medium"
                  >
                    {showAllQ ? 'Show less' : `View all ${analysis.repeated_questions.length}`}
                  </button>
                </div>
                <div className="space-y-3">
                  {analysis.repeated_questions.slice(0, showAllQ ? undefined : 5).map((q, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-white/4 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {q.frequency}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 text-sm leading-relaxed">{q.question_text}</p>
                        <p className="text-gray-500 text-xs mt-1">{q.paper_ids.length} papers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty — no analysis yet */}
        {!analysis && !loading && (
          <div className="glass-card rounded-2xl p-huge text-center">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-base block">analytics</span>
            <h3 className="font-headline text-headline-md text-on-surface mb-sm">Select a Subject to Analyse</h3>
            <p className="text-on-surface-variant text-body-md">
              Choose a subject above and click Analyse Papers to see topic priorities, repeat patterns, and what's likely to come in your exam
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

// ─── SubjectDropdown — custom branded dropdown ───────────────────────────────

function SubjectDropdown({
  subjects,
  value,
  onChange,
}: {
  subjects: Subject[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const selected = subjects.find(s => s.id === value)

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`
          w-full flex items-center justify-between
          px-4 py-3 rounded-xl
          bg-[#141416] border transition-all duration-200
          text-body-md text-left
          ${open
            ? 'border-[#ff6600] shadow-[0_0_0_1px_#ff6600]'
            : 'border-[#222226] hover:border-[#333339]'
          }
        `}
      >
        <span className={selected ? 'text-white' : 'text-neutral-500'}>
          {selected ? selected.name : 'Choose a subject…'}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Options panel */}
      {open && (
        <div className="
          absolute z-50 w-full mt-2
          bg-[#141416] border border-[#222226] rounded-xl
          shadow-[0_12px_30px_-4px_rgba(0,0,0,0.7)]
          max-h-64 overflow-y-auto
        ">
          {subjects.map(s => {
            const isSelected = s.id === value
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(s.id); setOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3
                  text-left transition-colors duration-150
                  ${isSelected
                    ? 'bg-[#ff6600]/8 text-[#ff6600]'
                    : 'text-neutral-400 hover:bg-[#1a1a1d] hover:text-neutral-100'
                  }
                `}
              >
                {/* Subject code badge */}
                <span className={`
                  shrink-0 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md
                  ${isSelected
                    ? 'bg-[#ff6600]/10 text-[#ff6600]'
                    : 'bg-neutral-800 text-neutral-400'
                  }
                `}>
                  {s.code}
                </span>

                {/* Subject name */}
                <span className="flex-1 text-sm leading-snug">
                  {s.name}
                </span>

                {/* Checkmark for selected */}
                {isSelected && (
                  <svg className="w-4 h-4 text-[#ff6600] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── small helpers ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: 'orange' | 'green' | 'blue' }) {
  const colorMap = {
    orange: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    green:  { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    blue:   { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  }
  const c = colorMap[color]
  return (
    <div className={`glass-card rounded-2xl p-lg border ${c.bg} ${c.border}`}>
      <div className={`font-headline text-headline-lg mb-xs ${c.text}`}>{value}</div>
      <div className="text-on-surface-variant text-body-sm">{label}</div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    'Very High': 'bg-red-500/20 text-red-400 border-red-500/30',
    'High':      'bg-primary/20 text-primary border-primary/30',
    'Medium':    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  const cls = map[priority] || 'bg-surface-container text-on-surface-variant border-outline-variant'
  return (
    <span className={`text-[10px] px-sm py-xs rounded-full border font-bold uppercase tracking-wider ${cls}`}>
      {priority}
    </span>
  )
}
