/**
 * prefsStore — global preferences that affect the whole app.
 * Loaded once on login from user_profiles.preferences in Supabase.
 * Changes here instantly reflect everywhere (no page navigation needed).
 *
 * HOW IT WORKS (Zustand):
 * - Zustand is a small state management library. Think of it as a global
 *   variable that React components can subscribe to.
 * - When any component calls setPrefs(), ALL components that read from
 *   this store automatically re-render with the new values.
 * - This is "reactive global state" — the same pattern React Query uses
 *   for server data, but for client-side preferences.
 */
import { create } from 'zustand'

export interface AppPrefs {
  defaultExamFilter: 'all' | 'mid1' | 'mid2' | 'semester'
  autoAnalysis: boolean
  compactMode: boolean
  reduceMotion: boolean
  topicSensitivity: number
  theme: 'dark' | 'light'
  defaultLandingPage: 'dashboard' | 'analysis' | 'papers'
  dashboardView: 'Intelligence' | 'Personal'
  analysisLayout: 'Interactive' | 'Compact'
}

const DEFAULT_PREFS: AppPrefs = {
  defaultExamFilter: 'semester',
  autoAnalysis: true,
  compactMode: false,
  reduceMotion: false,
  topicSensitivity: 70,
  theme: 'dark',
  defaultLandingPage: 'dashboard',
  dashboardView: 'Intelligence',
  analysisLayout: 'Interactive',
}

interface PrefsStore {
  prefs: AppPrefs
  loaded: boolean
  setPrefs: (prefs: Partial<AppPrefs>) => void
  loadFromProfile: (profilePreferences: Record<string, any>) => void
}

export const usePrefsStore = create<PrefsStore>((set) => ({
  prefs: DEFAULT_PREFS,
  loaded: false,

  // Update one or more prefs — triggers re-render in all subscribers
  setPrefs: (updates) =>
    set((state) => ({ prefs: { ...state.prefs, ...updates } })),

  // Called once after login when we fetch the user profile from Supabase.
  // Maps the DB preferences JSON to our typed AppPrefs shape.
  loadFromProfile: (profilePreferences) => {
    const analysis = profilePreferences?.analysis || {}
    const display  = profilePreferences?.display  || {}
    const intel    = profilePreferences?.intelligence || {}
    const navigation = profilePreferences?.navigation || {}

    // Map "Semester" / "Mid-1" / "Mid-2" / "All" → our filter key
    const filterMap: Record<string, AppPrefs['defaultExamFilter']> = {
      'Semester': 'semester',
      'Mid-1':    'mid1',
      'Mid-2':    'mid2',
      'All':      'all',
    }

    // Map "Dashboard" / "Analysis" / "Papers" → our landing page key
    const landingMap: Record<string, AppPrefs['defaultLandingPage']> = {
      'Dashboard': 'dashboard',
      'Analysis':  'analysis',
      'Papers':    'papers',
    }

    set({
      loaded: true,
      prefs: {
        defaultExamFilter: filterMap[analysis.defaultExamFilter] ?? DEFAULT_PREFS.defaultExamFilter,
        autoAnalysis:      analysis.autoAnalysis      ?? DEFAULT_PREFS.autoAnalysis,
        compactMode:       display.compactMode        ?? DEFAULT_PREFS.compactMode,
        reduceMotion:      display.reduceMotion       ?? DEFAULT_PREFS.reduceMotion,
        topicSensitivity:  intel.topicSensitivity     ?? DEFAULT_PREFS.topicSensitivity,
        theme:             display.theme              ?? DEFAULT_PREFS.theme,
        defaultLandingPage: landingMap[navigation.defaultLandingPage] ?? DEFAULT_PREFS.defaultLandingPage,
      },
    })
  },
}))
