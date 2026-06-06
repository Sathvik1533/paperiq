/**
 * NavBar — shared across all authenticated screens.
 * Matches the Stitch design exactly: logo + nav links + search + actions + avatar.
 * All links are real React Router <Link> elements.
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Icon } from './Icon'
import { CommandPalette } from './CommandPalette'

interface NavBarProps {
  /** Override which nav item is highlighted (defaults to path detection) */
  activeTab?: 'dashboard' | 'analysis' | 'papers' | 'profile' | 'settings' | 'about'
}

export function NavBar({ activeTab }: NavBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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
  useEffect(() => { setDropdownOpen(false) }, [location.pathname])

  // Cmd+K / Ctrl+K global shortcut for command palette
  useEffect(() => {
    function handleGlobal(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    document.addEventListener('keydown', handleGlobal)
    return () => document.removeEventListener('keydown', handleGlobal)
  }, [])

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
    { key: 'profile',   label: 'Profile',     to: '/profile',  tourAttr: 'tour-nav-profile' },
    { key: 'about',     label: 'About',       to: '/about',    tourAttr: undefined },
  ]

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  const avatarUrl = user?.user_metadata?.avatar_url
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center px-base md:px-xl h-20 gap-xl">
        {/* Logo */}
        <div className="flex items-center gap-huge">
          <Link to="/" className="font-headline text-headline-md font-bold text-on-surface tracking-tight">
            Paper<span className="text-primary-container">IQ</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-xl">
            {navLinks.map(link => {
              const isBeam = (hoveredKey ?? active) === link.key
              return (
                <Link
                  key={link.key}
                  to={link.to}
                  data-tour={link.tourAttr}
                  onMouseEnter={() => setHoveredKey(link.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`relative font-body-md text-body-md transition-colors duration-200 pb-1 ${
                    isBeam
                      ? 'text-primary-container font-bold'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  {link.label}
                  {/* beam — follows hover, snaps back to active route on mouse leave */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full bg-primary-container transition-all duration-200 ${
                      isBeam ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                    style={{ transformOrigin: 'left' }}
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-base">
          {/* Search / Command Palette trigger */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-sm bg-surface border border-outline-variant rounded-xl pl-3 pr-4 py-2 text-body-sm text-on-surface-variant hover:border-primary-container/60 hover:text-on-surface transition-all w-48 group"
              aria-label="Search (⌘K)"
            >
              <Icon name="search" size={20} />
              <span className="flex-1 text-left text-on-surface-variant/60">Search…</span>
              <kbd className="hidden lg:flex items-center gap-[2px] text-[9px] border border-outline-variant rounded px-[4px] py-[1px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Run New Analysis CTA */}
          <button
            data-tour="tour-run-analysis-cta"
            onClick={() => navigate('/analysis?reset=1')}
            className="hidden md:flex items-center gap-sm bg-primary-container text-on-primary-container font-bold px-base py-2 rounded-xl text-body-sm hover:brightness-110 transition-all active:scale-95 glow-orange"
          >
            <Icon name="add" size={18} />
            Run New Analysis
          </button>

          {/* Avatar / dropdown — click-controlled, no hover jank */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-surface-container flex items-center justify-center text-sm font-bold text-primary-container transition-all ${
                dropdownOpen
                  ? 'border-primary-container shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                  : 'border-primary-container/40 hover:border-primary-container'
              }`}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : initials
              }
            </button>

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

                {/* User identity */}
                <div className="px-md pt-md pb-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary-container/30 bg-surface-container flex items-center justify-center text-sm font-bold text-primary-container shrink-0">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        : initials
                      }
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
                  <button
                    onClick={() => signOut().then(() => navigate('/'))}
                    className="w-full flex items-center gap-sm px-sm py-[10px] rounded-xl text-body-sm text-on-surface-variant hover:bg-error/8 hover:text-error transition-colors group/sign"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/sign:bg-error/15 transition-colors">
                      <span className="material-symbols-outlined text-[15px]">logout</span>
                    </div>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile: search icon → palette */}
          <button
            className="sm:hidden material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={() => setPaletteOpen(true)}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-container border-t border-outline-variant px-base py-md space-y-xs">
          {navLinks.map(link => (
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
          ))}
          <button
            onClick={() => { navigate('/analysis?reset=1'); setMobileOpen(false) }}
            className="w-full mt-sm bg-primary-container text-on-primary-container font-bold py-sm px-base rounded-xl text-body-sm"
          >
            Run New Analysis
          </button>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  )
}
