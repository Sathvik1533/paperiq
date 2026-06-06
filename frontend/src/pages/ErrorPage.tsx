/**
 * ErrorPage — Screen 22 (general error)
 * Used as the React Router errorElement AND as a standalone boundary.
 * Matches stitch_html/22_error.html exactly.
 */
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'

export function ErrorPage({ message }: { message?: string }) {
  const navigate = useNavigate()

  // When used as React Router's errorElement, extract error details
  let routeError: any
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    routeError = useRouteError()
  } catch {
    routeError = null
  }

  const errorMessage = message
    ?? (isRouteErrorResponse(routeError)
        ? `${routeError.status}: ${routeError.statusText}`
        : routeError?.message ?? 'An unexpected error occurred.')

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col"
      style={{backgroundImage:'radial-gradient(circle at 2px 2px, rgba(255,182,144,0.05) 1px, transparent 0)', backgroundSize:'32px 32px'}}>
      <nav className="fixed bg-background border-b border-outline-variant z-50 w-full">
        <div className="flex justify-between items-center w-full px-base md:px-xl max-w-[1200px] mx-auto h-20">
          <button onClick={() => navigate('/')} className="font-headline text-headline-md font-bold text-on-surface">
            Paper<span className="text-primary-container">IQ</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-base py-huge pt-24 relative">
        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px]" />

        <div className="relative z-10 w-full max-w-[600px] flex flex-col items-center text-center">
          {/* Warning icon */}
          <div className="mb-xl relative">
            <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-surface-container border border-outline-variant rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-primary-container">warning</span>
            </div>
          </div>

          <h1 className="font-headline text-headline-lg text-on-surface mb-base">Intelligence Sync Interrupted</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-xxl max-w-[480px]">
            {errorMessage}
          </p>

          {/* Error reference */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-md mb-xxl w-full max-w-sm flex items-center justify-between gap-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-body-md">terminal</span>
              <span className="font-data-label text-data-label text-on-surface-variant">REFERENCE_ID:</span>
            </div>
            <span className="font-data-value text-data-value text-primary-container tracking-wider">ERR_SYNC_409_PIQ</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-base w-full sm:w-auto">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto bg-primary-container text-on-primary-container font-headline text-body-md px-huge py-md rounded-[12px] font-bold hover:brightness-110 active:scale-95 transition-all glow-orange flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">refresh</span>Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto border border-outline-variant bg-transparent text-on-surface font-headline text-body-md px-huge py-md rounded-[12px] hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined">dashboard</span>Dashboard
            </button>
          </div>

          <div className="mt-huge flex items-center gap-sm">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-body-sm text-body-sm text-on-secondary-fixed-variant">All other PaperIQ systems are operational.</span>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest py-xxl px-base md:px-xl max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-base">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <span className="font-headline text-headline-md font-bold text-on-surface">PaperIQ</span>
          <p className="font-body-sm text-body-sm text-on-secondary-fixed-variant">© 2026 PaperIQ. Built for high-achieving scholars.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-xl">
          <a href="#" className="font-data-label text-data-label text-on-secondary-fixed-variant hover:text-on-surface transition-colors">Privacy Policy</a>
          <a href="#" className="font-data-label text-data-label text-on-secondary-fixed-variant hover:text-on-surface transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  )
}
