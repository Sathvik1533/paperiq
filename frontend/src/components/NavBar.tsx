/**
 * NavBar — shared across all authenticated screens.
 * Matches the Stitch design exactly: logo + nav links + search + actions + avatar.
 * All links are real React Router <Link> elements.
 * 
 * ENHANCED: Spring-driven micro-interactions on ALL interactive elements
 * Per interaction-patterns.md: stiffness 300, damping 20, max 800ms
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Icon } from './Icon'
import { Tooltip } from './ui/Tooltip'
import { hoverScale, tapScale, SPRING_SNAPPY } from '../lib/motion'

/** Tooltip descriptions for each nav link */
const navTooltips: Record<string, string> = {
  dashboard: 'Your study command center \u2014 subjects, progress, and quick actions',
  analysis:  'AI-powered exam pattern analysis across 10+ years of papers',
  papers:    'Browse, search, and download 80+ past exam papers',
  about:     'The story behind PaperIQ and the developer',
  profile:   'Your learning goals, preferences, and academic profile',
  settings:  'Customize your PaperIQ experience',
  vision:    'The future roadmap of PaperIQ',
}

interface NavBarProps {
  /** Override which nav item is highlighted (defaults to path detection) */
  activeTab?: 'dashboard' | 'analysis' | 'papers' | 'about' | 'profile' | 'settings' | 'vision'
}

