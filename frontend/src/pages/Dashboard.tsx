/**
 * Dashboard — Subject Hub
 * Route: /dashboard
 *
 * Home screen after onboarding. Shows all subjects with REAL priority scores
 * derived from question frequency in the DB — not simulated ranks.
 *
 * Data flow: user profile → semester/regulation → subjects from DB
 *            → question counts per subject → normalised priority scores (0–94%)
 * 
 * ENHANCED: Spring-driven animations on all interactive elements
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { Icon, IconSets } from '../components/Icon'
import { GuidedTour, type TourStep } from '../components/GuidedTour'
import { useAuthStore } from '../store/authStore'
import { getUserProfile, getSubjectsForSemester } from '../lib/api'
import { supabase } from '../lib/supabase'
import { PageTransition } from '../components/ui/PageTransition'
import { StaggerContainer, StaggerItem } from '../components/ui/StaggerContainer'
import { AnimatedCard } from '../components/ui/AnimatedCard'
import { AnimatedButton } from '../components/ui/AnimatedButton'
import { hoverScale, tapScale, SPRING_SNAPPY } from '../lib/motion'
import type { Subject } from '../types'

// Priority accent colours by rank (0-indexed)
function priorityBorder(idx: number): string {
  if (idx === 0) return 'border-primary/50'
  if (idx === 1) return 'border-primary/30'
  return 'border-outline-variant'
}
// Badge label for top 2 subjects
function priorityLabel(idx: number): { text: string; cls: string } | null {
  if (idx === 0) return { text: 'Critical', cls: 'text-primary' }
  if (idx === 1) return { text: 'High Attention', cls: 'text-primary/70' }
  return null
}

// Fetch real question counts + top topic per subject, normalise to 0–94 priority scores
async function fetchRealPriorityScores(subjectIds: string[]): Promise<Record<string, number>> {
  if (!subjectIds.length) return {}
  try {
    const { data } = await supabase
      .from('questions')
      .select('subject_id')
      .in('subject_id', subjectIds)
    if (!data) return {}
    const counts: Record<string, number> = {}
    for (const row of data) {
      counts[row.subject_id] = (counts[row.subject_id] || 0) + 1
    }
    const maxCount = Math.max(...Object.values(counts), 1)
    const scores: Record<string, number> = {}
    for (const id of subjectIds) {
      const count = counts[id] || 0
      // If no questions exist for this subject, score is 0 — never fake it
      scores[id] = count > 0 ? Math.round((count / maxCount) * 94) : 0
    }
    return scores
  } catch {
    return {}
  }
}

// Fetch top topic and top unit per subject for card display
async function fetchSubjectInsights(subjectIds: string[]): Promise<Record<string, { topTopic: string; topUnit: string }>> {
  if (!subjectIds.length) return {}
  try {
    const { data } = await supabase
      .from('questions')
      .select('subject_id, topic_name, unit_name')
      .in('subject_id', subjectIds)
      .not('topic_name', 'is', null)
    if (!data) return {}

    // Count topics and units per subject
    const topicCounts: Record<string, Record<string, number>> = {}
    const unitCounts: Record<string, Record<string, number>> = {}
    for (const row of data) {
      if (!topicCounts[row.subject_id]) topicCounts[row.subject_id] = {}
      if (!unitCounts[row.subject_id]) unitCounts[row.subject_id] = {}
      if (row.topic_name) topicCounts[row.subject_id][row.topic_name] = (topicCounts[row.subject_id][row.topic_name] || 0) + 1
      if (row.unit_name) unitCounts[row.subject_id][row.unit_name] = (unitCounts[row.subject_id][row.unit_name] || 0) + 1
    }

    const insights: Record<string, { topTopic: string; topUnit: string }> = {}
    for (const id of subjectIds) {
      const topics = topicCounts[id] || {}
      const units = unitCounts[id] || {}
      const topTopic = Object.entries(topics).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
      const topUnit = Object.entries(units).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
      insights[id] = { topTopic, topUnit }
    }
    return insights
  } catch {
    return {}
  }
}

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const shouldReduceMotion = useReducedMotion()
  const [profile, setProfile]         = useState<any>(null)
  const [subjects, setSubjects]       = useState<Subject[]>([])
  const [priorityScores, setPriorityScores] = useState<Record<string, number>>({})
  const [subjectInsights, setSubjectInsights] = useState<Record<string, { topTopic: string; topUnit: string }>>({})
  const [paperCount, setPaperCount]   = useState<number>(0)
  const [hasAnyScores, setHasAnyScores] = useState(false)
  // hasUserActivity: true only if the user has personally run at least one analysis
  const [hasUserActivity, setHasUserActivity] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // ── Guided Tour ────────────────────────────────────────────────────────────
  // Read both flags: 'finished' = tour completed/skipped, 'started' = tour is
  // actively in progress (prevents re-triggering when the tour navigates back
  // to /dashboard mid-flow on step 9).
  const hasCompleted = localStorage.getItem('paperiq_tour_finished')
  const isInProgress = localStorage.getItem('paperiq_tour_started')
  const [runTour, setRunTour] = useState(!hasCompleted && !isInProgress)

  function startTour() {
    // Mark as in-progress IMMEDIATELY so remounts don't restart it
    localStorage.setItem('paperiq_tour_started', 'true')
    setRunTour(true)
  }

  function completeTour() {
    localStorage.setItem('paperiq_tour_finished', 'true')
    localStorage.removeItem('paperiq_tour_started')
    setRunTour(false)
  }

  useEffect(() => {
    if (!user) return
    getUserProfile(user.id)
      .then(async (prof) => {
        console.log('👤 Dashboard: Profile loaded:', prof)
        setProfile(prof)
        if (prof?.current_semester && prof?.regulation) {
          const subs = await getSubjectsForSemester(prof.current_semester, prof.regulation)
          console.log(`📚 Dashboard: Loaded ${subs?.length || 0} subjects for Semester ${prof.current_semester}, ${prof.regulation}`)
          console.log('📚 Dashboard subject codes:', subs?.map(s => s.code).join(', '))
          console.table(subs)
          setSubjects(subs || [])

          if (subs?.length) {
            // Check if the user has run any analysis before loading priority scores
            const { count: analysisCount } = await supabase
              .from('analysis_reports')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)

            const userHasRunAnalysis = (analysisCount ?? 0) > 0
            setHasUserActivity(userHasRunAnalysis)

            if (userHasRunAnalysis) {
              // Only fetch and show real priority scores if the user has prior activity
              const scores = await fetchRealPriorityScores(subs.map((s: Subject) => s.id))
              setPriorityScores(scores)
              setHasAnyScores(Object.values(scores).some(v => v > 0))
            } else {
              // New user — baseline all priority scores to 0
              const zeroScores: Record<string, number> = {}
              for (const s of subs) zeroScores[s.id] = 0
              setPriorityScores(zeroScores)
              setHasAnyScores(false)
            }

            const insights = await fetchSubjectInsights(subs.map((s: Subject) => s.id))
            setSubjectInsights(insights)
          }
        }
        // Get total paper count for sidebar stats
        const { count } = await supabase
          .from('papers')
          .select('*', { count: 'exact', head: true })
        setPaperCount(count || 0)
      })
      .catch(err => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user])

  const displayName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'Scholar'

  // isFirstTime: user has a valid profile but has never run an analysis
  const isFirstTime = !hasUserActivity && !loading && !!profile?.current_semester

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="dashboard" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
          <div className="mb-xl">
            <div className="skeleton h-10 w-72 mb-3 rounded-xl" />
            <div className="skeleton h-5 w-52 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton rounded-2xl h-56" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  // ── No profile → onboarding ───────────────────────────────────────────────
  if (error || !profile?.current_semester) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="dashboard" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 flex items-center justify-center min-h-[60vh]">
          <div className="glass-card rounded-2xl p-xl text-center max-w-md">
            <Icon name="school" size={64} color="text-primary" filled className="mb-base block" />
            <h2 className="font-headline text-headline-md text-on-surface mb-sm">
              Complete Your Setup
            </h2>
            <p className="text-on-surface-variant text-body-md mb-xl">
              {error || 'Set up your semester and regulation to see your subject analysis.'}
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="bg-primary text-on-primary px-lg py-md rounded-xl font-bold hover:brightness-110 transition-all"
            >
              Complete Setup
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Sort subjects by real priority score descending — highest question count first
  const sortedSubjects = Object.keys(priorityScores).length > 0
    ? [...subjects].sort((a, b) => (priorityScores[b.id] ?? 0) - (priorityScores[a.id] ?? 0))
    : subjects

  const topSubject = sortedSubjects[0]

  // 3-step tour: Dashboard → Analysis → Papers
  const tourSteps: TourStep[] = [
    {
      target: 'tour-nav-dashboard',
      title: 'Welcome to PaperIQ',
      description: 'This is your Dashboard. It gives you a high-level overview of your semester subjects and study priorities.',
      position: 'bottom',
      route: '/dashboard',
      waitMs: 500,
    },
    {
      target: 'tour-subject-grid',
      title: 'Your Subjects',
      description: 'These are all your enrolled subjects. Click any card to run an AI analysis — see which topics appear most in past papers.',
      position: 'top',
      route: '/dashboard',
      waitMs: 500,
    },
    {
      target: 'tour-nav-analysis',
      title: 'AI Analysis',
      description: 'Navigate here to get deep insights into exam patterns and see which topics carry the most weight.',
      position: 'bottom',
      route: '/dashboard',
      waitMs: 500,
    },
    {
      target: 'tour-analysis-subject',
      title: 'Pick a Subject to Analyse',
      description: 'Select a subject, choose Semester exam type, then hit "Analyse Papers" to get unit priorities and most-asked topics from real past papers.',
      position: 'bottom',
      route: '/analysis',
      waitMs: 900,
    },
    {
      target: 'tour-nav-papers',
      title: 'Past Papers',
      description: 'Need the raw PDFs? Head over to the Papers section to browse the complete archive.',
      position: 'bottom',
      route: '/analysis',
      waitMs: 500,
    },
    {
      target: 'tour-papers-filters',
      title: 'Download Past Papers',
      description: 'Browse and download any past paper as a PDF. Filter by subject, regulation, and year. One click — no RAR files, no hunting.',
      position: 'right',
      route: '/papers',
      waitMs: 900,
    },
    {
      target: 'tour-nav-about',
      title: 'About the Creator',
      description: 'Learn more about the vision behind PaperIQ and the developer who built it.',
      position: 'bottom',
      route: '/about',
      waitMs: 900,
    },
    {
      target: 'tour-nav-profile',
      title: 'Your Profile',
      description: 'Update your semester, regulation, and personal details anytime.',
      position: 'bottom',
      route: '/profile',
      waitMs: 900,
    },
    {
      target: 'tour-nav-settings',
      title: 'Settings',
      description: 'Tweak your app preferences, like enabling reduced motion or managing session data. You are all set!',
      position: 'bottom',
      route: '/settings',
      waitMs: 900,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="dashboard" />

      

      <PageTransition>
        <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">

          {/* ── Welcome Header ────────────────────────────────────────────── */}
          <motion.section
            className="mb-xl"
            data-tour="tour-dashboard"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-start justify-between gap-base">
              <div>
                <h1 className="font-headline text-headline-lg text-on-surface mb-xs">
                  Welcome back, {displayName}
                </h1>
                <p className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest">
                  Exam Intelligence · {profile.regulation} · {
                    profile.current_semester === 3 ? '2-1 (Sem 3)' :
                    profile.current_semester === 4 ? '2-2 (Sem 4)' :
                    `Semester ${profile.current_semester}`
                  }
                </p>
              </div>
              {/* Tour trigger button — always visible so user can replay */}
              <motion.button
                onClick={() => setRunTour(true)}
                className="shrink-0 flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-xl text-body-sm text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03, translateY: -2 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon name="search" size={16} />
                <span className="hidden sm:inline">Platform Tour</span>
              </motion.button>
            </div>
          </motion.section>

          {/* ── Getting Started Guide (shown only until first analysis is run) ── */}
          {isFirstTime && (
            <section className="mb-xxl">
              <div className="rounded-2xl border border-primary/30 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(7,7,13,1) 60%)' }}>
                {/* Header */}
                <div className="px-xl pt-xl pb-lg border-b border-outline-variant/40 flex items-start gap-md">
                  <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-px">
                    <Icon name="rocket" size={22} color="text-primary" filled />
                  </div>
                  <div>
                    <h2 className="font-headline text-headline-md text-on-surface mb-xs">
                      You're all set up — here's what to do next
                    </h2>
                    <p className="text-on-surface-variant text-body-md">
                      No analysis data yet. Follow these 3 steps to get your personalised exam insights.
                    </p>
                  </div>
                </div>

                {/* Steps */}
                <div className="px-xl py-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-lg relative">
                    {/* connector line (desktop only) */}
                    <div className="hidden md:block absolute top-7 left-[calc(16.67%+8px)] right-[calc(16.67%+8px)] h-[2px] bg-gradient-to-r from-primary/30 via-primary/15 to-transparent -z-0 pointer-events-none" />

                    {[
                      {
                        n: '1',
                        icon: 'analytics' as const,
                        title: 'Pick a subject',
                        desc: 'Choose any subject from the grid below. Each card represents one of your enrolled subjects.',
                        cta: null,
                        color: 'text-primary',
                        bg: 'bg-primary/10',
                        border: 'border-primary/25',
                      },
                      {
                        n: '2',
                        icon: 'bolt' as const,
                        title: 'Run Analysis',
                        desc: 'Click "Run Analysis" to let our AI scan 10 years of question papers and find high-probability exam topics.',
                        cta: null,
                        color: 'text-primary',
                        bg: 'bg-primary/10',
                        border: 'border-primary/25',
                      },
                      {
                        n: '3',
                        icon: 'emoji_events' as const,
                        title: 'Study what matters',
                        desc: 'Get a ranked topic heatmap, unit priorities, and predicted questions — all tailored to your semester.',
                        cta: null,
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/25',
                      },
                    ].map((step, i) => (
                      <motion.div
                        key={step.n}
                        className="relative z-10 flex flex-col items-center text-center gap-sm"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.08 }}
                      >
                        {/* Step number */}
                        <div className={`relative w-14 h-14 rounded-2xl border ${step.border} flex flex-col items-center justify-center shrink-0 overflow-hidden`}>
                          <div className="absolute inset-0 bg-[#07070d]" />
                          <div className={`absolute inset-0 ${step.bg}`} />
                          <div className="relative flex flex-col items-center mt-1">
                            <span className={`font-headline text-[10px] ${step.color} uppercase tracking-widest leading-none mb-px`}>Step</span>
                            <span className={`font-headline text-[22px] leading-none ${step.color}`}>{step.n}</span>
                          </div>
                        </div>
                        <div className="mt-1">
                          <div className="flex items-center justify-center gap-xs mb-xs">
                            <Icon name={step.icon} size={16} color={step.color} filled />
                            <h3 className="font-headline text-[16px] text-on-surface">{step.title}</h3>
                          </div>
                          <p className="text-on-surface-variant text-body-sm leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Call to action pointing at the first subject */}
                  {sortedSubjects.length > 0 && (
                    <div className="mt-lg pt-lg border-t border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base">
                      <div className="flex items-center gap-sm text-on-surface-variant text-body-sm">
                        <Icon name="arrow_right" size={18} color="text-primary" filled />
                        Start with <strong className="text-on-surface">{sortedSubjects[0].name}</strong> — scroll down and click the card
                      </div>
                      <button
                        onClick={() => navigate(`/analysis?subject_id=${sortedSubjects[0].id}`)}
                        className="bg-primary text-on-primary font-bold px-lg py-sm rounded-xl text-body-sm hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-sm whitespace-nowrap"
                      >
                        <Icon name="analytics" size={18} />
                        Start First Analysis
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── Quick Actions (shown for returning users) ─ */}
          {!isFirstTime && (
            <section className="mb-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-base">
                <motion.button
                  onClick={() => navigate('/analysis')}
                  className="glass-card bg-surface border border-primary/20 p-lg rounded-xl flex items-center gap-md transition-all group"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                    <Icon name="analytics" size={24} color="text-primary" filled />
                  </div>
                  <div className="text-left">
                    <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Run Analysis</h3>
                    <p className="text-body-sm text-on-surface-variant">Scan any subject</p>
                  </div>
                </motion.button>
                
                <motion.button
                  onClick={() => navigate('/papers')}
                  className="glass-card bg-surface border border-outline-variant p-lg rounded-xl flex items-center gap-md hover:border-primary/30 transition-all group"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                    <Icon name="library_books" size={24} color="text-on-surface-variant" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Browse Papers</h3>
                    <p className="text-body-sm text-on-surface-variant">{paperCount}+ documents</p>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => window.open('https://forms.gle/your-feedback-form', '_blank')}
                  className="glass-card bg-surface border border-outline-variant p-lg rounded-xl flex items-center gap-md hover:border-primary/30 transition-all group"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                    <Icon name="feedback" size={24} color="text-on-surface-variant" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Send Feedback</h3>
                    <p className="text-body-sm text-on-surface-variant">Help us improve</p>
                  </div>
                </motion.button>
              </div>
            </section>
          )}

          {/* ── Attention Banner (shown only after first analysis — top subject highlight) ─ */}
          {!isFirstTime && topSubject && (
            <section className="mb-xxl">
              <div className="bg-surface-container border border-primary/20 rounded-2xl p-lg flex flex-col md:flex-row md:items-center justify-between gap-base">
                <div>
                  <p className="font-data-label text-data-label text-primary uppercase tracking-widest mb-xs flex items-center gap-xs">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Highest Priority
                  </p>
                  <h2 className="font-headline text-headline-md text-on-surface">
                    {topSubject.name}
                  </h2>
                  <p className="text-on-surface-variant text-body-md mt-xs">
                    {subjects.length} subjects tracked · {paperCount} papers in database · Start with this subject for maximum exam yield
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/analysis?subject_id=${topSubject.id}`)}
                  className="bg-primary text-on-primary font-bold px-xl py-3 rounded-xl text-body-sm hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap flex items-center gap-sm"
                >
                  <Icon name="analytics" size={20} />
                  Run Analysis
                </button>
              </div>
            </section>
          )}

          <div className="flex flex-col lg:flex-row gap-xl">

            {/* ── Subject Grid ──────────────────────────────────────────────── */}
            <div className="flex-1" data-tour="tour-subject-grid">
              {sortedSubjects.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-base"
                  initial="initial"
                  animate="animate"
                  variants={
                    shouldReduceMotion
                      ? {}
                      : {
                          initial: {},
                          animate: {
                            transition: { staggerChildren: 0.05, delayChildren: 0.1 },
                          },
                        }
                  }
                >
                  {sortedSubjects.map((subject, idx) => {
                    // Score is 0 for new users or subjects with no activity — never fabricate
                    const score  = priorityScores[subject.id] ?? 0
                    const hasData = hasUserActivity && score > 0
                    // Only show priority badges if the user has real activity to rank against
                    const label  = (hasAnyScores && hasUserActivity) ? priorityLabel(idx) : null
                    const border = (hasAnyScores && hasUserActivity) ? priorityBorder(idx) : 'border-outline-variant'

                    const cardContent = (
                      <>
                        <div>
                          {/* Top row: code + priority badge */}
                          <div className="flex justify-between items-start mb-md">
                            <span className="font-data-label text-data-label text-primary bg-primary/10 border border-primary/20 px-sm py-xs rounded-lg">
                              {subject.code}
                            </span>
                            {label && (
                              <div className="flex items-center gap-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className={`font-data-label text-[10px] uppercase tracking-widest ${label.cls}`}>
                                  {label.text}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Subject name */}
                          <h3 className="font-headline text-headline-md text-on-surface mb-lg group-hover:text-primary transition-colors leading-tight">
                            {subject.name}
                          </h3>
                        </div>

                        <div className="space-y-md">
                          {/* Priority score bar */}
                          <div>
                            <div className="flex justify-between items-end mb-xs">
                              <span className="font-data-label text-data-label text-on-surface-variant">Priority Score</span>
                              {hasData ? (
                                <span className={`font-data-value text-data-value ${idx < 2 ? 'text-primary' : 'text-on-surface-variant'}`}>
                                  {score}%
                                </span>
                              ) : (
                                <span className="font-data-label text-data-label text-primary/60 italic">
                                  Click to analyse →
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              {hasData ? (
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{
                                    width: `${score}%`,
                                    opacity: idx === 0 ? 1 : idx === 1 ? 0.7 : idx < 4 ? 0.5 : 0.3,
                                  }}
                                />
                              ) : (
                                /* Empty bar — 0% until analysis is run */
                                <div className="h-full w-0" />
                              )}
                            </div>
                          </div>

                          {/* Most Asked + Focus Area — matches Stitch exactly */}
                          <div className="flex flex-col gap-xs">
                            <div className="flex items-center gap-sm">
                              <Icon name="trending_up" size={16} color="text-primary" />
                              <span className="font-body-sm text-body-sm text-on-surface">
                                Most Asked: {subjectInsights[subject.id]?.topTopic || '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-sm">
                              <Icon name="target" size={16} color="text-on-surface-variant" />
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                Focus Area: {subjectInsights[subject.id]?.topUnit || '—'}
                              </span>
                            </div>
                          </div>

                          {/* CTA link */}
                          <div className="flex items-center justify-between pt-sm border-t border-outline-variant">
                            <span className="text-on-surface-variant text-body-sm">
                              {subject.semester === 3 ? '2-1' : subject.semester === 4 ? '2-2' : `Sem ${subject.semester}`} · {subject.regulation}
                            </span>
                            <span className="text-primary font-bold text-body-sm flex items-center gap-xs group-hover:gap-md transition-all">
                              View Analysis
                              <Icon name="arrow_right" size={18} />
                            </span>
                          </div>
                        </div>
                      </>
                    )

                    if (shouldReduceMotion) {
                      return (
                        <div
                          key={subject.id}
                          onClick={() => navigate(`/analysis?subject_id=${subject.id}`)}
                          className={`glass-card bg-[#111113] border ${border} p-lg rounded-2xl flex flex-col justify-between cursor-pointer group transition-all duration-500 ease-out hover:-translate-y-1 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] ${
                            border === 'border-primary/50' || border === 'border-primary/30'
                              ? 'hover:border-[#ff6600]/30'
                              : 'border-[#1e1e22] hover:border-[#ff6600]/30'
                          }`}
                        >
                          {cardContent}
                        </div>
                      )
                    }

                    return (
                      <motion.div
                        key={subject.id}
                        onClick={() => navigate(`/analysis?subject_id=${subject.id}`)}
                        className={`glass-card bg-[#111113] border ${border} p-lg rounded-2xl flex flex-col justify-between cursor-pointer group shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] ${
                          border === 'border-primary/50' || border === 'border-primary/30'
                            ? 'hover:border-[#ff6600]/30'
                            : 'border-[#1e1e22] hover:border-[#ff6600]/30'
                        }`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, translateY: -3 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {cardContent}
                      </motion.div>
                    )
                  })}
                </motion.div>
              ) : (
                /* Empty state */
                <div className="glass-card rounded-2xl p-xxl text-center">
                  <Icon name="library_books" size={64} color="text-on-surface-variant" className="mb-base block" />
                  <h3 className="font-headline text-headline-md text-on-surface mb-sm">No Subjects Found</h3>
                  <p className="text-on-surface-variant text-body-md mb-xl max-w-sm mx-auto">
                    No subjects for {profile.regulation} {
                      profile.current_semester === 3 ? '2-1 (Sem 3)' :
                      profile.current_semester === 4 ? '2-2 (Sem 4)' :
                      `Semester ${profile.current_semester}`
                    }.
                    Try updating your profile with the correct regulation and semester.
                  </p>
                  <div className="flex gap-base justify-center flex-wrap">
                    <button
                      onClick={() => navigate('/profile')}
                      className="px-lg py-md border border-outline-variant rounded-xl font-bold hover:border-white/40 transition-colors"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-lg py-md bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <aside className="w-full lg:w-72 shrink-0 space-y-lg">

              {/* Today's Focus */}
              {topSubject && (
                <motion.div
                  className="bg-surface border border-primary/20 rounded-2xl overflow-hidden"
                  data-tour="tour-today-focus"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="p-lg border-b border-outline-variant flex items-center gap-sm bg-primary/5">
                    <Icon name="bolt" size={20} color="text-primary" filled />
                    <h3 className="font-headline text-[18px] text-on-surface">Today's Focus</h3>
                  </div>
                  <div className="p-lg">
                    <p className="font-data-label text-data-label text-primary uppercase mb-xs">
                      {topSubject.code}
                    </p>
                    <p className="font-headline text-on-surface mb-md">{topSubject.name}</p>
                    <div className="bg-surface-container-high p-md rounded-lg border-l-4 border-primary mb-lg">
                      <p className="text-body-sm text-on-surface leading-relaxed">
                        {isFirstTime
                          ? 'Run your first analysis to unlock personalised topic priorities and study recommendations.'
                          : 'Start with the highest-priority unit for maximum exam yield. Check the analysis for specific topics.'
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/analysis?subject_id=${topSubject.id}`)}
                      className="w-full bg-primary text-on-primary py-md rounded-xl font-bold text-body-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-sm"
                    >
                      <Icon name="analytics" size={18} />
                      {isFirstTime ? 'Start First Analysis' : 'View Analysis'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Quick Stats */}
              <motion.div
                className="bg-surface border border-outline-variant rounded-2xl p-lg"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <h3 className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest mb-lg">
                  Global Insights
                </h3>
                <div className="grid grid-cols-2 gap-base">
                  <div className="flex flex-col">
                    <span className="font-headline text-headline-md text-on-surface">{paperCount || '—'}</span>
                    <span className="text-body-sm text-on-surface-variant">Papers Analyzed</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline text-headline-md text-primary">
                      {(hasAnyScores && hasUserActivity) ? '89%' : '—'}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">Accuracy Rate</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <div className="space-y-sm">
                <p className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest px-xs mb-sm">
                  Quick Actions
                </p>
                {[
                  { icon: 'description' as const, label: 'Browse Papers', to: '/papers' },
                  { icon: 'person' as const, label: 'My Profile', to: '/profile' },
                  { icon: 'settings' as const, label: 'Settings', to: '/settings' },
                ].map(action => (
                  <motion.button
                    key={action.to}
                    onClick={() => navigate(action.to)}
                    className="w-full flex items-center justify-between p-md bg-surface border border-outline-variant rounded-xl hover:border-primary/40 transition-all group"
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02, boxShadow: '0 0 20px rgba(255,102,0,0.12)' }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div className="flex items-center gap-md">
                      <Icon name={action.icon} color="text-primary" />
                      <span className="font-body-md text-on-surface">{action.label}</span>
                    </div>
                    <Icon name="chevron_right" color="text-on-surface-variant" className="group-hover:text-primary transition-colors" />
                  </motion.button>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}
