import { create } from 'zustand'

interface AppState {
  selectedSubjectId: string | null
  activeFilter: 'all' | 'mid1' | 'mid2' | 'semester'
  setSelectedSubjectId: (id: string | null) => void
  setActiveFilter: (filter: 'all' | 'mid1' | 'mid2' | 'semester') => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedSubjectId: null,
  activeFilter: 'all',
  setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}))
