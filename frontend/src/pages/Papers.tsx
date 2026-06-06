/**
 * Papers — Screens 15 (browser) + 16 (empty state)
 * Route: /papers?subject=...&regulation=...&category=...&q=...
 *
 * Sidebar filters + paper card grid. Real data from Supabase.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { getUserProfile, getSubjectsForSemester } from '../lib/api'
import { supabase } from '../lib/supabase'

interface Paper {
  id: string
  title?: string
  exam_type: string
  exam_year: number
  exam_month?: string
  exam_category?: string
  regulation: string
  subject_id: string
  max_marks?: number
  duration_hours?: number   // actual DB column
  question_count?: number
  part_a_count?: number
  part_b_count?: number
}

export function Papers() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [subjects, setSubjects]     = useState<any[]>([])
  const [papers, setPapers]         = useState<Paper[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [profileReady, setProfileReady] = useState(false)
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!subjectDropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown="subject"]')) setSubjectDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [subjectDropdownOpen])

  // Filters — selectedReg intentionally empty until profile loads (avoids wrong-regulation first fetch)
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '')
  const [selectedReg, setSelectedReg]         = useState(searchParams.get('regulation') || '')
  const [selectedCats, setSelectedCats]       = useState<string[]>([])
  const [yearRange, setYearRange]             = useState(2025)
  const [searchQ, setSearchQ]               = useState(searchParams.get('q') || '')

  useEffect(() => {
    if (!user) return
    getUserProfile(user.id).then(async prof => {
      if (prof?.current_semester && prof?.regulation) {
        const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)
        setSubjects(subs || [])
        // Only set regulation from profile if not already specified in URL
        if (!searchParams.get('regulation')) setSelectedReg(prof.regulation)
      } else {
        // No profile yet — default to R22 so the page still works
        if (!searchParams.get('regulation')) setSelectedReg('R22')
      }
      setProfileReady(true)  // gates the fetch below
    }).catch(() => {
      setSelectedReg('R22')
      setProfileReady(true)
    })
  }, [user])

  // Only run after profile has set the correct regulation — prevents the double-fetch
  useEffect(() => {
    if (!profileReady) return
    fetchPapers()
  }, [profileReady, selectedSubject, selectedReg, selectedCats, yearRange, searchQ])

  async function fetchPapers() {
    setLoading(true); setError('')
    try {
      let query = supabase
        .from('papers')
        .select('id, title, exam_type, exam_year, exam_month, exam_category, regulation, subject_id, max_marks, duration_hours')
        .order('exam_year', { ascending: false })
        .limit(50)

      if (selectedSubject) query = query.eq('subject_id', selectedSubject)
      if (selectedReg)     query = query.eq('regulation', selectedReg)
      if (selectedCats.length > 0) {
        query = query.in('exam_category', selectedCats)
      }
      // Only filter by year for papers that actually have a year set
      // Papers with null exam_year are still valid — don't hide them
      if (yearRange < 2025) query = query.or(`exam_year.gte.${yearRange},exam_year.is.null`)
      if (searchQ) query = query.ilike('title', `%${searchQ}%`)

      const { data, error: err } = await query
      if (err) throw err

      const paperRows = data || []
      if (!paperRows.length) { setPapers([]); return }

      // Single batch query for ALL questions — no N+1
      const paperIds = paperRows.map((p: any) => p.id)
      const { data: allQs } = await supabase
        .from('questions')
        .select('paper_id, part')
        .in('paper_id', paperIds)

      // Aggregate counts per paper in memory
      const countMap: Record<string, { total: number; partA: number; partB: number }> = {}
      for (const q of allQs || []) {
        if (!countMap[q.paper_id]) countMap[q.paper_id] = { total: 0, partA: 0, partB: 0 }
        countMap[q.paper_id].total++
        if (q.part === 'A') countMap[q.paper_id].partA++
        if (q.part === 'B') countMap[q.paper_id].partB++
      }

      const papersWithCounts: Paper[] = paperRows.map((p: any) => ({
        ...p,
        question_count: countMap[p.id]?.total ?? 0,
        part_a_count:   countMap[p.id]?.partA ?? 0,
        part_b_count:   countMap[p.id]?.partB ?? 0,
      }))
      setPapers(papersWithCounts)
    } catch (err: any) {
      setError(err.message || 'Failed to load papers')
    } finally {
      setLoading(false)
    }
  }

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function resetFilters() {
    setSelectedSubject(''); setSelectedReg('R22'); setSelectedCats([]); setYearRange(2025); setSearchQ('')
  }

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Past Paper'
  const formatExamType = (p: Paper) => {
    // Guard against null/Unknown values from DB
    const rawCat = p.exam_category || p.exam_type || ''
    const cat = (rawCat && rawCat !== 'Unknown') ? rawCat : ''
    const rawMonth = p.exam_month && p.exam_month !== 'Unknown' ? p.exam_month : ''
    const month = rawMonth ? ` — ${rawMonth}` : ''
    const year = p.exam_year ? ` ${p.exam_year}` : ''
    // If we have nothing meaningful, show "Past Paper"
    return (cat || year) ? `${cat}${month}${year}`.trim() : 'Past Paper'
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="papers" />

      <div className="flex pt-[80px] min-h-screen">
        {/* ── Filter Sidebar ──────────────────────────────────────── */}
        <aside className="w-72 bg-surface-container border-r border-outline-variant h-full p-base hidden md:block overflow-y-auto fixed top-[80px] bottom-0 left-0 z-30" data-tour="tour-papers-filters">
          <div className="flex items-center gap-sm mb-lg">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings:"'FILL' 1"}}>filter_list</span>
            <span className="font-headline text-body-lg font-bold">Filters</span>
          </div>
          <div className="space-y-xl">
            {/* Subject */}
            <div className="space-y-sm">
              <label className="font-data-label text-data-label text-outline block">SUBJECT</label>
              {/* Custom dropdown — matches design system, not browser native */}
              <div className="relative" data-dropdown="subject">
                <button
                  onClick={() => setSubjectDropdownOpen(o => !o)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-sm py-md text-body-sm text-on-surface flex items-center justify-between hover:border-primary-container/50 transition-colors"
                >
                  <span className={selectedSubject ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name || 'All Subjects' : 'All Subjects'}
                  </span>
                  <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 ${subjectDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {subjectDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* All Subjects option */}
                    <button
                      onClick={() => { setSelectedSubject(''); setSubjectDropdownOpen(false) }}
                      className={`w-full text-left px-sm py-md text-body-sm transition-colors flex items-center gap-sm ${
                        !selectedSubject
                          ? 'bg-primary-container/10 text-primary-container'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {!selectedSubject && <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>check</span>}
                      All Subjects
                    </button>
                    <div className="h-px bg-outline-variant/30" />
                    {subjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSubject(s.id); setSubjectDropdownOpen(false) }}
                        className={`w-full text-left px-sm py-md text-body-sm transition-colors flex items-center gap-sm ${
                          selectedSubject === s.id
                            ? 'bg-primary-container/10 text-primary-container'
                            : 'text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {selectedSubject === s.id && <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>check</span>}
                        <span className={selectedSubject === s.id ? '' : 'ml-6'}>{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Regulation */}
            <div className="space-y-sm">
              <label className="font-data-label text-data-label text-outline block">REGULATION</label>
              <div className="flex gap-sm flex-wrap">
                {['R22','R20','R18','R16'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedReg(r)}
                    className={`px-sm py-xs rounded-lg font-data-value text-data-label border transition-colors ${
                      selectedReg === r
                        ? 'bg-primary-container/10 text-primary border-primary/20'
                        : 'bg-white/5 text-outline border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Category */}
            <div className="space-y-md">
              <label className="font-data-label text-data-label text-outline block">EXAM CATEGORY</label>
              <div className="space-y-sm">
                {['Mid-1','Mid-2','Semester'].map(cat => (
                  <label key={cat} className="flex items-center gap-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(cat)}
                      onChange={() => toggleCat(cat)}
                      className="rounded border-outline-variant bg-surface text-primary-container focus:ring-primary-container w-4 h-4 accent-primary-container"
                    />
                    <span className="text-body-sm group-hover:text-primary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <label className="font-data-label text-data-label text-outline block">YEAR RANGE</label>
                <span className="text-data-label font-data-value text-primary">{yearRange} - 2025</span>
              </div>
              <input
                type="range" min={2018} max={2025} step={1}
                value={yearRange}
                onChange={e => setYearRange(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="pt-base border-t border-outline-variant">
              <button onClick={resetFilters} className="w-full text-center py-sm text-on-surface-variant hover:text-on-surface text-data-label font-data-label transition-colors uppercase">
                RESET ALL FILTERS
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 md:ml-72 overflow-y-auto bg-background">
          <div className="max-w-[1000px] mx-auto p-lg lg:p-huge space-y-xl">
            {/* Header */}
            <div className="space-y-sm border-b border-outline-variant pb-lg">
              <h1 className="font-headline text-headline-lg text-on-surface">Past Examination Papers</h1>
              <p className="text-outline font-body-md">Browse and filter papers by subject, year, and exam type</p>
            </div>

            {/* Search bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search papers..."
                className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-on-surface text-body-sm focus:outline-none focus:border-primary-container transition-colors"
              />
            </div>

            {/* Count line */}
            {!loading && (
              <div className="flex items-center gap-sm text-body-sm font-body-md text-outline">
                <span className="text-primary-container font-bold">{papers.length} papers found</span>
                {selectedCats.length > 0 && <><span className="opacity-30">•</span><span>{selectedCats.join(', ')}</span></>}
                {selectedReg && <><span className="opacity-30">•</span><span>{selectedReg}</span></>}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                {[1,2,3,4].map(i => <div key={i} className="skeleton rounded-2xl h-48" />)}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* ── Paper Cards ─────────────────────────────────────── */}
            {!loading && papers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                {papers.map(paper => (
                  <div
                    key={paper.id}
                    onClick={() => navigate(`/papers/${paper.id}`)}
                    className="bg-surface border border-outline-variant p-lg rounded-2xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 group"
                    style={{transition:'all 0.3s'}}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#f97316'; (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(249,115,22,0.15)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor=''; (e.currentTarget as HTMLElement).style.boxShadow='' }}
                  >
                    <div className="flex justify-between items-start mb-base">
                      <h3 className="font-headline text-body-lg text-on-surface group-hover:text-primary-container transition-colors">
                        {getSubjectName(paper.subject_id)}
                      </h3>
                      <span className="bg-white/5 border border-outline-variant px-sm py-xs rounded-lg text-data-label font-data-label">
                        {paper.regulation}
                      </span>
                    </div>
                    <div className="space-y-md">
                      <div className="flex items-center gap-sm text-outline">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span className="text-body-sm">{formatExamType(paper)}</span>
                      </div>
                      <div className="flex items-center gap-xl py-sm border-y border-outline-variant">
                        <div className="flex flex-col">
                          <span className="text-outline text-data-label font-data-label">QUESTIONS</span>
                          <span className="text-on-surface font-data-value text-data-value">{paper.question_count ?? '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-outline text-data-label font-data-label">TOTAL MARKS</span>
                          <span className="text-on-surface font-data-value text-data-value">{paper.max_marks ?? '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-outline text-data-label font-data-label">DURATION</span>
                          <span className="text-on-surface font-data-value text-data-value">
                            {paper.duration_hours ? `${paper.duration_hours} Hr${paper.duration_hours > 1 ? 's' : ''}` : '—'}
                          </span>
                        </div>
                      </div>
                      {/* Part A / Part B breakdown — matches Stitch card */}
                      {((paper.part_a_count ?? 0) > 0 || (paper.part_b_count ?? 0) > 0) && (
                        <div className="text-body-sm text-outline flex gap-lg">
                          <span className="flex items-center gap-xs">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            Part A: {paper.part_a_count ?? 0} Q's
                          </span>
                          <span className="flex items-center gap-xs">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            Part B: {paper.part_b_count ?? 0} Q's
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-lg pt-base border-t border-outline-variant flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
                          window.open(`${apiBaseUrl}/papers/${paper.id}/download`, '_blank')
                        }}
                        className="text-on-surface-variant hover:text-primary-container font-bold text-body-sm flex items-center gap-xs transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Download PDF
                      </button>
                      <span className="text-primary-container font-bold text-body-sm flex items-center gap-xs group-hover:gap-sm transition-all" aria-hidden="true">
                        View Paper <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Empty State (Screen 16) ──────────────────────────── */}
            {!loading && papers.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-section text-center space-y-lg">
                <div className="w-48 h-48 flex items-center justify-center opacity-30">
                  <span className="material-symbols-outlined text-[120px] text-on-surface-variant">description</span>
                </div>
                <div className="space-y-sm">
                  <h3 className="font-headline text-headline-md text-on-surface">No papers found</h3>
                  <p className="text-outline max-w-md mx-auto">We couldn't find any papers matching your filters. Try resetting or adjusting your selection.</p>
                </div>
                <div className="flex gap-base justify-center">
                  <button
                    onClick={resetFilters}
                    className="bg-primary-container text-on-primary-container px-lg py-sm rounded-xl font-bold hover:brightness-110 transition-all"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="border border-outline-variant text-on-surface px-lg py-sm rounded-xl font-bold hover:bg-white/5 transition-colors"
                  >
                    Browse Subjects
                  </button>
                </div>
                <div className="pt-xl">
                  <p className="text-data-label font-data-label text-outline mb-sm uppercase">SUGGESTIONS</p>
                  <div className="flex gap-sm justify-center flex-wrap">
                    {['Check R18 Regulation','Broaden Year Range','All Subjects'].map(s => (
                      <button key={s} onClick={resetFilters} className="bg-white/5 px-base py-sm rounded-full text-body-sm text-on-surface border border-white/5 hover:border-primary/50 transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
