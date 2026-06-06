/**
 * OfflinePage — Screen 23
 * Route: /offline (also triggered by service worker when network is unavailable)
 *
 * Matches stitch_html/23_offline.html exactly.
 */
import { useNavigate } from 'react-router-dom'

export function OfflinePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background border-b border-outline-variant h-20 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full px-base md:px-xl flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="font-headline text-headline-md font-bold text-on-surface tracking-tight"
          >
            Paper<span className="text-primary-container">IQ</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-container text-on-primary-container px-base py-sm rounded-xl font-bold text-body-md hover:brightness-110 transition-all"
          >
            Try Again
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 px-base">
        <div className="max-w-[600px] w-full text-center flex flex-col items-center gap-xl">
          {/* Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary-container/10 blur-[80px] rounded-full" />
            <div className="relative w-24 h-24 bg-surface-container border border-outline-variant rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">wifi_off</span>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-base">
            <h1 className="font-headline text-headline-lg text-on-surface">
              Connection Lost
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto">
              PaperIQ needs an internet connection to load your exam intelligence. Check your connection and try again.
            </p>
          </div>

          {/* Status panel */}
          <div className="glass-card rounded-xl p-lg w-full max-w-sm">
            <div className="flex items-center justify-between mb-base">
              <span className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-xs">
                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span className="font-data-label text-data-label text-error uppercase">Offline</span>
              </div>
            </div>
            <div className="space-y-sm">
              {[
                { label: 'Network', status: 'Unavailable', ok: false },
                { label: 'Backend API', status: 'Unreachable', ok: false },
                { label: 'Local Cache', status: 'Available', ok: true },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-xs border-b border-outline-variant last:border-0">
                  <span className="font-data-label text-data-label text-on-surface-variant">{item.label}</span>
                  <span className={`font-data-label text-data-label ${item.ok ? 'text-success' : 'text-error'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-base w-full sm:w-auto">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-container text-on-primary-container font-bold px-xl py-md rounded-xl hover:brightness-110 active:scale-95 transition-all glow-orange flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Retry Connection
            </button>
            <button
              onClick={() => navigate(-1)}
              className="border border-outline-variant text-on-surface font-bold px-xl py-md rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Go Back
            </button>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant opacity-50">
            Your analysis data will reload automatically when the connection is restored.
          </p>
        </div>
      </main>
    </div>
  )
}
