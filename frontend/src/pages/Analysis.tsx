/**
 * Analysis — Screens 11 (select), 12 (results), 13 (study priority)
 * Route: /analysis?subject_id=...
 *
 * Step 1: Select subject + filter chips
 * Step 2: Loading skeleton
 * Step 3: Full results — unit distribution, most asked, high probability, study priority, repeated Q's
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/useAppStore'
import { getUserProfile, getSubjectsForSemester, generateAnalysis } from '../lib/api'
import { OFFICIAL_R22_3_1_SUBJECTS, filterTo31Subjects } from '../constants/r22_3_1'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { MarksBreakdown } from '../components/MarksBreakdown'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { SearchableCombobox } from '../components/SearchableCombobox'
import { AnalysisLoadingState } from '../components/AnalysisLoadingState'
import { PageTransition } from '../components/ui/PageTransition'
import { Tooltip } from '../components/ui/Tooltip'
import type { Subject, UserProfile } from '../types'

const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 300, damping: 20 }

type Filter = 'all' | 'mid1' | 'mid2' | 'semester'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'All Papers' },
  { value: 'mid1',     label: 'Mid-Term 1' },
  { value: 'mid2',     label: 'Mid-Term 2' },
  { value: 'semester', label: 'End-Semester' },
]

// ── Guaranteed subject fallback map ──────────────────────────────────────
// Used when Supabase returns fewer subjects than expected (DB gap / semester
// number mismatch). Keyed by "semester-regulation". These are the canonical
// MLRIT R22 CSE subject lists so the UI is never broken by missing DB rows.
// MLRIT Autonomous R22 — 3-1 canonical subjects allowlist
const SUBJECT_FALLBACK: Record<string, Array<{ id: string; name: string; code: string; semester: number; regulation: string }>> = {
  '1-R22': OFFICIAL_R22_3_1_SUBJECTS.map((s) => ({ id: s.id, name: s.name, code: s.code, semester: 1, regulation: 'R22' })),
  '3-1-R22': OFFICIAL_R22_3_1_SUBJECTS.map((s) => ({ id: s.id, name: s.name, code: s.code, semester: 1, regulation: 'R22' })),
}

// ── Priority card ────────────────────────────────────────────────────────────
function PriorityCard({ item, rank, subjectId, onViewUnit }: {
  item: any; rank: number; subjectId: string; onViewUnit: (unit: string) => void
}) {
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const isTop = rank === 1
  const isSecond = rank === 2
  const borderColor = isTop ? '#f97316' : isSecond ? 'rgba(249,115,22,0.6)' : rank === 3 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'
  const cardBg = isTop ? 'linear-gradient(90deg, rgba(249,115,22,0.07) 0%, rgba(15,15,15,0.75) 60%)' : 'rgba(15,15,15,0.75)'
  const glowStyle = isTop ? { boxShadow: '0 0 20px rgba(249,115,22,0.18)' } : {}

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border transition-all hover:border-white/20"
      style={{ borderLeft: `6px solid ${borderColor}`, background: cardBg, backdropFilter: 'blur(16px)',
        borderTop:'1px solid rgba(255,255,255,0.07)', borderRight:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)', ...glowStyle }}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SNAPPY, delay: rank * 0.06 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01, boxShadow: '0 0 30px rgba(249,115,22,0.18)' }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
    >
      <div className="p-6 space-y-5">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 ${
                isTop ? 'bg-primary-container text-white' : isSecond ? 'border-2 border-primary-container text-primary-container' : 'border-2 border-white/20 text-gray-400'
              }`}
              style={isTop ? { boxShadow: '0 0 14px rgba(249,115,22,0.5)' } : {}}
            >
              {rank}
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold text-white">{item.unit}</h3>
              <p className="text-gray-300 text-[15px] leading-relaxed mt-0.5">{item.recommendation}</p>
            </div>
          </div>
          <div className="text-right shrink-0 sm:pl-6">
            <div className={`font-mono font-bold leading-none ${isTop ? 'text-5xl text-primary-container' : isSecond ? 'text-4xl text-primary-container/80' : 'text-3xl text-white/60'}`}>
              {item.percentage?.toFixed(1) ?? '—'}%
            </div>
            <div className="font-mono text-xs text-gray-500 mt-1">of exam</div>
            <div className="font-mono text-xs text-gray-500">{item.question_count} questions</div>
          </div>
        </div>

        <div className="border-t border-white/6" />

        {/* Focus topics */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px] text-[#f97316]" style={{fontVariationSettings:"'FILL' 1"}}>target</span> Focus Topics</p>
          <div className="flex flex-wrap gap-2.5">
            {(item.top_topics || []).slice(0,5).map((t: any, i: number) => (
              <div
                key={i}
                className="flex items-center rounded-lg overflow-hidden border transition-all hover:border-primary-container/40"
                style={{ background: isTop ? 'rgba(249,115,22,0.08)' : 'rgba(255,255,255,0.06)', borderColor: isTop ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.12)' }}
              >
                <span className="px-4 py-2 text-[14px] font-medium text-white">{t.topic}</span>
                <div className="h-8 w-px" style={{background:'rgba(255,255,255,0.1)'}} />
                <span className="px-3 py-2 font-mono text-[13px] font-bold text-primary-container">{t.count}</span>
              </div>
            ))}
            <button
              onClick={() => navigate(`/analysis/${subjectId}/unit/${encodeURIComponent(item.unit)}/questions`)}
              className="px-4 py-2 text-sm font-semibold text-primary-container border border-primary-container/30 rounded-lg hover:bg-primary-container/10 transition-all"
            >
              View Important Questions ({item.question_count}) →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function Analysis() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  const { selectedSubjectId, activeFilter, setSelectedSubjectId, setActiveFilter } = useAppStore()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [showAllQ, setShowAllQ] = useState(false)
  const [repeatedMarkFilter, setRepeatedMarkFilter] = useState<'all' | '10m_direct' | '5m_sub' | '1m'>('all')

  // Load profile + subjects (profile is optional now)
  useEffect(() => {
    // Load strict 3-1 R22 subjects by default (no profile required)
    const allR22Subjects = OFFICIAL_R22_3_1_SUBJECTS.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      semester: 1,
      regulation: 'R22',
    }))
    setSubjects(allR22Subjects)
    setProfileLoading(false)
    
    // Try to load user profile if logged in (optional enhancement)
    if (user) {
      getUserProfile(user.id).then(async prof => {
        setProfile(prof)
        if (prof?.regulation) {
          const rawSubs = await getSubjectsForSemester(1, prof.regulation)
          const filtered = filterTo31Subjects(rawSubs || [])
          const finalSubs = filtered.length > 0 ? filtered : allR22Subjects
          setSubjects(finalSubs as any)
        }
      }).catch(err => {
        // Profile load failed, but that's okay - we have fallback subjects
        console.warn('Profile load failed, using fallback subjects:', err)
      })
    }
  }, [user])

  // Sync searchParams subject_id on mount/change
  useEffect(() => {
    const id = searchParams.get('subject_id')
    if (id) {
      setSelectedSubjectId(id)
    }
  }, [searchParams, setSelectedSubjectId])

  // Auto-run if subject_id came from URL or is already set in store when subjects load
  useEffect(() => {
    const id = searchParams.get('subject_id') || selectedSubjectId
    if (id && subjects.length > 0 && !analysis && !loading) {
      setSelectedSubjectId(id)
      runAnalysis(id)
    }
  }, [subjects])

  async function runAnalysis(subjectId?: string) {
    const id = subjectId || selectedSubjectId || ''
    if (!id) return
    setLoading(true); setError(''); setAnalysis(null); setLoadingComplete(false)
    try {
      // Use profile regulation if available, otherwise default to R22
      const regulation = profile?.regulation || 'R22'
      const report = await generateAnalysis(id, regulation, activeFilter !== 'all' ? activeFilter : undefined)
      setAnalysis(report)
    } catch (e: any) {
      setError(e.message?.includes('fetch') || e.message?.includes('connect')
        ? 'Unable to connect to PaperIQ right now. Please check your connection or try again shortly.'
        : 'We could not complete your analysis right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedSubjectName = subjects.find(s => s.id === (selectedSubjectId || ''))?.name || ''

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32">
          <div className="skeleton h-10 w-64 mb-8 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
            {[1,2,3,4,5,6].map(i => <div key={i} className="md:col-span-4 skeleton rounded-2xl h-64" />)}
          </div>
        </main>
      </div>
    )
  }

  if (!profile?.current_semester) {
    // No profile is fine - we'll use default semester 1 display
    // Just make sure we have fallback subjects loaded
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="analysis" />

      <PageTransition>
        <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
          {/* ── Select subject header (Screen 11 style) ─────────────── */}
          <header className="mb-xxl flex flex-col md:flex-row md:items-end justify-between gap-xl">
            <div className="space-y-sm">
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#ffb690]" />
                <span className="font-data-label text-data-label text-primary uppercase tracking-widest">Performance Dashboard</span>
              </div>
              <h1 className="font-headline text-headline-lg md:text-5xl text-on-surface">Select Subject for Deep-Dive</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                Drill down into specific coursework metrics to uncover patterns and exam leverage points.
              </p>
            </div>
            {/* Filter chips */}
            <div className="flex flex-wrap gap-sm bg-[#0f0f0f] p-xs border border-outline-variant rounded-2xl">
              {FILTERS.map(f => {
                const isLocked = f.value === 'mid1' || f.value === 'mid2'
                return (
                  <motion.button
                    key={f.value}
                    onClick={() => !isLocked && setActiveFilter(f.value)}
                    disabled={isLocked}
                    title={isLocked ? 'Coming soon' : undefined}
                    className={`px-md py-sm rounded-xl font-data-label text-data-label transition-all relative ${
                      isLocked
                        ? 'text-on-surface-variant/30 cursor-not-allowed'
                        : activeFilter === f.value
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-variant hover:bg-white/5'
                    }`}
                    whileHover={shouldReduceMotion || isLocked ? {} : { scale: 1.05 }}
                    whileTap={shouldReduceMotion || isLocked ? {} : { scale: 0.95 }}
                  >
                    {f.label}
                    {isLocked && (
                      <span className="material-symbols-outlined text-[11px] absolute -top-1 -right-1 text-outline/50" style={{fontVariationSettings:"'FILL' 1"}}>lock</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </header>

          {/* Subject picker + run button */}
          <motion.div
            className="glass-card rounded-2xl p-lg mb-xxl relative z-50"
            data-tour="tour-analysis-subject"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_SNAPPY}
          >
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider block mb-2">Semester</label>
                <div className="px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-white font-medium text-sm">
                  {profile?.current_semester ? `Semester ${profile.current_semester} · ${profile.regulation}` : 'All Semesters · R22'}
                </div>
              </div>
              <div>
                <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider block mb-2">Subject</label>
                <SearchableCombobox
                  value={selectedSubjectId || ''}
                  onChange={v => { setSelectedSubjectId(v); setAnalysis(null) }}
                  placeholder="Choose or type a subject (e.g., Java, Data Structures)..."
                  options={subjects.map(s => {
                    return { value: s.id, label: s.name, sublabel: s.code }
                  })}
                />
              </div>
            </div>
            <Tooltip content={selectedSubjectId ? "Start AI pattern recognition" : "Select a subject first"} placement="bottom">
              <motion.button
                onClick={() => runAnalysis()}
                disabled={!selectedSubjectId || loading}
                className="w-full py-3.5 bg-primary-container hover:brightness-110 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-on-primary-container"
                whileHover={shouldReduceMotion || (!selectedSubjectId || loading) ? {} : { scale: 1.03, boxShadow: '0 0 24px rgba(249,115,22,0.5)' }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analysing papers…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">bolt</span>Analyse Papers</>
                )}
              </motion.button>
            </Tooltip>
            {error && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm whitespace-pre-line">{error}</div>
            )}
          </motion.div>

          {/* ── LOADING skeleton ─────────────────────────────────────── */}
          {(loading || (analysis && !loadingComplete)) && (
            <AnalysisLoadingState 
              subjectName={selectedSubjectName} 
              questionCount={analysis?.question_count}
              coveragePct={analysis?.coverage_analysis?.classification_coverage}
              isBackendDone={!loading && analysis !== null}
              onComplete={() => setLoadingComplete(true)}
            />
          )}

          {/* ── ANALYSIS RESULTS (Screen 12) ─────────────────────────── */}
          {analysis && loadingComplete && (
            <div className="space-y-6">
              {/* Subject name divider */}
              {selectedSubjectName && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-on-surface-variant text-sm px-3">{selectedSubjectName}</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
                {/* Priority score */}
                <div className="md:col-span-4 glass-card p-xl flex flex-col justify-between relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 blur-3xl -mr-16 -mt-16" />
                  <div>
                    <div className="flex justify-between items-center mb-base">
                      <span className="font-data-label text-data-label text-primary-container uppercase tracking-widest">Priority Score</span>
                    </div>
                    <div className="flex items-baseline gap-sm">
                      <span className="font-headline text-[64px] leading-none text-primary-container" style={{filter:'drop-shadow(0 0 8px rgba(249,115,22,0.4))'}}>
                        {Math.round(analysis.coverage_analysis?.classification_coverage * 100) || analysis.question_count}
                      </span>
                      <span className="text-2xl text-primary-container">{analysis.coverage_analysis ? '%' : 'Q'}</span>
                    </div>
                  </div>
                  <div className="mt-base">
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden mb-sm">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{width:`${Math.min(analysis.coverage_analysis?.classification_coverage * 100 || 75, 100)}%`}}
                      />
                    </div>
                    <p className="font-headline text-on-surface text-lg">
                      {(analysis.coverage_analysis?.classification_coverage || 0) >= 0.7 ? 'HIGH CONFIDENCE' : 'MID CONFIDENCE'}
                    </p>
                  </div>
                </div>

                {/* Key insights */}
                <div className="md:col-span-8 glass-card p-xl rounded-xl">
                  <h3 className="font-headline text-on-surface mb-lg flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">lightbulb</span>Key Insights
                  </h3>
                  <div className="space-y-base">
                    {(analysis.most_asked_topics || []).slice(0,3).map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-base group">
                        <span className="material-symbols-outlined text-primary mt-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        <p className="font-body-lg text-on-surface">
                          <span className="font-bold text-primary">{t.topic}</span> appeared in{' '}
                          <span className="text-primary font-bold">{t.percentage}%</span> of analysed papers.
                        </p>
                      </div>
                    ))}
                    {(analysis.most_asked_topics || []).length === 0 && (
                      <p className="text-on-surface-variant">No topic data available for this subject yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Most asked + unit distribution */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
                {/* Most asked table */}
                <motion.section
                  className="md:col-span-7 glass-card overflow-hidden rounded-xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...SPRING_SNAPPY, delay: 0 * 0.07 }}
                >
                  <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-headline text-on-surface">Most Asked Topics</h3>
                    <span className="font-data-label text-data-label text-on-surface-variant">SEASONAL TRENDS</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-high/50">
                          {['RANK','TOPIC','FREQUENCY','EVIDENCE'].map(h => (
                            <th key={h} className="p-lg font-data-label text-data-label text-on-surface-variant">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="font-body-md divide-y divide-outline-variant">
                        {(analysis.most_asked_topics || []).slice(0,8).map((topic: any, i: number) => (
                          <tr key={i} className="hover:bg-surface-container transition-colors">
                            <td className="p-lg font-data-value text-on-surface-variant">#{i+1}</td>
                            <td className="p-lg font-bold">{topic.topic}</td>
                            <td className="p-lg text-primary font-data-value">{topic.count ?? topic.percentage + '%'}</td>
                            <td className="p-lg">
                              <span className={`px-sm py-xs rounded-lg text-xs font-bold border ${
                                topic.priority === 'Very High' ? 'bg-primary/10 text-primary border-primary/20' :
                                topic.priority === 'High' ? 'bg-primary/10 text-primary border-primary/20' :
                                'bg-secondary-container text-on-secondary-container border-transparent'
                              }`}>
                                {topic.priority || 'Medium'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.section>

                {/* Unit distribution */}
                <motion.section
                  className="md:col-span-5 glass-card p-xl rounded-xl"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...SPRING_SNAPPY, delay: 1 * 0.07 }}
                >
                  <h3 className="font-headline text-on-surface mb-lg">Unit Distribution</h3>
                  <div className="space-y-xl">
                    {Object.entries(analysis.unit_distribution_classified || {})
                      .sort((a: any, b: any) => b[1].percentage - a[1].percentage)
                      .map(([unit, data]: [string, any]) => (
                        <div key={unit} className="space-y-sm">
                          <div className="flex justify-between items-center text-on-surface-variant">
                            <span className="font-data-label">{unit.toUpperCase()}</span>
                            <span className={`font-data-value ${data.percentage > 25 ? 'text-primary' : ''}`}>{data.percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full"
                              style={{width:`${Math.min(data.percentage, 100)}%`}}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.section>
              </div>

              {/* High probability mini cards */}
              {(analysis.high_probability_topics_classified || []).length > 0 && (
                <motion.section
                  className="space-y-lg"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...SPRING_SNAPPY, delay: 2 * 0.07 }}
                >
                  <h3 className="font-headline text-on-surface">High Probability Topics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                    {(analysis.high_probability_topics_classified || []).slice(0,3).map((topic: any, i: number) => (
                      <div key={i} className="glass-card p-lg flex items-center justify-between rounded-xl">
                        <div className="space-y-xs">
                          <p className="font-headline text-lg">{topic.topic}</p>
                          <p className={`text-body-sm font-bold ${topic.probability === 'Very High' ? 'text-success' : 'text-primary'}`}>
                            Probability: {topic.probability}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-data-label text-on-surface-variant">CONFIDENCE</p>
                          <p className="font-data-value text-xl text-primary">{(topic.confidence || 0.8).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Marks Distribution Breakdown - NEW FEATURE */}
              {analysis.id && <MarksBreakdown analysisId={analysis.id} />}

              {/* ── Study Priority Order (Screen 13) ─────────────────── */}
              {(analysis.study_priority_order || []).length > 0 && (
                <motion.section
                  className="space-y-lg"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...SPRING_SNAPPY, delay: 3 * 0.07 }}
                >
                  {/* Header */}
                  <div className="relative py-xl text-center" style={{background:'radial-gradient(circle at center, rgba(249,115,22,0.08) 0%, transparent 70%)'}}>
                    <h2 className="font-headline text-3xl font-bold text-white flex items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-primary-container text-[30px]" style={{fontVariationSettings:"'FILL' 1"}}>menu_book</span> Study Priority Order
                    </h2>
                    <p className="text-on-surface-variant mt-1">Ranked by exam frequency — start from #1 and work down</p>
                  </div>

                  {/* Intelligence banner */}
                  <div className="px-5 py-4 rounded-xl border border-primary-container/30" style={{background:'rgba(249,115,22,0.07)'}}>
                    <p className="text-white text-sm leading-relaxed">
                      <span className="inline-flex items-center gap-1 align-middle"><span className="material-symbols-outlined text-[16px] text-primary-container" style={{fontVariationSettings:"'FILL' 1"}}>bolt</span></span>{' '}PaperIQ analysed <span className="font-bold text-primary-container">{analysis.question_count} questions</span> from past papers — here's{' '}
                      <span className="text-primary-container font-semibold">exactly</span> where to focus.
                      {(() => {
                        const t = analysis.study_priority_order[0], t2 = analysis.study_priority_order[1]
                        const pct = (t?.percentage ?? 0) + (t2?.percentage ?? 0)
                        return t && t2 ? ` ${t.unit} and ${t2.unit} account for ${pct.toFixed(0)}% of all exam questions — start there.` : ''
                      })()}
                    </p>
                  </div>

                  {/* Sticky priority nav */}
                  <div className="sticky top-[77px] z-20 py-2 px-4 rounded-full border border-white/[0.08] overflow-x-auto"
                    style={{background:'rgba(7,7,13,0.92)', backdropFilter:'blur(12px)'}}>
                    <div className="flex items-center gap-5 whitespace-nowrap justify-center">
                      <span className="font-mono text-xs uppercase tracking-widest text-gray-500">Priority:</span>
                      {(analysis.study_priority_order || []).slice(0,5).map((item: any, i: number) => (
                        <span key={item.unit} className={`font-mono text-sm font-bold transition-colors ${
                          i===0 ? 'text-primary-container' : i===1 ? 'text-white/80' : i===2 ? 'text-white/60' : 'text-white/35'
                        }`}>
                          #{item.priority} {item.unit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Priority cards */}
                  <div className="space-y-5">
                    {(analysis.study_priority_order || []).slice(0,5).map((item: any) => (
                      <PriorityCard
                        key={item.unit}
                        item={item}
                        rank={item.priority}
                        subjectId={selectedSubjectId || ''}
                        onViewUnit={unit => navigate(`/analysis/${selectedSubjectId}/unit/${encodeURIComponent(unit)}/questions`)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Analysis coverage */}
              {analysis.coverage_analysis && (
                <motion.section
                  className="glass-card p-xl rounded-xl bg-gradient-to-br from-surface-container-low to-background"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...SPRING_SNAPPY, delay: 4 * 0.07 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-xl items-center">
                    <div className="md:col-span-1">
                      <h3 className="font-headline text-headline-md">Analysis Coverage</h3>
                      <p className="text-body-sm text-on-surface-variant">Statistical integrity of this report</p>
                    </div>
                    {[
                      { value: analysis.question_count, label: 'QUESTIONS ANALYSED' },
                      { value: `${Math.round((analysis.coverage_analysis.classification_coverage || 0) * 100)}%`, label: 'CLASSIFIED' },
                    ].map(stat => (
                      <div key={stat.label} className="flex flex-col items-center border-r border-outline-variant/30">
                        <span className="font-data-value text-2xl text-primary">{stat.value}</span>
                        <span className="font-data-label text-on-surface-variant">{stat.label}</span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-xs text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
                        <span className="font-data-value text-2xl">High Confidence</span>
                      </div>
                      <span className="font-data-label text-on-surface-variant">AI ENGINE V1.0</span>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Repeated questions — 60-Mark Exam Intelligence */}
              {((analysis.repeated_questions_60m && analysis.repeated_questions_60m.length > 0) || (analysis.repeated_questions && analysis.repeated_questions.length > 0)) && (() => {
                const rawRepeated = (analysis.repeated_questions_60m && analysis.repeated_questions_60m.length > 0) 
                  ? analysis.repeated_questions_60m 
                  : (analysis.repeated_questions || []).map((q: any) => ({
                      ...q,
                      mark_type: q.marks === 10 ? '10m_direct' : q.marks === 5 ? '5m_sub' : q.marks === 1 ? '1m' : 'other',
                      canonical_text: q.canonical_text || q.question_text
                    }));
                
                const filteredRepeated = rawRepeated.filter((q: any) => {
                  if (repeatedMarkFilter === 'all') return true;
                  return q.mark_type === repeatedMarkFilter;
                });

                return (
                  <motion.section
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...SPRING_SNAPPY, delay: 5 * 0.07 }}
                  >
                    <div className="glass-card rounded-2xl p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div>
                          <h2 className="font-headline text-xl font-bold flex items-center gap-2">
                            <span className="text-primary-container">🔁</span> High-Frequency Repeated Questions
                          </h2>
                          <p className="text-xs text-on-surface-variant mt-1 font-mono">
                            MLRIT R22 60M Pattern · Direct 10M and 5M subquestions calculated separately
                          </p>
                        </div>
                        <button onClick={() => setShowAllQ(!showAllQ)} className="text-sm text-primary-container hover:text-primary transition-colors font-medium self-start md:self-auto">
                          {showAllQ ? 'Show less' : `View all ${filteredRepeated.length}`}
                        </button>
                      </div>

                      {/* Filter Chips for Mark Types */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-white/[0.02] rounded-xl border border-white/5">
                        <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mr-1">Filter by Marks:</span>
                        {[
                          { id: 'all', label: `All (${rawRepeated.length})` },
                          { id: '10m_direct', label: `Direct 10M (${rawRepeated.filter((q: any) => q.mark_type === '10m_direct').length})` },
                          { id: '5m_sub', label: `5M Subquestions (${rawRepeated.filter((q: any) => q.mark_type === '5m_sub').length})` },
                          { id: '1m', label: `1M Short (${rawRepeated.filter((q: any) => q.mark_type === '1m').length})` },
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setRepeatedMarkFilter(f.id as any)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              repeatedMarkFilter === f.id
                                ? 'bg-primary-container text-on-primary-container shadow'
                                : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {filteredRepeated.slice(0, showAllQ ? undefined : 6).map((q: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-2 p-4 bg-white/[0.04] rounded-xl hover:border-white/10 border border-transparent transition-all">
                            <div className="flex gap-3 items-start">
                              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                                {q.frequency || q.count}×
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {q.mark_type === '10m_direct' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                      Direct 10M Question
                                    </span>
                                  )}
                                  {q.mark_type === '5m_sub' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                      5M Subquestion
                                    </span>
                                  )}
                                  {q.mark_type === '1m' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                      1M Part A
                                    </span>
                                  )}
                                  <span className="text-gray-500 text-xs font-mono">
                                    {(q.source_papers || q.appearances || []).length} paper occurrence(s)
                                  </span>
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed">{q.canonical_text || q.question_text}</p>
                              </div>
                            </div>

                            {/* Exact Source Papers */}
                            {(q.source_papers || q.appearances) && (q.source_papers || q.appearances).length > 0 && (
                              <div className="ml-12 pl-2 border-l-2 border-white/10 text-xs text-gray-400 space-y-1">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500">Source Papers:</span>
                                <div className="flex flex-wrap gap-2">
                                  {(q.source_papers || q.appearances).map((src: any, sIdx: number) => (
                                    <span key={sIdx} className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono text-[11px] text-gray-300">
                                      {src.source_reference || `${src.paper_title || src.paper_id} · ${src.part || ''} Q${src.question_number || ''} (${src.marks || ''}M)`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {filteredRepeated.length === 0 && (
                          <div className="p-6 text-center text-on-surface-variant text-sm">
                            No repeated questions found in this category.
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>
                );
              })()}
            </div>
          )}

          {/* ── Empty — no analysis yet ────────────────────────────── */}
          {!analysis && !loading && (
            <div className="space-y-lg">
              {/* Bento grid — subject selection preview (Screen 11 style) */}
              {subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
                  {/* Hero card */}
                  {subjects[0] && (
                    <div
                      onClick={() => { setSelectedSubjectId(subjects[0].id) }}
                      className="md:col-span-8 group relative overflow-hidden cursor-pointer rounded-2xl p-xl flex flex-col justify-between min-h-[320px] transition-all"
                      style={{background:'#0f0f0f', border:'1px solid #584237'}}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#ffb690'; (e.currentTarget as HTMLElement).style.background='#161616' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#584237'; (e.currentTarget as HTMLElement).style.background='#0f0f0f' }}
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-start">
                          <div className="p-md bg-primary/10 border border-primary/20 rounded-xl mb-base">
                            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings:"'FILL' 1"}}>account_tree</span>
                          </div>
                          <span className="px-sm py-1 bg-green-500/10 rounded-lg font-data-label text-[10px] text-green-400 border border-green-500/20 uppercase">High Priority</span>
                        </div>
                        <h2 className="font-headline text-headline-md text-on-surface mb-xs">{subjects[0].name}</h2>
                        <p className="font-body-md text-body-md text-on-surface-variant/80">Click to explore frequency analysis, topic ranking, and exam predictions.</p>
                      </div>
                      <div className="mt-xl flex items-center justify-between">
                        <span className="font-data-label text-data-label text-on-surface-variant">{subjects[0].code}</span>
                        <span className="flex items-center gap-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                          Explore Insights <span className="material-symbols-outlined">arrow_forward</span>
                        </span>
                      </div>
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                    </div>
                  )}
                  {/* Smaller subject cards */}
                  {subjects.slice(1, 5).map(subject => (
                    <div
                      key={subject.id}
                      onClick={() => { setSelectedSubjectId(subject.id) }}
                      className="md:col-span-4 group cursor-pointer rounded-2xl p-xl flex flex-col transition-all"
                      style={{background:'#0f0f0f', border:'1px solid #584237'}}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#ffb690'; (e.currentTarget as HTMLElement).style.background='#161616' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#584237'; (e.currentTarget as HTMLElement).style.background='#0f0f0f' }}
                    >
                      <div className="p-md bg-white/5 border border-white/10 rounded-xl w-fit mb-base">
                        <span className="material-symbols-outlined text-on-surface">library_books</span>
                      </div>
                      <h3 className="font-headline text-headline-md text-on-surface mb-xs">{subject.name}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant/80 flex-1">Click to analyse past papers for this subject.</p>
                      <div className="mt-xl flex items-center justify-between">
                        <span className="text-xs font-data-label text-on-surface-variant">{subject.code}</span>
                        <button className="p-sm rounded-lg bg-white/5 hover:bg-primary/20 transition-colors">
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-xl text-center">
                  <span className="text-6xl mb-4 block">🔍</span>
                  <h3 className="font-headline text-2xl font-bold mb-2">Select a Subject to Analyse</h3>
                  <p className="text-on-surface-variant">Choose a subject above and click Analyse Papers to see topic priorities and exam patterns.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </PageTransition>

      <Footer />
      {/* Show feedback: timed (5min) + exit intent popup — after user has seen real value */}
      {analysis && <FeedbackWidget page="analysis_results" timedDelayMs={5 * 60 * 1000} />}
    </div>
  )
}
