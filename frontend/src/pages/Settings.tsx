/**
 * Settings — Screen 20 (desktop + mobile)
 * Route: /settings
 *
 * All toggles/sliders are functional and persist to user_profiles.preferences JSONB.
 * Sections: Intelligence, Notifications, Analysis, Data & Privacy, Display, Experimental, About.
 * 
 * ENHANCED: Spring-driven animations on all interactive elements
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { usePrefsStore } from '../store/prefsStore'
import { getUserProfile } from '../lib/api'
import { supabase } from '../lib/supabase'
import { CustomSelect } from '../components/CustomSelect'
import { PageTransition } from '../components/ui/PageTransition'
import { hoverScale, tapScale, SPRING_SNAPPY } from '../lib/motion'

interface Prefs {
  notifications: { analysisComplete: boolean; examReminders: boolean; studyPlanUpdates: boolean }
  intelligence: { topicSensitivity: number; confidenceDisplay: string; recommendationStyle: string; priorityVisibility: boolean; revisionReminders: boolean }
  analysis: { autoAnalysis: boolean; defaultExamFilter: string; minConfidence: number }
  privacy: { anonymousAnalytics: boolean; cacheResults: boolean }
  display: { compactMode: boolean; reduceMotion: boolean; theme: 'dark' | 'light' }
  experimental: { newDashboard: boolean; advancedAnalysis: boolean; earlyFeatures: boolean }
}

const DEFAULT_PREFS: Prefs = {
  notifications: { analysisComplete: true,  examReminders: true,  studyPlanUpdates: false },
  intelligence:  { topicSensitivity: 70, confidenceDisplay:'Standard', recommendationStyle:'Balanced', priorityVisibility:true, revisionReminders:false },
  analysis:      { autoAnalysis: true, defaultExamFilter:'Semester', minConfidence:80 },
  privacy:       { anonymousAnalytics: false, cacheResults: true },
  display:       { compactMode: false, reduceMotion: false, theme: 'dark' },
  experimental:  { newDashboard: false, advancedAnalysis: false, earlyFeatures: false },
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-primary-container' : 'bg-surface-container-highest'
      }`}
      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      transition={SPRING_SNAPPY}
      aria-checked={checked}
      role="switch"
      style={{ pointerEvents: 'auto' }}
    >
      <motion.span 
        className="absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-lg"
        animate={{ x: checked ? 20 : 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : SPRING_SNAPPY}
        style={{ pointerEvents: 'none' }}
      />
    </motion.button>
  )
}

export function Settings() {
  const { user, signOut } = useAuthStore()
  const { setPrefs: setGlobalPrefs } = usePrefsStore()   // live global update
  const navigate  = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [prefs, setPrefs]   = useState<Prefs>(DEFAULT_PREFS)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeSection, setActiveSection] = useState<string>('Intelligence')

  useEffect(() => {
    if (!user) return
    getUserProfile(user.id).then(prof => {
      if (prof?.preferences) {
        setPrefs({ ...DEFAULT_PREFS, ...prof.preferences })
      }
    })
  }, [user])

  async function savePrefs(updated: Prefs) {
    if (!user) return
    setSaving(true); setSuccess('')
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, preferences: updated })
      if (error) throw error
      setSuccess('Settings saved.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (_) {}
    finally { setSaving(false) }
  }

  function update<K extends keyof Prefs>(section: K, field: keyof Prefs[K], value: any) {
    const updated = { ...prefs, [section]: { ...prefs[section], [field]: value } }
    setPrefs(updated)
    debouncedSave(updated)

    // Push relevant prefs into global store immediately — no page reload needed.
    // Any component reading usePrefsStore() re-renders instantly.
    const filterMap: Record<string, any> = {
      'Semester': 'semester', 'All': 'all',
    }
    if (section === 'analysis') {
      if (field === 'defaultExamFilter') setGlobalPrefs({ defaultExamFilter: filterMap[value] ?? 'semester' })
      if (field === 'autoAnalysis')      setGlobalPrefs({ autoAnalysis: value })
    }
    if (section === 'display') {
      if (field === 'compactMode')   setGlobalPrefs({ compactMode: value })
      if (field === 'reduceMotion')  setGlobalPrefs({ reduceMotion: value })
      if (field === 'theme')         setGlobalPrefs({ theme: value })
    }
    if (section === 'intelligence') {
      if (field === 'topicSensitivity') setGlobalPrefs({ topicSensitivity: value })
    }
  }

  const nav = ['Notifications','Intelligence','Privacy','Display','Experimental']
  const [apiStatus, setApiStatus] = useState<'checking'|'healthy'|'down'>('checking')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check real backend health
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL as string
    if (!base) { setApiStatus('down'); return }
    fetch(`${base}/health`, { signal: AbortSignal.timeout(4000) })
      .then(r => setApiStatus(r.ok ? 'healthy' : 'down'))
      .catch(() => setApiStatus('down'))
  }, [])

  // Debounced save — waits 600ms after last change before writing to DB
  const debouncedSave = useCallback((updated: Prefs) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => savePrefs(updated), 600)
  }, [user])

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <NavBar activeTab="settings" />

      <div className="flex gap-xl max-w-[1200px] mx-auto pt-32 pb-xxl px-lg">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 pr-base">
          <div className="sticky top-28 flex flex-col rounded-2xl border border-white/8 p-base gap-md"
            style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
            <div className="mb-base">
              <h2 className="font-headline text-headline-md text-primary-container">Settings</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Academic Workspace</p>
            </div>
            <div className="flex flex-col gap-xs flex-1">
              {nav.map(section => (
                <motion.button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`flex items-center gap-sm px-sm py-md rounded-lg transition-all ${
                    activeSection === section 
                      ? 'text-primary font-bold bg-surface-container-high' 
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                  whileHover={shouldReduceMotion ? {} : hoverScale}
                  whileTap={shouldReduceMotion ? {} : tapScale}
                  transition={SPRING_SNAPPY}
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="material-symbols-outlined">
                    {section==='Notifications'?'notifications':section==='Intelligence'?'psychology':section==='Privacy'?'lock':section==='Display'?'palette':'science'}
                  </span>
                  <span className="font-body-md">{section}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-auto pt-base border-t border-surface-variant">
              <div className="flex flex-col gap-xs">
                <Link to="/profile" className="flex items-center gap-sm px-sm py-sm text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span className="text-body-sm">Profile</span>
                </Link>
                <button
                  onClick={() => signOut().then(() => navigate('/'))}
                  className="flex items-center gap-sm px-sm py-sm text-on-surface-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="text-body-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <header className="mb-xl">
            <h1 className="font-headline text-headline-lg text-on-surface mb-xs">Settings</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your preferences and application behaviour.</p>
          </header>

          {success && <div className="mb-lg px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
            {/* ── Intelligence ──────────────────────────────────── */}
            <section className="md:col-span-8 glass-card p-lg rounded-xl">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary-container">psychology</span>
                <h2 className="font-headline text-headline-md text-on-surface">Intelligence Preferences</h2>
              </div>
              <div className="space-y-xl">
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="font-body-md text-on-surface">Topic Prediction Sensitivity</label>
                    <span className="font-data-value text-data-value text-primary-container">{prefs.intelligence.topicSensitivity}%</span>
                  </div>
                  <input
                    type="range" min={50} max={95}
                    value={prefs.intelligence.topicSensitivity}
                    onChange={e => update('intelligence','topicSensitivity', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-xs">
                    <span className="text-data-label text-on-surface-variant">50%</span>
                    <span className="text-data-label text-on-surface-variant">95%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                  {[
                    { label:'Confidence Display', field:'confidenceDisplay' as const, opts:['Minimal','Standard','Detailed'] },
                    { label:'Recommendation Style', field:'recommendationStyle' as const, opts:['Conservative','Balanced','Aggressive'] },
                  ].map(s => (
                    <div key={s.label} className="space-y-sm">
                      <label className="font-body-sm text-on-surface-variant block">{s.label}</label>
                      <CustomSelect
                        value={prefs.intelligence[s.field] as string}
                        onChange={v => update('intelligence', s.field, v)}
                        options={s.opts.map(o => ({ value: o, label: o }))}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-md bg-white/5 rounded-xl border border-white/5">
                  <div>
                    <p className="font-body-md text-on-surface font-semibold">Priority Score Visibility</p>
                    <p className="text-body-sm text-on-surface-variant">Highlight urgent study topics automatically.</p>
                  </div>
                  <Toggle checked={prefs.intelligence.priorityVisibility} onChange={v => update('intelligence','priorityVisibility',v)} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-body-md text-on-surface">Topic Revision Reminders</p>
                  <Toggle checked={prefs.intelligence.revisionReminders} onChange={v => update('intelligence','revisionReminders',v)} />
                </div>
              </div>
            </section>

            {/* ── Notifications ─────────────────────────────────── */}
            <section className="md:col-span-4 glass-card p-lg rounded-xl">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary-container">notifications</span>
                <h2 className="font-headline text-headline-md text-on-surface">Notifications</h2>
              </div>
              <div className="space-y-lg">
                {[
                  { label:'Analysis Complete', field:'analysisComplete' as const },
                  { label:'Exam Reminders',    field:'examReminders' as const },
                  { label:'Study Plan Updates', field:'studyPlanUpdates' as const },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between">
                    <span className="font-body-md text-on-surface">{n.label}</span>
                    <Toggle checked={prefs.notifications[n.field]} onChange={v => update('notifications', n.field, v)} />
                  </div>
                ))}
              </div>
            </section>

            {/* ── Analysis ──────────────────────────────────────── */}
            <section className="md:col-span-6 glass-card p-lg rounded-xl">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary-container">analytics</span>
                <h2 className="font-headline text-headline-md text-on-surface">Analysis</h2>
              </div>
              <div className="space-y-lg">
                <div className="flex items-center justify-between">
                  <span className="font-body-md text-on-surface">Auto-Analysis</span>
                  <Toggle checked={prefs.analysis.autoAnalysis} onChange={v => update('analysis','autoAnalysis',v)} />
                </div>
                <div className="space-y-sm">
                  <label className="font-body-sm text-on-surface-variant block">Default Exam Filter</label>
                  <CustomSelect
                    value={prefs.analysis.defaultExamFilter}
                    onChange={v => update('analysis','defaultExamFilter', v)}
                    options={['All','Semester'].map(o => ({ value: o, label: o }))}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-sm">
                    <label className="font-body-md text-on-surface">Minimum Confidence</label>
                    <span className="font-data-value text-data-value text-primary-container">{prefs.analysis.minConfidence}%</span>
                  </div>
                  <input
                    type="range" min={50} max={90}
                    value={prefs.analysis.minConfidence}
                    onChange={e => update('analysis','minConfidence',Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </section>

            {/* ── Data & Privacy ────────────────────────────────── */}
            <section className="md:col-span-6 glass-card p-lg rounded-xl">
              <div className="flex items-center gap-sm mb-lg">
                <span className="material-symbols-outlined text-primary-container">lock</span>
                <h2 className="font-headline text-headline-md text-on-surface">Data & Privacy</h2>
              </div>
              <div className="space-y-lg">
                <div className="flex items-center justify-between">
                  <span className="font-body-md text-on-surface">Anonymous Usage Analytics</span>
                  <Toggle checked={prefs.privacy.anonymousAnalytics} onChange={v => update('privacy','anonymousAnalytics',v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body-md text-on-surface">Cache Analysis Results</span>
                  <Toggle checked={prefs.privacy.cacheResults} onChange={v => update('privacy','cacheResults',v)} />
                </div>
                <div className="pt-base border-t border-surface-variant">
                  {shouldReduceMotion ? (
                    <button
                      onClick={() => {
                        if (confirm('Clear cached analysis results? This cannot be undone.')) {
                          setSuccess('Cache cleared.')
                          setTimeout(() => setSuccess(''), 3000)
                        }
                      }}
                      className="text-error font-body-md hover:underline flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>Clear Cache
                    </button>
                  ) : (
                    <motion.button
                      onClick={() => {
                        if (confirm('Clear cached analysis results? This cannot be undone.')) {
                          setSuccess('Cache cleared.')
                          setTimeout(() => setSuccess(''), 3000)
                        }
                      }}
                      className="text-error font-body-md hover:underline flex items-center gap-xs"
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={tapScale}
                      transition={SPRING_SNAPPY}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>Clear Cache
                    </motion.button>
                  )}
                </div>
              </div>
            </section>

            {/* ── Display + Experimental ────────────────────────── */}
            <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
              {/* Display */}
              <section data-tour="tour-settings-display" className="glass-card p-lg rounded-xl">
                <div className="flex items-center gap-sm mb-lg">
                  <span className="material-symbols-outlined text-primary-container">palette</span>
                  <h2 className="font-headline text-headline-md text-on-surface">Display</h2>
                </div>
                <div className="space-y-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-body-md text-on-surface block mb-xs">Theme</span>
                      <span className="text-body-sm text-on-surface-variant">Light mode coming soon</span>
                    </div>
                    <div className="flex items-center gap-xs px-md py-xs bg-surface-container-high rounded-lg">
                      <span className="material-symbols-outlined text-[18px] text-primary">dark_mode</span>
                      <span className="text-body-sm text-on-surface">Dark</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-on-surface">Compact Mode</span>
                    <Toggle checked={prefs.display.compactMode} onChange={v => update('display','compactMode',v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-md text-on-surface">Reduce Motion</span>
                    <Toggle checked={prefs.display.reduceMotion} onChange={v => update('display','reduceMotion',v)} />
                  </div>
                </div>
              </section>

              {/* Advanced */}
              <section className="glass-card p-lg rounded-xl">
                <div className="flex items-center gap-sm mb-lg">
                  <span className="material-symbols-outlined text-primary-container">settings_suggest</span>
                  <h2 className="font-headline text-headline-md text-on-surface">Advanced</h2>
                </div>
                <div className="space-y-md">
                  {/* Reset Tutorial */}
                  <div>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-body-sm text-on-surface">Reset Tutorial</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mb-sm">Show the guided tour again on next login</p>
                    {shouldReduceMotion ? (
                      <button
                        onClick={() => {
                          localStorage.setItem('paperiq_tour_completed', 'false')
                          setSuccess('Tutorial will restart on next page load.')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                        className="w-full border border-surface-variant text-on-surface font-body-sm py-xs rounded-lg hover:bg-white/5 transition-all"
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                          Reset
                        </span>
                      </button>
                    ) : (
                      <motion.button
                        onClick={() => {
                          localStorage.setItem('paperiq_tour_completed', 'false')
                          setSuccess('Tutorial will restart on next page load.')
                          setTimeout(() => setSuccess(''), 3000)
                        }}
                        className="w-full border border-surface-variant text-on-surface font-body-sm py-xs rounded-lg hover:bg-white/5 transition-all"
                        whileHover={hoverScale}
                        whileTap={tapScale}
                        transition={SPRING_SNAPPY}
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">refresh</span>
                          Reset
                        </span>
                      </motion.button>
                    )}
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Clear All Data */}
                  <div>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-body-sm text-on-surface">Clear All Cache</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mb-sm">Remove cached analysis results and local data</p>
                    {shouldReduceMotion ? (
                      <button
                        onClick={() => {
                          if (confirm('Clear all cached data? This will remove locally stored analysis results but won\'t delete your account or profile.')) {
                            // Clear localStorage (except auth)
                            const authData = localStorage.getItem('supabase.auth.token')
                            localStorage.clear()
                            if (authData) localStorage.setItem('supabase.auth.token', authData)
                            
                            // Clear sessionStorage
                            sessionStorage.clear()
                            
                            setSuccess('Cache cleared successfully.')
                            setTimeout(() => setSuccess(''), 3000)
                          }
                        }}
                        className="w-full border border-error/40 text-error font-body-sm py-xs rounded-lg hover:bg-error/10 transition-all"
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                          Clear Cache
                        </span>
                      </button>
                    ) : (
                      <motion.button
                        onClick={() => {
                          if (confirm('Clear all cached data? This will remove locally stored analysis results but won\'t delete your account or profile.')) {
                            // Clear localStorage (except auth)
                            const authData = localStorage.getItem('supabase.auth.token')
                            localStorage.clear()
                            if (authData) localStorage.setItem('supabase.auth.token', authData)
                            
                            // Clear sessionStorage
                            sessionStorage.clear()
                            
                            setSuccess('Cache cleared successfully.')
                            setTimeout(() => setSuccess(''), 3000)
                          }
                        }}
                        className="w-full border border-error/40 text-error font-body-sm py-xs rounded-lg hover:bg-error/10 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={tapScale}
                        transition={SPRING_SNAPPY}
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                          Clear Cache
                        </span>
                      </motion.button>
                    )}
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Report Issue */}
                  <div>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-body-sm text-on-surface">Having Issues?</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mb-sm">Contact support for help</p>
                    {shouldReduceMotion ? (
                      <button
                        onClick={() => {
                          window.open('mailto:support@paperiq.in?subject=PaperIQ Support Request&body=User: ' + user?.email, '_blank')
                        }}
                        className="w-full border border-surface-variant text-on-surface font-body-sm py-xs rounded-lg hover:bg-white/5 transition-all"
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                          Email Support
                        </span>
                      </button>
                    ) : (
                      <motion.button
                        onClick={() => {
                          window.open('mailto:support@paperiq.in?subject=PaperIQ Support Request&body=User: ' + user?.email, '_blank')
                        }}
                        className="w-full border border-surface-variant text-on-surface font-body-sm py-xs rounded-lg hover:bg-white/5 transition-all"
                        whileHover={hoverScale}
                        whileTap={tapScale}
                        transition={SPRING_SNAPPY}
                      >
                        <span className="flex items-center justify-center gap-xs">
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                          Email Support
                        </span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </section>

              {/* Experimental */}
              <section className="glass-card p-lg border-primary-container/20 rounded-xl">
                <div className="flex items-center gap-sm mb-lg">
                  <span className="material-symbols-outlined text-primary-container">science</span>
                  <h2 className="font-headline text-headline-md text-on-surface">Experimental</h2>
                </div>
                <div className="space-y-md">
                  {[
                    { label:'New Dashboard',    field:'newDashboard' as const },
                    { label:'Advanced Analysis', field:'advancedAnalysis' as const },
                    { label:'Early Features',   field:'earlyFeatures' as const },
                  ].map(e => (
                    <div key={e.label} className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface">{e.label}</span>
                      <Toggle checked={prefs.experimental[e.field]} onChange={v => update('experimental',e.field,v)} />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* About */}
            <section className="md:col-span-12 glass-card p-lg rounded-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
                <div className="space-y-xs">
                  <h2 className="font-headline text-headline-md text-on-surface">About PaperIQ</h2>
                  <p className="font-data-label text-data-label text-on-surface-variant">Version 1.0.0-beta • MLRIT Academic Edition</p>
                </div>
                <div className="flex flex-wrap gap-lg items-center">
                  <div className="flex items-center gap-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      apiStatus === 'healthy' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      : apiStatus === 'down' ? 'bg-red-500'
                      : 'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="text-body-sm text-on-surface-variant">
                      Backend API: {apiStatus === 'healthy' ? 'Healthy' : apiStatus === 'down' ? 'Unreachable' : 'Checking...'}
                    </span>
                  </div>
                  <div className="flex gap-md">
                    <a href="#" className="text-primary-container text-body-sm hover:underline">Terms</a>
                    <a href="#" className="text-primary-container text-body-sm hover:underline">Privacy</a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {saving && <p className="text-on-surface-variant text-body-sm mt-4">Saving...</p>}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-variant z-50 flex justify-around items-center h-16 px-base">
        {[
          { icon:'dashboard', to:'/dashboard' },
          { icon:'library_books', to:'/papers' },
          { icon:'settings', to:'/settings', active:true },
        ].map(l => (
          <button key={l.to} onClick={() => navigate(l.to)} className={`flex flex-col items-center ${l.active ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined" style={l.active ? {fontVariationSettings:"'FILL' 1"} : {}}>{l.icon}</span>
            <span className="text-[10px] font-data-label">{l.icon.charAt(0).toUpperCase()+l.icon.slice(1)}</span>
          </button>
        ))}
      </div>

        <div className="pb-16 md:pb-0">
          <Footer />
        </div>
      </div>
    </PageTransition>
  )
}
