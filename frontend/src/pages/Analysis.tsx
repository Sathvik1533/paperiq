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
import { useAuthStore } from '../store/authStore'
import { getUserProfile, getSubjectsForSemester, generateAnalysis } from '../lib/api'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { CustomSelect } from '../components/CustomSelect'
import type { Subject, UserProfile } from '../types'

type Filter = 'all' | 'mid1' | 'mid2' | 'semester'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'All Papers' },
  { value: 'mid1',     label: 'Mid-Term 1' },
  { value: 'mid2',     label: 'Mid-Term 2' },
  { value: 'semester', label: 'End-Semester' },
]

// ── Priority card ────────────────────────────────────────────────────────────
function PriorityCard({ item, rank, subjectId, onViewUnit }: {
  item: any; rank: number; subjectId: string; onViewUnit: (unit: string) => void
}) {
  const navigate = useNavigate()
  const isTop = rank === 1
  const isSecond = rank === 2
  const borderColor = isTop ? '#f97316' : isSecond ? 'rgba(249,115,22,0.6)' : rank === 3 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'
  const cardBg = isTop ? 'linear-gradient(90deg, rgba(249,115,22,0.07) 0%, rgba(15,15,15,0.75) 60%)' : 'rgba(15,15,15,0.75)'
  const glowStyle = isTop ? { boxShadow: '0 0 20px rgba(249,115,22,0.18)' } : {}

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all hover:border-white/20"
      style={{ borderLeft: `6px solid ${borderColor}`, background: cardBg, backdropFilter: 'blur(16px)',
        borderTop:'1px solid rgba(255,255,255,0.07)', borderRight:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)', ...glowStyle }}
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
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function Analysis() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject_id') || '')
  const [filter, setFilter] = useState<Filter>('all')
  const [analysis, setAnalysis] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllQ, setShowAllQ] = useState(false)

  // Load profile + subjects
  useEffect(() => {
    if (!user) return
    getUserProfile(user.id).then(async prof => {
      setProfile(prof)
      if (prof?.current_semester && prof?.regulation) {
        const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)
        setSubjects(subs || [])
      }
    }).finally(() => setProfileLoading(false))
  }, [user])

  // Auto-run if subject_id came from URL
  useEffect(() => {
    const id = searchParams.get('subject_id')
    if (id && subjects.length > 0 && !analysis && !loading) {
      setSelectedSubject(id)
      runAnalysis(id)
    }
  }, [subjects])

  async function runAnalysis(subjectId?: string) {
    const id = subjectId || selectedSubject
    if (!id || !profile) return
    setLoading(true); setError(''); setAnalysis(null)
    try {
      const report = await generateAnalysis(id, profile.regulation || 'R22', filter !== 'all' ? filter : undefined)
      setAnalysis(report)
    } catch (e: any) {
      setError(e.message?.includes('fetch') || e.message?.includes('connect')
        ? 'Backend not running. Start with: cd backend && uvicorn app.main:app --reload --port 8000'
        : e.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || ''

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
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 flex items-center justify-center min-h-[60vh]">
          <div className="glass-card rounded-2xl p-xl text-center max-w-md">
            <span className="material-symbols-outlined text-[64px] text-primary-container mb-base block">school</span>
            <h2 className="font-headline text-headline-md mb-sm">Complete Your Profile First</h2>
            <p className="text-on-surface-variant mb-xl">Set up your semester and regulation to access analysis.</p>
            <button onClick={() => navigate('/onboarding')} className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl font-bold hover:brightness-110 transition-all">
              Complete Onboarding
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="analysis" />

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
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-md py-sm rounded-xl font-data-label text-data-label transition-all ${
                  filter === f.value
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {/* Subject picker + run button */}
        <div className="glass-card rounded-2xl p-lg mb-xxl">
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider block mb-2">Semester</label>
              <div className="px-4 py-3 bg-white/5 border border-white/[0.08] rounded-xl text-white font-medium text-sm">
                Semester {profile.current_semester} · {profile.regulation}
              </div>
            </div>
            <div>
              <label className="text-on-surface-variant text-xs font-medium uppercase tracking-wider block mb-2">Subject</label>
              <CustomSelect
                value={selectedSubject}
                onChange={v => { setSelectedSubject(v); setAnalysis(null) }}
                placeholder="Choose a subject..."
                options={subjects.map(s => ({ value: s.id, label: s.name, sublabel: s.code }))}
              />
            </div>
          </div>
          <button
            onClick={() => runAnalysis()}
            disabled={!selectedSubject || loading}
            className="w-full py-3.5 bg-primary-container hover:brightness-110 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-on-primary-container active:scale-[0.99]"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Analysing papers…</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">bolt</span>Analyse Papers</>
            )}
          </button>
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm whitespace-pre-line">{error}</div>
          )}
        </div>

        {/* ── LOADING skeleton ─────────────────────────────────────── */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="skeleton rounded-2xl h-28" />)}
            </div>
            <div className="skeleton rounded-2xl h-64" />
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="skeleton rounded-2xl h-80" />
              <div className="skeleton rounded-2xl h-80" />
            </div>
          </div>
        )}

        {/* ── ANALYSIS RESULTS (Screen 12) ─────────────────────────── */}
        {analysis && !loading && (
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
              <div className="md:col-span-7 glass-card overflow-hidden rounded-xl">
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
              </div>

              {/* Unit distribution */}
              <div className="md:col-span-5 glass-card p-xl rounded-xl">
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
              </div>
            </div>

            {/* High probability mini cards */}
            {(analysis.high_probability_topics_classified || []).length > 0 && (
              <section className="space-y-lg">
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
              </section>
            )}

            {/* ── Study Priority Order (Screen 13) ─────────────────── */}
            {(analysis.study_priority_order || []).length > 0 && (
              <section className="space-y-lg">
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
                      subjectId={selectedSubject}
                      onViewUnit={unit => navigate(`/analysis/${selectedSubject}/unit/${encodeURIComponent(unit)}/questions`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Analysis coverage */}
            {analysis.coverage_analysis && (
              <section className="glass-card p-xl rounded-xl bg-gradient-to-br from-surface-container-low to-background">
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
              </section>
            )}

            {/* Repeated questions */}
            {(analysis.repeated_questions || []).length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-headline text-xl font-bold flex items-center gap-2">
                    <span className="text-primary-container">🔁</span> Repeated Questions
                  </h2>
                  <button onClick={() => setShowAllQ(!showAllQ)} className="text-sm text-primary-container hover:text-primary transition-colors font-medium">
                    {showAllQ ? 'Show less' : `View all ${analysis.repeated_questions.length}`}
                  </button>
                </div>
                <div className="space-y-3">
                  {(analysis.repeated_questions || []).slice(0, showAllQ ? undefined : 5).map((q: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-4 bg-white/[0.04] rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {q.frequency}×
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 text-sm leading-relaxed">{q.question_text}</p>
                        <p className="text-gray-500 text-xs mt-1">{(q.paper_ids || []).length} papers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    onClick={() => { setSelectedSubject(subjects[0].id); runAnalysis(subjects[0].id) }}
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
                    onClick={() => { setSelectedSubject(subject.id); runAnalysis(subject.id) }}
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

      <Footer />
      {/* Show feedback: timed (5min) + exit intent popup — after user has seen real value */}
      {analysis && <FeedbackWidget page="analysis_results" timedDelayMs={5 * 60 * 1000} />}
    </div>
  )
}
