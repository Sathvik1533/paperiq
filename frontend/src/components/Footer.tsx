/**
 * Footer — shared across all screens.
 * Matches Stitch design exactly.
 */
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] pt-8 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col items-start">
          <span className="font-headline text-2xl font-bold text-white">
            Paper<span className="text-primary-container">IQ</span>
          </span>
          <p className="text-sm text-neutral-500 tracking-tight mt-1">
            © 2026 PaperIQ. Built for high-achieving scholars.
          </p>
        </div>
        <div className="flex flex-wrap justify-start md:justify-center gap-x-8 gap-y-4">
          <a href="#" className="text-sm text-neutral-500 tracking-tight hover:text-white transition-colors">Academic Integrity</a>
          <a href="#" className="text-sm text-neutral-500 tracking-tight hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="text-sm text-neutral-500 tracking-tight hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="text-sm text-neutral-500 tracking-tight hover:text-white transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  )
}
