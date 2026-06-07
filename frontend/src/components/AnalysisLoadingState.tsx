/**
 * AnalysisLoadingState — Interactive loading screen for analysis
 *
 * Shows the "Before PaperIQ chaos" vs "The PaperIQ Clarity" comparison
 * with step-by-step animated progress.
 *
 * Accepts real stats (questionCount, coveragePct) so the numbers shown
 * are authentic to the subject being analysed — not hardcoded fiction.
 *
 * When all steps complete, calls onComplete() so the parent can reveal results.
 */
import { useState, useEffect, useRef } from 'react'

interface Step {
  id: string
  label: string
  duration: number  // ms to show this step before advancing
}

const STEPS: Step[] = [
  { id: 'loading',     label: 'Loading question papers…',           duration: 1800 },
  { id: 'analyzing',   label: 'Analyzing questions by unit…',        duration: 2200 },
  { id: 'calculating', label: 'Calculating topic frequency…',         duration: 1800 },
  { id: 'identifying', label: 'Identifying high-probability topics…', duration: 1800 },
  { id: 'building',    label: 'Building study priority order…',       duration: 1400 },
  { id: 'generating',  label: 'Generating exam insights…',            duration: 1200 },
  { id: 'done',        label: 'Finalising your report…',              duration: 900 },
]

interface Props {
  subjectName?: string
  /** Real question count fetched before analysis starts (optional — shows placeholder until known) */
  questionCount?: number
  /** Real classification coverage 0–1 (optional) */
  coveragePct?: number
  /** True if the backend generateAnalysis request has completed */
  isBackendDone?: boolean
  /** Called when all steps finish and fade-out is complete — parent reveals results */
  onComplete?: () => void
}

