/**
 * SearchableCombobox — Premium searchable dropdown with scroll support
 * 
 * Features:
 * - Search/filter by typing course name or code
 * - Scrollable dropdown list (max-h-64 with overflow-y-auto)
 * - Framer Motion spring animations
 * - Absolute positioning with z-50 overlay depth
 * - Displays all subjects without clipping
 */
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SPRING_SNAPPY } from '../lib/motion'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string  // Course code (e.g., A6CS05)
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableCombobox({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Choose or type a subject (e.g., Java, Data Structures)...', 
  className = '', 
  disabled = false 
}: Props) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape, navigate with arrow keys
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearchQuery('')
        inputRef.current?.blur()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault()
        const option = filteredOptions[focusedIndex]
        if (option) {
          onChange(option.value)
          setOpen(false)
          setSearchQuery('')
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, focusedIndex, options, onChange])

  const selected = options.find(o => o.value === value)

  // Filter options based on search query
  const filteredOptions = searchQuery.trim()
    ? options.filter(opt => {
        const query = searchQuery.toLowerCase()
        const matchesLabel = opt.label.toLowerCase().includes(query)
        const matchesSublabel = opt.sublabel?.toLowerCase().includes(query)
        return matchesLabel || matchesSublabel
      })
    : options

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(-1)
  }, [searchQuery])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setOpen(false)
    setSearchQuery('')
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }, 50)
  }

  const displayText = open ? searchQuery : (selected?.label || '')

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Search Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayText}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`
            w-full flex items-center justify-between gap-2
            bg-white/5 border rounded-xl px-4 py-3
            text-sm font-medium transition-colors duration-200
            focus:outline-none focus:ring-1 focus:ring-primary-container/50
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-text'}
            ${open
              ? 'border-primary-container/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
              : 'border-white/10'
            }
            ${!open && !selected ? 'text-white/40' : 'text-white'}
          `}
        />
        {/* Search icon */}
        <span 
          className="material-symbols-outlined text-[18px] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: open ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.4)' }}
        >
          {open ? 'search' : 'expand_more'}
        </span>
      </div>

  const dropdownPanel = (
    <AnimatePresence>
      {open && rect && filteredOptions.length > 0 && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -8, scale: 0.96 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -8, scale: 0.96 }}
          transition={SPRING_SNAPPY}
          className="fixed z-[9999] bg-[#121214] border border-[#1e1e24] rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-neutral-800"
          style={{
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {filteredOptions.map((opt, idx) => {
            const isSelected = opt.value === value
            const isFocused = idx === focusedIndex
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm
                  flex items-center gap-3
                  ${isSelected
                    ? 'text-primary-container bg-primary-container/10'
                    : isFocused
                    ? 'text-white bg-white/5'
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
                  <span className="font-medium">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-xs text-white/30 mt-0.5">{opt.sublabel}</span>
                  )}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      )}
      {open && rect && filteredOptions.length === 0 && searchQuery && (
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
          animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
          transition={SPRING_SNAPPY}
          className="fixed z-[9999] bg-[#121214] border border-[#1e1e24] rounded-xl shadow-2xl py-4 px-4"
          style={{
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <p className="text-white/40 text-sm text-center">
            No subjects found matching "{searchQuery}"
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Search Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={displayText}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`
            w-full flex items-center justify-between gap-2
            bg-white/5 border rounded-xl px-4 py-3
            text-sm font-medium transition-colors duration-200
            focus:outline-none focus:ring-1 focus:ring-primary-container/50
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-text'}
            ${open
              ? 'border-primary-container/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
              : 'border-white/10'
            }
            ${!open && !selected ? 'text-white/40' : 'text-white'}
          `}
        />
        {/* Search icon */}
        <span 
          className="material-symbols-outlined text-[18px] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: open ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.4)' }}
        >
          {open ? 'search' : 'expand_more'}
        </span>
      </div>

      {/* Dropdown Panel with Scroll rendered in portal */}
      {typeof document !== 'undefined' ? createPortal(dropdownPanel, document.body) : dropdownPanel}
    </div>
  )
}
