import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { usePrefsStore } from './prefsStore'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    // Load prefs from Supabase profile on initial session restore
    if (session?.user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', session.user.id)
        .single()
      if (profile?.preferences) {
        usePrefsStore.getState().loadFromProfile(profile.preferences)
      }
    }

    // Store the subscription so we can unsubscribe later (prevents memory leak)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null })

      if (event === 'SIGNED_OUT') {
        window.location.href = '/auth'
        return
      }

      // Load prefs whenever a user signs in
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('preferences')
          .eq('id', session.user.id)
          .single()
        if (profile?.preferences) {
          usePrefsStore.getState().loadFromProfile(profile.preferences)
        }
      }
    })
    // Expose cleanup for StrictMode double-mount scenarios
    ;(window as any).__paperiq_auth_unsub = () => subscription.unsubscribe()
  },

  signInWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
