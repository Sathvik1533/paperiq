/**
 * Footer — shared across all screens.
 * Matches Stitch design exactly.
 */
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-background">
      <div className="max-w-[1200px] mx-auto py-xl px-base md:px-xl flex flex-col md:flex-row justify-between items-center gap-lg">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-headline text-headline-md font-bold text-on-surface">
            Paper<span className="text-primary-container">IQ</span>
          </span>
          <p className="font-data-label text-data-label text-on-surface-variant mt-xs">
            © 2026 PaperIQ. Built for high-achieving scholars.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-lg">
          <a href="#" className="font-data-label text-data-label text-on-surface-variant hover:text-on-surface transition-colors">Academic Integrity</a>
          <a href="#" className="font-data-label text-data-label text-on-surface-variant hover:text-on-surface transition-colors">Terms of Service</a>
          <a href="#" className="font-data-label text-data-label text-on-surface-variant hover:text-on-surface transition-colors">Privacy Policy</a>
          <a href="#" className="font-data-label text-data-label text-on-surface-variant hover:text-on-surface transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  )
}
