/**
 * CommandPalette — Global search / navigation overlay
 * Triggered by Cmd+K (Mac) / Ctrl+K (Win/Linux) or the search button in NavBar.
 * Lists all pages + quick actions + searches papers by title.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface CommandItem {
  id: string
  type: 'page' | 'action' | 'paper'
  label: string
  description?: string
  icon: string
  to?: string
  action?: () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const STATIC_ITEMS: CommandItem[] = [
  {
    id: 'dashboard',
    type: 'page',
    label: 'Dashboard',
    description: 'Your subject overview and quick links',
    icon: 'dashboard',
    to: '/dashboard',
    keywords: ['home', 'subjects', 'overview'],
  },
  {
    id: 'analysis',
    type: 'page',
    label: 'Exam Analysis',
    description: 'AI insights — topic priorities & repeat patterns',
    icon: 'bolt',
    to: '/analysis',
    keywords: ['analyze', 'exam', 'topics', 'study', 'priority', 'predict'],
  },
  {
    id: 'papers',
    type: 'page',
    label: 'Past Papers',
    description: 'Browse all MLRIT past exam papers',
    icon: 'description',
    to: '/papers',
    keywords: ['questions', 'exam papers', 'previous', 'past'],
  },
  {
    id: 'profile',
    type: 'page',
    label: 'Profile',
    description: 'Your college, branch and semester details',
    icon: 'person',
    to: '/profile',
    keywords: ['account', 'college', 'branch', 'semester'],
  },
  {
    id: 'settings',
    type: 'page',
    label: 'Settings',
    description: 'Preferences, theme and default filters',
    icon: 'settings',
    to: '/settings',
    keywords: ['preferences', 'theme', 'dark', 'notifications'],
  },
  {
    id: 'run-analysis',
    type: 'action',
    label: 'Run New Analysis',
    description: 'Start a fresh analysis for any subject',
    icon: 'add_circle',
    to: '/analysis?reset=1',
    keywords: ['new', 'start', 'analyse', 'fresh'],
  },
  {
    id: 'onboarding',
    type: 'action',
    label: 'Re-run Onboarding',
    description: 'Update your college, branch or semester',
    icon: 'school',
    to: '/onboarding',
    keywords: ['setup', 'change college', 'change semester', 'mlrit'],
  },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Filter items by query
  const filtered = query.trim()
    ? STATIC_ITEMS.filter(item => {
        const q = query.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.keywords?.some(k => k.includes(q))
        )
      })
    : STATIC_ITEMS

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const execute = useCallback(
    (item: CommandItem) => {
      onClose()
      if (item.action) {
        item.action()
      } else if (item.to) {
        navigate(item.to)
      }
    },
    [navigate, onClose]
  )

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const item = filtered[activeIdx]
      if (item) execute(item)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  const pages = filtered.filter(i => i.type === 'page')
  const actions = filtered.filter(i => i.type === 'action')

  function renderGroup(items: CommandItem[], label: string) {
    if (!items.length) return null
    return (
      <div className="mb-1">
        <div className="px-md py-xs text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
          {label}
        </div>
        {items.map(item => {
          const globalIdx = filtered.indexOf(item)
          const isActive = globalIdx === activeIdx
          return (
            <button
              key={item.id}
              data-idx={globalIdx}
              onClick={() => execute(item)}
              onMouseEnter={() => setActiveIdx(globalIdx)}
              className={`w-full flex items-center gap-sm px-md py-[10px] rounded-xl text-left transition-colors ${
                isActive
                  ? 'bg-primary-container/15 text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? 'bg-primary-container/20' : 'bg-white/6'
              }`}>
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`}>
                  {item.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-body-sm font-semibold ${isActive ? 'text-on-surface' : ''}`}>
                  {item.label}
                </div>
                {item.description && (
                  <div className="text-[11px] text-on-surface-variant/60 truncate mt-[1px]">
                    {item.description}
                  </div>
                )}
              </div>
              {isActive && (
                <span className="material-symbols-outlined text-[14px] text-primary-container/60 shrink-0">
                  keyboard_return
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[401] w-full max-w-lg mx-auto px-sm"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        <div
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: 'rgba(12,12,18,0.97)',
            backdropFilter: 'blur(32px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), 0 0 40px rgba(249,115,22,0.06)',
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-sm px-md border-b border-white/8">
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">search</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
              onKeyDown={handleKey}
              placeholder="Search pages, actions…"
              className="flex-1 bg-transparent py-[18px] text-body-md text-on-surface placeholder:text-on-surface-variant/40 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:flex items-center gap-[2px] text-[10px] text-on-surface-variant/50 border border-white/8 rounded px-[5px] py-[2px] font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto p-xs">
            {filtered.length === 0 ? (
              <div className="py-xl text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 block mb-sm">search_off</span>
                <p className="text-body-sm text-on-surface-variant">No results for "{query}"</p>
              </div>
            ) : (
              <>
                {renderGroup(pages, 'Pages')}
                {renderGroup(actions, 'Quick Actions')}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-white/6 px-md py-sm flex items-center gap-lg text-[10px] text-on-surface-variant/40">
            <span className="flex items-center gap-xs">
              <kbd className="border border-white/10 rounded px-[4px] py-[1px] font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-xs">
              <kbd className="border border-white/10 rounded px-[4px] py-[1px] font-mono">↵</kbd> open
            </span>
            <span className="flex items-center gap-xs">
              <kbd className="border border-white/10 rounded px-[4px] py-[1px] font-mono">Esc</kbd> close
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
