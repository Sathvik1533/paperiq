/**
 * PaperView — Screens 17 (individual paper) + 18 (PDF viewer)
 * Route: /papers/:paperId
 *
 * Shows: breadcrumb, paper metadata, Part A/B structure, questions list with filters,
 * PDF sidebar. Download button triggers real download.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'
import { CustomSelect } from '../components/CustomSelect'
import { motion, useReducedMotion } from 'framer-motion'
import { PageTransition } from '../components/ui/PageTransition'
interface Question {
  id: string
  question_number?: number
  question_text: string
  unit_name?: string
  topic_name?: string
  marks?: number
  part?: string
  question_type?: string
}

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
  duration_hours?: number   // actual DB column name
  original_url?: string     // actual DB column (download link)
  storage_path?: string     // actual DB column (Supabase storage)
  storage_bucket?: string   // actual DB column (Supabase bucket name)
}

export function PaperView() {
  const { paperId } = useParams<{ paperId: string }>()
  const navigate    = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldReduceMotion = useReducedMotion()

  const [paper, setPaper]             = useState<Paper | null>(null)
  const [questions, setQuestions]     = useState<Question[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [filterPart, setFilterPart]   = useState<'all'|'A'|'B'>('all')
  const [filterUnit, setFilterUnit]   = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  // Adjacent paper IDs for Prev/Next navigation — matches Stitch bottom bar
  const [prevPaperId, setPrevPaperId] = useState<string | null>(null)
  const [nextPaperId, setNextPaperId] = useState<string | null>(null)

  useEffect(() => { if (paperId) loadPaper() }, [paperId])

  async function loadPaper() {
    try {
      setLoading(true)
      const { data: p, error: pErr } = await supabase
        .from('papers')
        .select('id, title, exam_type, exam_year, exam_month, exam_category, regulation, subject_id, max_marks, duration_hours, original_url, storage_path, storage_bucket')
        .eq('id', paperId)
        .single()
      if (pErr) throw pErr
      setPaper(p)

      // Get subject name
      if (p.subject_id) {
        const { data: sub } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', p.subject_id)
          .single()
        if (sub) setSubjectName(sub.name)
      }

      // Get questions ordered by question_number (paper order), fallback to marks
      const { data: qs } = await supabase
        .from('questions')
        .select('id, question_number, question_text, unit_name, topic_name, marks, part, question_type')
        .eq('paper_id', paperId)
        .order('question_number', { ascending: true, nullsFirst: false })
      setQuestions(qs || [])

      // Fetch adjacent papers (same subject, ordered by year) for Prev/Next nav
      if (p.subject_id) {
        const { data: siblings } = await supabase
          .from('papers')
          .select('id, exam_year, exam_month')
          .eq('subject_id', p.subject_id)
          .eq('regulation', p.regulation)
          .order('exam_year', { ascending: false })
          .order('exam_month', { ascending: false })

        if (siblings && siblings.length > 1) {
          const idx = siblings.findIndex((s: any) => s.id === paperId)
          if (idx > 0) setNextPaperId(siblings[idx - 1].id)   // newer = "next"
          if (idx < siblings.length - 1) setPrevPaperId(siblings[idx + 1].id) // older = "prev"
        }
      }

      // Auto-trigger download if ?download=1
      if (searchParams.get('download') === '1') {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
        const isRarOrZip = p.original_url?.match(/\.(rar|zip)$/i)
        const url = (p.original_url?.startsWith('http') && !isRarOrZip)
          ? p.original_url
          : `${apiBase}/papers/${p.id}/download`
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load paper')
    } finally {
      setLoading(false)
    }
  }

  // Build the public Supabase Storage URL using the SDK — handles URL encoding correctly
  function getStorageUrl(storagePath: string, bucketName: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath)
    return data?.publicUrl || ''
  }

  async function downloadPaper() {
    if (!paper) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

    // Priority 1: original_url is a direct PDF or DOCX (not a RAR archive)
    if (paper.original_url && paper.original_url.startsWith('http')) {
      const url = paper.original_url.toLowerCase()
      if (!url.endsWith('.rar') && !url.endsWith('.zip')) {
        // Direct document link — open it
        console.log('[Download] direct original_url →', paper.original_url)
        window.open(paper.original_url, '_blank', 'noopener,noreferrer')
        return
      }
      // RAR/ZIP — fall through to backend extraction
      console.log('[Download] original_url is archive, using backend extraction')
    }

    // Priority 2: Document is stored in Supabase Storage
    if (paper.storage_path && paper.storage_bucket) {
      const storageUrl = getStorageUrl(paper.storage_path, paper.storage_bucket)
      console.log('[Download] Supabase Storage →', storageUrl)
      window.open(storageUrl, '_blank', 'noopener,noreferrer')
      return
    }

    // Priority 3: Backend on-demand PDF generation from extracted questions
    // This is the fallback working path — generates a clean PDF from the parsed questions
    const pdfUrl = `${apiBase}/papers/${paper.id}/download`
    console.log('[Download] Backend PDF →', pdfUrl)
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  // Helper to normalize part value (handles both "Part A" and "A" formats)
  const normalizePart = (part: string | undefined): 'A' | 'B' | null => {
    if (!part) return null
    const partUpper = part.toUpperCase()
    if (partUpper === 'A' || partUpper === 'PART A') return 'A'
    if (partUpper === 'B' || partUpper === 'PART B') return 'B'
    return null
  }

  const filteredQ = questions.filter(q => {
    if (filterPart !== 'all') {
      const qPart = normalizePart(q.part)
      if (qPart !== filterPart) return false
    }
    if (filterUnit && !q.unit_name?.toLowerCase().includes(filterUnit.toLowerCase())) return false
    if (filterTopic && q.topic_name !== filterTopic) return false
    return true
  })

  const partACount = questions.filter(q => normalizePart(q.part) === 'A').length
  const partBCount = questions.filter(q => normalizePart(q.part) === 'B').length
  const units  = Array.from(new Set(questions.map(q => q.unit_name).filter(Boolean))) as string[]
  const topics = Array.from(new Set(questions.map(q => q.topic_name).filter(Boolean))) as string[]

  const formatTitle = () => {
    if (!paper) return ''
    const rawCat = paper.exam_category || paper.exam_type || ''
    const cat = (rawCat && rawCat !== 'Unknown') ? rawCat : ''
    const rawMonth = paper.exam_month && paper.exam_month !== 'Unknown' ? paper.exam_month : ''
    const month = rawMonth ? ` ${rawMonth}` : ''
    const year = paper.exam_year ? ` ${paper.exam_year}` : ''
    return (cat || year) ? `${cat}${month}${year}`.trim() : 'Past Paper'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="papers" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
          <div className="skeleton h-6 w-64 mb-8 rounded-lg" />
          <div className="skeleton h-12 w-80 mb-4 rounded-lg" />
          <div className="skeleton h-5 w-96 mb-8 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
            <div className="lg:col-span-8 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
            </div>
            <div className="hidden lg:block lg:col-span-4 skeleton rounded-xl h-96" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="papers" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 flex items-center justify-center min-h-[60vh]">
          <div className="glass-card rounded-2xl p-xl text-center max-w-md">
            <span className="material-symbols-outlined text-[64px] text-error mb-base block">error</span>
            <h2 className="font-headline text-headline-md mb-sm">Paper Not Found</h2>
            <p className="text-on-surface-variant mb-xl">{error || 'This paper could not be found.'}</p>
            <button onClick={() => navigate('/papers')} className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl font-bold hover:brightness-110 transition-all">
              Back to Papers
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <NavBar activeTab="papers" />

      <main className="max-w-[1200px] mx-auto px-lg py-xl pt-32 pb-huge">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs text-body-sm mb-lg">
          <button onClick={() => navigate('/papers')} className="text-on-surface-variant hover:text-primary cursor-pointer">Papers</button>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
          <button onClick={() => navigate(`/papers?subject=${paper.subject_id}`)} className="text-on-surface-variant hover:text-primary cursor-pointer">{subjectName}</button>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
          <span className="text-primary">{formatTitle()}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xxl">
          <div>
            <h2 className="font-headline text-headline-md text-on-surface-variant mb-xs">{subjectName}</h2>
            <h1 className="font-headline text-display-hero-mobile md:text-headline-lg font-bold text-on-surface leading-tight">{formatTitle()}</h1>
            <div className="flex flex-wrap items-center gap-base mt-md">
              {(() => {
                // Strict academic marks calculation — never trust stale DB max_marks column.
                // Priority 1: Sum marks from parsed questions (ground truth)
                // Priority 2: Regulation cap — R22 = 60M, all others = 70M
                const regulationCap = (paper.regulation?.toUpperCase() === 'R22') ? 60 : 70
                const absoluteTotalMarks = paper.max_marks || regulationCap
                
                return [
                  { icon:'school',        text: paper.regulation },
                  { icon:'list_alt',      text: `${questions.length} Questions` },
                  { icon:'military_tech', text: `${absoluteTotalMarks} Marks` },
                  { icon:'schedule',      text: `${paper.duration_hours || 3} Hr${(paper.duration_hours || 3) > 1 ? 's' : ''}` },
                ].map(tag => (
                  <span key={tag.text} className="flex items-center gap-xs text-body-sm font-data-label text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">
                    <span className="material-symbols-outlined text-[18px]">{tag.icon}</span> {tag.text}
                  </span>
                ))
              })()}
            </div>
          </div>
          <div className="flex gap-base">
            <button
              onClick={downloadPaper}
              className="px-base py-sm border border-outline-variant text-on-surface hover:bg-surface-container-high rounded-xl transition-all flex items-center gap-sm font-body-md"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
              Download Question Paper
            </button>
            <button
              onClick={() => navigate('/papers')}
              className="px-base py-sm bg-primary-container text-on-primary-container rounded-xl hover:brightness-110 transition-all flex items-center gap-sm font-body-md font-bold"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span> Back to Papers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          {/* Questions */}
          <div className="lg:col-span-8">
            {/* Structure */}
            {(partACount > 0 || partBCount > 0) && (
              <div className="glass-card rounded-xl p-lg mb-xl">
                <div className="flex items-center justify-between mb-base">
                  <h3 className="font-headline text-body-lg font-bold uppercase tracking-wider text-on-surface-variant">Paper Structure</h3>
                  <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
                <div className="space-y-base">
                  {partACount > 0 && (
                    <div className="space-y-xs">
                      <div className="flex justify-between items-end">
                        <span className="text-body-md font-bold">Part A: Short Questions</span>
                        <span className="font-data-value text-primary">{partACount} Questions</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-container h-full rounded-full" style={{width:`${Math.min(partACount / questions.length * 100, 100)}%`}} />
                      </div>
                    </div>
                  )}
                  {partBCount > 0 && (
                    <div className="space-y-xs">
                      <div className="flex justify-between items-end">
                        <span className="text-body-md font-bold">Part B: Long Questions</span>
                        <span className="font-data-value text-secondary-fixed-dim">{partBCount} Questions</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div className="bg-secondary-fixed-dim h-full rounded-full" style={{width:`${Math.min(partBCount / questions.length * 100, 100)}%`}} />
                      </div>
                    </div>
                  )}
                  {partACount === 0 && partBCount === 0 && questions.length > 0 && (
                    <div className="text-center py-base">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-sm block">info</span>
                      <p className="text-body-sm text-on-surface-variant">
                        This paper has {questions.length} questions that are being processed for classification.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filters — All Questions / Part A / Part B | All Units | All Topics */}
            <div className="flex flex-col md:flex-row gap-base items-center justify-between mb-lg">
              <div className="flex p-xs bg-surface-container rounded-xl">
                {(['all','A','B'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPart(p)}
                    className={`px-base py-xs rounded-lg font-body-sm transition-colors ${
                      filterPart === p ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {p === 'all' ? 'All Questions' : `Part ${p}`}
                  </button>
                ))}
              </div>
              <div className="flex gap-base w-full md:w-auto">
                {units.length > 0 && (
                  <CustomSelect
                    value={filterUnit}
                    onChange={setFilterUnit}
                    placeholder="All Units"
                    options={[{ value: '', label: 'All Units' }, ...units.map(u => ({ value: u, label: u }))]}
                    className="flex-1 md:flex-none md:w-48"
                  />
                )}
                {topics.length > 0 && (
                  <CustomSelect
                    value={filterTopic}
                    onChange={setFilterTopic}
                    placeholder="All Topics"
                    options={[{ value: '', label: 'All Topics' }, ...topics.map(t => ({ value: t, label: t }))]}
                    className="flex-1 md:flex-none md:w-56"
                  />
                )}
              </div>
            </div>

            {/* Questions list */}
            {filteredQ.length > 0 ? (
              <div className="space-y-base">
                {filteredQ.map((q, index) => {
                  const qPart = normalizePart(q.part)
                  const isPartB = qPart === 'B'
                  // Smart fallback for marks: Part A = 2 marks, Part B = 10 marks
                  const displayMarks = q.marks || (qPart === 'A' ? 2 : qPart === 'B' ? 10 : null)
                  
                  return (
                    <motion.div
                      key={q.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring' as const, stiffness: 300, damping: 20, delay: index * 0.03 }}
                      className="glass-card rounded-xl p-lg"
                      style={{borderLeft: `4px solid ${isPartB ? '#10b981' : '#f97316'}`}}
                    >
                      {/* Question header with part badges */}
                      <div className="flex gap-sm items-center mb-sm">
                        <span className={`font-data-label text-[10px] px-sm py-xs rounded-full uppercase font-bold border ${
                          qPart === 'A'
                            ? 'bg-primary-container/10 text-primary-container border-primary-container/20'
                            : 'bg-secondary-container text-on-secondary-container border-transparent'
                        }`}>
                          {qPart ? `Part ${qPart}` : 'Question'}
                        </span>
                        {q.unit_name && (
                          <span className="font-data-label text-[10px] bg-surface-container-highest text-on-surface-variant px-sm py-xs rounded-full uppercase">
                            {q.unit_name}
                          </span>
                        )}
                      </div>
                      
                      {/* Question text and marks - right-aligned layout */}
                      <div className="flex justify-between items-center w-full gap-lg mb-md">
                        <h4 className="text-body-lg font-bold flex-1">{q.question_text}</h4>
                        {displayMarks && (
                          <span className={`font-data-value font-bold text-lg whitespace-nowrap ${
                            isPartB ? 'text-emerald-500' : 'text-primary-container'
                          }`}>
                            [{displayMarks} Marks]
                          </span>
                        )}
                      </div>
                      
                      {q.topic_name && (
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">tag</span>
                          <span className="text-body-sm text-on-surface-variant">Topic: {q.topic_name}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : questions.length === 0 ? (
              // Graceful empty state when no questions have been extracted yet
              <div className="glass-card p-xl text-center rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/20">
                <div className="max-w-md mx-auto space-y-lg">
                  <div className="relative inline-block">
                    <span className="material-symbols-outlined text-[64px] text-primary-container mb-base block animate-pulse">
                      auto_awesome
                    </span>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-container rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px] text-on-primary-container" style={{fontVariationSettings:"'FILL' 1"}}>
                        settings
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-sm">
                    <h3 className="font-headline text-headline-sm text-on-surface font-bold">
                      AI Question Breakdown in Progress
                    </h3>
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      Our AI is currently analyzing this paper and extracting individual questions with topics and marks breakdown. 
                    </p>
                  </div>
                  
                  <div className="bg-surface-container-highest/50 rounded-xl p-lg border border-outline-variant/30">
                    <div className="flex items-start gap-base text-left">
                      <span className="material-symbols-outlined text-[24px] text-primary-container flex-shrink-0 mt-xs" style={{fontVariationSettings:"'FILL' 1"}}>
                        download
                      </span>
                      <div className="space-y-xs flex-1">
                        <p className="text-body-md font-bold text-on-surface">
                          Get the Official Paper Now
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          Use the download button on the right to grab the complete, authentic MLRIT examination paper instantly while we process the questions!
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={downloadPaper}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-xl py-base rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-sm mx-auto"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Download Question Paper
                  </button>
                </div>
              </div>
            ) : (
              // No questions match filters
              <div className="glass-card p-xl text-center rounded-xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-base block">filter_alt_off</span>
                <p className="text-on-surface-variant">No questions match your current filters. Try adjusting them above.</p>
              </div>
            )}
          </div>

          {/* PDF Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-[100px] h-[calc(100vh-140px)]">
            <div className="glass-card rounded-xl h-full flex flex-col">
              <div className="p-base border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline text-body-md font-bold">View Original Paper</h3>
                <button onClick={downloadPaper} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface text-[20px]">download</button>
              </div>
              <div className="flex-grow p-base overflow-y-auto">
                <div className="relative w-full aspect-[1/1.414] bg-surface-container-highest rounded-lg border border-outline-variant flex flex-col items-center justify-center p-xl text-center">
                  <span className="material-symbols-outlined text-[64px] text-primary-container mb-base z-10">description</span>
                  <p className="text-body-sm font-bold z-10">
                    {subjectName} — {formatTitle()}
                  </p>
                  <p className="text-body-sm text-on-surface-variant z-10 mt-xs">{paper.regulation}</p>
                  <button
                    onClick={downloadPaper}
                    className="mt-lg px-base py-xs rounded-lg text-body-sm font-bold z-10 transition-all flex items-center gap-sm bg-primary-container text-on-primary-container hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download Question Paper
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Fixed Bottom Navigation — matches Stitch 17_paper_view_refined.html exactly */}
      <div className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-xl border-t border-outline-variant z-40">
        <div className="max-w-[1200px] mx-auto px-lg py-base flex items-center justify-between">
          <button
            onClick={() => prevPaperId ? navigate(`/papers/${prevPaperId}`) : undefined}
            disabled={!prevPaperId}
            className={`flex items-center gap-xs font-body-md transition-colors ${
              prevPaperId
                ? 'text-on-surface-variant hover:text-primary cursor-pointer'
                : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined">west</span>
            <span className="hidden sm:inline">Previous Paper</span>
          </button>

          <button
            onClick={() => navigate('/papers')}
            className="px-base py-xs border border-outline-variant rounded-xl text-on-surface-variant hover:text-on-surface transition-colors font-body-md text-body-sm"
          >
            Back to Papers
          </button>

          <button
            onClick={() => nextPaperId ? navigate(`/papers/${nextPaperId}`) : undefined}
            disabled={!nextPaperId}
            className={`flex items-center gap-xs font-body-md transition-colors ${
              nextPaperId
                ? 'text-on-surface-variant hover:text-primary cursor-pointer'
                : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next Paper</span>
            <span className="material-symbols-outlined">east</span>
          </button>
        </div>
      </div>

      <div className="pb-20">
        <Footer />
      </div>
    </div>
    </PageTransition>
  )
}
