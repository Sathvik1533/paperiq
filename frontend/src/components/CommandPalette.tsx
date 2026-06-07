/**
 * CommandPalette — Global floating search modal
 *
 * Trigger: Cmd+K / Ctrl+K keyboard shortcut OR dispatching the custom
 * 'cmd-palette:open' event from anywhere in the app (e.g. NavBar search button).
 *
 * Design: glassmorphic backdrop, Framer Motion spring slide-down, premium input.
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { SPRING_SNAPPY } from '../lib/motion'

interface SearchResult {
  id: string
  type: 'page' | 'paper' | 'subject'
  title: string
  subtitle?: string
  icon: string
  path: string
}

const PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard',       subtitle: 'Your subject hub',          icon: 'dashboard',     path: '/dashboard' },
  { id: 'analysis',  type: 'page', title: 'Analysis',        subtitle: 'AI exam insights',           icon: 'analytics',     path: '/analysis'  },
  { id: 'papers',    type: 'page', title: 'Papers',          subtitle: 'Browse past papers',         icon: 'library_books', path: '/papers'    },
  { id: 'about',     type: 'page', title: 'About Creator',   subtitle: 'Meet the developer',        icon: 'info',          path: '/about'     },
  { id: 'profile',   type: 'page', title: 'Profile',         subtitle: 'Your account & semester',   icon: 'person',        path: '/profile'   },
  { id: 'settings',  type: 'page', title: 'Settings',        subtitle: 'Preferences & behaviour',   icon: 'settings',      path: '/settings'  },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [papers, setPapers] = useState<SearchResult[]>([])
  const [subjects, setSubjects] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const shouldReduceMotion = useReducedMotion()

  // ── Open via Cmd+K / Ctrl+K ──────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // ── Open via custom event (dispatched from NavBar search button) ─────────
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('cmd-palette:open', handler)
    return () => window.removeEventListener('cmd-palette:open', handler)
  }, [])

  // ── Auto-focus input when opened ─────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setFocusedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 80)
    } else {
      setSearch('')
      setPapers([])
      setSubjects([])
    }
  }, [open])

  // ── Live search (300ms debounce) ─────────────────────────────────────────
  useEffect(() => {
    if (!search || search.length < 2) {
      setPapers([])
      setSubjects([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [{ data: papersData }, { data: subjectsData }] = await Promise.all([
          supabase
            .from('papers')
            .select('id, title, exam_category, exam_year')
            .ilike('title', `%${search}%`)
            .limit(5),
          supabase
            .from('subjects')
            .select('id, name, code')
            .ilike('name', `%${search}%`)
            .limit(5),
        ])
        setPapers(
          (papersData || []).map(p => ({
            id: p.id, type: 'paper' as const,
            title: p.title || 'Untitled Paper',
            subtitle: `${p.exam_category || 'Exam'} ${p.exam_year || ''}`,
            icon: 'description', path: `/papers/${p.id}`,
          }))
        )
        setSubjects(
          (subjectsData || []).map(s => ({
            id: s.id, type: 'subject' as const,
            title: s.name,
            subtitle: s.code,
            icon: 'book', path: `/analysis?subject_id=${s.id}`,
          }))
        )
      } catch (err) {
        console.error('CommandPalette search error:', err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const allResults: SearchResult[] = search.length < 2
    ? PAGES
    : [...papers, ...subjects]

  const handleSelect = useCallback((path: string) => {
    setOpen(false)
    navigate(path)
  }, [navigate])

  // ── Keyboard navigation inside palette ───────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIdx(i => Math.min(i + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = allResults[focusedIdx]
        if (item) handleSelect(item.path)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, allResults, focusedIdx, handleSelect])

  if (!user) return null

  const backdropVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
    exit:    { opacity: 0 },
  }

  const panelVariants = {
    hidden:  { opacity: 0, y: -24, scale: 0.96 },
    visible: { opacity: 1, y: 0,   scale: 1    },
    exit:    { opacity: 0, y: -16, scale: 0.97 },
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ────────────────────────────────────────────── */}
          <motion.div
            key="cmd-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50"
            onClick={() => setOpen(false)}
          >
            {/* ── Panel ───────────────────────────────────────────── */}
            <motion.div
              key="cmd-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-full max-w-xl mx-4 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(12,12,18,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(249,115,22,0.12), 0 0 60px rgba(249,115,22,0.06)',
                backdropFilter: 'blur(32px)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Search input ──────────────────────────────────── */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
                <span
                  className="material-symbols-outlined text-[22px] shrink-0"
                  style={{ color: 'rgba(249,115,22,0.8)' }}
                >
                  search
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setFocusedIdx(0) }}
                  placeholder="Search screens, papers, subjects…"
                  className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/30 outline-none font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
                <kbd className="hidden sm:flex items-center gap-[2px] text-[10px] border border-white/10 rounded px-1.5 py-0.5 font-mono text-white/30">
                  ESC
                </kbd>
              </div>

              {/* ── Results list ────────────────────────────────────── */}
              <div className="max-h-[360px] overflow-y-auto py-2">
                {loading && (
                  <div className="py-8 flex justify-center">
                    <div className="w-5 h-5 border-2 border-white/10 border-t-[#f97316] rounded-full animate-spin" />
                  </div>
                )}

                {!loading && allResults.length === 0 && search.length >= 2 && (
                  <div className="py-8 text-center text-white/30 text-sm">
                    No results for "{search}"
                  </div>
                )}

                {!loading && allResults.length > 0 && (
                  <div className="px-2">
                    {/* Section label */}
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/25 mb-1">
                      {search.length < 2 ? 'Navigate to' : 'Results'}
                    </p>
                    {allResults.map((item, idx) => {
                      const isFocused = idx === focusedIdx
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setFocusedIdx(idx)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                          style={{
                            background: isFocused ? 'rgba(249,115,22,0.1)' : 'transparent',
                            border: isFocused ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                          }}
                          initial={false}
                          animate={{
                            backgroundColor: isFocused ? 'rgba(249,115,22,0.1)' : 'rgba(0,0,0,0)',
                          }}
                          transition={{ duration: 0.12 }}
                        >
                          {/* Icon */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: isFocused ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)',
                            }}
                          >
                            <span
                              className="material-symbols-outlined text-[17px]"
                              style={{ color: isFocused ? '#f97316' : 'rgba(255,255,255,0.5)', fontVariationSettings: "'FILL' 1" }}
                            >
                              {item.icon}
                            </span>
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isFocused ? 'text-white' : 'text-white/80'}`}>
                              {item.title}
                            </p>
                            {item.subtitle && (
                              <p className="text-xs text-white/30 truncate mt-0.5">{item.subtitle}</p>
                            )}
                          </div>
                          {/* Arrow hint for focused item */}
                          {isFocused && (
                            <span className="material-symbols-outlined text-[15px] text-[#f97316] shrink-0">
                              arrow_forward
                            </span>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Footer hints ────────────────────────────────────── */}
              <div className="px-5 py-3 border-t border-white/[0.05] flex items-center gap-4 text-[10px] text-white/20 font-mono">
                <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">↑↓</kbd> navigate</span>
                <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">↵</kbd> open</span>
                <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">esc</kbd> close</span>
                <span className="ml-auto text-[#f97316]/40">⌘K</span>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
