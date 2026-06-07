/**
 * CustomSelect — replaces every native <select> in the app.
 *
 * Why: browser-native <select> ignores CSS for the dropdown panel.
 * On Chrome/macOS it shows a white/blue OS dropdown that looks completely
 * out of place on the dark #07070d background.
 *
 * This component is a fully styled replacement:
 * - Dark bg-surface-container panel with border-outline-variant border
 * - Orange accent on selected item (text-primary-container)
 * - Hover state bg-surface-container-high
 * - Animated chevron rotates 180° when open
 * - Closes on outside click via useEffect
 * - Keyboard accessible (Enter/Space to open, Escape to close)
 * 
 * ENHANCED: Spring-driven animations for smooth, responsive interactions
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING_SNAPPY, tapScale } from '../lib/motion'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string  // optional second line — used for subject codes
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CustomSelect({ value, onChange, options, placeholder = 'Select...', className = '', disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  // Update rect for portal positioning
  useEffect(() => {
    if (!open) return
    const updateRect = () => {
      if (ref.current) setRect(ref.current.getBoundingClientRect())
    }
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Determine whether to flip upward when opened
  useEffect(() => {
    if (!open) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    // flip if there is less space below than needed (200px) and more space above
    setOpenUpward(spaceBelow < 200 && spaceAbove > spaceBelow)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/5 border rounded-xl px-4 py-3
          text-sm font-medium transition-colors duration-200
          focus:outline-none focus:ring-1 focus:ring-primary-container/50
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${open
            ? 'border-primary-container/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
            : 'border-white/10'
          }
        `}
        whileHover={disabled || shouldReduceMotion ? {} : { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={disabled || shouldReduceMotion ? {} : tapScale}
        transition={SPRING_SNAPPY}
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron — rotates when open */}
        <motion.span
          className="material-symbols-outlined text-[18px] shrink-0"
          animate={{ 
            rotate: open ? 180 : 0,
            color: open ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.4)'
          }}
          transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
        >
          expand_more
        </motion.span>
      </motion.button>

  const dropdownPanel = (
    <AnimatePresence>
      {open && rect && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: openUpward ? 8 : -8, scale: 0.96 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: openUpward ? 8 : -8, scale: 0.96 }}
          transition={SPRING_SNAPPY}
          className={`fixed z-[9999] rounded-xl overflow-hidden shadow-2xl`}
          style={{
            top: openUpward ? 'auto' : rect.bottom + 6,
            bottom: openUpward ? window.innerHeight - rect.top + 6 : 'auto',
            left: rect.left,
            width: rect.width,
            background: 'rgba(15,15,20,0.98)',
            border: '1px solid rgba(249,115,22,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt, idx) => {
              const isSelected = opt.value === value
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm
                    flex items-center gap-3
                    ${isSelected
                      ? 'text-primary-container bg-primary-container/10'
                      : 'text-white/80'
                    }
                  `}
                  initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                  transition={shouldReduceMotion ? {} : { ...SPRING_SNAPPY, delay: idx * 0.02 }}
                  whileHover={shouldReduceMotion ? {} : { 
                    backgroundColor: isSelected ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                    color: 'rgb(255,255,255)',
                    x: 2
                  }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                >
                  {/* Check icon for selected */}
                  <motion.span 
                    className={`material-symbols-outlined text-[16px] shrink-0 text-primary-container`}
                    style={{fontVariationSettings:"'FILL' 1"}}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: isSelected ? 1 : 0,
                      scale: isSelected ? 1 : 0.5
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
                  >
                    check_circle
                  </motion.span>
                  <span className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.sublabel && <span className="text-xs text-white/30 mt-0.5">{opt.sublabel}</span>}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger button */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/5 border rounded-xl px-4 py-3
          text-sm font-medium transition-colors duration-200
          focus:outline-none focus:ring-1 focus:ring-primary-container/50
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${open
            ? 'border-primary-container/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
            : 'border-white/10'
          }
        `}
        whileHover={disabled || shouldReduceMotion ? {} : { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={disabled || shouldReduceMotion ? {} : tapScale}
        transition={SPRING_SNAPPY}
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron — rotates when open */}
        <motion.span
          className="material-symbols-outlined text-[18px] shrink-0"
          animate={{ 
            rotate: open ? 180 : 0,
            color: open ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.4)'
          }}
          transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
        >
          expand_more
        </motion.span>
      </motion.button>

      {typeof document !== 'undefined' ? createPortal(dropdownPanel, document.body) : dropdownPanel}
    </div>
  )
}
