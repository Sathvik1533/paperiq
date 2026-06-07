/**
 * Papers — Screens 15 (browser) + 16 (empty state)
 * Route: /papers?subject=...&regulation=...&category=...&q=...
 *
 * Sidebar filters + paper card grid. Real data from Supabase.
 * Performance: Filter requests debounced + React Query caching.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { PageTransition } from '../components/ui/PageTransition'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { getUserProfile } from '../lib/api'
import { usePapers } from '../lib/queries'
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
  storage_path?: string
  storage_bucket?: string
  original_url?: string
  parsed_questions?: Array<{
    id: string
    question_text: string
    marks?: number
    part?: string
  }>
}

export function Papers() {
  const shouldReduceMotion = useReducedMotion()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [subjects, setSubjects] = useState<any[]>([])
  const [profileReady, setProfileReady] = useState(false)
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState(false)
  
  // Hardcoded semester allocation matrix
  const SEMESTER_SUBJECTS = {
    '2-1': [
      { code: 'A6CS05', name: 'Data Structures' },
      { code: 'A6IT02', name: 'Object Oriented Programming through Java' },
      { code: 'A6CS02', name: 'Digital Electronics and Computer Organization' },
      { code: 'A6CS07', name: 'Software Engineering' },
      { code: 'A6BS03', name: 'Computer Oriented Statistical Methods' },
    ],
    '2-2': [
      { code: 'A6HS08', name: 'Business Economics and Financial Analysis' },
      { code: 'A6CS08', name: 'Discrete Mathematics' },
      { code: 'A6CS09', name: 'Database Management Systems' },
      { code: 'A6CS11', name: 'Operating System' },
      { code: 'A6CS13', name: 'Software Testing Fundamentals' },
    ],
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!subjectDropdownOpen && !semesterDropdownOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown="subject"]')) setSubjectDropdownOpen(false)
      if (!target.closest('[data-dropdown="semester"]')) setSemesterDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [subjectDropdownOpen, semesterDropdownOpen])

  // Filters
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '')
  const [selectedSemester, setSelectedSemester] = useState<'2-1' | '2-2' | ''>('') // New semester filter
  const [selectedReg, setSelectedReg] = useState(searchParams.get('regulation') || '')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [yearRange, setYearRange] = useState(2025)
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '')

  // Debounced filter state for API calls (prevents request storms)
  const [debouncedSubject, setDebouncedSubject] = useState(selectedSubject)
  const [debouncedSemester, setDebouncedSemester] = useState(selectedSemester)
  const [debouncedReg, setDebouncedReg] = useState(selectedReg)
  const [debouncedCats, setDebouncedCats] = useState(selectedCats)
  const [debouncedYear, setDebouncedYear] = useState(yearRange)
  const [debouncedSearch, setDebouncedSearch] = useState(searchQ)

  // Debounce filter changes (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSubject(selectedSubject)
      setDebouncedSemester(selectedSemester)
      setDebouncedReg(selectedReg)
      setDebouncedCats(selectedCats)
      setDebouncedYear(yearRange)
      setDebouncedSearch(searchQ)
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedSubject, selectedSemester, selectedReg, selectedCats, yearRange, searchQ])

  // React Query hook for papers (automatic caching + deduplication)
  const { data: papers = [], isLoading, error } = usePapers({
    subject_id: debouncedSubject || undefined,
    regulation: profileReady && debouncedReg ? debouncedReg : undefined,
    exam_category: debouncedCats.length > 0 ? debouncedCats : undefined,
    yearRange: debouncedYear < 2025 ? debouncedYear : undefined,
    search: debouncedSearch || undefined,
  })

  useEffect(() => {
    if (!user) return
    getUserProfile(user.id).then(async prof => {
      const regulation = prof?.regulation || 'R22'
      if (!searchParams.get('regulation')) setSelectedReg(regulation)

      // Load ALL subjects for this regulation (not filtered by semester number,
      // because the DB may store semester as 3/4 for 2nd year subjects)
      const { data: allSubs } = await supabase
        .from('subjects')
        .select('*')
        .eq('regulation', regulation)
        .order('code', { ascending: true })

      // Canonical 10-subject list — ensures the dropdown always shows all subjects
      // even if the DB query returns nothing (code is used as display key)
      const ALL_SUBJECTS_CANONICAL = [
        { id: 'A6CS05', name: 'Data Structures',                               code: 'A6CS05', semester: 1, regulation },
        { id: 'A6IT02', name: 'Object Oriented Programming through Java',      code: 'A6IT02', semester: 1, regulation },
        { id: 'A6CS02', name: 'Digital Electronics and Computer Organization', code: 'A6CS02', semester: 1, regulation },
        { id: 'A6CS07', name: 'Software Engineering',                          code: 'A6CS07', semester: 1, regulation },
        { id: 'A6BS03', name: 'Computer Oriented Statistical Methods',         code: 'A6BS03', semester: 1, regulation },
        { id: 'A6HS08', name: 'Business Economics and Financial Analysis',     code: 'A6HS08', semester: 2, regulation },
        { id: 'A6CS08', name: 'Discrete Mathematics',                          code: 'A6CS08', semester: 2, regulation },
        { id: 'A6CS09', name: 'Database Management Systems',                   code: 'A6CS09', semester: 2, regulation },
        { id: 'A6CS11', name: 'Operating System',                              code: 'A6CS11', semester: 2, regulation },
        { id: 'A6CS13', name: 'Software Testing Fundamentals',                 code: 'A6CS13', semester: 2, regulation },
      ]

      // Merge DB subjects (real UUIDs) with canonical list
      // DB subjects take priority — their UUIDs are used for paper filtering
      const dbByCode = new Map((allSubs || []).map((s: any) => [s.code, s]))
      const finalSubs = ALL_SUBJECTS_CANONICAL.map(f => {
        const live = dbByCode.get(f.code)
        // Use DB record if found (preserves real UUID), otherwise use canonical fallback
        return live ? { ...live, name: f.name } : f
      })
      setSubjects(finalSubs)
      setProfileReady(true)
    }).catch(() => {
      setSelectedReg('R22')
      setProfileReady(true)
    })
  }, [user])

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function resetFilters() {
    setSelectedSubject(''); setSelectedSemester(''); setSelectedReg('R22'); setSelectedCats([]); setYearRange(2025); setSearchQ('')
  }

  const getDownloadUrl = (paper: Paper): string | null => {
    // We intentionally ignore paper.original_url here so that ALL downloads
    // route through our backend /api/v1/papers/{id}/download endpoint.
    // The backend handles downloading the RAR, parsing it internally,
    // and serving the exact PDF/DOCX file directly to the user.
    return null
  }

  const getSubjectName = (paper: Paper) => {
    // Try to get from subjects list first
    const subject = subjects.find(s => s.id === paper.subject_id)
    if (subject?.name) return subject.name
    
    // Fallback to paper title if available
    if (paper.title && paper.title !== 'Unknown') return paper.title
    
    // Last resort - generic name
    return 'Question Paper'
  }
  
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
  
  // CRITICAL: Semester Segregation Filter
  // ALWAYS restrict to our canonical 2nd-year subject codes — no 1st/3rd/4th year papers ever.
  const ALL_ALLOWED_CODES = new Set([
    ...SEMESTER_SUBJECTS['2-1'].map(s => s.code),
    ...SEMESTER_SUBJECTS['2-2'].map(s => s.code),
  ])

  const semesterFilteredBase = papers.filter(paper => {
    const subject = subjects.find(s => s.id === paper.subject_id)
    // Drop any paper whose subject isn't in our canonical 10-subject list
    if (!subject || !ALL_ALLOWED_CODES.has(subject.code)) return false
    // If a specific semester is chosen, further restrict to that semester's subjects
    if (debouncedSemester) {
      const semesterCodes = SEMESTER_SUBJECTS[debouncedSemester].map(s => s.code)
      return semesterCodes.includes(subject.code)
    }
    return true
  })

  // Deduplication: collapse papers that share the same subject + year + category.
  // Prevents split-title rows (e.g. "Computer Organization" vs "Digital Electronics and
  // Computer Organization") from rendering as separate cards in the grid.
  // Sort richest first (most parsed_questions), then dedupe by composite key.
  const semesterFilteredPapers = [...semesterFilteredBase]
    .sort((a, b) => ((b as any).parsed_questions?.length ?? 0) - ((a as any).parsed_questions?.length ?? 0))
    .filter((() => {
      const seen = new Set<string>()
      return (paper: any) => {
        const key = `${paper.subject_id}__${paper.exam_year}__${(paper.exam_category || paper.exam_type || '').toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }
    })())

  // Show loading state - match website vibe with engaging animation
  if (isLoading || !profileReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar activeTab="papers" />
        <div className="flex-1 flex items-center justify-center px-lg pt-[80px]">
          <div className="text-center space-y-xl max-w-md">
            {/* Animated icon */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-primary/30 animate-ping" style={{animationDuration: '2s'}} />
              <div className="absolute inset-8 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary/20">
                <span className="material-symbols-outlined text-[48px] text-primary animate-bounce" style={{
                  fontVariationSettings: "'FILL' 1",
                  animationDuration: '1.5s'
                }}>
                  description
                </span>
              </div>
            </div>
            
            {/* Text */}
            <div className="space-y-sm">
              <h2 className="font-headline text-headline-sm text-on-surface">
                Loading Papers
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Fetching question papers from the database...
              </p>
            </div>
            
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-sm">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{
                    animation: 'bounce 1.4s infinite',
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <NavBar activeTab="papers" />

      <div className="flex pt-[80px] min-h-screen">
        {/* ── Filter Sidebar ──────────────────────────────────────── */}
        <aside className="w-72 bg-surface-container border-r border-outline-variant h-full p-base hidden md:block overflow-visible fixed top-[80px] bottom-0 left-0 z-30" data-tour="tour-papers-filters">
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
                  <div className="absolute z-50 w-full mt-2 bg-[#121214] border border-[#1e1e24] rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
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

            {/* Semester Filter - CRITICAL NEW SECTION */}
            <div className="space-y-sm">
              <label className="font-data-label text-data-label text-outline block">SEMESTER</label>
              <div className="relative" data-dropdown="semester">
                <button
                  onClick={() => setSemesterDropdownOpen(o => !o)}
                  className="w-full bg-[#121214] border border-[#1e1e24] rounded-xl px-sm py-md text-body-sm text-on-surface flex items-center justify-between hover:border-[#ff6600]/50 transition-colors"
                >
                  <span className={selectedSemester ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {selectedSemester ? `Semester ${selectedSemester}` : 'All Semesters'}
                  </span>
                  <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 ${semesterDropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {semesterDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-[#121214] border border-[#1e1e24] rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
                    {/* All Semesters option */}
                    <button
                      onClick={() => { setSelectedSemester(''); setSemesterDropdownOpen(false) }}
                      className={`w-full text-left px-sm py-md text-body-sm transition-colors flex items-center gap-sm ${
                        !selectedSemester
                          ? 'bg-primary-container/10 text-primary-container'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {!selectedSemester && <span className="material-symbols-outlined text-[16px] text-[#ff6600]" style={{fontVariationSettings:"'FILL' 1"}}>check</span>}
                      All Semesters
                    </button>
                    <div className="h-px bg-outline-variant/30" />
                    {/* Semester 2-1 */}
                    <button
                      onClick={() => { setSelectedSemester('2-1'); setSemesterDropdownOpen(false) }}
                      className={`w-full text-left px-sm py-md text-body-sm transition-colors flex items-center gap-sm ${
                        selectedSemester === '2-1'
                          ? 'bg-primary-container/10 text-[#ff6600]'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {selectedSemester === '2-1' && <span className="material-symbols-outlined text-[16px] text-[#ff6600]" style={{fontVariationSettings:"'FILL' 1"}}>check</span>}
                      <span className={selectedSemester === '2-1' ? '' : 'ml-6'}>Semester 2-1</span>
                    </button>
                    {/* Semester 2-2 */}
                    <button
                      onClick={() => { setSelectedSemester('2-2'); setSemesterDropdownOpen(false) }}
                      className={`w-full text-left px-sm py-md text-body-sm transition-colors flex items-center gap-sm ${
                        selectedSemester === '2-2'
                          ? 'bg-primary-container/10 text-[#ff6600]'
                          : 'text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {selectedSemester === '2-2' && <span className="material-symbols-outlined text-[16px] text-[#ff6600]" style={{fontVariationSettings:"'FILL' 1"}}>check</span>}
                      <span className={selectedSemester === '2-2' ? '' : 'ml-6'}>Semester 2-2</span>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant italic flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Filter papers by academic semester allocation
              </p>
            </div>

            {/* Regulation - Only R22 is clickable, others are locked */}
            <div className="space-y-sm">
              <label className="font-data-label text-data-label text-outline block">REGULATION</label>
              <div className="flex gap-sm flex-wrap">
                {['R22','R20','R18','R16'].map(r => {
                  const isLocked = r !== 'R22'
                  return (
                    <motion.button
                      key={r}
                      onClick={() => !isLocked && setSelectedReg(r)}
                      disabled={isLocked}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      className={`px-sm py-xs rounded-lg font-data-value text-data-label border transition-colors relative ${
                        selectedReg === r && !isLocked
                          ? 'bg-primary-container/10 text-primary border-primary/20'
                          : isLocked
                          ? 'bg-surface/30 text-outline/40 border-outline-variant/20 cursor-not-allowed'
                          : 'bg-white/5 text-outline border-white/5 hover:bg-white/10'
                      }`}
                      title={isLocked ? 'Coming soon - R22 only for now' : undefined}
                    >
                      {r}
                      {isLocked && (
                        <span className="material-symbols-outlined text-[12px] absolute -top-1 -right-1 text-outline/60" style={{fontVariationSettings:"'FILL' 1"}}>
                          lock
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
              <p className="text-[11px] text-on-surface-variant italic flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Only R22 papers available currently
              </p>
            </div>

            {/* Exam Category */}
            <div className="space-y-md">
              <label className="font-data-label text-data-label text-outline block">EXAM CATEGORY</label>
              <div className="space-y-sm">
                {/* Semester — active */}
                <label className="flex items-center gap-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes('Semester')}
                    onChange={() => toggleCat('Semester')}
                    className="rounded border-outline-variant bg-surface text-primary-container focus:ring-primary-container w-4 h-4 accent-primary-container"
                  />
                  <span className="text-body-sm group-hover:text-primary transition-colors">Semester</span>
                </label>
                {/* Mid-1 & Mid-2 — coming soon, locked */}
                {['Mid-1', 'Mid-2'].map(cat => (
                  <div key={cat} className="flex items-center gap-sm opacity-40 cursor-not-allowed" title="Coming soon">
                    <input type="checkbox" disabled className="rounded border-outline-variant bg-surface w-4 h-4 cursor-not-allowed" />
                    <span className="text-body-sm text-on-surface-variant">{cat}</span>
                    <span className="material-symbols-outlined text-[13px] text-outline ml-auto" style={{fontVariationSettings:"'FILL' 1"}}>lock</span>
                    <span className="text-[10px] text-outline italic">soon</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant italic flex items-center gap-xs">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Mid-term papers coming soon
              </p>
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
            {semesterFilteredPapers && semesterFilteredPapers.length > 0 && (
              <div className="flex items-center gap-sm text-body-sm font-body-md text-outline">
                <span className="text-primary-container font-bold">{semesterFilteredPapers.length} papers found</span>
                {selectedSemester && <><span className="opacity-30">•</span><span>Semester {selectedSemester}</span></>}
                {selectedCats.length > 0 && <><span className="opacity-30">•</span><span>{selectedCats.join(', ')}</span></>}
                {selectedReg && <><span className="opacity-30">•</span><span>{selectedReg}</span></>}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error instanceof Error ? error.message : 'Failed to load papers'}
              </div>
            )}

            {/* ── Paper Cards ─────────────────────────────────────── */}
            {semesterFilteredPapers && semesterFilteredPapers.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                {semesterFilteredPapers.map((paper, index) => {
                  // ── Strict marks (regulation + category driven, never raw DB sum) ──
                  // Use questions length if available; otherwise fall back to the stored question_count from the API
                  const qArray = (paper as any).questions || paper.parsed_questions || []
                  const trueQuestionCount = qArray.length > 0 ? qArray.length : (paper.question_count || 0)
                  const isR22Card = paper.regulation?.toUpperCase() === 'R22'
                  const catCard = (paper.exam_category || paper.exam_type || '').toLowerCase()
                  const isMidCard = catCard.includes('mid')
                  
                  const trueTotalMarks = paper.max_marks || (paper.regulation === 'R22' || paper.exam_year === 2025 ? 60 : 70);
                  
                  const hasQuestions = trueQuestionCount > 0
                  const downloadUrl = getDownloadUrl(paper)
                  
                  return (
                    <motion.div
                      key={paper.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring' as const, stiffness: 300, damping: 20, delay: index * 0.04 }}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.01, boxShadow: '0 0 20px rgba(249,115,22,0.12)' }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
                      onClick={() => navigate(`/papers/${paper.id}`)}
                      className="relative bg-surface border border-outline-variant p-lg rounded-2xl transition-all duration-300 group overflow-hidden cursor-pointer hover:-translate-y-1"
                      style={{transition:'all 0.3s'}}
                      onMouseEnter={e => { 
                        (e.currentTarget as HTMLElement).style.borderColor='#f97316'
                        ;(e.currentTarget as HTMLElement).style.boxShadow='0 8px 30px rgba(249,115,22,0.2)'
                      }}
                      onMouseLeave={e => { 
                        (e.currentTarget as HTMLElement).style.borderColor=''
                        ;(e.currentTarget as HTMLElement).style.boxShadow=''
                      }}
                    >
                      {/* Subtle gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-base">
                          <h3 className="font-headline text-body-lg text-on-surface group-hover:text-primary-container transition-colors font-bold">
                            {getSubjectName(paper)}
                          </h3>
                          <div className="flex items-center gap-xs">
                            <span className="bg-primary/10 border border-primary/20 px-sm py-xs rounded-lg text-data-label font-data-label text-primary">
                              {paper.regulation}
                            </span>
                            {hasQuestions && (
                              <span className="material-symbols-outlined text-emerald-500 text-[18px]" style={{fontVariationSettings:"'FILL' 1"}} title="Fully processed">
                                verified
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-md">
                          <div className="flex items-center gap-sm text-outline">
                            <span className="material-symbols-outlined text-[18px] text-primary-container">calendar_today</span>
                            <span className="text-body-sm font-medium">{formatExamType(paper)}</span>
                          </div>
                          
                          {/* Stats grid - ZERO DASHES RULE: Always show values */}
                          <div className="grid grid-cols-3 gap-sm py-base border-y border-outline-variant bg-surface-container-highest/30 rounded-lg px-sm">
                            <div className="flex flex-col items-center text-center">
                              <span className="text-outline text-data-label font-data-label mb-xs uppercase tracking-wider">Questions</span>
                              <span className="font-data-value text-data-value font-bold text-primary-container">
                                {trueQuestionCount}
                              </span>
                            </div>
                            <div className="flex flex-col items-center text-center border-x border-outline-variant/50">
                              <span className="text-outline text-data-label font-data-label mb-xs uppercase tracking-wider">Total Marks</span>
                              <span className="font-data-value text-data-value font-bold text-emerald-500">
                                {trueTotalMarks}
                              </span>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              <span className="text-outline text-data-label font-data-label mb-xs uppercase tracking-wider">Duration</span>
                              <span className="text-on-surface font-data-value text-data-value font-bold">
                                {paper.duration_hours || 3}h
                              </span>
                            </div>
                          </div>
                          
                          {/* Part A / Part B breakdown with progress bars */}
                          {((paper.part_a_count ?? 0) > 0 || (paper.part_b_count ?? 0) > 0) && (
                            <div className="space-y-sm bg-surface-container-highest/20 p-sm rounded-lg">
                              {(paper.part_a_count ?? 0) > 0 && (
                                <div className="flex items-center justify-between text-body-sm">
                                  <span className="flex items-center gap-xs text-outline font-medium">
                                    <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
                                    Part A
                                  </span>
                                  <span className="font-bold text-primary-container">{paper.part_a_count} Q's</span>
                                </div>
                              )}
                              {(paper.part_b_count ?? 0) > 0 && (
                                <div className="flex items-center justify-between text-body-sm">
                                  <span className="flex items-center gap-xs text-outline font-medium">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                                    Part B
                                  </span>
                                  <span className="font-bold text-emerald-500">{paper.part_b_count} Q's</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons with better interactivity */}
                        <div className="mt-lg pt-base border-t border-outline-variant flex justify-between items-center gap-base">
                          {(() => {
                            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
                            const href = downloadUrl || `${apiBase}/papers/${paper.id}/download`
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-primary-container/10 hover:bg-primary-container/20 border border-primary-container/20 hover:border-primary-container/40 text-primary-container hover:text-primary font-bold text-body-sm flex items-center justify-center gap-xs transition-all rounded-lg py-sm"
                              >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download
                              </a>
                            )
                          })()}
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/papers/${paper.id}`) }}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-body-sm flex items-center justify-center gap-xs transition-all rounded-lg py-sm shadow-lg hover:shadow-xl"
                          >
                            View Paper
                            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ── Empty State (Screen 16) ──────────────────────────── */}
            {semesterFilteredPapers && semesterFilteredPapers.length === 0 && !error && (
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
    </PageTransition>
  )
}
