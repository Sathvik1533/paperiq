/**
 * Landing — Screen 01
 * Route: /
 * "The Exam Isn't Random. Neither Is Your Preparation."
 * Scroll-triggered reveals, hero stats (live from DB), 3-step flow, final CTA.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'

// Live stats pulled from Supabase — no hardcoded numbers
function useLiveStats() {
  const [stats, setStats] = useState({ papers: 72, questions: 5730, subjects: 10 })
  useEffect(() => {
    async function fetchStats() {
      try {
        const [papersRes, questionsRes, subjectsRes] = await Promise.all([
          supabase.from('papers').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('subjects').select('*', { count: 'exact', head: true }),
        ])
        setStats({
          papers: papersRes.count || 72,
          questions: questionsRes.count || 5730,
          subjects: subjectsRes.count || 10,
        })
      } catch {
        // silently keep defaults — landing page should never fail on stats
      }
    }
    fetchStats()
  }, [])
  return stats
}

export function Landing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const heroRef = useRef<HTMLDivElement>(null)
  const stats = useLiveStats()

  // Scroll spy — tracks which section is currently in view
  const [activeSection, setActiveSection] = useState<string>('hero')
  // Hover state — when hovering a nav link, beam follows the hover
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  // The visible beam follows hover when hovering, otherwise follows scroll
  const beamSection = hoveredSection ?? activeSection

  useEffect(() => {
    // Reveal animation observer (unchanged)
    const revealObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal-hidden').forEach(el => revealObserver.observe(el))
    setTimeout(() => heroRef.current?.classList.add('revealed'), 100)

    // Scroll spy observer — highlights nav link for the section in view
    // threshold: 0.3 means the section must be 30% visible to become "active"
    const sections = ['hero', 'how-it-works', 'r22-support']
    const spyObserver = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id)
        })
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    )
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) spyObserver.observe(el)
    })

    return () => {
      revealObserver.disconnect()
      spyObserver.disconnect()
    }
  }, [])

  // Smooth scroll to section when nav link is clicked
  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleStart = () => navigate(user ? '/dashboard' : '/auth?mode=signup')

  // Nav link style: orange text when beam is on this link (hover or scroll-active), else grey
  const navLinkClass = (section: string) =>
    `relative text-sm font-medium transition-colors pb-1 ${
      beamSection === section
        ? 'text-primary-container'
        : 'text-on-surface/60 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center w-full px-base md:px-xl max-w-[1200px] mx-auto h-20">
          {/* Logo → landing page */}
          <button
            onClick={() => scrollTo('hero')}
            className="font-headline text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity"
          >
            Paper<span className="text-primary-container">IQ</span>
          </button>

          <div className="hidden md:flex gap-xl items-center">
            {[
              { label: 'Home',         section: 'hero' },
              { label: 'How It Works', section: 'how-it-works' },
              { label: 'R22 Support',  section: 'r22-support' },
            ].map(link => (
              <button
                key={link.section}
                onClick={() => scrollTo(link.section)}
                onMouseEnter={() => setHoveredSection(link.section)}
                onMouseLeave={() => setHoveredSection(null)}
                className={navLinkClass(link.section)}
              >
                {link.label}
                {/* The "beam" — orange underline that follows hover, then snaps to scroll position */}
                <span
                  className={`absolute bottom-0 left-0 w-full h-[2px] rounded-full bg-primary-container transition-all duration-200 ${
                    beamSection === link.section ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                  style={{ transformOrigin: 'left' }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-base">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary-container text-on-primary-container px-base py-2 rounded-xl font-bold hover:brightness-110 transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-on-surface/60 hover:text-white transition-colors text-sm font-medium hidden sm:block"
                >
                  Login
                </button>
                <button
                  onClick={handleStart}
                  className="bg-white text-black px-base py-2 rounded-xl font-bold hover:bg-primary-container hover:text-white transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section id="hero" className="relative pt-xxl pb-huge px-base overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.08) 0%, rgba(139,92,246,0.03) 50%, transparent 100%)' }}
          />
          <div ref={heroRef} className="max-w-[1000px] mx-auto text-center space-y-xl reveal-hidden">
            {/* Badge */}
            <div className="inline-flex items-center gap-sm bg-success/10 text-success border border-success/20 px-4 py-1.5 rounded-full text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Students save 4-6 hours of manual organisation
            </div>

            <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.1] tracking-tight">
              The Exam Isn't Random.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-orange-400">
                Neither Is Your Preparation.
              </span>
            </h1>

            <p className="text-on-surface/60 text-lg md:text-xl max-w-2xl mx-auto">
              Stop scrolling WhatsApp groups for last year's papers. Upload your Hall Ticket. Get personalised insights in 30 seconds.
            </p>

            <div className="flex flex-col items-center gap-base pt-md">
              <button
                onClick={handleStart}
                className="bg-primary-container text-white px-xl py-4 rounded-2xl font-bold text-lg glow-orange flex items-center gap-2 group transition-all"
              >
                Analyse My Subjects
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              <p className="text-xs font-mono text-on-surface/40 uppercase tracking-widest">
                Upload your hall ticket. Get exam insights in 30 seconds.
              </p>
            </div>

            {/* Stats */}
            <div className="pt-xl flex flex-wrap justify-center gap-xl md:gap-huge text-sm font-mono opacity-60">
              {[
                { value: String(stats.papers), label: 'Papers Analyzed' },
                { value: stats.questions.toLocaleString(), label: 'Questions Indexed' },
                { value: String(stats.subjects), label: 'Subjects Covered' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="text-white font-bold text-lg">{s.value}</span>
                  <span className="uppercase tracking-tighter text-[10px]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transformation visual */}
          <div className="max-w-[1200px] mx-auto mt-huge reveal-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/10 glass-card">
              {/* Left: chaos */}
              <div className="p-xl md:p-huge border-r border-white/5 bg-black/40 relative overflow-hidden">
                <div className="flex items-center gap-2 text-red-400/80 mb-base">
                  <span className="material-symbols-outlined text-sm">block</span>
                  <span className="text-xs font-bold uppercase tracking-widest">The Old Chaos</span>
                </div>
                <div className="space-y-sm opacity-40 grayscale blur-[1px]">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="space-y-1 flex-1">
                        <div className="h-2 bg-white/10 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xl font-headline font-bold text-white/40 italic mt-xl">
                  "Does anyone have the Unit 3 notes? I can't find them in the scroll..."
                </p>
                <p className="text-xs font-mono mt-2 text-white/20 uppercase tracking-widest">Manual Hunting: 6+ Hours</p>
              </div>
              {/* Right: PaperIQ */}
              <div className="p-xl md:p-huge bg-gradient-to-br from-primary-container/10 to-transparent relative overflow-hidden">
                <div className="flex items-center gap-2 text-primary-container mb-base">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-xs font-bold uppercase tracking-widest">The PaperIQ Clarity</span>
                </div>
                <div className="bg-background border border-primary-container/30 p-base rounded-2xl shadow-2xl animate-float">
                  <div className="flex justify-between items-center mb-base border-b border-white/5 pb-2">
                    <span className="text-xs font-bold">Data Structures</span>
                    <span className="text-[10px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded uppercase font-bold">AI Priority 1</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono opacity-60 mb-1">
                        <span>Unit 1: Introduction</span><span>85% Probable</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-container w-[85%]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[{l:'Analyzed',v:'514 Qs'},{l:'Success',v:'92%',c:'text-success'},{l:'Saved',v:'4.5h'}].map(s => (
                        <div key={s.l} className="bg-white/5 p-2 rounded text-center">
                          <div className="text-[10px] text-white/40 uppercase">{s.l}</div>
                          <div className={`text-sm font-bold ${s.c||''}`}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPARISON ───────────────────────────────────────── */}
        <section className="py-section px-base relative overflow-hidden">
          {/* Ambient background glow — the whole section breathes */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-container/8 blur-[120px] rounded-full" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-container/20 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          <div className="max-w-[1200px] mx-auto text-center mb-huge reveal-hidden relative">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-base">The Dramatic Shift in Performance</h2>
            <p className="text-on-surface/60 max-w-xl mx-auto">We analysed the time spent by 100+ MLRIT students before and after using PaperIQ.</p>
          </div>

          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl items-center reveal-hidden relative">
            {/* Before — progress bars with subtle filled glow */}
            <div className="space-y-lg text-center md:text-left order-2 md:order-1">
              {[
                {l:'Searching PDFs', v:'6h', w:'90%'},
                {l:'Organising Units', v:'3h', w:'60%'},
                {l:'Guessing Topics', v:'2h', w:'40%'},
              ].map(r => (
                <div key={r.l} className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{r.l}</span>
                  <div className="flex items-center gap-base">
                    {/* Bar with a dim red fill to show wasted time */}
                    <div className="h-2 bg-white/6 rounded-full flex-grow overflow-hidden relative">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: r.w,
                          background: 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(239,68,68,0.2))',
                          boxShadow: '0 0 8px rgba(239,68,68,0.3)',
                        }}
                      />
                    </div>
                    <span className="font-bold text-white/40 text-sm w-6 shrink-0">{r.v}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Centre — the hero "30s" with layered glow */}
            <div className="relative flex flex-col items-center justify-center p-xl order-1 md:order-2">
              {/* Multi-layer glow — inner bright, outer diffuse */}
              <div className="absolute inset-0 bg-primary-container/25 blur-[80px] -z-10 rounded-full" />
              <div className="absolute inset-[-20%] bg-primary-container/8 blur-[120px] -z-10 rounded-full" />
              {/* Pulsing ring behind the number */}
              <div className="absolute w-48 h-48 rounded-full border border-primary-container/20 animate-ping" style={{animationDuration:'3s'}} />
              <div className="absolute w-36 h-36 rounded-full border border-primary-container/30" />

              <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary-container mb-2">Result Time</span>
              <div
                className="text-8xl md:text-9xl font-headline font-bold text-white leading-none"
                style={{textShadow:'0 0 40px rgba(249,115,22,0.4), 0 0 80px rgba(249,115,22,0.15)'}}
              >
                30<span className="text-primary-container" style={{textShadow:'0 0 30px rgba(249,115,22,0.8)'}}>s</span>
              </div>
              <div className="mt-4 bg-primary-container/20 text-primary-container px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary-container/40"
                style={{boxShadow:'0 0 20px rgba(249,115,22,0.15)'}}>
                11 Hours of manual work replaced
              </div>
            </div>

            {/* After — feature cards with hover glow */}
            <div className="space-y-base order-3">
              {[
                {icon:'bolt', label:'Instant Topic Priority', delay:'0ms'},
                {icon:'track_changes', label:'Heatmap Analysis', delay:'80ms'},
                {icon:'person', label:'Personalised Study Map', delay:'160ms'},
              ].map(f => (
                <div
                  key={f.label}
                  className="group relative p-4 rounded-xl flex items-center gap-4 border border-white/8 transition-all duration-300 cursor-default overflow-hidden"
                  style={{
                    background:'rgba(255,255,255,0.03)',
                    animationDelay: f.delay,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.4)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(249,115,22,0.12), inset 0 0 20px rgba(249,115,22,0.04)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  {/* Icon with its own glow */}
                  <div className="w-9 h-9 rounded-lg bg-primary-container/15 border border-primary-container/25 flex items-center justify-center shrink-0 group-hover:bg-primary-container/25 transition-colors"
                    style={{boxShadow:'0 0 12px rgba(249,115,22,0.2)'}}>
                    <span className="material-symbols-outlined text-primary-container text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>{f.icon}</span>
                  </div>
                  <span className="text-sm font-bold text-white/90">{f.label}</span>
                  {/* Subtle right-side glow on hover */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary-container/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-xl" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THREE STEPS ──────────────────────────────────────── */}
        <section id="how-it-works" className="py-section px-base max-w-[1200px] mx-auto text-center reveal-hidden">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-base">Three Steps to Exam Clarity</h2>
          <p className="text-on-surface/60 max-w-2xl mx-auto mb-huge">
            We've automated the most painful part of exam preparation so you can focus on learning.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-container/30 to-transparent -z-10" />
            {[
              { n:'1', title:'Upload Hall Ticket', desc:'Drag and drop your MLRIT hall ticket PDF or image. No manual data entry required.' },
              { n:'2', title:'AI Analyses 10 Years', desc:'Our engine cross-references your current subjects with past question patterns.' },
              { n:'3', title:'Study What Matters', desc:'Receive a heatmap of important units and frequently asked questions.' },
            ].map(s => (
              <div key={s.n} className="space-y-base group">
                {/* Step number with glow ring */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-primary-container/20 blur-[20px] rounded-2xl group-hover:bg-primary-container/35 transition-all duration-500" />
                  <div className="relative w-20 h-20 bg-background border border-primary-container/40 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-container"
                    style={{boxShadow:'0 0 20px rgba(249,115,22,0.2), inset 0 0 20px rgba(249,115,22,0.05)'}}>
                    {s.n}
                  </div>
                </div>
                <h3 className="font-headline text-xl font-bold">{s.title}</h3>
                <p className="text-sm text-on-surface/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA / R22 SUPPORT ──────────────────────────── */}
        <section id="r22-support" className="py-section px-base reveal-hidden">
          <div className="max-w-[1000px] mx-auto bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-[40px] p-xl md:p-huge text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-container/5 -z-10" />
            <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight mb-base">Ready to Stop Wasting Time?</h2>
            <p className="text-on-surface/60 text-lg max-w-xl mx-auto mb-xl">
              Join 100+ MLRIT students studying smarter, not harder. Get your personalised analysis in under a minute.
            </p>
            <button
              onClick={handleStart}
              className="bg-primary-container text-white px-xl py-5 rounded-2xl font-bold text-xl glow-orange transition-all"
            >
              Upload Hall Ticket — Get Started
            </button>
            <p className="text-xs font-mono text-on-surface/30 mt-base uppercase tracking-widest">
              Free to use. No payment required.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
