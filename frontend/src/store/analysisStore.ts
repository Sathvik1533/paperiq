import { create } from 'zustand'
import type { AnalysisReport } from '../types'

interface AnalysisState {
  currentReport: AnalysisReport | null
  loading: boolean
  error: string | null
  regulation: string
  setReport: (report: AnalysisReport) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  setRegulation: (r: string) => void
  clear: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentReport: null,
  loading: false,
  error: null,
  regulation: 'R22',

  setReport: (report) => set({ currentReport: report }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setRegulation: (regulation) => set({ regulation }),
  clear: () => set({ currentReport: null, error: null }),
}))
