/**
 * About Page - Developer Story
 * Honest, student-built product. No fake metrics.
 * Route: /about
 */

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { PageTransition } from '../components/ui/PageTransition'
import sathvikAvatar from '../assets/avatar-sathvik.jpg'

const SPRING_SNAPPY = { type: 'spring', stiffness: 300, damping: 20 } as const

export function About() {
  const shouldReduceMotion = useReducedMotion()

  const techStack = [
    { icon: 'code', label: 'React 18 + TS' },
    { icon: 'bolt', label: 'Tailwind + Vite' },
    { icon: 'terminal', label: 'Python FastAPI' },
    { icon: 'database', label: 'Supabase + PG' },
    { icon: 'psychology', label: 'Gemini AI' },
  ]

  const asideItems = [
    'avatar',
    'devinfo',
    'techstack',
    'quote',
  ]

  const cardSections = [
    {
      index: 0,
      id: 'origin',
    },
    {
      index: 1,
      id: 'whatitis',
    },
    {
      index: 2,
      id: 'howbuilt',
    },
    {
      index: 3,
      id: 'social',
    },
  ]

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050507] text-on-background">
        <NavBar activeTab="about" />

        <main className="max-w-[1400px] mx-auto px-6 md:px-12 pt-32 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-8">

            {/* LEFT COLUMN: Profile */}
            <aside className="lg:sticky lg:top-32 h-fit flex flex-col gap-8">

              {/* Avatar */}
              {shouldReduceMotion ? (
                <div className="relative w-60 group cursor-pointer">
                  <div className="w-60 h-60 rounded-full overflow-hidden border-[3px] border-[#1e1e24] transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_32px_rgba(249,115,22,0.4)] hover:border-[#ff6600]/50 bg-surface-container will-change-transform transform-gpu">
                    <img
                      src={sathvikAvatar}
                      alt="Sathvik - PaperIQ Developer"
                      width="240"
                      height="240"
                      loading="eager"
                      className="w-60 h-60 object-cover grayscale brightness-75 contrast-125 transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform transform-gpu"
                    />
                  </div>
                </div>
              ) : (
                <motion.div
                  className="relative w-60 group cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0 }}
                  whileHover={{ scale: 1.04 }}
                >
                  <div className="w-60 h-60 rounded-full overflow-hidden border-[3px] border-[#1e1e24] transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_32px_rgba(249,115,22,0.4)] hover:border-[#ff6600]/50 bg-surface-container will-change-transform transform-gpu">
                    <img
                      src={sathvikAvatar}
                      alt="Sathvik - PaperIQ Developer"
                      width="240"
                      height="240"
                      loading="eager"
                      className="w-60 h-60 object-cover grayscale brightness-75 contrast-125 transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform transform-gpu"
                    />
                  </div>
                </motion.div>
              )}

              {/* Developer Info */}
              {shouldReduceMotion ? (
                <div className="space-y-2">
                  <h1 className="text-white font-headline text-headline-lg font-bold tracking-tight">
                    Sathvik
                  </h1>
                  <p className="text-neutral-400 font-body-md font-medium tracking-wide">
                    2nd Year CSE Student · MLRIT
                  </p>
                </div>
              ) : (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.07 }}
                >
                  <h1 className="text-white font-headline text-headline-lg font-bold tracking-tight">
                    Sathvik
                  </h1>
                  <p className="text-neutral-400 font-body-md font-medium tracking-wide">
                    2nd Year CSE Student · MLRIT
                  </p>
                </motion.div>
              )}

              {/* Tech Stack Chips */}
              {shouldReduceMotion ? (
                <div className="flex flex-wrap gap-3">
                  {techStack.map((tech) => (
                    <div
                      key={tech.label}
                      className="flex items-center gap-2 px-3 py-2 bg-[#121214] border border-[#1e1e24] rounded-lg cursor-default transition-all hover:-translate-y-0.5 hover:border-[#ff6600]/40"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">{tech.icon}</span>
                      <span className="text-xs font-mono text-on-surface">{tech.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="flex flex-wrap gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.14 }}
                >
                  {techStack.map((tech) => (
                    <motion.div
                      key={tech.label}
                      className="flex items-center gap-2 px-3 py-2 bg-[#121214] border border-[#1e1e24] rounded-lg cursor-default"
                      whileHover={{ scale: 1.03, translateY: -2, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING_SNAPPY}
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">{tech.icon}</span>
                      <span className="text-xs font-mono text-on-surface">{tech.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Quote */}
              {shouldReduceMotion ? (
                <div className="pt-6 border-t border-outline-variant">
                  <p className="text-neutral-400 text-sm italic leading-relaxed">
                    "I built this because I was frustrated. Every student at MLRIT has the same problem — past papers are scattered, hard to find, and impossible to analyse. So I fixed it."
                  </p>
                </div>
              ) : (
                <motion.div
                  className="pt-6 border-t border-outline-variant"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.21 }}
                >
                  <p className="text-neutral-400 text-sm italic leading-relaxed">
                    "I built this because I was frustrated. Every student at MLRIT has the same problem — past papers are scattered, hard to find, and impossible to analyse. So I fixed it."
                  </p>
                </motion.div>
              )}
            </aside>

            {/* RIGHT COLUMN: Content */}
            <div className="flex flex-col gap-6">

              {/* Origin Story Card */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <div className="space-y-4">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">
                      Origin Story
                    </span>
                    <h2 className="text-white font-headline text-headline-md">Why I Built This</h2>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      I'm a 2nd year CSE student at MLRIT. Before every exam, I'd spend hours hunting for past papers
                      across college portals, WhatsApp groups, and random drives. Half the time the files were corrupt,
                      missing, or in some RAR archive nobody knew how to open.
                    </p>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      I thought — there has to be a better way. So I scraped the college website, extracted every paper,
                      parsed the questions, and built an analysis engine on top of it. PaperIQ is the result: one place
                      to find, read, download, and understand what actually comes in your exams.
                    </p>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      This is a student project. Not a startup, not a company. Just a tool I needed, built properly,
                      and shared with everyone who has the same problem.
                    </p>
                  </div>
                </section>
              ) : (
                <motion.section
                  className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0 * 0.05 }}
                >
                  <div className="space-y-4">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">
                      Origin Story
                    </span>
                    <h2 className="text-white font-headline text-headline-md">Why I Built This</h2>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      I'm a 2nd year CSE student at MLRIT. Before every exam, I'd spend hours hunting for past papers
                      across college portals, WhatsApp groups, and random drives. Half the time the files were corrupt,
                      missing, or in some RAR archive nobody knew how to open.
                    </p>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      I thought — there has to be a better way. So I scraped the college website, extracted every paper,
                      parsed the questions, and built an analysis engine on top of it. PaperIQ is the result: one place
                      to find, read, download, and understand what actually comes in your exams.
                    </p>
                    <p className="text-[#9ca3af] text-lg leading-[1.7]">
                      This is a student project. Not a startup, not a company. Just a tool I needed, built properly,
                      and shared with everyone who has the same problem.
                    </p>
                  </div>
                </motion.section>
              )}

              {/* What it actually is */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <div className="mb-6">
                    <h2 className="text-white font-headline text-headline-md">What PaperIQ Actually Is</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      No hype. Just what it does.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: 'search', title: '80+ Papers Scraped', desc: 'All MLRIT R22 CSE semester papers, extracted from the college website and parsed into individual questions.' },
                      { icon: 'analytics', title: 'Topic Frequency Analysis', desc: 'Find which topics appear most in past papers so you know exactly where to focus before an exam.' },
                      { icon: 'download', title: 'One-Click Downloads', desc: 'Get a clean PDF of any paper instantly. No RAR files, no broken links, no WhatsApp group digging.' },
                      { icon: 'school', title: 'R22 Regulation Only (for now)', desc: 'Started with what I needed — 2nd year CSE. More regulations and branches coming as I build.' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-4 p-4 bg-[#0d0d0f] rounded-xl border border-[#1e1e22]">
                        <span className="material-symbols-outlined text-[22px] text-primary-container mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        <div>
                          <p className="text-white font-medium text-sm">{item.title}</p>
                          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <motion.section
                  className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 1 * 0.05 }}
                >
                  <div className="mb-6">
                    <h2 className="text-white font-headline text-headline-md">What PaperIQ Actually Is</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      No hype. Just what it does.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: 'search', title: '80+ Papers Scraped', desc: 'All MLRIT R22 CSE semester papers, extracted from the college website and parsed into individual questions.' },
                      { icon: 'analytics', title: 'Topic Frequency Analysis', desc: 'Find which topics appear most in past papers so you know exactly where to focus before an exam.' },
                      { icon: 'download', title: 'One-Click Downloads', desc: 'Get a clean PDF of any paper instantly. No RAR files, no broken links, no WhatsApp group digging.' },
                      { icon: 'school', title: 'R22 Regulation Only (for now)', desc: 'Started with what I needed — 2nd year CSE. More regulations and branches coming as I build.' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-4 p-4 bg-[#0d0d0f] rounded-xl border border-[#1e1e22]">
                        <span className="material-symbols-outlined text-[22px] text-primary-container mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        <div>
                          <p className="text-white font-medium text-sm">{item.title}</p>
                          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Architecture Decisions ────────────────── */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <div className="mb-6">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">Engineering</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">Under the Hood</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      Not just features — architecture decisions that make PaperIQ reliable.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: 'sync_alt',
                        title: 'Multi-Provider AI Fallback',
                        desc: 'If Gemini fails, the system automatically falls back to alternative providers. Zero downtime for students.',
                        tag: 'Resilience'
                      },
                      {
                        icon: 'shield',
                        title: 'Row-Level Security',
                        desc: 'Every database query is scoped to the authenticated user via Supabase RLS. Your data is yours alone.',
                        tag: 'Security'
                      },
                      {
                        icon: 'cached',
                        title: 'Intelligent Caching',
                        desc: 'React Query caches API responses for 5 minutes, reducing network traffic by 70%. Instant page switches.',
                        tag: 'Performance'
                      },
                      {
                        icon: 'unarchive',
                        title: 'RAR → DOCX Extraction',
                        desc: 'College papers come in .rar archives. Our backend extracts the original .docx files automatically — no manual work.',
                        tag: 'Pipeline'
                      },
                      {
                        icon: 'route',
                        title: 'Regulation-Aware Routing',
                        desc: 'The entire data model is scoped by regulation (R22, R18). Adding new regulations is a config change, not a rewrite.',
                        tag: 'Architecture'
                      },
                      {
                        icon: 'psychology',
                        title: 'Structured AI Prompting',
                        desc: 'Questions are parsed into structured JSON schemas — not free-text. This makes analysis deterministic and reliable.',
                        tag: 'AI Engine'
                      },
                    ].map((item) => (
                      <div key={item.title} className="relative flex items-start gap-4 p-4 bg-[#0d0d0f] rounded-xl border border-[#1e1e22] group hover:border-[#ff6600]/20 transition-all">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm">{item.title}</p>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-[#ff6600]/60 bg-[#ff6600]/8 px-1.5 py-0.5 rounded">{item.tag}</span>
                          </div>
                          <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <motion.section
                  className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.1 }}
                >
                  <div className="mb-6">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">Engineering</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">Under the Hood</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      Not just features — architecture decisions that make PaperIQ reliable.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: 'sync_alt',
                        title: 'Multi-Provider AI Fallback',
                        desc: 'If Gemini fails, the system automatically falls back to alternative providers. Zero downtime for students.',
                        tag: 'Resilience'
                      },
                      {
                        icon: 'shield',
                        title: 'Row-Level Security',
                        desc: 'Every database query is scoped to the authenticated user via Supabase RLS. Your data is yours alone.',
                        tag: 'Security'
                      },
                      {
                        icon: 'cached',
                        title: 'Intelligent Caching',
                        desc: 'React Query caches API responses for 5 minutes, reducing network traffic by 70%. Instant page switches.',
                        tag: 'Performance'
                      },
                      {
                        icon: 'unarchive',
                        title: 'RAR → DOCX Extraction',
                        desc: 'College papers come in .rar archives. Our backend extracts the original .docx files automatically — no manual work.',
                        tag: 'Pipeline'
                      },
                      {
                        icon: 'route',
                        title: 'Regulation-Aware Routing',
                        desc: 'The entire data model is scoped by regulation (R22, R18). Adding new regulations is a config change, not a rewrite.',
                        tag: 'Architecture'
                      },
                      {
                        icon: 'psychology',
                        title: 'Structured AI Prompting',
                        desc: 'Questions are parsed into structured JSON schemas — not free-text. This makes analysis deterministic and reliable.',
                        tag: 'AI Engine'
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.title}
                        className="relative flex items-start gap-4 p-4 bg-[#0d0d0f] rounded-xl border border-[#1e1e22] group"
                        whileHover={{ scale: 1.02, borderColor: 'rgba(255,102,0,0.2)', boxShadow: '0 0 15px rgba(255,102,0,0.08)' }}
                        transition={SPRING_SNAPPY}
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm">{item.title}</p>
                            <span className="text-[9px] font-mono uppercase tracking-wider text-[#ff6600]/60 bg-[#ff6600]/8 px-1.5 py-0.5 rounded">{item.tag}</span>
                          </div>
                          <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── Data Pipeline Visualization ────────────────── */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <div className="mb-6">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">Pipeline</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">How Your Data Flows</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      From college website → to your personalised study plan. Every step automated.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
                    {[
                      { icon: 'language', label: 'College Website', sub: 'Scraping' },
                      { icon: 'unarchive', label: 'RAR Extraction', sub: 'Parsing' },
                      { icon: 'format_list_bulleted', label: 'Question Index', sub: 'Structuring' },
                      { icon: 'psychology', label: 'AI Analysis', sub: 'Intelligence' },
                      { icon: 'speed', label: 'Readiness Score', sub: 'Output' },
                    ].map((step, i, arr) => (
                      <div key={step.label} className="flex items-center gap-3 md:gap-0 w-full md:w-auto">
                        <div className="flex-1 md:flex-none w-full md:w-[140px] p-3 bg-[#0d0d0f] border border-[#1e1e22] rounded-xl text-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                          </div>
                          <p className="text-white text-xs font-medium">{step.label}</p>
                          <p className="text-on-surface-variant text-[10px] font-mono mt-0.5">{step.sub}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <span className="material-symbols-outlined text-[#ff6600]/40 text-sm hidden md:block mx-1">arrow_forward</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <motion.section
                  className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.15 }}
                >
                  <div className="mb-6">
                    <span className="text-[#ff6600] text-xs font-mono tracking-[0.2em] uppercase">Pipeline</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">How Your Data Flows</h2>
                    <p className="text-on-surface-variant text-sm mt-1">
                      From college website → to your personalised study plan. Every step automated.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
                    {[
                      { icon: 'language', label: 'College Website', sub: 'Scraping' },
                      { icon: 'unarchive', label: 'RAR Extraction', sub: 'Parsing' },
                      { icon: 'format_list_bulleted', label: 'Question Index', sub: 'Structuring' },
                      { icon: 'psychology', label: 'AI Analysis', sub: 'Intelligence' },
                      { icon: 'speed', label: 'Readiness Score', sub: 'Output' },
                    ].map((step, i, arr) => (
                      <div key={step.label} className="flex items-center gap-3 md:gap-0 w-full md:w-auto">
                        <motion.div
                          className="flex-1 md:flex-none w-full md:w-[140px] p-3 bg-[#0d0d0f] border border-[#1e1e22] rounded-xl text-center"
                          whileHover={{ scale: 1.06, y: -4, borderColor: 'rgba(255,102,0,0.3)' }}
                          transition={SPRING_SNAPPY}
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                          </div>
                          <p className="text-white text-xs font-medium">{step.label}</p>
                          <p className="text-on-surface-variant text-[10px] font-mono mt-0.5">{step.sub}</p>
                        </motion.div>
                        {i < arr.length - 1 && (
                          <motion.span
                            className="material-symbols-outlined text-[#ff6600]/40 text-sm hidden md:block mx-1"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          >
                            arrow_forward
                          </motion.span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── What's Next Teaser ────────────────── */}
              {shouldReduceMotion ? (
                <section className="relative bg-gradient-to-br from-[#111113] to-[#0d0d18] border border-[#1e1e22] p-6 md:p-10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)] hover:border-[#8b5cf6]/30 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 to-[#ff6600]/5 pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-[#8b5cf6] text-xs font-mono tracking-[0.2em] uppercase">Roadmap</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">What's Coming Next</h2>
                    <p className="text-on-surface-variant text-sm mt-2 mb-6 max-w-lg">
                      PaperIQ is just getting started. We're building from <span className="text-white font-medium">Exam Intelligence</span> → <span className="text-[#8b5cf6] font-medium">Exam Mentor</span> → <span className="text-blue-400 font-medium">Academic Operating System</span>.
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {[
                        { label: 'AI Exam Mentor', icon: 'school' },
                        { label: 'Mock Generator', icon: 'edit_note' },
                        { label: 'CGPA Engine', icon: 'calculate' },
                        { label: 'Viva Trainer', icon: 'mic' },
                        { label: 'Smart Revision', icon: 'auto_fix_high' },
                      ].map((f) => (
                        <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-[#8b5cf6]/8 border border-[#8b5cf6]/15 rounded-lg">
                          <span className="material-symbols-outlined text-[14px] text-[#8b5cf6]">{f.icon}</span>
                          <span className="text-[11px] font-medium text-[#8b5cf6]/80">{f.label}</span>
                        </div>
                      ))}
                    </div>
                    <a
                      href="/vision"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 rounded-xl text-[#8b5cf6] font-medium text-sm hover:bg-[#8b5cf6]/25 transition-all"
                    >
                      See the Full Roadmap
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </a>
                  </div>
                </section>
              ) : (
                <motion.section
                  className="relative bg-gradient-to-br from-[#111113] to-[#0d0d18] border border-[#1e1e22] p-6 md:p-10 rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 0.2 }}
                  whileHover={{ borderColor: 'rgba(139,92,246,0.3)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6]/5 to-[#ff6600]/5 pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-[#8b5cf6] text-xs font-mono tracking-[0.2em] uppercase">Roadmap</span>
                    <h2 className="text-white font-headline text-headline-md mt-1">What's Coming Next</h2>
                    <p className="text-on-surface-variant text-sm mt-2 mb-6 max-w-lg">
                      PaperIQ is just getting started. We're building from <span className="text-white font-medium">Exam Intelligence</span> → <span className="text-[#8b5cf6] font-medium">Exam Mentor</span> → <span className="text-blue-400 font-medium">Academic Operating System</span>.
                    </p>
                    <motion.div
                      className="flex flex-wrap gap-3 mb-6"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={{
                        visible: { transition: { staggerChildren: 0.06 } }
                      }}
                    >
                      {[
                        { label: 'AI Exam Mentor', icon: 'school' },
                        { label: 'Mock Generator', icon: 'edit_note' },
                        { label: 'CGPA Engine', icon: 'calculate' },
                        { label: 'Viva Trainer', icon: 'mic' },
                        { label: 'Smart Revision', icon: 'auto_fix_high' },
                      ].map((f) => (
                        <motion.div
                          key={f.label}
                          className="flex items-center gap-2 px-3 py-2 bg-[#8b5cf6]/8 border border-[#8b5cf6]/15 rounded-lg cursor-default"
                          variants={{
                            hidden: { opacity: 0, scale: 0.9, y: 8 },
                            visible: { opacity: 1, scale: 1, y: 0 }
                          }}
                          transition={SPRING_SNAPPY}
                          whileHover={{ scale: 1.05, borderColor: 'rgba(139,92,246,0.4)', boxShadow: '0 0 15px rgba(139,92,246,0.15)' }}
                        >
                          <span className="material-symbols-outlined text-[14px] text-[#8b5cf6]">{f.icon}</span>
                          <span className="text-[11px] font-medium text-[#8b5cf6]/80">{f.label}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.a
                      href="/vision"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 rounded-xl text-[#8b5cf6] font-medium text-sm"
                      whileHover={{ scale: 1.03, backgroundColor: 'rgba(139,92,246,0.25)', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={SPRING_SNAPPY}
                    >
                      See the Full Roadmap
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </motion.a>
                  </div>
                </motion.section>
              )}

              {/* Technical stack */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <h2 className="text-white font-headline text-headline-md mb-2">Tech That Works</h2>
                  <p className="text-on-surface-variant text-sm mb-8">Not just buzzwords. This stack is what makes your preferences instantly update, your analyses run in seconds, and your data stay secure. It's all live and connected.</p>
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 h-fit md:h-[300px]">
                    <svg className="absolute top-1/2 left-0 w-full h-0.5 hidden md:block -translate-y-1/2 z-0" style={{ overflow: 'visible' }}>
                      <line x1="15%" y1="0" x2="85%" y2="0" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="2" strokeDasharray="8 4" />
                    </svg>
                    {[
                      { icon: 'layers', title: 'Frontend', tech: 'React · Tailwind · Vite' },
                      { icon: 'settings_input_component', title: 'Backend', tech: 'FastAPI · Python' },
                      { icon: 'database', title: 'Database', tech: 'Supabase · PostgreSQL' },
                    ].map((node) => (
                      <div key={node.title} className="z-10 w-full md:w-[180px] p-4 bg-surface-container border border-primary/20 rounded-xl text-center group transition-all hover:scale-105 hover:border-primary/50">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-[24px] text-primary">{node.icon}</span>
                        </div>
                        <h3 className="font-headline text-base text-white mb-1">{node.title}</h3>
                        <p className="text-on-surface-variant text-[11px] font-mono">{node.tech}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <motion.section
                  className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 2 * 0.05 }}
                >
                  <h2 className="text-white font-headline text-headline-md mb-2">Tech That Works</h2>
                  <p className="text-on-surface-variant text-sm mb-8">Not just buzzwords. This stack is what makes your preferences instantly update, your analyses run in seconds, and your data stay secure. It's all live and connected.</p>

                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 h-fit md:h-[300px]">
                    <svg className="absolute top-1/2 left-0 w-full h-0.5 hidden md:block -translate-y-1/2 z-0" style={{ overflow: 'visible' }}>
                      <line x1="15%" y1="0" x2="85%" y2="0" stroke="rgba(249, 115, 22, 0.15)" strokeWidth="2" strokeDasharray="8 4" />
                    </svg>
                    {[
                      { icon: 'layers', title: 'Frontend', tech: 'React · Tailwind · Vite' },
                      { icon: 'settings_input_component', title: 'Backend', tech: 'FastAPI · Python' },
                      { icon: 'database', title: 'Database', tech: 'Supabase · PostgreSQL' },
                    ].map((node) => (
                      <motion.div
                        key={node.title}
                        className="z-10 w-full md:w-[180px] p-4 bg-surface-container border border-primary/20 rounded-xl text-center"
                        whileHover={{ scale: 1.06, y: -4 }}
                        whileTap={{ scale: 0.97 }}
                        transition={SPRING_SNAPPY}
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="material-symbols-outlined text-[24px] text-primary">{node.icon}</span>
                        </div>
                        <h3 className="font-headline text-base text-white mb-1">{node.title}</h3>
                        <p className="text-on-surface-variant text-[11px] font-mono">{node.tech}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Social Links */}
              {shouldReduceMotion ? (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <a
                    href="https://github.com/Sathvik1533"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111113] border border-[#1e1e22] p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-all duration-500 ease-out hover:border-[#ff6600]/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center transition-colors group-hover:bg-white/10">
                        <span className="material-symbols-outlined text-[20px] text-white">code</span>
                      </div>
                      <div>
                        <h4 className="text-white font-headline text-base">GitHub</h4>
                        <p className="text-on-surface-variant text-sm">github.com/Sathvik1533</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/kotagiri-sathvik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111113] border border-[#1e1e22] p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-all duration-500 ease-out hover:border-[#ff6600]/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)]"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center transition-colors group-hover:bg-blue-500/20">
                        <span className="material-symbols-outlined text-[20px] text-blue-400">alternate_email</span>
                      </div>
                      <div>
                        <h4 className="text-white font-headline text-base">LinkedIn</h4>
                        <p className="text-on-surface-variant text-sm">kotagiri-sathvik</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </a>
                </section>
              ) : (
                <motion.section
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ ...SPRING_SNAPPY, delay: 3 * 0.05 }}
                >
                  <motion.a
                    href="https://github.com/Sathvik1533"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111113] border border-[#1e1e22] p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-all duration-500 ease-out hover:border-[#ff6600]/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)]"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_SNAPPY}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center transition-colors group-hover:bg-white/10">
                        <span className="material-symbols-outlined text-[20px] text-white">code</span>
                      </div>
                      <div>
                        <h4 className="text-white font-headline text-base">GitHub</h4>
                        <p className="text-on-surface-variant text-sm">github.com/Sathvik1533</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </motion.a>

                  <motion.a
                    href="https://www.linkedin.com/in/kotagiri-sathvik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111113] border border-[#1e1e22] p-6 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface-container-high transition-all duration-500 ease-out hover:border-[#ff6600]/30 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)]"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING_SNAPPY}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center transition-colors group-hover:bg-blue-500/20">
                        <span className="material-symbols-outlined text-[20px] text-blue-400">alternate_email</span>
                      </div>
                      <div>
                        <h4 className="text-white font-headline text-base">LinkedIn</h4>
                        <p className="text-on-surface-variant text-sm">kotagiri-sathvik</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                  </motion.a>
                </motion.section>
              )}

            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  )
}
