/**
 * Landing — Screen 01
 * Route: /
 * "The Exam Isn't Random. Neither Is Your Preparation."
 * Scroll-triggered reveals, hero stats (live from DB), 3-step flow, final CTA.
 * Enhanced with Framer Motion for god-level interactions
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, useMotionValue, useTransform, useScroll } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Footer } from '../components/Footer'
import { ActionButton } from '../components/ui/ActionButton'

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

// Live stats pulled from backend API
function useLiveStats() {
  const [stats, setStats] = useState({ papers: 72, questions: 5730, subjects: 10 })
  useEffect(() => {
    async function fetchStats() {
      try {
        const { getStats } = await import('../lib/api')
        const data = await getStats()
        setStats(data)
      } catch {
        // silently keep defaults
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

  // Scroll spy
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const beamSection = hoveredSection ?? activeSection

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed') }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal-hidden').forEach(el => revealObserver.observe(el))
    setTimeout(() => heroRef.current?.classList.add('revealed'), 100)

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

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleStart = () => navigate(user ? '/dashboard' : '/auth?mode=signup')

  const navLinkClass = (section: string) =>
    `relative text-sm font-medium transition-colors pb-1 ${
      beamSection === section
        ? 'text-primary-container'
        : 'text-on-surface/60 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-[#030303] text-on-surface font-body">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center w-full px-base md:px-xl max-w-[1200px] mx-auto h-20">
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
            <div className="inline-flex items-center gap-sm bg-success/10 text-success border border-success/20 px-4 py-1.5 rounded-full text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              Students save 4-6 hours of manual organisation
            </div>

            <h1 className="font-headline text-4xl md:text-6xl font-bold leading-[1.1] tracking-tighter">
              The Exam Isn't Random.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-white/80">
                Neither Is Your Preparation.
              </span>
            </h1>

            <p className="text-on-surface/60 text-lg md:text-xl max-w-2xl mx-auto font-light">
              Stop scrolling WhatsApp groups for last year's papers. Upload your Hall Ticket. Get personalised insights in 30 seconds.
            </p>

            <div className="flex flex-col items-center gap-base pt-md">
              <ActionButton
                onClick={handleStart}
                className="relative overflow-hidden bg-primary-container text-white px-xl py-4 rounded-2xl font-bold text-lg glow-orange flex items-center gap-2 group transition-transform hover:scale-[1.02]"
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" style={{ willChange: 'transform' }} />
                <span className="relative">Analyse My Subjects</span>
                <span className="relative material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </ActionButton>
              <p className="text-xs font-mono text-on-surface/40 uppercase tracking-widest">
                Upload your hall ticket. Get exam insights in 30 seconds.
              </p>
            </div>

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

          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="max-w-[1200px] mx-auto mt-huge"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-white/5 glass-card shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
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
                
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  viewport={{ once: true, amount: 0.5 }}
                  className="space-y-sm opacity-40 grayscale blur-[1px]"
                >
                  {[1,2,3].map(i => (
                    <motion.div
                      key={i}
                      variants={{ hidden: { opacity: 0.2, x: -10 }, visible: { opacity: 0.4, x: 0 } }}
                      transition={SPRING_SMOOTH}
                      className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-3"
                      style={{ animation: `pulse ${2 + i * 0.3}s ease-in-out infinite alternate` }}
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
                
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 0.4 }}
                  transition={{ delay: 0.3, duration: 1 }}
                  viewport={{ once: true }}
                  className="text-xl font-headline font-bold text-white/40 italic mt-xl"
                  animate={{ opacity: [0.3, 0.4, 0.35, 0.4] }}
                  style={{ animationDuration: '4s', animationIterationCount: 'infinite' }}
                >
                  "Does anyone have the Unit 3 notes? I can't find them in the scroll..."
                </motion.p>
                <p className="text-xs font-mono mt-2 text-white/20 uppercase tracking-widest">Manual Hunting: 6+ Hours</p>
              </motion.div>
              
              <div className="p-xl md:p-huge bg-gradient-to-br from-primary-container/10 to-transparent relative overflow-hidden">
                <div className="flex items-center gap-2 text-primary-container mb-base">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span className="text-xs font-bold uppercase tracking-widest">The PaperIQ Clarity</span>
                </div>
                <PaperIQCard />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── COMPARISON ───────────────────────────────────────── */}
        <section className="py-section px-base relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary-container/5 blur-[120px] rounded-full" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary-container/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            className="max-w-[1200px] mx-auto text-center mb-huge relative"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-base tracking-tight">The Dramatic Shift in Performance</h2>
            <p className="text-on-surface/60 max-w-xl mx-auto font-light">We analysed the time spent by 100+ MLRIT students before and after using PaperIQ.</p>
          </motion.div>

          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl items-center relative">
            <motion.div
              initial={{ opacity: 0, x: -32, scale: 0.96 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              className="space-y-lg text-center md:text-left order-2 md:order-1"
              style={{ willChange: 'transform, opacity' }}
            >
              {[
                {l:'Searching PDFs', v:'6h', sX:0.9},
                {l:'Organising Units', v:'3h', sX:0.6},
                {l:'Guessing Topics', v:'2h', sX:0.4},
              ].map(r => (
                <div key={r.l} className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{r.l}</span>
                  <div className="flex items-center gap-base">
                    <div className="h-2 bg-white/5 rounded-full flex-grow overflow-hidden relative">
                      <div
                        className="h-full rounded-full origin-left"
                        style={{
                          transform: `scaleX(${r.sX})`,
                          background: 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(239,68,68,0.2))',
                          boxShadow: '0 0 8px rgba(239,68,68,0.3)',
                        }}
                      />
                    </div>
                    <span className="font-bold text-white/40 text-sm w-6 shrink-0">{r.v}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
              className="relative flex flex-col items-center justify-center p-xl order-1 md:order-2"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="absolute inset-0 bg-primary-container/20 blur-[80px] -z-10 rounded-full" />
              <div className="absolute inset-[-20%] bg-primary-container/5 blur-[120px] -z-10 rounded-full" />
              <div className="absolute w-48 h-48 rounded-full border border-primary-container/20 animate-ping" style={{animationDuration:'3s'}} />
              <div className="absolute w-36 h-36 rounded-full border border-primary-container/30" />

              <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary-container mb-2">Result Time</span>
              <div
                className="text-8xl md:text-9xl font-headline font-bold text-white leading-none"
                style={{textShadow:'0 0 40px rgba(249,115,22,0.4), 0 0 80px rgba(249,115,22,0.15)'}}
              >
                30<span className="text-primary-container" style={{textShadow:'0 0 30px rgba(249,115,22,0.8)'}}>s</span>
              </div>
              <div className="mt-4 bg-primary-container/10 text-primary-container px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-primary-container/20"
                style={{boxShadow:'0 0 20px rgba(249,115,22,0.1)'}}>
                11 Hours of manual work replaced
              </div>
            </motion.div>

            <div className="space-y-base order-3">
              {[
                {icon:'bolt', label:'Instant Topic Priority', delay: 0},
                {icon:'track_changes', label:'Heatmap Analysis', delay: 0.1},
                {icon:'person', label:'Personalised Study Map', delay: 0.2},
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: 32, scale: 0.96 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: f.delay }}
                  className="group relative p-4 rounded-xl flex items-center gap-4 border border-white/5 hover:border-primary-container/40 bg-white/5 overflow-hidden"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  <div className="relative w-9 h-9 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center shrink-0 group-hover:bg-primary-container/20 transition-colors"
                    style={{boxShadow:'0 0 12px rgba(249,115,22,0.1)'}}>
                    <span className="material-symbols-outlined text-primary-container text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>{f.icon}</span>
                  </div>
                  <span className="relative text-sm font-bold text-white/90">{f.label}</span>
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary-container/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-xl" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THREE STEPS ──────────────────────────────────────── */}
        <ThreeStepsSection />

        {/* ── FINAL CTA / R22 SUPPORT ──────────────────────────── */}
        <motion.section
          id="r22-support"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          className="py-section px-base"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="max-w-[1000px] mx-auto bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 rounded-[40px] p-xl md:p-huge text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-container/5 -z-10" />
            <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight mb-base">Ready to Stop Wasting Time?</h2>
            <p className="text-on-surface/60 text-lg max-w-xl mx-auto mb-xl font-light">
              Join 100+ MLRIT students studying smarter, not harder. Get your personalised analysis in under a minute.
            </p>
            <ActionButton
              onClick={handleStart}
              className="relative overflow-hidden bg-primary-container text-white px-xl py-5 rounded-2xl font-bold text-xl glow-orange transition-transform hover:scale-[1.02] group"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative">Upload Hall Ticket — Get Started</span>
            </ActionButton>
            <p className="text-xs font-mono text-on-surface/30 mt-base uppercase tracking-widest">
              Free to use. No payment required.
            </p>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  )
}

function ThreeStepsSection() {
  const stepsRef = useRef<HTMLElement>(null)
  
  // Track scroll position over the Three Steps section
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ["start center", "center center"]
  })
  
  // God-level Beam scale mapping
  const beamScaleX = useTransform(scrollYProgress, [0, 1], [0, 1])
  
  return (
    <motion.section
      id="how-it-works"
      ref={stepsRef}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      className="py-section px-base max-w-[1200px] mx-auto text-center relative"
    >
      <h2 className="font-headline text-3xl md:text-4xl font-bold mb-base tracking-tight">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
          Three Steps to Exam Clarity
        </span>
      </h2>
      <p className="text-on-surface/60 max-w-2xl mx-auto mb-huge font-light">
        We've automated the most painful part of exam preparation so you can focus on learning.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl md:gap-xl relative">
        {/* Dynamic Glowing Beam Track - DESKTOP (Horizontal) */}
        <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-[2px] bg-white/5 -z-10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-transparent via-[#ff6600]/80 to-[#ff3300]"
            style={{ 
              scaleX: beamScaleX, 
              transformOrigin: 'left', 
              boxShadow: '0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4)',
              willChange: 'transform'
            }}
          />
        </div>

        {/* Dynamic Glowing Beam Track - MOBILE (Vertical) */}
        <div className="md:hidden absolute top-10 bottom-[10%] left-1/2 -translate-x-1/2 w-[2px] bg-white/5 -z-10 rounded-full overflow-hidden">
          <motion.div 
            className="w-full bg-gradient-to-b from-transparent via-[#ff6600]/80 to-[#ff3300]"
            style={{ 
              scaleY: beamScaleX, 
              transformOrigin: 'top', 
              boxShadow: '0 0 20px rgba(249,115,22,0.8), 0 0 40px rgba(249,115,22,0.4)',
              willChange: 'transform'
            }}
          />
        </div>
        
        {[
          { n:'1', title:'Upload Hall Ticket', desc:'Drag and drop your MLRIT hall ticket PDF or image. No manual data entry required.' },
          { n:'2', title:'AI Analyses 10 Years', desc:'Our engine cross-references your current subjects with past question patterns.' },
          { n:'3', title:'Study What Matters', desc:'Receive a heatmap of important units and frequently asked questions.' },
        ].map((s, index) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: index * 0.15 }}
            className="space-y-base group"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Step number with glow ring and spring hover */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={SPRING_SNAPPY}
              className="relative w-20 h-20 mx-auto cursor-default"
            >
              <div className="absolute inset-0 bg-primary-container/10 blur-[20px] rounded-2xl group-hover:bg-primary-container/30 transition-all duration-500" />
              <div className="relative w-20 h-20 bg-[#050507] border border-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary-container group-hover:border-primary-container/50 transition-colors"
                style={{boxShadow:'inset 0 0 20px rgba(249,115,22,0.02)'}}>
                {s.n}
              </div>
            </motion.div>
            <h3 className="font-headline text-xl font-bold">{s.title}</h3>
            <p className="text-sm text-on-surface/60 leading-relaxed font-light">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function PaperIQCard() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5])
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }
  
  const analyzedCount = useCountUp(514, isInView, 1200)
  const successPercent = useCountUp(92, isInView, 1400)
  const savedHours = useCountUp(45, isInView, 1300) / 10
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={SPRING_SNAPPY}
      whileHover={{ scale: 1.02, y: -4, transition: SPRING_SNAPPY }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
        boxShadow: '0 4px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,102,0,0.05)'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-[#0B0B0F] border border-white/5 p-base rounded-2xl cursor-pointer hover:border-primary-container/30 relative overflow-hidden group"
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      <motion.div
        transition={SPRING_SNAPPY}
        className="rounded-2xl relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex justify-between items-center mb-base border-b border-white/5 pb-2">
          <span className="text-xs font-bold text-white/90">Data Structures</span>
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, ...SPRING_SNAPPY }}
            whileHover={{ scale: 1.05 }}
            className="text-[10px] bg-primary-container/10 border border-primary-container/20 text-primary-container px-2 py-0.5 rounded uppercase font-bold relative"
          >
            AI Priority 1
          </motion.span>
        </div>
        
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-between text-[10px] font-mono text-white/60 mb-1">
              <span>Unit 1: Introduction</span>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                85% Probable
              </motion.span>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 0.85 }}
                transition={{ delay: 0.4, duration: 1, type: 'spring', stiffness: 100, damping: 15 }}
                viewport={{ once: true }}
                className="h-full bg-primary-container rounded-full origin-left"
                style={{ boxShadow: '0 0 8px rgba(249, 115, 22, 0.4)', willChange: 'transform' }}
              />
            </div>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-3 gap-2 pt-2"
            initial="hidden"
            whileInView="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
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
                className="bg-white/5 p-2 rounded border border-white/5 text-center"
                style={{ willChange: 'transform, opacity' }}
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
