/**
 * NotFound — Screen 21
 * Route: * (catch-all)
 */
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function NotFound() {
  const navigate = useNavigate()
  const [ts, setTs] = useState('')

  useEffect(() => {
    const now = new Date()
    setTs(`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`)
  }, [])

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col justify-between overflow-hidden relative">
      {/* Atmospheric blurs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-container/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary-container/5 blur-[100px] rounded-full pointer-events-none" />

      <header className="w-full h-20 flex justify-between items-center px-base md:px-xl max-w-[1200px] mx-auto z-10">
        <button onClick={() => navigate('/')} className="font-headline text-headline-md font-bold text-on-surface">
          Paper<span className="text-primary-container">IQ</span>
        </button>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-base z-10 text-center">
        <div className="max-w-[800px] w-full flex flex-col items-center gap-huge">
          {/* Icon with glow */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary-container/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
            <div className="relative w-64 h-64 flex items-center justify-center">
              <span className="material-symbols-outlined text-[160px] text-on-surface-variant/30">search_off</span>
            </div>
            {/* Floating chips */}
            <div className="absolute -top-4 -right-8 glass-card px-md py-sm rounded-xl animate-bounce">
              <span className="font-data-label text-data-label text-primary">ERR_404_INDEX_MISSING</span>
            </div>
            <div className="absolute bottom-8 -left-12 glass-card px-md py-sm rounded-xl animate-pulse">
              <span className="font-data-label text-data-label text-on-surface-variant">NODE_UNREACHABLE</span>
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <h1 className="font-headline text-display-hero-mobile md:text-headline-lg font-bold text-on-surface tracking-tighter">
              404 — Research Path Not Found
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[600px] mx-auto opacity-80">
              The page you're looking for has been moved or doesn't exist in the current database.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-base items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center px-huge py-md bg-primary-container text-on-primary-container font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all glow-orange"
            >
              <span className="material-symbols-outlined mr-2">dashboard</span>
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center px-xl py-md border border-white/15 hover:bg-white/5 text-on-surface font-medium rounded-xl transition-all"
            >
              Go Back
            </button>
          </div>

          <div className="mt-xl flex gap-xl opacity-30">
            <div className="flex flex-col items-center">
              <span className="font-data-label text-data-label uppercase tracking-widest">Protocol</span>
              <span className="font-data-value text-data-value">TCP/PAPER_IQ</span>
            </div>
            <div className="w-[1px] h-8 bg-outline-variant" />
            <div className="flex flex-col items-center">
              <span className="font-data-label text-data-label uppercase tracking-widest">Timestamp</span>
              <span className="font-data-value text-data-value">{ts}</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-base px-base md:px-xl max-w-[1200px] mx-auto flex justify-between items-center z-10">
        <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">© 2026 PaperIQ. Built for high-achieving scholars.</p>
        <div className="flex gap-lg">
          <span className="font-data-label text-data-label text-outline uppercase">Access Denied</span>
        </div>
      </footer>
    </div>
  )
}
