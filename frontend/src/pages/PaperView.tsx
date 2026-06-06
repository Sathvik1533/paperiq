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
}

export function PaperView() {
  const { paperId } = useParams<{ paperId: string }>()
  const navigate    = useNavigate()
  const [searchParams] = useSearchParams()

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
  const [downloadToast, setDownloadToast] = useState<{ show: boolean; type: 'info' | 'error' }>({ show: false, type: 'info' })

  useEffect(() => { if (paperId) loadPaper() }, [paperId])

  async function loadPaper() {
    try {
      setLoading(true)
      const { data: p, error: pErr } = await supabase
        .from('papers')
        .select('id, title, exam_type, exam_year, exam_month, exam_category, regulation, subject_id, max_marks, duration_hours, original_url, storage_path')
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
      if (searchParams.get('download') === '1' && (p.original_url || p.storage_path)) {
        const url = p.original_url || getStorageUrl(p.storage_path!)
        window.open(url, '_blank')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load paper')
    } finally {
      setLoading(false)
    }
  }

  // Helper to convert storage_path to public URL
  function getStorageUrl(path: string): string {
    const { data } = supabase.storage.from('papers').getPublicUrl(path)
    return data?.publicUrl || ''
  }

  function downloadPaper() {
    if (!paper) return
    // Use original_url (direct link) first, then fall back to Supabase storage
    const url = paper.original_url
      || (paper.storage_path ? getStorageUrl(paper.storage_path) : '')
    if (url) {
      window.open(url, '_blank')
    } else {
      // Show an elegant in-page toast instead of a browser alert
      setDownloadToast({ show: true, type: 'info' })
      setTimeout(() => setDownloadToast({ show: false, type: 'info' }), 4000)
    }
  }

  const filteredQ = questions.filter(q => {
    if (filterPart !== 'all' && q.part !== filterPart) return false
    if (filterUnit && !q.unit_name?.toLowerCase().includes(filterUnit.toLowerCase())) return false
    if (filterTopic && q.topic_name !== filterTopic) return false
    return true
  })

  const partACount = questions.filter(q => q.part === 'A').length
  const partBCount = questions.filter(q => q.part === 'B').length
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
    <div className="min-h-screen bg-background">
      <NavBar activeTab="papers" />

      {/* PDF Unavailable Toast */}
      {downloadToast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-sm bg-surface-container border border-outline-variant rounded-2xl px-lg py-md shadow-xl backdrop-blur-xl max-w-sm">
            <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary-container text-[18px]">hourglass_top</span>
            </div>
            <div>
              <p className="text-body-sm font-bold text-on-surface">PDF coming soon</p>
              <p className="text-[11px] text-on-surface-variant mt-[1px]">Questions are fully available above. PDF upload in progress.</p>
            </div>
            <button
              onClick={() => setDownloadToast({ show: false, type: 'info' })}
              className="ml-auto text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

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
              {[
                { icon:'school',        text: paper.regulation },
                { icon:'list_alt',      text: `${questions.length} Questions` },
                { icon:'military_tech', text: paper.max_marks ? `${paper.max_marks} Marks` : '—' },
                ...(paper.duration_hours
                  ? [{ icon:'schedule', text: `${paper.duration_hours} Hr${paper.duration_hours > 1 ? 's' : ''}` }]
                  : []),
              ].map(tag => (
                <span key={tag.text} className="flex items-center gap-xs text-body-sm font-data-label text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">{tag.icon}</span> {tag.text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-base">
            <button
              onClick={downloadPaper}
              className={`px-base py-sm border rounded-xl transition-all flex items-center gap-sm font-body-md ${
                (paper.original_url || paper.storage_path)
                  ? 'border-outline-variant text-on-surface hover:bg-surface-container-high'
                  : 'border-outline-variant/50 text-on-surface-variant/60 cursor-default'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {(paper.original_url || paper.storage_path) ? 'download' : 'hourglass_top'}
              </span>
              {(paper.original_url || paper.storage_path) ? 'Download PDF' : 'PDF Coming Soon'}
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
                {filteredQ.map((q, i) => {
                  const isPartB = q.part === 'B'
                  return (
                    <div
                      key={q.id}
                      className="glass-card rounded-xl p-lg"
                      style={{borderLeft: `4px solid ${isPartB ? '#10b981' : '#f97316'}`}}
                    >
                      <div className="flex justify-between items-start mb-sm">
                        <div className="flex gap-sm items-center">
                          <span className={`font-data-label text-[10px] px-sm py-xs rounded-full uppercase font-bold border ${
                            q.part === 'A'
                              ? 'bg-primary-container/10 text-primary-container border-primary-container/20'
                              : 'bg-secondary-container text-on-secondary-container border-transparent'
                          }`}>
                            {q.part ? `Part ${q.part}` : 'Question'}
                          </span>
                          {q.unit_name && (
                            <span className="font-data-label text-[10px] bg-surface-container-highest text-on-surface-variant px-sm py-xs rounded-full uppercase">
                              {q.unit_name}
                            </span>
                          )}
                        </div>
                        {q.marks && (
                          <span className={`font-data-value ${isPartB ? 'text-emerald-500' : 'text-primary-container'}`}>
                            {q.marks} Marks
                          </span>
                        )}
                      </div>
                      <h4 className="text-body-lg font-bold mb-md">{q.question_text}</h4>
                      {q.topic_name && (
                        <div className="flex items-center gap-sm">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">tag</span>
                          <span className="text-body-sm text-on-surface-variant">Topic: {q.topic_name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="glass-card p-xl text-center rounded-xl">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-base block">quiz</span>
                <p className="text-on-surface-variant">No questions found. Extraction may still be in progress.</p>
              </div>
            )}
          </div>

          {/* PDF Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-[100px] h-[calc(100vh-140px)]">
            <div className="glass-card rounded-xl h-full flex flex-col">
              <div className="p-base border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline text-body-md font-bold">View Original PDF</h3>
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
                    className={`mt-lg px-base py-xs rounded-lg text-body-sm font-bold z-10 transition-all flex items-center gap-sm ${
                      (paper.original_url || paper.storage_path)
                        ? 'bg-primary-container text-on-primary-container hover:brightness-110'
                        : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant cursor-default'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {(paper.original_url || paper.storage_path) ? 'download' : 'hourglass_top'}
                    </span>
                    {(paper.original_url || paper.storage_path) ? 'Download PDF' : 'PDF Coming Soon'}
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
  )
}
