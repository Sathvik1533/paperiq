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
 */
import { useState, useEffect, useRef } from 'react'

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
  const ref = useRef<HTMLDivElement>(null)

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
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white/5 border rounded-xl px-4 py-3
          text-sm font-medium transition-all duration-200
          focus:outline-none focus:ring-1 focus:ring-primary-container/50
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/8'}
          ${open
            ? 'border-primary-container/60 bg-white/8 shadow-[0_0_0_1px_rgba(249,115,22,0.2)]'
            : 'border-white/10 hover:border-white/20'
          }
        `}
      >
        <span className={selected ? 'text-white' : 'text-white/40'}>
          {selected ? selected.label : placeholder}
        </span>
        {/* Chevron — rotates when open */}
        <span
          className={`material-symbols-outlined text-[18px] text-white/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180 text-primary-container' : ''}`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(15,15,20,0.98)',
            border: '1px solid rgba(249,115,22,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm transition-all duration-150
                    flex items-center gap-3
                    ${isSelected
                      ? 'text-primary-container bg-primary-container/10'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {/* Check icon for selected */}
                  <span className={`material-symbols-outlined text-[16px] shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-primary-container' : 'opacity-0'}`}
                    style={{fontVariationSettings:"'FILL' 1"}}>
                    check_circle
                  </span>
                  <span className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.sublabel && <span className="text-xs text-white/30 mt-0.5">{opt.sublabel}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