export function NavBar({ activeTab }: NavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  // Hover state — beam follows hover, falls back to active route
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [dropdownOpen])

  // Close dropdown on route change
  useEffect(() => { 
    setDropdownOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  // Derive active tab from path if not overridden
  const path = location.pathname
  const active = activeTab ?? (
    path.startsWith('/dashboard') || path.startsWith('/subjects') ? 'dashboard' :
    path.startsWith('/analysis') || path.startsWith('/beta') ? 'analysis' :
    path.startsWith('/papers') ? 'papers' :
    path.startsWith('/profile') ? 'profile' :
    path.startsWith('/settings') ? 'settings' :
    path.startsWith('/about') ? 'about' :
    'dashboard'
  )

  const navLinks: Array<{ key: typeof active; label: string; to: string; tourAttr?: string }> = [
    { key: 'dashboard', label: 'Dashboard',  to: '/dashboard', tourAttr: 'tour-nav-dashboard' },
    { key: 'analysis',  label: 'Analysis',   to: '/analysis',  tourAttr: 'tour-nav-analysis' },
    { key: 'papers',    label: 'Papers',      to: '/papers',   tourAttr: 'tour-nav-papers' },
    { key: 'about',     label: 'About',       to: '/about',    tourAttr: 'tour-nav-about' },
    { key: 'profile',   label: 'Profile',     to: '/profile',  tourAttr: 'tour-nav-profile' },
    { key: 'settings',  label: 'Settings',    to: '/settings', tourAttr: 'tour-nav-settings' },
  ]

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const avatarUrl = user?.user_metadata?.avatar_url
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-background/80 backdrop-blur-xl border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-base md:px-xl h-20 gap-xl">
        {/* Logo */}
        <div className="flex items-center gap-huge">
          <Tooltip content="Go to Dashboard" placement="bottom">
            {shouldReduceMotion ? (
              <Link to="/dashboard" className="font-headline text-headline-md font-bold text-on-surface tracking-tight">
                Paper<span className="text-primary-container">IQ</span>
              </Link>
            ) : (
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
              >
                <Link to="/dashboard" className="font-headline text-headline-md font-bold text-on-surface tracking-tight">
                  Paper<span className="text-primary-container">IQ</span>
                </Link>
              </motion.div>
            )}
          </Tooltip>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-xl">
            {navLinks.map(link => {
              const isBeam = (hoveredKey ?? active) === link.key
              const NavLink = shouldReduceMotion ? Link : motion(Link)
              
              return (
                <Tooltip key={link.key} content={navTooltips[link.key] ?? link.label} placement="bottom">
                  <NavLink
                    to={link.to}
                    data-tour={link.tourAttr}
                    onMouseEnter={() => setHoveredKey(link.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={`relative font-body-md text-body-md transition-colors duration-200 pb-1 ${
                      isBeam
                        ? 'text-primary-container font-bold'
                        : 'text-on-surface-variant hover:text-primary-container'
                    }`}
                    {...(!shouldReduceMotion && {
                      whileHover: { scale: 1.03, translateY: -2 },
                      whileTap: { scale: 0.97 },
                      transition: SPRING_SNAPPY
                    })}
                  >
                    {link.label}
                    {/* beam — follows hover, snaps back to active route on mouse leave */}
                    <span
                      className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full bg-primary-container transition-all duration-200 ${
                        isBeam ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                      }`}
                      style={{ transformOrigin: 'left' }}
                    />
                  </NavLink>
                </Tooltip>
              )
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-base">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-on-surface hover:text-primary-container transition-colors"
            aria-label="Menu"
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={24} />
          </button>

          {/* Search / Command Palette trigger */}
          <div className="relative hidden sm:block">
            <Tooltip content="Search papers, subjects, and more (⌘K)" placement="bottom">
              {shouldReduceMotion ? (
                <button
                  onClick={() => window.dispatchEvent(new Event('cmd-palette:open'))}
                  className="flex items-center gap-sm bg-surface border border-outline-variant rounded-xl pl-3 pr-4 py-2 text-body-sm text-on-surface-variant hover:border-primary-container/60 hover:text-on-surface transition-all w-48 group"
                  aria-label="Search (⌘K)"
                >
                  <Icon name="search" size={20} />
                  <span className="flex-1 text-left text-on-surface-variant/60">Search…</span>
                  <kbd className="hidden lg:flex items-center gap-[2px] text-[9px] border border-outline-variant rounded px-[4px] py-[1px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">⌘K</kbd>
                </button>
              ) : (
                <motion.button
                  onClick={() => window.dispatchEvent(new Event('cmd-palette:open'))}
                  className="flex items-center gap-sm bg-surface border border-outline-variant rounded-xl pl-3 pr-4 py-2 text-body-sm text-on-surface-variant hover:border-primary-container/60 hover:text-on-surface transition-all w-48 group"
                  aria-label="Search (⌘K)"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 16px rgba(255,102,0,0.10)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING_SNAPPY}
                >
                  <Icon name="search" size={20} />
                  <span className="flex-1 text-left text-on-surface-variant/60">Search…</span>
                  <kbd className="hidden lg:flex items-center gap-[2px] text-[9px] border border-outline-variant rounded px-[4px] py-[1px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">⌘K</kbd>
                </motion.button>
              )}
            </Tooltip>
          </div>

          {/* Run New Analysis CTA */}
          {shouldReduceMotion ? (
            <button
              data-tour="tour-run-analysis-cta"
              onClick={() => navigate('/analysis?reset=1')}
              className="hidden md:flex items-center gap-sm bg-primary-container text-on-primary-container font-bold px-base py-2 rounded-xl text-body-sm hover:brightness-110 transition-all active:scale-95 glow-orange"
            >
              <Icon name="add" size={18} />
              Run New Analysis
            </button>
          ) : (
            <motion.button
              data-tour="tour-run-analysis-cta"
              onClick={() => navigate('/analysis?reset=1')}
              className="hidden md:flex items-center gap-sm bg-primary-container text-on-primary-container font-bold px-base py-2 rounded-xl text-body-sm hover:brightness-110 transition-all glow-orange"
              whileHover={{ ...hoverScale, boxShadow: "0 0 20px rgba(249, 115, 22, 0.4)" }}
              whileTap={tapScale}
              transition={SPRING_SNAPPY}
            >
              <Icon name="add" size={18} />
              Run New Analysis
            </motion.button>
          )}

          {/* Avatar / dropdown — click-controlled, no hover jank */}
          {/* Student placeholder - personal avatar only on About page */}
          <div className="relative" ref={dropdownRef}>
            <Tooltip content="Your profile & sign out" placement="bottom">
              {shouldReduceMotion ? (
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-400 transition-all ${
                    dropdownOpen
                      ? 'border-primary-container shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                      : 'border-neutral-700 hover:border-primary-container'
                  }`}
                >
                  {initials}
                </button>
              ) : (
                <motion.button
                  onClick={() => setDropdownOpen(o => !o)}
                  className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-400 transition-all ${
                    dropdownOpen
                      ? 'border-primary-container shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                      : 'border-neutral-700 hover:border-primary-container'
                  }`}
                  whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(249,115,22,0.35)' }}
                  whileTap={{ scale: 0.93 }}
                  transition={SPRING_SNAPPY}
                >
                  {initials}
                </motion.button>
              )}
            </Tooltip>

            {/* Dropdown — click-triggered, z-[200] over all page content */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-12 w-64 rounded-2xl border border-white/10 z-[200] overflow-hidden"
                style={{
                  background: 'rgba(14,14,20,0.98)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 32px rgba(249,115,22,0.08)',
                }}
              >
                {/* Caret pointer */}
                <div className="absolute -top-[6px] right-3 w-3 h-3 rotate-45 border-l border-t border-white/10"
                  style={{ background: 'rgba(14,14,20,0.98)' }} />

                {/* User identity - student placeholder */}
                <div className="px-md pt-md pb-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-400 shrink-0">
                      {/* Student initials only - no personal photo */}
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-bold text-on-surface truncate leading-tight">
                        {firstName}
                      </p>
                      <p className="text-[11px] text-on-surface-variant truncate mt-[1px]">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mx-md mb-sm h-px bg-white/6" />

                {/* Menu items */}
                <div className="px-xs pb-xs space-y-[2px]">
                  <Link
                    to="/profile"
                    className="flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface hover:bg-white/6 hover:text-primary-container transition-colors group/item"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-primary-container/15 transition-colors">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover/item:text-primary-container transition-colors">person</span>
                    </div>
                    <div>
                      <span className="block">Profile</span>
                      <span className="text-[11px] text-on-surface-variant/60">View & edit your details</span>
                    </div>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface hover:bg-white/6 hover:text-primary-container transition-colors group/item"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-primary-container/15 transition-colors">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover/item:text-primary-container transition-colors">settings</span>
                    </div>
                    <div>
                      <span className="block">Settings</span>
                      <span className="text-[11px] text-on-surface-variant/60">Preferences & behaviour</span>
                    </div>
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface hover:bg-white/6 hover:text-primary-container transition-colors group/item"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-primary-container/15 transition-colors">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant group-hover/item:text-primary-container transition-colors">dashboard</span>
                    </div>
                    <div>
                      <span className="block">Dashboard</span>
                      <span className="text-[11px] text-on-surface-variant/60">Your subject overview</span>
                    </div>
                  </Link>
                </div>

                {/* Sign out — separated visually */}
                <div className="mx-md mt-xs mb-md h-px bg-white/6" />
                <div className="px-xs pb-xs">
                  {shouldReduceMotion ? (
                    <button
                      onClick={() => signOut().then(() => navigate('/'))}
                      className="w-full flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface-variant hover:bg-error/8 hover:text-error transition-colors group/sign"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/sign:bg-error/15 transition-colors">
                        <span className="material-symbols-outlined text-[15px]">logout</span>
                      </div>
                      Sign out
                    </button>
                  ) : (
                    <motion.button
                      onClick={() => signOut().then(() => navigate('/'))}
                      className="w-full flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface-variant hover:bg-error/8 hover:text-error transition-colors group/sign"
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING_SNAPPY}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/sign:bg-error/15 transition-colors">
                        <span className="material-symbols-outlined text-[15px]">logout</span>
                      </div>
                      Sign out
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile: search icon → open command palette */}
          <button
            className="sm:hidden material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => window.dispatchEvent(new Event('cmd-palette:open'))}
            aria-label="Search"
          >
            search
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden material-symbols-outlined text-on-surface"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? 'close' : 'menu'}
          </button>
        </div>
      </div>

      {/* Mobile menu — AnimatePresence for smooth open/close */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden bg-surface-container border-t border-outline-variant px-base py-md space-y-xs overflow-hidden"
            initial={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {navLinks.map((link, i) => (
              shouldReduceMotion ? (
                <Link
                  key={link.key}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-sm py-sm rounded-xl text-body-md transition-colors ${
                    active === link.key
                      ? 'bg-primary-container/10 text-primary-container font-bold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <motion.div
                  key={link.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.04 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-sm py-sm rounded-xl text-body-md transition-colors ${
                      active === link.key
                        ? 'bg-primary-container/10 text-primary-container font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              )
            ))}
            {shouldReduceMotion ? (
              <button
                onClick={() => { navigate('/analysis?reset=1'); setMobileOpen(false) }}
                className="w-full mt-sm bg-primary-container text-on-primary-container font-bold py-sm px-base rounded-xl text-body-sm"
              >
                Run New Analysis
              </button>
            ) : (
              <motion.button
                onClick={() => { navigate('/analysis?reset=1'); setMobileOpen(false) }}
                className="w-full mt-sm bg-primary-container text-on-primary-container font-bold py-sm px-base rounded-xl text-body-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: navLinks.length * 0.04 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(249,115,22,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Run New Analysis
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
