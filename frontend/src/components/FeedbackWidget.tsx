/**
 * FeedbackWidget — two-stage passive feedback system
 *
 * Stage 1 — Timed emoji (5 minutes on site):
 *   Shows a 3-emoji reaction in bottom-right corner.
 *   One tap, it's gone. No form, no friction.
 *
 * Stage 2 — Exit intent popup (mouse toward top of browser):
 *   Shows when user is about to leave. Two questions:
 *   1. Was this helpful? (emoji)
 *   2. How many hours did this save you? (picker)
 *
 *   This timing is intentional — user is DONE, formed their complete opinion.
 *   The hours-saved answer becomes your marketing data.
 *
 * Stores to Supabase `feedback` table:
 *   id, user_id, page, rating (1/2/3), hours_saved (nullable), created_at
 *
 * One reaction per session per page — never shows twice.
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface Props {
  page: string
  /** Delay before timed widget appears. Default: 5 minutes */
  timedDelayMs?: number
}

type Stage = 'hidden' | 'timed' | 'exit'

const HOURS_OPTIONS = ['< 30 min', '1–2 hours', '3–4 hours', '5–6 hours', '7+ hours']

export function FeedbackWidget({ page, timedDelayMs = 5 * 60 * 1000 }: Props) {
  const { user } = useAuthStore()
  const [stage, setStage] = useState<Stage>('hidden')
  const [done, setDone] = useState(false)
  const [rating, setRating] = useState<1 | 2 | 3 | null>(null)
  const [hoursSaved, setHoursSaved] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const exitBound = useRef(false) // prevent binding exit listener twice

  const storageKey = `feedback_done_${page}`

  // ── Stage 1: timed trigger ─────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem(storageKey)) return
    const timer = setTimeout(() => {
      if (!done) setStage('timed')
    }, timedDelayMs)
    return () => clearTimeout(timer)
  }, [page, timedDelayMs, storageKey, done])

  // ── Stage 2: exit intent ───────────────────────────────────────────────
  // Detects mouse moving to top 5% of viewport = user moving to close/address bar
  useEffect(() => {
    if (exitBound.current || sessionStorage.getItem(storageKey)) return
    exitBound.current = true

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse exits from the TOP of the page
      if (e.clientY <= window.innerHeight * 0.05 && !done) {
        setStage('exit')
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [storageKey, done])

  // ── Submit helper ──────────────────────────────────────────────────────
  const submit = async (r: 1 | 2 | 3, hours?: string) => {
    setDone(true)
    setStage('hidden')
    sessionStorage.setItem(storageKey, '1')

    try {
      setSubmitting(true)
      await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        page,
        rating: r,
        hours_saved: hours ?? null,
        trigger: stage, // "timed" or "exit" — useful to know which trigger got more responses
      })
    } catch {
      // silent — analytics failure should never affect the user experience
    } finally {
      setSubmitting(false)
    }
  }

  const dismiss = () => {
    setStage('hidden')
    sessionStorage.setItem(storageKey, '1')
  }

  if (done || stage === 'hidden') return null

  // ── Stage 1 render: timed emoji strip ─────────────────────────────────
  if (stage === 'timed') {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-1"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
          <span className="text-xs text-white/40 font-mono uppercase tracking-widest whitespace-nowrap">
            Helpful?
          </span>
          {([
            { emoji: '😕', r: 1 as const, label: 'Not helpful' },
            { emoji: '😐', r: 2 as const, label: 'Okay' },
            { emoji: '😊', r: 3 as const, label: 'Very helpful' },
          ] as const).map(({ emoji, r, label }) => (
            <button
              key={r}
              onClick={() => submit(r)}
              title={label}
              className="text-2xl hover:scale-125 active:scale-95 transition-transform duration-150 leading-none"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={dismiss}
            className="text-white/20 hover:text-white/40 transition-colors ml-1 text-lg leading-none"
            title="Dismiss"
          >×</button>
        </div>
        <span className="text-[10px] text-white/15 font-mono mr-1">PaperIQ beta</span>
      </div>
    )
  }

  // ── Stage 2 render: exit intent — 2-question popup ────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Dismiss */}
        <button onClick={dismiss}
          className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors text-xl leading-none">
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👋</div>
          <h3 className="font-headline text-xl font-bold text-white mb-1">Before you go</h3>
          <p className="text-sm text-white/40">30 seconds — helps us improve PaperIQ</p>
        </div>

        {/* Q1: Was this helpful? */}
        <div className="mb-6">
          <p className="text-sm font-medium text-white/70 mb-3 text-center">Was PaperIQ helpful for your exam prep?</p>
          <div className="flex justify-center gap-4">
            {([
              { emoji: '😕', r: 1 as const, label: 'Not really' },
              { emoji: '😐', r: 2 as const, label: 'It was okay' },
              { emoji: '😊', r: 3 as const, label: 'Very helpful' },
            ] as const).map(({ emoji, r, label }) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  rating === r
                    ? 'border-[#f97316] bg-[#f97316]/10 scale-110'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] text-white/40 whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Q2: Hours saved — only appears after Q1 is answered */}
        {rating && (
          <div className="mb-6" style={{ animation: 'slideUp 0.2s ease-out' }}>
            <p className="text-sm font-medium text-white/70 mb-3 text-center">
              How much time did PaperIQ save you?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {HOURS_OPTIONS.map(h => (
                <button
                  key={h}
                  onClick={() => setHoursSaved(h)}
                  className={`px-2 py-2 rounded-xl border text-xs font-mono transition-all ${
                    hoursSaved === h
                      ? 'border-[#f97316] bg-[#f97316]/10 text-[#f97316]'
                      : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                  }`}
                >
                  {h}
                </button>
              ))}
              <button
                onClick={() => setHoursSaved('none')}
                className={`col-span-3 px-2 py-2 rounded-xl border text-xs font-mono transition-all ${
                  hoursSaved === 'none'
                    ? 'border-white/20 bg-white/10 text-white/60'
                    : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/10'
                }`}
              >
                Didn't save time
              </button>
            </div>
          </div>
        )}

        {/* Submit — only active when Q1 answered */}
        {rating && (
          <button
            onClick={() => submit(rating, hoursSaved ?? undefined)}
            disabled={submitting}
            className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] rounded-xl font-bold text-white text-sm transition-all disabled:opacity-50"
            style={{ animation: 'slideUp 0.2s ease-out' }}
          >
            {submitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        )}

        {/* Skip */}
        <button onClick={dismiss}
          className="w-full mt-2 py-2 text-white/20 hover:text-white/40 text-xs transition-colors">
          Skip
        </button>
      </div>
    </div>
  )
}
