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
  const [markFilter, setMarkFilter]   = useState<'all' | '1m' | '10m_direct' | '5m_sub' | 'repeated'>('all')
  const [yearFilter, setYearFilter]   = useState<'all' | '2024' | '2025'>('all')

  // Revision & Completion state (persisted to localStorage)
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('paperiq_saved_questions')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('paperiq_completed_questions')
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  const toggleSaveQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('paperiq_saved_questions', JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const toggleCompleteQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem('paperiq_completed_questions', JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

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

      // Get eligible regular papers (2024 and 2025)
      const { data: ps } = await supabase
        .from('papers')
        .select('id, title, exam_type, exam_year, exam_category, regulation')
        .eq('subject_id', subjectId)
        .order('exam_year', { ascending: false })
        .limit(20)

      const paperMap: Record<string, any> = {}
      for (const p of ps || []) {
        paperMap[p.id] = p
      }
      // Show eligible 2024-2025 regular papers
      const eligiblePapers = (ps || []).filter((p: any) => 
        (p.exam_type || 'Regular').toLowerCase() === 'regular' &&
        (p.exam_year === 2024 || p.exam_year === 2025)
      )
      setPapers(eligiblePapers.length > 0 ? eligiblePapers.slice(0, 6) : (ps || []).slice(0, 6))

      // Get actual questions for this unit
      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_text, unit_name, topic_name, marks, question_hash, paper_id, part, question_number, exam_year')
        .eq('subject_id', subjectId)
        .ilike('unit_name', `%${unitLabel}%`)
        .order('marks', { ascending: false, nullsFirst: false })
        .limit(150)

      const eligiblePaperIds = new Set(eligiblePapers.map((p: any) => p.id))
      // Strictly restrict questions to eligible 60-mark regular papers (2024–2025)
      const validQs = (qs || []).filter((q: any) => {
        // Exclude questions from non-eligible papers if paper_id exists
        if (q.paper_id && eligiblePaperIds.size > 0 && !eligiblePaperIds.has(q.paper_id)) {
          return false
        }
        // Exclude legacy 70M paper questions (Part A with 2M)
        if (q.marks === 2 && String(q.part || '').toLowerCase().includes('part a')) {
          return false
        }
        // Exclude pre-2024 years
        if (q.exam_year && q.exam_year < 2024) {
          return false
        }
        return true
      })

      // Segregate mark types: 1m, 10m_direct, 5m_sub
      // Calculate frequency per mark type so 10M direct and 5M subquestions are NEVER mixed
      const markTypeHashCount: Record<string, number> = {}
      const markTypePaperSources: Record<string, any[]> = {}

      for (const q of validQs) {
        const marks = q.marks
        const mtype = marks === 1 ? '1m' : marks === 10 ? '10m_direct' : marks === 5 ? '5m_sub' : 'other'
        const key = `${q.question_hash || q.question_text}::${mtype}`
        markTypeHashCount[key] = (markTypeHashCount[key] || 0) + 1

        const p = paperMap[q.paper_id]
        const pTitle = p?.title || `MLRIT R22 Paper ${q.exam_year || ''}`
        const sec = q.part || (marks === 1 ? 'Part A' : 'Part B')
        const qNum = q.question_number ? `Q${q.question_number}` : ''
        const srcRef = `${pTitle} · ${sec} ${qNum} (${marks || '?'}M)`.trim()

        if (!markTypePaperSources[key]) markTypePaperSources[key] = []
        markTypePaperSources[key].push({
          paper_id: q.paper_id,
          paper_title: pTitle,
          year: q.exam_year || p?.exam_year,
          source_reference: srcRef
        })
      }

      // Deduplicate within same mark type, attach frequency and exact source papers
      const seen = new Set<string>()
      const processed = validQs
        .map((q: any) => {
          const marks = q.marks
          const mtype = marks === 1 ? '1m' : marks === 10 ? '10m_direct' : marks === 5 ? '5m_sub' : 'other'
          const key = `${q.question_hash || q.question_text}::${mtype}`
          const p = paperMap[q.paper_id]
          const pTitle = p?.title || `MLRIT R22 Paper ${q.exam_year || ''}`
          const sec = q.part || (marks === 1 ? 'Part A' : 'Part B')
          const qNum = q.question_number ? `Q${q.question_number}` : ''
          const srcRef = `${pTitle} · ${sec} ${qNum} (${marks || '?'}M)`.trim()

          return {
            ...q,
            mark_type: mtype,
            frequency: markTypeHashCount[key] || 1,
            source_reference: srcRef,
            source_papers: markTypePaperSources[key] || [],
            exam_year: q.exam_year || p?.exam_year || 2024,
          }
        })
        .filter((q: any) => {
          const key = `${q.question_hash || q.question_text}::${q.mark_type}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .sort((a: any, b: any) => (b.frequency || 1) - (a.frequency || 1))

      setQuestions(processed)
    } catch (err: any) {
      setError(err.message || 'Failed to load unit data')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter((q: any) => {
    // Year filter (2024 or 2025)
    if (yearFilter !== 'all' && String(q.exam_year) !== yearFilter) {
      return false
    }
    // Mark structure filter: 1M Part A, Direct 10M Part B, 5M subquestion Part B, Repeated only
    if (markFilter === '1m') return q.mark_type === '1m'
    if (markFilter === '10m_direct') return q.mark_type === '10m_direct'
    if (markFilter === '5m_sub') return q.mark_type === '5m_sub'
    if (markFilter === 'repeated') return (q.frequency || 0) > 1
    return true
  })

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
              <h2 className="font-headline text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>target</span>
                Important Questions ({filteredQuestions.length})
              </h2>
              <div className="text-xs text-primary font-mono bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                MLRIT R22 · 60-Mark Regular Pattern
              </div>
            </div>

            {/* Student-facing 60-mark filter bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-md mb-lg p-md bg-surface-container rounded-xl border border-outline-variant">
              <div className="flex flex-wrap items-center gap-xs">
                <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mr-1">Structure:</span>
                {[
                  { id: 'all', label: 'All Questions' },
                  { id: '1m', label: '1M (Part A)' },
                  { id: '10m_direct', label: 'Direct 10M (Part B)' },
                  { id: '5m_sub', label: '5M Subquestions (Part B)' },
                  { id: 'repeated', label: 'Repeated Only (2×+)' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setMarkFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      markFilter === f.id
                        ? 'bg-primary-container text-on-primary-container shadow'
                        : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-xs">
                <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mr-1">Regular Exam:</span>
                {[
                  { id: 'all', label: '2024 & 2025' },
                  { id: '2024', label: '2024 Regular' },
                  { id: '2025', label: '2025 Regular' },
                ].map(y => (
                  <button
                    key={y.id}
                    onClick={() => setYearFilter(y.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      yearFilter === y.id
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {y.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredQuestions.length > 0 ? (
              <div className="space-y-base">
                {filteredQuestions.map((q, i) => (
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
                      <h3 className={`font-headline max-w-2xl leading-snug transition-colors ${completedQuestions.has(q.id) ? 'line-through text-gray-500' : 'text-on-surface'}`}>{q.question_text}</h3>
                      <div className="flex flex-wrap gap-xs h-fit shrink-0 items-center">
                        {q.mark_type === '10m_direct' && (
                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            Direct 10M Question
                          </span>
                        )}
                        {q.mark_type === '5m_sub' && (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            5M Subquestion
                          </span>
                        )}
                        {q.mark_type === '1m' && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            1M Short Answer (Part A)
                          </span>
                        )}
                        {(q.frequency || 0) > 1 && (
                          <span className="bg-primary/20 text-primary px-sm py-1 rounded text-[10px] font-bold uppercase border border-primary/30">
                            Repeated {q.frequency}×
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-md">
                      {q.topic_name && (
                        <span className="bg-white/5 text-on-surface-variant px-sm py-1 rounded-lg text-xs font-data-label border border-white/10 break-words whitespace-normal line-clamp-2 md:line-clamp-none max-w-full">{q.topic_name}</span>
                      )}
                      {q.marks && <span className="text-primary font-bold text-sm shrink-0">{q.marks} Marks</span>}
                      {q.source_reference && (
                        <span className="text-xs text-on-surface-variant/80 font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                          {q.source_reference}
                        </span>
                      )}
                    </div>

                    {/* Exact source papers for repeated questions */}
                    {(q.source_papers || []).length > 1 && (
                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-on-surface-variant">
                        <span className="text-gray-400 font-bold block mb-1">Source Papers:</span>
                        <div className="flex flex-wrap gap-2">
                          {(q.source_papers || []).map((src: any, sIdx: number) => (
                            <span key={sIdx} className="bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono text-[11px]">
                              {src.source_reference}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons: AI Tutor Answer, Open Paper, Save for Revision, Mark Completed */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/companion?query=${encodeURIComponent(q.question_text)}&marks=${q.marks || 10}&subject=${encodeURIComponent(subjectName)}`)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-bold transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">psychology</span>
                          Read AI Answer
                        </button>
                        {q.paper_id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/papers/${q.paper_id}`)
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white border border-white/10 rounded-lg text-xs font-medium transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                            Original Paper
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleSaveQuestion(q.id, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            savedQuestions.has(q.id)
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/5 text-on-surface-variant hover:text-white border-white/10'
                          }`}
                          title="Save for Revision"
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: savedQuestions.has(q.id) ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
                          {savedQuestions.has(q.id) ? 'Saved' : 'Save'}
                        </button>
                        <button
                          onClick={(e) => toggleCompleteQuestion(q.id, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            completedQuestions.has(q.id)
                              ? 'bg-green-500/20 text-green-300 border-green-500/40'
                              : 'bg-white/5 text-on-surface-variant hover:text-white border-white/10'
                          }`}
                          title="Mark as Completed"
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: completedQuestions.has(q.id) ? "'FILL' 1" : "'FILL' 0" }}>check_circle</span>
                          {completedQuestions.has(q.id) ? 'Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-xl text-center rounded-xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-base block">quiz</span>
                <p className="text-on-surface-variant text-body-md">No questions found matching the selected filter.</p>
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
