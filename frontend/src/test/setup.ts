import '@testing-library/jest-dom'

if (typeof window !== 'undefined' && (!window.localStorage || typeof window.localStorage.getItem !== 'function')) {
  const store: Record<string, string> = {}
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value) },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach(k => delete store[k]) },
      length: 0,
      key: (_i: number) => null,
    },
    writable: true,
  })
}