export function AnalysisLoadingState({ subjectName, questionCount, coveragePct, isBackendDone, onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [done, setDone] = useState<string[]>([])
  const [allDone, setAllDone] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef = useRef(false)

  // Core progression timer
  useEffect(() => {
    // If backend isn't done, pause at the second-to-last step (index 5: "Generating insights")
    if (stepIndex === 5 && !isBackendDone) return
    if (stepIndex >= STEPS.length) return

    timerRef.current = setTimeout(() => {
      const currentStep = STEPS[stepIndex]
      setDone(prev => [...prev, currentStep.id])
      const nextIndex = stepIndex + 1
      setStepIndex(nextIndex)
      
      // All steps done (index 7)
      if (nextIndex >= STEPS.length && !completedRef.current) {
        completedRef.current = true
        setAllDone(true)
        // Brief celebration pause, then fade-out transition into results
        setTimeout(() => {
          setRevealing(true)
          setTimeout(() => {
            onComplete?.()
          }, 600)
        }, 800)
      }
    }, STEPS[stepIndex].duration)
    
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [stepIndex, isBackendDone, onComplete])

  const progress = Math.min(((stepIndex) / STEPS.length) * 100, 100)
  const finalProgress = allDone ? 100 : progress

  // Hours saved: rough heuristic — minimum 1h
  const hoursSaved = questionCount != null ? Math.max(1, Math.round(questionCount / 100) * 0.5).toFixed(1) : '—'

  return (
    <div
      className={`min-h-[80vh] pt-32 pb-xl flex items-center justify-center px-lg transition-all duration-500 ${
        revealing ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
      }`}
    >
      <div className="w-full max-w-[1000px]">

        {/* ── Heading ─────────────────────────────────────────────────── */}
        <div className="text-center mb-xxl">
          <div className="inline-flex items-center gap-sm mb-base">
            <div
              className={`w-3 h-3 rounded-full bg-primary ${allDone ? '' : 'animate-pulse'}`}
              style={{ boxShadow: '0 0 20px rgba(249,115,22,0.6)' }}
            />
            <span className="font-data-label text-data-label text-primary uppercase tracking-widest">
              {allDone ? 'Analysis Complete' : 'AI Analysis in Progress'}
            </span>
          </div>
          <h1 className="font-headline text-[42px] md:text-[56px] font-bold text-on-surface leading-tight mb-sm">
            {allDone ? 'Report Ready' : 'Analyzing papers'}
          </h1>
          <p className="text-on-surface-variant text-body-lg">
            {allDone
              ? `${subjectName ? `${subjectName} — ` : ''}Loading your results…`
              : subjectName
                ? `Scanning ${subjectName} question papers…`
                : 'Loading question papers…'
            }
          </p>
        </div>

        {/* ── Before / After ──────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-xl mb-xxl">

          {/* THE OLD CHAOS */}
          <div className="relative overflow-hidden rounded-2xl p-xl border border-outline-variant"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(15,15,15,0.9) 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-xs mb-lg">
                <span className="material-symbols-outlined text-red-400 text-[20px]">close</span>
                <h3 className="font-headline text-body-lg text-red-400 uppercase tracking-wider">The Old Chaos</h3>
              </div>
              <div className="space-y-md opacity-50">
                {[70, 50, 60, 45, 55].map((w, i) => (
                  <div key={i} className="flex items-center gap-sm" style={{ paddingLeft: i % 2 === 1 ? 16 : 0 }}>
                    <div className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                    <div className="h-3 bg-gray-700 rounded" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              <p className="mt-lg text-body-sm text-gray-400 italic leading-relaxed">
                "Does anyone have the Unit 3 notes? I can't find them in the scroll…"
              </p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-xs">
                Manual Hunting · 6+ Hours
              </p>
            </div>
          </div>

          {/* THE PAPERIQ CLARITY — real numbers */}
          <div
            className={`relative overflow-hidden rounded-2xl p-xl border transition-all duration-500 ${
              allDone ? 'border-primary/60' : 'border-primary/30'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(15,15,15,0.9) 100%)',
              boxShadow: allDone ? '0 0 60px rgba(249,115,22,0.2)' : '0 0 40px rgba(249,115,22,0.1)',
            }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-xs mb-lg">
                <span
                  className="material-symbols-outlined text-primary text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <h3 className="font-headline text-body-lg text-primary uppercase tracking-wider">
                  The PaperIQ Clarity
                </h3>
              </div>

              <div className="bg-surface-container rounded-xl p-base border border-outline-variant">
                <div className="flex items-center justify-between mb-xs">
                  <span className="text-body-sm font-bold text-on-surface">
                    {subjectName || 'Your Subject'}
                  </span>
                  <span className="font-data-label text-[11px] text-primary uppercase">AI Priority I</span>
                </div>

                {/* Top unit probability bar */}
                <div className="mb-md">
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant mb-1">
                    <span>Highest-frequency unit</span>
                    <span className="font-bold text-primary">
                      {coveragePct != null ? `${Math.round(coveragePct * 100)}% Coverage` : 'Scanning…'}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-1000"
                      style={{
                        width: coveragePct != null ? `${Math.round(coveragePct * 100)}%` : `${finalProgress}%`,
                        boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                      }}
                    />
                  </div>
                </div>

                {/* Real stats grid */}
                <div className="grid grid-cols-3 gap-xs text-center pt-xs border-t border-outline-variant/30">
                  <div>
                    <div className="font-data-value text-lg text-primary">
                      {questionCount != null ? (
                        <span>{questionCount.toLocaleString()}</span>
                      ) : (
                        <span className="animate-pulse">…</span>
                      )}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase">Analyzed</div>
                  </div>
                  <div>
                    <div className="font-data-value text-lg text-emerald-400">
                      {coveragePct != null ? (
                        <span>{Math.round(coveragePct * 100)}%</span>
                      ) : (
                        <span className="animate-pulse">…</span>
                      )}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase">Coverage</div>
                  </div>
                  <div>
                    <div className="font-data-value text-lg text-on-surface">
                      {questionCount != null ? (
                        <span>{hoursSaved}h</span>
                      ) : (
                        <span className="animate-pulse">…</span>
                      )}
                    </div>
                    <div className="text-[9px] text-on-surface-variant uppercase">Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Progress steps ──────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-xl">
          <div className="mb-xl">
            <div className="flex justify-between items-center mb-sm">
              <span className="text-body-sm text-on-surface-variant">
                {allDone ? 'All steps complete' : `Step ${stepIndex + 1} of ${STEPS.length}`}
              </span>
              <span className="font-data-value text-primary">{Math.round(finalProgress)}%</span>
            </div>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-primary via-orange-400 to-primary rounded-full transition-all duration-500 ease-out ${allDone ? '' : ''}`}
                style={{
                  width: `${finalProgress}%`,
                  backgroundSize: '200% 100%',
                  animation: allDone ? 'none' : 'shimmer 2s infinite',
                  boxShadow: allDone ? '0 0 12px rgba(249,115,22,0.6)' : 'none',
                }}
              />
            </div>
          </div>

          <div className="space-y-sm">
            {STEPS.map((step, i) => {
              const isActive    = i === stepIndex && !allDone
              const isCompleted = done.includes(step.id)
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-base py-sm px-base rounded-lg transition-all duration-300 ${
                    isActive    ? 'bg-primary/10 border border-primary/20' :
                    isCompleted ? 'bg-surface-container' :
                    'opacity-40'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCompleted ? 'bg-primary' :
                    isActive    ? 'bg-primary/20 border-2 border-primary' :
                    'bg-surface-container-highest'
                  }`}>
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-[16px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    ) : isActive ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">radio_button_unchecked</span>
                    )}
                  </div>

                  <span className={`text-body-sm flex-1 ${isActive ? 'text-on-surface font-medium' : isCompleted ? 'text-on-surface-variant' : 'text-on-surface-variant'}`}>
                    {step.id === 'analyzing' && questionCount != null
                      ? `Analyzing ${questionCount.toLocaleString()} questions…`
                      : step.label}
                  </span>

                  {isActive && (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}
                  {isCompleted && (
                    <span className="text-[10px] font-mono text-primary/60 uppercase tracking-wider">done</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* All-done celebration row */}
          {allDone && (
            <div className="mt-lg pt-lg border-t border-white/8 flex items-center justify-center gap-md">
              <span
                className="material-symbols-outlined text-[28px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1", animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}
              >
                check_circle
              </span>
              <span className="text-on-surface font-bold text-body-md">Report generated — loading results…</span>
            </div>
          )}
        </div>

        {/* ── Fun fact ────────────────────────────────────────────────── */}
        {!allDone && (
          <div className="mt-xl text-center">
            <p className="text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-primary align-middle mr-xs">lightbulb</span>
              <span className="italic">Did you know?</span> PaperIQ has analyzed over{' '}
              <span className="font-bold text-on-surface">10,000+ questions</span> from 10 years of MLRIT past papers
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pop {
          0%   { transform: scale(0); opacity: 0; }
          80%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
