/**
 * UnitQuestions — Screen 14 (Unit Intelligence / Important Questions)
 * Route: /analysis/:subjectId/unit/:unitId/questions
 *
 * Shows: Summary stats, revision path timeline, high-priority questions list, related papers.
 * 
 * IMPORTANT: Does NOT re-run full analysis on load.
 * Unit priority/percentage data is read from the cached analysis_reports table.
 * Falls back gracefully if no cached report exists.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { getUserProfile, getSubjectsForSemester } from '../lib/api'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

export function UnitQuestions() {
  const { subjectId, unitId } = useParams<{ subjectId: string; unitId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [profile, setProfile]         = useState<any>(null)
  const [subjectName, setSubjectName] = useState('')
  const [unitData, setUnitData]       = useState<any | null>(null)
  const [questions, setQuestions]     = useState<any[]>([])
  const [papers, setPapers]           = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  const unitLabel = decodeURIComponent(unitId || '')

  useEffect(() => {
    if (!user || !subjectId || !unitId) return
    loadData()
  }, [user, subjectId, unitId])

  async function loadData() {
    try {
      setLoading(true)
      const prof = await getUserProfile(user!.id)
      setProfile(prof)

      // Get subject name
      if (prof?.current_semester && prof?.regulation) {
        const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)
        const found = subs.find((s: any) => s.id === subjectId)
        if (found) setSubjectName(found.name)
      }

      // Read unit priority from the CACHED analysis report — no re-analysis on every load
      // This is a DB read, not an AI computation (fast: ~50ms vs ~5s)
      const { data: cachedReports } = await supabase
        .from('analysis_reports')
        .select('report_data')
        .eq('subject_id', subjectId)
        .eq('status', 'ready')
        .order('generated_at', { ascending: false })
        .limit(1)

      if (cachedReports?.length) {
        const reportData = cachedReports[0].report_data
        const allUnits = reportData?.study_priority_order || []
        const thisUnit = allUnits.find((u: any) => u.unit === unitLabel)
        setUnitData(thisUnit || null)
      }
      // If no cache: unitData stays null — page still shows questions, just without priority rank

      // Get actual questions for this unit
      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_text, unit_name, topic_name, marks, question_hash, paper_id')
        .eq('subject_id', subjectId)
        .ilike('unit_name', `%${unitLabel}%`)
        .order('marks', { ascending: false, nullsFirst: false })
        .limit(100)

      // Count occurrences of each unique question by hash
      const hashCount: Record<string, number> = {}
      for (const q of qs || []) {
        if (q.question_hash) hashCount[q.question_hash] = (hashCount[q.question_hash] || 0) + 1
      }
      // Deduplicate — keep highest-marks version, attach frequency
      const seen = new Set<string>()
      const deduped = (qs || [])
        .map((q: any) => ({ ...q, frequency: q.question_hash ? hashCount[q.question_hash] : 1 }))
        .filter((q: any) => {
          if (!q.question_hash) return true
          if (seen.has(q.question_hash)) return false
          seen.add(q.question_hash)
          return true
        })
        .sort((a: any, b: any) => (b.frequency || 1) - (a.frequency || 1))

      setQuestions(deduped)

      // Get related papers
      const { data: ps } = await supabase
        .from('papers')
        .select('id, title, exam_type, exam_year, exam_category, regulation')
        .eq('subject_id', subjectId)
        .order('exam_year', { ascending: false })
        .limit(6)

      setPapers(ps || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load unit data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="analysis" />
        <main className="pt-24 max-w-[1200px] mx-auto px-lg pb-huge">
          <div className="skeleton h-8 w-48 mb-4 rounded-lg" />
          <div className="skeleton h-12 w-96 mb-8 rounded-lg" />
          <div className="skeleton h-40 w-full mb-6 rounded-2xl" />
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 w-full rounded-xl" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="analysis" />

      {/* Mobile back button — visible only on mobile since sidebar is hidden */}
      <div className="md:hidden fixed top-20 left-0 right-0 z-30 px-base py-sm bg-background/90 backdrop-blur-md border-b border-outline-variant flex items-center gap-sm">
        <button
          onClick={() => navigate(`/analysis?subject_id=${subjectId}`)}
          className="flex items-center gap-xs text-primary font-body-sm font-bold"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to Analysis
        </button>
        <span className="text-on-surface-variant text-body-sm truncate ml-auto">{unitLabel}</span>
      </div>

      {/* Side nav */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface-container border-r border-outline-variant pt-20 py-xl px-base z-40">
        <div className="mb-xl">
          <h3 className="font-headline text-body-lg font-bold text-primary px-base">Unit Intelligence</h3>
          <p className="text-on-surface-variant text-xs px-base">{subjectName}</p>
        </div>
        <nav className="flex-1">
          {[
            { icon:'dashboard', label:'Dashboard', to:'/dashboard' },
            { icon:'analytics', label:'Analysis', to:'/analysis', active:true },
            { icon:'description', label:'Papers', to:'/papers' },
          ].map(l => (
            <Link
              key={l.label}
              to={l.to}
              className={`flex items-center gap-md px-base py-sm mb-xs rounded-lg transition-all ${
                l.active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined">{l.icon}</span>
              <span className="font-body-md">{l.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={() => navigate(`/analysis?subject_id=${subjectId}`)}
          className="bg-primary-container text-on-primary-container py-md rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all mb-lg"
        >
          Back to Analysis
        </button>
      </aside>

      {/* pt-[144px] on mobile = 80px navbar + 48px mobile back bar + 16px gap */}
      <main className="md:ml-64 pt-[144px] md:pt-24 pb-huge px-base md:px-xl">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-xs text-on-surface-variant mb-base text-xs font-data-label uppercase tracking-widest">
            <Link to="/analysis" className="hover:text-primary transition-colors">Analysis</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <Link to={`/analysis?subject_id=${subjectId}`} className="hover:text-primary transition-colors">{subjectName || 'Subject'}</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary">Unit Intelligence</span>
          </nav>

          {/* Header */}
          <div className="mb-xl">
            <h1 className="font-headline text-headline-lg text-on-surface mb-xs">{unitLabel}</h1>
            {!error && (
              <p className="text-on-surface-variant font-body-md">
                {questions.length} important questions identified from past papers
              </p>
            )}
          </div>

          {error && (
            <div className="mb-xl px-xl py-lg bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
              <span className="material-symbols-outlined text-[48px] text-red-400 mb-4 block">error</span>
              <h3 className="text-headline-sm font-headline text-red-400 mb-2">Network Error</h3>
              <p className="text-red-400/80 text-body-md">{error}</p>
            </div>
          )}

          {!error && (
            <>
              {/* Intelligence summary card */}
          <section className="glass-card rounded-2xl p-xl mb-huge">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-lg">
              {[
                { label:'Priority Rank', value: unitData ? `#${unitData.priority}` : '#—', color:'text-primary' },
                { label:'Exam Weight',   value: unitData ? `${unitData.percentage?.toFixed(1)}%` : '—' },
                { label:'Question Count', value: questions.length || unitData?.question_count || '—' },
                { label:'Regulation',    value: profile?.regulation || '—' },
                { label:'Semester',      value: profile?.current_semester ? `Sem ${profile.current_semester}` : '—' },
                { label:'Subject',       value: subjectName || '—', truncate: true },
              ].map(s => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-on-surface-variant font-data-label text-[10px] uppercase mb-sm">{s.label}</span>
                  <span className={`font-data-value text-headline-md ${s.color || 'text-on-surface'} ${s.truncate ? 'truncate text-sm' : ''}`}>{String(s.value)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended revision path */}
          {unitData?.top_topics && (
            <section className="mb-huge">
              <div className="flex justify-between items-end mb-lg">
                <h2 className="font-headline text-on-surface flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  Recommended Revision Path
                </h2>
              </div>
              <div className="relative pt-8">
                <div className="hidden md:block absolute top-[48px] left-[10%] w-[80%] border-t-2 border-dashed border-primary/30" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-xl relative z-10">
                  {unitData.top_topics.slice(0, 4).map((t: any, i: number) => (
                    <div key={i} className="flex flex-col gap-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        i === 0 ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container border-2 border-primary/50 text-primary'
                      }`}
                        style={i === 0 ? {filter:'drop-shadow(0 0 8px rgba(249,115,22,0.5))'} : {}}
                      >
                        {i + 1}
                      </div>
                      <div className="mt-xs">
                        <h4 className="font-bold text-on-surface">{t.topic}</h4>
                        <p className="text-sm text-on-surface-variant">{t.count} questions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* High priority questions */}
          <section className="mb-huge">
            <h2 className="font-headline text-on-surface mb-lg flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>target</span>
              Important Questions
            </h2>
            {questions.length > 0 ? (
              <div className="space-y-base">
                {questions.map((q, i) => (
                  <motion.div 
                    key={q.id || i} 
                    className="bg-surface-container border border-outline-variant rounded-xl p-lg hover:border-primary/50 transition-all cursor-pointer"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                    whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-md mb-md">
                      <h3 className="font-headline text-on-surface max-w-2xl leading-snug">{q.question_text}</h3>
                      <div className="flex flex-wrap gap-xs h-fit shrink-0">
                        {(q.frequency || 0) > 1 && (
                          <span className="bg-primary/10 text-primary px-sm py-1 rounded text-[10px] font-bold uppercase border border-primary/20">
                            Appeared {q.frequency}× Times
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-md">
                      {q.topic_name && (
                        <span className="bg-white/5 text-on-surface-variant px-sm py-1 rounded-lg text-xs font-data-label border border-white/10 break-words whitespace-normal line-clamp-2 md:line-clamp-none max-w-full">{q.topic_name}</span>
                      )}
                      {q.marks && <span className="text-primary font-bold text-sm shrink-0">{q.marks} Marks</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-xl text-center rounded-xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-base block">quiz</span>
                <p className="text-on-surface-variant text-body-md">No questions found for this unit yet. Classification may be in progress.</p>
              </div>
            )}
          </section>

          {/* Related papers */}
          {papers.length > 0 && (
            <section className="mb-section">
              <h2 className="font-headline text-on-surface mb-lg flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">description</span>
                Related Previous Papers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {papers.map(paper => (
                  <div key={paper.id} className="bg-surface-container border border-outline-variant rounded-xl p-lg hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-md mb-base">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl">picture_as_pdf</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface">{paper.exam_category || paper.exam_type} {paper.exam_year}</h4>
                        <p className="text-xs text-on-surface-variant">{paper.regulation}</p>
                      </div>
                    </div>
                    <div className="flex gap-base">
                      <button
                        onClick={() => navigate(`/papers/${paper.id}`)}
                        className="flex-1 bg-surface-container-highest text-on-surface py-sm rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                      >
                        View Paper
                      </button>
                      <button
                        onClick={() => navigate(`/papers/${paper.id}?download=1`)}
                        className="px-md bg-primary-container text-on-primary-container py-sm rounded-lg hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
