/**
 * Onboarding — Screens 05 (Select), 07 (Extracting), 08 (Confirm), 09 (Manual)
 * Route: /onboarding
 *
 * Four steps:
 *   method    → choose hall ticket or manual
 *   extracting → animated OCR in progress
 *   confirm   → verify extracted data
 *   manual    → fill form manually
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { parseHallTicket, upsertUserProfile } from '../lib/api'
import { CustomSelect } from '../components/CustomSelect'

type Step = 'method' | 'extracting' | 'confirm' | 'manual'

interface Extracted {
  branch: string | null
  regulation: string | null
  year: number | null
  semester: number | null
  semester_display: string | null
  subject_codes: string[]
  subjects: Array<{ code: string; name: string }>
  confidence: string
}

export function Onboarding() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const [step, setStep] = useState<Step>('method')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [extracted, setExtracted] = useState<Extracted | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Manual form state
  const [manual, setManual] = useState({
    college: 'MLRIT',
    branch: 'CSE',
    regulation: 'R22',
    year: 2,
    semester: 3,
  })

  const processFile = useCallback(async (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG)')
      setStep('method')
      return
    }
    setError('')
    setStep('extracting')
    try {
      const result = await parseHallTicket(file)
      setExtracted(result)
      setStep('confirm')
    } catch (err: any) {
      setError(err.message || 'Failed to parse hall ticket')
      setStep('method')
    }
  }, [])

  // Window-level drag-and-drop so files can be dropped from anywhere
  useEffect(() => {
    if (step !== 'method') return
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current++
      if (e.dataTransfer?.types.includes('Files')) setIsDraggingOver(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDraggingOver(false) }
    }
    const handleDragOver = (e: DragEvent) => e.preventDefault()
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDraggingOver(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) processFile(file)
    }
    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [step, processFile])

  // ── STEP: method ──────────────────────────────────────────────────────────
  if (step === 'method') {
    return (
      <div className={`min-h-screen text-on-surface flex flex-col items-center transition-colors duration-200 ${isDraggingOver ? 'bg-primary/5' : 'bg-background'}`}
        style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'40px 40px'}}>

        {/* Full-screen drag overlay */}
        {isDraggingOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-dashed border-primary-container rounded-3xl w-[80vw] h-[70vh] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[72px] text-primary-container" style={{fontVariationSettings:"'FILL' 1"}}>upload_file</span>
              <p className="text-2xl font-headline font-bold text-primary-container">Drop your hall ticket here</p>
              <p className="text-on-surface/50 text-sm">PDF, JPG, or PNG</p>
            </div>
          </div>
        )}

        <header className="w-full max-w-[1200px] flex justify-between items-center h-20 px-base md:px-xl">
          <Link to="/" className="font-headline text-headline-md font-bold text-on-surface tracking-tight">PaperIQ</Link>
          <span className="text-on-secondary-fixed-variant text-body-sm hidden md:block">Step 1 of 2</span>
        </header>

        <main className="flex-1 w-full max-w-[1200px] px-base md:px-xl py-xl flex flex-col items-center justify-center">
          <section className="text-center mb-huge">
            <h1 className="font-headline text-display-hero-mobile md:text-headline-lg font-bold mb-md tracking-tight">
              We'll set up your profile in 30 seconds
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface/60 max-w-2xl mx-auto mb-base">
              Upload your hall ticket or enter details manually — your choice
            </p>
            <div className="flex items-center justify-center gap-sm text-on-surface/40 font-body-sm">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>lock</span>
              <span>Your data stays private. We never share hall tickets.</span>
            </div>
            <p className="text-on-surface/30 text-xs mt-sm font-body-sm flex items-center justify-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">info</span> You can also drag and drop from anywhere — desktop, WhatsApp, file manager
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg w-full max-w-4xl">
            {/* Hall ticket — primary */}
            <div
              className="glass-card rounded-xl p-xl flex flex-col justify-between relative overflow-hidden cursor-pointer"
              style={{boxShadow:'0 0 40px -10px rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.2)'}}
              onClick={() => fileRef.current?.click()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
              <div>
                <div className="flex items-center gap-sm mb-base">
                  <span className="material-symbols-outlined text-[24px] text-primary-container" style={{fontVariationSettings:"'FILL' 1"}}>id_card</span>
                  <h2 className="font-headline text-headline-md font-bold text-white">Upload Hall Ticket <span className="text-success text-sm">(Fastest)</span></h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface/70 mb-lg">
                  We'll auto-fill your college, branch, regulation, and subjects. Works for MLRIT and other colleges.
                </p>
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                />
                <button className="w-full bg-primary-container text-on-primary font-bold py-md px-lg rounded-xl flex items-center justify-center gap-sm mb-md hover:brightness-110 transition-all">
                  <span className="material-symbols-outlined">file_upload</span>
                  Choose Hall Ticket
                </button>
                <p className="font-data-label text-data-label text-on-surface/40 text-center uppercase tracking-widest">Supports: PDF, JPG, PNG • Max 5MB</p>
              </div>
              {error && <p className="text-error text-body-sm mt-md">{error}</p>}
            </div>

            {/* Manual entry */}
            <div className="glass-card rounded-xl p-xl flex flex-col justify-between cursor-pointer" onClick={() => setStep('manual')}>
              <div>
                <div className="flex items-center gap-sm mb-base">
                  <span className="material-symbols-outlined text-[24px] text-on-surface-variant" style={{fontVariationSettings:"'FILL' 1"}}>edit_note</span>
                  <h2 className="font-headline text-headline-md font-bold text-white">Enter Details Manually</h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface/70 mb-lg">
                  Choose this if you don't have your hall ticket handy. Takes about 2 minutes.
                </p>
              </div>
              <button className="w-full border border-outline-variant hover:bg-white/5 text-on-surface font-medium py-md px-lg rounded-xl transition-all flex items-center justify-center gap-sm">
                Manual Setup
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* University logos row */}
          <div className="mt-huge w-full grid grid-cols-2 md:grid-cols-4 gap-base opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['MLRIT Hyderabad','JNTU Kakinada','Osmania University','Anna University'].map(u => (
              <div key={u} className="flex items-center justify-center py-base">
                <span className="font-data-label text-data-label font-bold uppercase tracking-tighter">{u}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // ── STEP: extracting ──────────────────────────────────────────────────────
  if (step === 'extracting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Atmospheric blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/5 rounded-full blur-[120px]" />

        <main className="relative z-10 w-full max-w-[1200px] px-base md:px-xl flex flex-col items-center justify-center">
          {/* Ring */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-xxl flex items-center justify-center">
            <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-3xl animate-pulse" />
            <svg className="w-full h-full animate-spin" style={{animationDuration:'3s'}} viewBox="0 0 100 100">
              <circle className="stroke-surface-container-highest fill-transparent" cx="50" cy="50" r="45" strokeWidth="2" />
              <circle
                className="stroke-primary-container fill-transparent"
                cx="50" cy="50" r="45" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset="100"
                style={{transform:'rotate(-90deg)', transformOrigin:'50% 50%'}}
              />
            </svg>
            {/* Fake document with scan line */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-44 border border-outline-variant bg-surface-container-low rounded-lg overflow-hidden flex flex-col p-4 shadow-2xl">
                <div className="scan-line absolute inset-x-0 h-12 z-20" />
                <div className="w-full h-2 bg-outline-variant/30 rounded-full mb-3" />
                <div className="w-3/4 h-2 bg-outline-variant/20 rounded-full mb-6" />
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-2">
                      <div className="w-4 h-4 rounded bg-primary-container/20" />
                      <div className="flex-1 h-2 bg-outline-variant/20 rounded-full mt-1" />
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-1">
                  <div className="px-2 py-1 rounded-full bg-primary-container/10 text-[8px] text-primary border border-primary-container/20 font-data-label">MATHS</div>
                  <div className="px-2 py-1 rounded-full bg-primary-container/10 text-[8px] text-primary border border-primary-container/20 font-data-label">DSA</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center max-w-lg">
            <h1 className="font-headline text-headline-lg text-on-surface mb-base tracking-tight">Extracting Intelligence...</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-xl opacity-80">
              Our AI is parsing your hall ticket to map your subjects and exam schedule. This usually takes 15–30 seconds.
            </p>
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-base h-24 overflow-hidden relative">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                  <span className="font-data-label text-data-label">OCR Engine Initialised</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                  <span className="font-data-label text-data-label">Identifying Subject Codes...</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── STEP: confirm ─────────────────────────────────────────────────────────
  if (step === 'confirm' && extracted) {
    const handleConfirm = async () => {
      if (!user) return
      setSaving(true)
      setError('')
      try {
        await upsertUserProfile(user.id, {
          full_name: user.user_metadata?.full_name || null,
          regulation: extracted.regulation,
          current_year: extracted.year,
          current_semester: extracted.semester,
          onboarding_complete: true,
        })
        navigate('/dashboard', { replace: true })
      } catch (err: any) {
        setError(err.message || 'Failed to save profile')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center py-xxl px-base">
        {/* Atmospheric */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-primary opacity-5 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-[300px] h-[300px] bg-primary opacity-5 blur-[100px]" />
        </div>

        <div className="w-full max-w-[640px] relative z-10">
          <div className="text-center mb-xl">
            <div className="inline-flex items-center gap-sm bg-primary/10 px-md py-xs rounded-full border border-primary/20 mb-base">
              <span className="material-symbols-outlined text-primary text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
              <span className="font-data-label text-data-label text-primary uppercase">Identity Verified</span>
            </div>
            <h1 className="font-headline text-headline-lg text-on-surface mb-xs">✓ We found your details</h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
              Our AI parsed your hall ticket. Verify the information below is accurate.
            </p>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-[24px] overflow-hidden shadow-2xl">
            <div className="p-lg md:p-xl space-y-lg">
              {/* Meta grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
                {[
                  {label:'College', value: extracted.branch ? 'MLRIT' : 'Auto-detected'},
                  {label:'Branch', value: extracted.branch || 'Not detected'},
                  {label:'Regulation', value: extracted.regulation || 'Not detected'},
                ].map(f => (
                  <div key={f.label} className="space-y-xs">
                    <label className="font-data-label text-data-label text-on-secondary-fixed-variant uppercase">{f.label}</label>
                    <div className="flex items-center h-12 px-md bg-surface-container-low border border-outline-variant rounded-xl">
                      <span className="font-data-value text-data-value text-primary">{f.value}</span>
                      <span className="ml-auto material-symbols-outlined text-on-surface-variant text-[16px]">lock</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Semester */}
              <div className="space-y-xs">
                <label className="font-data-label text-data-label text-on-secondary-fixed-variant uppercase">Current Semester</label>
                <div className="px-md py-md bg-surface-container-low border border-outline-variant rounded-xl">
                  <span className="font-body-md text-on-surface">{extracted.semester_display || `Semester ${extracted.semester}`}</span>
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-md pt-base border-t border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <label className="font-headline text-headline-md text-on-surface">Subject List</label>
                  <span className="font-data-label text-data-label text-primary/80">{extracted.subjects.length} detected</span>
                </div>
                <div className="space-y-sm">
                  {extracted.subjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl">
                      <div className="flex items-center gap-md">
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-primary-container" />
                        <span className="font-body-md text-on-surface">{s.code} — {s.name}</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                    </div>
                  ))}
                  {/* Skeleton if loading */}
                  {extracted.subjects.length === 0 && (
                    <div className="flex items-center justify-between p-md bg-surface-container-low border border-dashed border-outline-variant rounded-xl animate-pulse">
                      <div className="flex items-center gap-md w-full">
                        <div className="w-5 h-5 rounded bg-outline-variant opacity-30" />
                        <div className="h-4 bg-outline-variant rounded w-2/3 opacity-30 skeleton" />
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px] animate-spin opacity-50">sync</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action footer */}
            <div className="p-lg md:p-xl bg-surface-container-high border-t border-outline-variant flex flex-col md:flex-row gap-base">
              <button
                onClick={handleConfirm} disabled={saving}
                className="flex-1 h-14 bg-primary-container text-white font-headline rounded-xl active:scale-95 transition-all flex items-center justify-center gap-sm hover:brightness-110 disabled:opacity-50"
              >
                {saving ? (
                  <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <>Confirm & Continue<span className="material-symbols-outlined">arrow_forward</span></>
                )}
              </button>
              <button
                onClick={() => setStep('method')}
                className="flex-1 md:flex-[0.4] h-14 bg-transparent border border-outline-variant text-on-surface font-headline rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-sm"
              >
                Start Over
              </button>
            </div>
          </div>
          {error && <p className="text-error text-body-sm text-center mt-md">{error}</p>}
          <p className="mt-xl text-center font-body-sm text-on-secondary-fixed-variant max-w-sm mx-auto">
            By confirming, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Academic Integrity</a> policy.
          </p>
        </div>
      </div>
    )
  }

  // ── STEP: manual ──────────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await upsertUserProfile(user.id, {
        full_name: user.user_metadata?.full_name || null,
        regulation: manual.regulation,
        current_year: manual.year,
        current_semester: manual.semester,
        onboarding_complete: true,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-base font-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/10 transition-all"
  const selectCls = `${inputCls} appearance-none`

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body-md overflow-x-hidden">
      <header className="fixed top-0 w-full h-20 flex justify-between items-center px-base md:px-xl max-w-[1200px] mx-auto left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant">
        <Link to="/" className="font-headline text-headline-md font-bold text-on-surface">PaperIQ</Link>
        <button onClick={() => setStep('method')} className="text-on-surface-variant hover:text-white text-body-sm flex items-center gap-xs transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 px-base">
        {/* Background blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-outline-variant/30 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-[600px] py-xl">
          <div className="text-center mb-xxl">
            <div className="inline-flex items-center gap-xs px-md py-xs rounded-full bg-white/5 border border-outline-variant mb-base">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>auto_awesome</span>
              <span className="font-data-label text-data-label text-on-surface-variant">STEP 1: ACADEMIC PROFILE</span>
            </div>
            <h1 className="font-headline text-headline-lg text-on-surface mb-sm">Enter Details Manually</h1>
            <p className="font-body-lg text-body-lg text-on-secondary-fixed-variant">Provide your academic details to curate your personalised study path.</p>
          </div>

          <div className="bg-[#0f0f0f] border border-outline-variant rounded-xl p-xl md:p-xxl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-lg opacity-10">
              <span className="material-symbols-outlined text-[120px]">school</span>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-lg relative z-10">
              <div className="space-y-xs">
                <label className="font-data-label text-data-label text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">apartment</span> COLLEGE NAME
                </label>
                <input type="text" value={manual.college} onChange={e => setManual(m => ({...m, college:e.target.value}))}
                  placeholder="e.g. MLRIT Hyderabad" className={inputCls} />
              </div>
              <div className="space-y-xs">
                <label className="font-data-label text-data-label text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">psychology</span> BRANCH / MAJOR
                </label>
                {/* Only CSE is available — others locked with visual indicator */}
                <div className="space-y-2">
                  {[
                    { value: 'CSE', label: 'Computer Science & Engineering', available: true },
                    { value: 'ECE', label: 'Electronics & Communication Engineering', available: false },
                    { value: 'EEE', label: 'Electrical & Electronics Engineering', available: false },
                    { value: 'MECH', label: 'Mechanical Engineering', available: false },
                    { value: 'CIVIL', label: 'Civil Engineering', available: false },
                    { value: 'IT', label: 'Information Technology', available: false },
                  ].map(branch => (
                    <div
                      key={branch.value}
                      onClick={() => branch.available && setManual(m => ({...m, branch: branch.value}))}
                      className={`flex items-center justify-between px-base py-sm rounded-xl border transition-all ${
                        !branch.available
                          ? 'border-outline-variant/20 bg-surface-container-lowest/20 cursor-not-allowed opacity-40'
                          : manual.branch === branch.value
                            ? 'border-primary-container bg-primary-container/10 cursor-pointer'
                            : 'border-outline-variant bg-surface-container-lowest hover:border-primary-container/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-md">
                        {!branch.available ? (
                          <span className="material-symbols-outlined text-on-surface/20 text-[18px]">lock</span>
                        ) : manual.branch === branch.value ? (
                          <span className="material-symbols-outlined text-primary-container text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface/30 text-[18px]">radio_button_unchecked</span>
                        )}
                        <span className={`font-body-md ${!branch.available ? 'line-through decoration-on-surface/20 text-on-surface/25' : ''}`}>
                          {branch.label}
                        </span>
                      </div>
                      {!branch.available && (
                        <span className="font-data-label text-[10px] uppercase tracking-widest text-on-surface/20 bg-surface-container px-sm py-xs rounded-full border border-outline-variant/20">
                          Unlocking soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="space-y-xs">
                  <label className="font-data-label text-data-label text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">gavel</span> REGULATION
                  </label>
                  <CustomSelect
                    value={manual.regulation}
                    onChange={v => setManual(m => ({...m, regulation: v}))}
                    options={['R18','R20','R22','R24'].map(r => ({ value: r, label: r }))}
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-data-label text-data-label text-on-surface-variant flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span> SEMESTER
                  </label>
                  <CustomSelect
                    value={String(manual.semester)}
                    onChange={v => setManual(m => ({...m, semester: Number(v)}))}
                    options={[
                      { value: '3', label: '2-1 (Sem 3)' },
                      { value: '4', label: '2-2 (Sem 4)' },
                    ]}
                  />
                </div>
              </div>
              {error && <p className="text-error text-body-sm">{error}</p>}
              <div className="pt-base">
                <button
                  type="submit" disabled={saving}
                  className="w-full bg-primary-container text-on-primary-container py-base rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-base hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? (
                    <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
                  ) : (
                    <>Generate My Dashboard<span className="material-symbols-outlined">arrow_forward</span></>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-center gap-sm text-on-secondary-fixed-variant font-body-sm mt-md">
                <span className="material-symbols-outlined text-[14px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>verified_user</span>
                Your academic data is encrypted and used only for personalisation.
              </div>
            </form>
          </div>

          {/* Feature chips */}
          <div className="mt-xl grid grid-cols-3 gap-base opacity-60">
            {[
              {icon:'analytics', label:'Curated Path'},
              {icon:'history_edu', label:'Paper Analysis'},
              {icon:'bolt', label:'Smart Forecast'},
            ].map(f => (
              <div key={f.label} className="flex items-center gap-sm px-base py-sm bg-white/5 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary">{f.icon}</span>
                <span className="font-data-label text-data-label">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
