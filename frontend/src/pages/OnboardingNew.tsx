import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { parseHallTicket, upsertUserProfile } from '../lib/api'
import { CustomSelect } from '../components/CustomSelect'
/**
 * Onboarding — Screen 05 (Select Path) & Screen 06 (Confirm Details) from stitch-screens.md
 * Routes: /onboarding/step-1 (method select) → /onboarding/step-2 (confirm)
 * Goal: Hall ticket upload as hero experience → magical auto-detection
 */

type OnboardingStep = 'method' | 'upload' | 'confirm' | 'manual'

interface ExtractedData {
  branch: string | null
  regulation: string | null
  year: number | null
  semester: number | null
  semester_display: string | null
  subject_codes: string[]
  subjects: Array<{code: string; name: string}>
  confidence: string
}

export function OnboardingNew() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [step, setStep] = useState<OnboardingStep>('method')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    branch: 'CSE',
    regulation: 'R22',
    year: 2,
    semester: 3,
  })

  // STEP 1: Method Selection — Hall Ticket (Hero) vs Manual
  if (step === 'method') {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl font-bold mb-2">
              The Fastest Setup Ever
            </h1>
            <p className="text-gray-400 text-lg">
              Upload your hall ticket. We'll detect everything automatically.
            </p>
          </div>

          {/* Two Method Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* HERO: Hall Ticket Upload */}
            <button
              onClick={() => setStep('upload')}
              className="glass-card rounded-2xl p-8 text-left hover:border-[#f97316] transition-all group relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <span className="material-symbols-outlined text-[48px] text-primary-container/80 mb-4 block" style={{fontVariationSettings:"'FILL' 1"}}>id_card</span>
                <h3 className="font-heading text-2xl font-semibold mb-2 text-white">
                  Upload Hall Ticket
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Auto-detect semester, regulation, and all subjects in 10 seconds
                </p>
                
                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[16px] text-[#10b981]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                    <span className="text-gray-300">Auto-detect semester</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[16px] text-[#10b981]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                    <span className="text-gray-300">Auto-detect regulation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-[16px] text-[#10b981]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                    <span className="text-gray-300">Auto-detect all subjects</span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-[#f97316] font-semibold group-hover:translate-x-1 transition-transform">
                  Start Upload
                  <span>→</span>
                </div>

                <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">schedule</span> Saves 4-6 hours of manual setup
                </p>
              </div>
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => setStep('manual')}
              className="glass-card rounded-2xl p-8 text-left hover:border-white/20 transition-all group"
            >
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/60 mb-4 block" style={{fontVariationSettings:"'FILL' 0"}}>edit_note</span>
              <h3 className="font-heading text-2xl font-semibold mb-2">
                Enter Manually
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Fill in your semester and subjects step by step
              </p>
              
              <div className="space-y-2 mb-6 opacity-60">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Select branch</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Select regulation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Select semester</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-white font-semibold group-hover:translate-x-1 transition-transform">
                Start Manual Entry
                <span>→</span>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Takes 2-3 minutes (slower)
              </p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // STEP 2: Hall Ticket Upload — global drag-and-drop (works from desktop, WhatsApp, file managers)
  if (step === 'upload') {
    return <HallTicketUpload
      onBack={() => setStep('method')}
      onSuccess={(result) => { setExtracted(result); setStep('confirm') }}
    />
  }

  // STEP 3: Confirm Extracted Data
  if (step === 'confirm' && extracted) {
    const handleConfirm = async () => {
      if (!user || !extracted) return
      
      setSaving(true)
      setError('')
      
      try {
        // Save all extracted fields including branch
        await upsertUserProfile(user.id, {
          full_name:        user.user_metadata?.full_name || null,
          regulation:       extracted.regulation,
          current_year:     extracted.year,
          current_semester: extracted.semester,
          branch:           extracted.branch || 'CSE',
          onboarding_complete: true,
        })
        
        navigate('/dashboard', { replace: true, state: { fromOnboarding: true } })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-[72px] text-[#10b981] mb-4 block" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
            <h2 className="font-heading text-3xl font-bold mb-2">
              Extracted Successfully
            </h2>
            <p className="text-gray-400">
              Confidence: <span className="text-[#10b981] font-semibold">{extracted.confidence}</span>
            </p>
          </div>

          {/* Extracted Data Card */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            {/* Academic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Branch</div>
                <div className="font-semibold text-lg">{extracted.branch || 'Not detected'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Regulation</div>
                <div className="font-semibold text-lg">{extracted.regulation || 'Not detected'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Year</div>
                <div className="font-semibold text-lg">Year {extracted.year}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Semester</div>
                <div className="font-semibold text-lg">{extracted.semester_display || `Semester ${extracted.semester}`}</div>
              </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Subjects Detected */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                {extracted.subjects.length} Subjects Detected
              </div>
              <div className="space-y-2">
                {extracted.subjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <span className="material-symbols-outlined text-[16px] text-[#10b981]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                    <div>
                      <div className="font-semibold text-sm">{subject.code}</div>
                      <div className="text-xs text-gray-400">{subject.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('method')}
                className="flex-1 px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 transition-colors font-semibold"
              >
                Start Over
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 px-6 py-4 bg-[#f97316] hover:bg-[#ea580c] rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? 'Saving...' : 'Confirm & Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP 4: Manual Entry
  if (step === 'manual') {
    const handleManualSubmit = async () => {
      if (!user) return
      
      setSaving(true)
      setError('')
      
      try {
        await upsertUserProfile(user.id, {
          full_name: user.user_metadata?.full_name,
          regulation: manualForm.regulation,
          current_year: manualForm.year,
          current_semester: manualForm.semester,
          onboarding_complete: true,
        })
        
        navigate('/dashboard', { replace: true, state: { fromOnboarding: true } })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Back Button */}
          <button
            onClick={() => setStep('method')}
            className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 text-sm transition-colors"
          >
            <span>←</span> Back to method selection
          </button>

          {/* Manual Form Card */}
          <div className="glass-card rounded-2xl p-10">
            <h2 className="font-heading text-3xl font-bold mb-2">Manual Entry</h2>
            <p className="text-gray-400 mb-8">Enter your academic details</p>

            <div className="space-y-4">
              {/* Branch */}
              <div>
                <label className="block text-sm font-medium mb-2">Branch</label>
                <div className="space-y-2">
                  {[
                    { value: 'CSE', label: 'Computer Science & Engineering', available: true },
                    { value: 'ECE', label: 'Electronics & Communication Engineering', available: false },
                    { value: 'EEE', label: 'Electrical & Electronics Engineering', available: false },
                    { value: 'MECH', label: 'Mechanical Engineering', available: false },
                    { value: 'CIVIL', label: 'Civil Engineering', available: false },
                  ].map(branch => (
                    <div
                      key={branch.value}
                      onClick={() => branch.available && setManualForm({...manualForm, branch: branch.value})}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        !branch.available
                          ? 'border-white/5 bg-white/[0.015] cursor-not-allowed opacity-50'
                          : manualForm.branch === branch.value
                            ? 'border-[#f97316] bg-[#f97316]/10 cursor-pointer'
                            : 'border-white/10 bg-white/5 hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Lock icon for unavailable, check for selected, circle for available */}
                        {!branch.available ? (
                          <span className="material-symbols-outlined text-white/20 text-[18px]">lock</span>
                        ) : manualForm.branch === branch.value ? (
                          <span className="material-symbols-outlined text-[#f97316] text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-white/30 text-[18px]">radio_button_unchecked</span>
                        )}
                        <span className={`text-sm ${!branch.available ? 'text-white/25 line-through decoration-white/20' : 'text-white'}`}>
                          {branch.label}
                        </span>
                      </div>
                      {!branch.available && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/20 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                          Unlocking soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Regulation */}
              <div>
                <label className="block text-sm font-medium mb-2">Regulation</label>
                <CustomSelect
                  value={manualForm.regulation}
                  onChange={(v) => setManualForm({...manualForm, regulation: v})}
                  options={['R18','R22','R24'].map(r => ({ value: r, label: r }))}
                />
              </div>

              {/* Year & Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <CustomSelect
                    value={String(manualForm.year)}
                    onChange={(v) => setManualForm({...manualForm, year: Number(v)})}
                    options={[
                      { value: '2', label: '2nd Year' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Semester</label>
                  <CustomSelect
                    value={String(manualForm.semester)}
                    onChange={(v) => setManualForm({...manualForm, semester: Number(v)})}
                    options={[
                      { value: '3', label: '2-1 (Sem 3)' },
                      { value: '4', label: '2-2 (Sem 4)' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={saving}
              className="w-full mt-8 px-6 py-4 bg-[#f97316] hover:bg-[#ea580c] rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── HallTicketUpload ──────────────────────────────────────────────────────────
// Standalone component with WINDOW-LEVEL drag-and-drop.
// Accepts drops anywhere on the page — desktop, WhatsApp exports, file managers, etc.
// ─────────────────────────────────────────────────────────────────────────────

interface HallTicketUploadProps {
  onBack: () => void
  onSuccess: (result: ExtractedData) => void
}

function HallTicketUpload({ onBack, onSuccess }: HallTicketUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  // isDraggingOver: true when a file is being dragged anywhere over the window
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const dragCounter = useRef(0)

  const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']

  const processFile = useCallback(async (file: File) => {
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG)')
      return
    }
    setError('')
    setUploadedFile(file)
    setExtracting(true)
    try {
      const result = await parseHallTicket(file)
      onSuccess(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse hall ticket')
    } finally {
      setExtracting(false)
    }
  }, [onSuccess])

  // Attach drag listeners to the window so drops work from ANYWHERE on the page
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current++
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDraggingOver(true)
      }
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDraggingOver(false)
      }
    }
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
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
  }, [processFile])

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-200 ${isDraggingOver ? 'bg-[#f97316]/10' : 'bg-[#07070d]'}`}>
      {/* Full-screen overlay shown when user drags a file over the window */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-dashed border-[#f97316] rounded-3xl w-[80vw] h-[70vh] flex flex-col items-center justify-center gap-4 bg-[#07070d]/80 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[72px] text-[#f97316]" style={{fontVariationSettings:"'FILL' 1"}}>upload_file</span>
            <p className="text-2xl font-bold text-[#f97316]">Drop your hall ticket here</p>
            <p className="text-gray-400 text-sm">PDF, JPG, or PNG</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 text-sm transition-colors"
        >
          <span>←</span> Back to method selection
        </button>

        {/* Upload Card */}
        <div className="glass-card rounded-2xl p-10">
          <h2 className="font-heading text-3xl font-bold mb-2">Upload Hall Ticket</h2>
          <p className="text-gray-400 mb-2">
            {extracting ? 'Extracting information...' : 'PDF, JPG, or PNG supported'}
          </p>
          {!extracting && (
            <p className="text-xs text-gray-500 mb-8 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">info</span> You can drag and drop from anywhere — desktop, WhatsApp, file manager
            </p>
          )}

          {/* Drop Zone — click to browse, or drag from desktop/WhatsApp */}
          <button
            type="button"
            disabled={extracting}
            onClick={() => !extracting && fileInputRef.current?.click()}
            className={`
              w-full border-2 border-dashed rounded-2xl p-12 text-center
              transition-all
              ${extracting
                ? 'border-[#f97316] bg-[#f97316]/5 cursor-not-allowed'
                : 'border-white/20 hover:border-[#f97316] hover:bg-white/5 cursor-pointer'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
              disabled={extracting}
            />

            {extracting ? (
              <div className="space-y-4">
                <span className="material-symbols-outlined text-[56px] text-[#f97316] animate-pulse block" style={{fontVariationSettings:"'FILL' 1"}}>description</span>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-white">Extracting information...</div>
                  <div className="flex flex-col gap-1 text-sm text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse" />
                      <span>Scanning document...</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
                      <span>Detecting semester & regulation...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : uploadedFile ? (
              <div className="space-y-3">
                <span className="material-symbols-outlined text-[56px] text-[#10b981] block" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                <div className="text-lg font-semibold text-white">{uploadedFile.name}</div>
                <div className="text-sm text-gray-400">Click to choose a different file</div>
              </div>
            ) : (
              <div className="space-y-3">
            <span className="material-symbols-outlined text-[56px] text-white/60 mb-2 block" style={{fontVariationSettings:"'FILL' 0"}}>cloud_upload</span>
                <div className="text-lg font-semibold text-white">Drag & Drop Hall Ticket</div>
                <div className="text-sm text-gray-400">or click to browse files</div>
                <div className="text-xs text-gray-500 mt-2">Supports PDF, JPG, PNG · Max 5MB</div>
              </div>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
