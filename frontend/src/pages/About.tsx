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

              {/* Technical stack */}
              {shouldReduceMotion ? (
                <section className="bg-[#111113] border border-[#1e1e22] p-6 md:p-10 rounded-2xl overflow-hidden relative shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:border-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] transition-all duration-500">
                  <h2 className="text-white font-headline text-headline-md mb-2">How It's Built</h2>
                  <p className="text-on-surface-variant text-sm mb-8">A solo student project — one frontend, one backend, one database.</p>
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
                  <h2 className="text-white font-headline text-headline-md mb-2">How It's Built</h2>
                  <p className="text-on-surface-variant text-sm mb-8">A solo student project — one frontend, one backend, one database.</p>

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
