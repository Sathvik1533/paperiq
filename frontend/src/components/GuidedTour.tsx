import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export interface TourStep {
  target: string        // data-tour attribute value
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  route?: string        // navigate to this route before showing this step
  waitMs?: number       // wait this many ms after navigation before showing step
}

interface Props {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  onStart?: () => void   // called once on mount so parent can persist 'in-progress' flag
}

export function GuidedTour({ steps, onComplete, onSkip, onStart }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Call onStart once on mount so parent can set 'tour_started' in localStorage
  // before any navigation happens (prevents re-trigger on remount).
  useEffect(() => { onStart?.() }, [])

  const step = steps[currentStep]

  const advance = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setVisible(false)
      setTimeout(() => setCurrentStep(c => c + 1), 200)
    } else {
      onComplete()
    }
  }, [currentStep, steps.length, onComplete])

  // Keep a ref to the LATEST advance so locateTarget's retry closures
  // always call the current step's advance — not a stale captured one.
  const advanceRef = useRef(advance)
  useEffect(() => { advanceRef.current = advance }, [advance])

  // Find element and compute its position.
  // IMPORTANT: Uses advanceRef (not advance directly) so that retry closures
  // always call the *current* step's advance, never a stale captured one.
  const locateTarget = useCallback(() => {
    const DEBUG = import.meta.env.DEV
    let retryCount = 0
    const maxRetries = 12
    
    const tryLocate = () => {
      if (DEBUG) console.log(`[Tour] Attempt ${retryCount + 1}/${maxRetries} - Looking for: ${step.target}`)
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
      
      if (el) {
        if (DEBUG) console.log(`[Tour] Found element: ${step.target}`, el)
        const rect = el.getBoundingClientRect()
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         window.getComputedStyle(el).visibility !== 'hidden' &&
                         window.getComputedStyle(el).display !== 'none'
        
        if (!isVisible && retryCount < maxRetries) {
          retryCount++
          const delay = Math.min(300 + (retryCount * 80), 800)
          if (DEBUG) console.log(`[Tour] Element found but not visible yet, retrying in ${delay}ms...`)
          setTimeout(tryLocate, delay)
          return
        }
        
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        setTimeout(() => {
          const rect = el.getBoundingClientRect()
          if (DEBUG) console.log(`[Tour] Element rect:`, rect)
          setTargetRect(rect)
          setTimeout(() => {
            if (DEBUG) console.log(`[Tour] Showing tooltip for: ${step.target}`)
            setVisible(true)
          }, 200)
        }, 600)
      } else if (retryCount < maxRetries) {
        retryCount++
        const delay = Math.min(300 + (retryCount * 80), 800)
        if (DEBUG) console.log(`[Tour] Element not found, retrying in ${delay}ms...`)
        setTimeout(tryLocate, delay)
      } else {
        // Element not found after retries — use the ref so we always call
        // the CURRENT step's advance, not a stale closure copy.
        console.warn(`[Tour] Target not found after ${maxRetries} retries: "${step.target}" — auto-advancing`)
        advanceRef.current()
      }
    }
    
    tryLocate()
  }, [step?.target])

  const DEBUG = import.meta.env.DEV

  useEffect(() => {
    if (!step) return
    if (DEBUG) console.log(`[Tour] Step ${currentStep + 1}/${steps.length}:`, step)
    setVisible(false)
    setTargetRect(null) // Clear previous target rect
    
    // If we need to navigate to a different route
    if (step.route && location.pathname !== step.route) {
      if (DEBUG) console.log(`[Tour] Navigating to: ${step.route}`)
      navigate(step.route)
      // Wait for navigation + specified delay
      const delay = (step.waitMs || 900) + 600
      if (DEBUG) console.log(`[Tour] Waiting ${delay}ms for page to load...`)
      setTimeout(locateTarget, delay)
    } else {
      if (DEBUG) console.log(`[Tour] Already on correct route: ${location.pathname}`)
      setTimeout(locateTarget, step.waitMs || 600)
    }
  }, [currentStep, step, location.pathname, navigate, locateTarget])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
      if (e.key === 'Enter' || e.key === 'ArrowRight') advance()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentStep, onSkip, advance])

  if (!step || !visible) return null

  // Compute tooltip position
  const PAD = 16
  const TW = 320
  const TH = 180
  let tooltipStyle: React.CSSProperties = {}

  if (!targetRect) {
    // Center of screen
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TW,
      zIndex: 10001,
    }
  } else {
    const pos = step.position || 'bottom'
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = 0, left = 0

    if (pos === 'bottom') {
      top = Math.min(targetRect.bottom + PAD, vh - TH - PAD)
      left = Math.min(Math.max(targetRect.left, PAD), vw - TW - PAD)
    } else if (pos === 'top') {
      top = Math.max(targetRect.top - TH - PAD, PAD)
      left = Math.min(Math.max(targetRect.left, PAD), vw - TW - PAD)
    } else if (pos === 'right') {
      top = Math.min(Math.max(targetRect.top, PAD), vh - TH - PAD)
      left = Math.min(targetRect.right + PAD, vw - TW - PAD)
    } else if (pos === 'left') {
      top = Math.min(Math.max(targetRect.top, PAD), vh - TH - PAD)
      left = Math.max(targetRect.left - TW - PAD, PAD)
    } else {
      top = vh / 2 - TH / 2
      left = vw / 2 - TW / 2
    }

    tooltipStyle = { position: 'fixed', top, left, width: TW, zIndex: 10001 }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  // Spotlight cutout — if targetRect exists, punch a hole in the overlay
  const spotlightStyle: React.CSSProperties = targetRect ? {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0)',
    pointerEvents: 'none',
  } : {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0.75)',
  }

  // SVG spotlight with cutout - make the dark area clickable to advance
  const svgSpotlight = targetRect ? (
    <svg
      style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}
      width="100%"
      height="100%"
      onClick={advance}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={targetRect.left - 6}
            y={targetRect.top - 6}
            width={targetRect.width + 12}
            height={targetRect.height + 12}
            rx="12"
            fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" style={{ cursor: 'pointer' }} />
      {/* Glow ring around spotlight */}
      <rect
        x={targetRect.left - 8}
        y={targetRect.top - 8}
        width={targetRect.width + 16}
        height={targetRect.height + 16}
        rx="14"
        fill="none"
        stroke="rgba(249,115,22,0.6)"
        strokeWidth="2"
        style={{ pointerEvents: 'none' }}
      />
      {/* Create a transparent clickable area over the spotlight cutout */}
      <rect
        x={targetRect.left - 6}
        y={targetRect.top - 6}
        width={targetRect.width + 12}
        height={targetRect.height + 12}
        rx="12"
        fill="transparent"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  ) : (
    <div style={spotlightStyle} onClick={advance} />
  )

  return (
    <>
      {/* Overlay with spotlight - pointerEvents none allows clicks to pass through to the app */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }}>
        {svgSpotlight}
      </div>

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          background: 'rgba(14,14,20,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 20,
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.1), 0 0 40px rgba(249,115,22,0.08)',
          padding: 24,
          animation: 'tourFadeIn 0.3s ease',
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #f97316, #fb923c)',
            borderRadius: 99,
            transition: 'width 0.4s ease',
            boxShadow: '0 0 12px rgba(249,115,22,0.8)',
          }} />
        </div>

        {/* Step counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f97316' }}>
              Step {currentStep + 1} of {steps.length}
            </span>
            {/* Animated step indicator dots */}
            <div style={{ display: 'flex', gap: 4 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i === currentStep ? '#f97316' : i < currentStep ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.3s ease',
                  boxShadow: i === currentStep ? '0 0 8px rgba(249,115,22,0.6)' : 'none',
                }} />
              ))}
            </div>
          </div>
          <button
            onClick={onSkip}
            style={{ 
              fontSize: 11, 
              color: 'rgba(255,255,255,0.35)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '4px 8px', 
              borderRadius: 6,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            Skip tour
          </button>
        </div>

        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(249,115,22,0.15)',
            border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            animation: 'pulse 2s ease infinite',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#f97316', fontVariationSettings: "'FILL' 1" }}>
              explore
            </span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0 }}>
            {step.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 20 }}>
          {step.description}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {currentStep > 0 && (
            <button
              onClick={() => { setVisible(false); setTimeout(() => setCurrentStep(c => c - 1), 200) }}
              style={{
                flex: '0 0 auto', padding: '10px 18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={advance}
            style={{
              flex: 1, padding: '12px 24px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(249,115,22,0.5)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(249,115,22,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(249,115,22,0.5)'
            }}
          >
            {currentStep === steps.length - 1 ? '🚀 Get Started!' : 'Next →'}
          </button>
        </div>

        {/* Keyboard hint */}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 12 }}>
          Press <kbd style={{ 
            padding: '2px 6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: 4, 
            fontFamily: 'monospace',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>Enter</kbd> to continue · <kbd style={{ 
            padding: '2px 6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: 4, 
            fontFamily: 'monospace',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>Esc</kbd> to skip
        </p>
      </div>

      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  )
}
