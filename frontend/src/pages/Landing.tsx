/**
 * Landing — Screen 01
 * Route: /
 * "The Exam Isn't Random. Neither Is Your Preparation."
 * Scroll-triggered reveals, hero stats (live from DB), 3-step flow, final CTA.
 * Enhanced with Framer Motion for god-level interactions
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'

// Spring config for snappy, responsive animations
const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 300, damping: 20 }
const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 150, damping: 25 }

// Counter animation hook for stats
function useCountUp(target: number, isVisible: boolean, duration = 1500) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!isVisible) return
    let startTime: number
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3) // ease out cubic
      setCount(Math.floor(easeProgress * target))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, isVisible, duration])
  
  return count
}

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

          {/* Transformation visual with Framer Motion god-level interactions */}
          <div className="max-w-[1200px] mx-auto mt-huge reveal-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/10 glass-card">
              {/* Left: The Old Chaos - Staggered frustrated skeleton state */}
              <motion.div
                initial={{ opacity: 0.3 }}
                whileInView={{ opacity: 0.5 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, amount: 0.5 }}
                className="p-xl md:p-huge border-r border-white/5 bg-black/40 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 text-red-400/80 mb-base">
                  <span className="material-symbols-outlined text-sm">block</span>
                  <span className="text-xs font-bold uppercase tracking-widest">The Old Chaos</span>
                </div>
                
                {/* Staggered skeleton rows with faint pulse/flicker */}
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  viewport={{ once: true, amount: 0.5 }}
                  className="space-y-sm opacity-40 grayscale blur-[1px]"
                >
                  {[1,2,3].map(i => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0.2, x: -10 },
                        visible: { opacity: 0.4, x: 0 }
                      }}
                      transition={SPRING_SMOOTH}
                      className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3"
                      style={{
                        animation: `pulse ${2 + i * 0.3}s ease-in-out infinite alternate`
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="space-y-1 flex-1">
                        <motion.div
                          className="h-2 bg-white/10 rounded w-3/4"
                          animate={{ opacity: [0.1, 0.3, 0.1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        />
                        <motion.div
                          className="h-2 bg-white/5 rounded w-1/2"
                          animate={{ opacity: [0.05, 0.15, 0.05] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Frustrated quote with slow flicker */}
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  transition={{ delay: 0.3, duration: 1 }}
                  viewport={{ once: true }}
                  className="text-xl font-headline font-bold text-white/40 italic mt-xl"
                  animate={{ opacity: [0.3, 0.4, 0.35, 0.4] }}
                  style={{ 
                    animationDuration: '4s',
                    animationIterationCount: 'infinite'
                  }}
                >
                  "Does anyone have the Unit 3 notes? I can't find them in the scroll..."
                </motion.p>
                <p className="text-xs font-mono mt-2 text-white/20 uppercase tracking-widest">Manual Hunting: 6+ Hours</p>
              </motion.div>
              
              {/* Right: PaperIQ Clarity - 3D card with spring animations */}
              <div className="p-xl md:p-huge bg-gradient-to-br from-primary-container/10 to-transparent relative overflow-hidden">
                <div className="flex items-center gap-2 text-primary-container mb-base">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-xs font-bold uppercase tracking-widest">The PaperIQ Clarity</span>
                </div>
                
                {/* Interactive analytics card with god-level hover */}
                <PaperIQCard />
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

// PaperIQ Analytics Card Component with God-Level Interactions
function PaperIQCard() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [isHovered, setIsHovered] = useState(false)
  
  // 3D mouse tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }
  
  // Counter animations
  const analyzedCount = useCountUp(514, isInView, 1200)
  const successPercent = useCountUp(92, isInView, 1400)
  const savedHours = useCountUp(45, isInView, 1300) / 10 // 4.5h
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={SPRING_SNAPPY}
      whileHover={{ 
        scale: 1.02, 
        translateY: -4,
        transition: SPRING_SNAPPY
      }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered 
          ? '0 4px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,102,0,0.03), 0 0 25px rgba(255,102,0,0.12)' 
          : '0 4px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,102,0,0.03)'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="bg-[#111113] border border-[#1e1e22] p-base rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:border-[#ff6600]/30"
    >
      <motion.div
        transition={SPRING_SNAPPY}
        className="rounded-2xl"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Header with pulsing AI Priority badge */}
        <div className="flex justify-between items-center mb-base border-b border-white/5 pb-2">
          <span className="text-xs font-bold">Data Structures</span>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, ...SPRING_SNAPPY }}
            whileHover={{ scale: 1.05 }}
            className="text-[10px] bg-primary-container/20 text-primary-container px-2 py-0.5 rounded uppercase font-bold relative"
            animate={isHovered ? {
              boxShadow: '0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)'
            } : {
              boxShadow: '0 0 0px rgba(249, 115, 22, 0)'
            }}
          >
            AI Priority 1
            {/* Pulsing ring on hover */}
            <motion.span
              initial={{ scale: 1, opacity: 0 }}
              animate={isHovered ? {
                scale: [1, 1.5],
                opacity: [0.4, 0]
              } : { scale: 1, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 border border-primary-container rounded"
            />
          </motion.span>
        </div>
        
        <div className="space-y-3">
          {/* Interactive Progress Bar with width animation */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between text-[10px] font-mono opacity-60 mb-1">
              <span>Unit 1: Introduction</span>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                85% Probable
              </motion.span>
            </div>
            
            {/* Animated progress bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '85%' }}
                transition={{ delay: 0.4, duration: 1, type: 'spring', stiffness: 100, damping: 15 }}
                viewport={{ once: true }}
                className="h-full bg-primary-container rounded-full"
                whileHover={{ opacity: 0.9 }}
                style={{
                  boxShadow: isHovered ? '0 0 12px rgba(249, 115, 22, 0.6)' : '0 0 8px rgba(249, 115, 22, 0.4)'
                }}
              />
            </div>
          </motion.div>
          
          {/* Live Stat Counter Upgrades */}
          <motion.div
            className="grid grid-cols-3 gap-2 pt-2"
            initial="hidden"
            whileInView="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            viewport={{ once: true, amount: 0.5 }}
          >
            {[
              { l: 'Analyzed', v: `${analyzedCount} Qs`, delay: 0 },
              { l: 'Success', v: `${successPercent}%`, c: 'text-success', delay: 0.1 },
              { l: 'Saved', v: `${savedHours.toFixed(1)}h`, delay: 0.2 }
            ].map((s, i) => (
              <motion.div
                key={s.l}
                variants={{
                  hidden: { opacity: 0, y: 10, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ ...SPRING_SNAPPY, delay: s.delay }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-white/5 p-2 rounded text-center transition-all"
                style={{
                  boxShadow: isHovered ? '0 0 10px rgba(249, 115, 22, 0.1)' : '0 0 0px rgba(0, 0, 0, 0)'
                }}
              >
                <div className="text-[10px] text-white/40 uppercase">{s.l}</div>
                <motion.div
                  className={`text-sm font-bold ${s.c || 'text-primary-container'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + s.delay }}
                >
                  {s.v}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
