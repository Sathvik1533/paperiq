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
import { useState, useEffect } from 'react'
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
  const TOUR_KEY = 'paperiq_tour_complete_v1'
  const [showTour, setShowTour] = useState(false)

  // Start tour once data is loaded (only for users who haven't seen it)
  useEffect(() => {
    if (!loading && profile?.current_semester) {
      const done = localStorage.getItem(TOUR_KEY)
      if (!done) {
        // Small delay so UI is fully painted before spotlight kicks in
        const t = setTimeout(() => setShowTour(true), 800)
        return () => clearTimeout(t)
      }
    }
  }, [loading, profile])

  function completeTour() {
    localStorage.setItem(TOUR_KEY, '1')
    setShowTour(false)
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

  // The full platform tour — navigates across all main nav pages
  // Conditionally includes "Today's Focus" step only if topSubject exists
  const tourSteps: TourStep[] = [
    {
      target: 'tour-dashboard',
      title: 'Your Dashboard',
      description: 'This is your command centre. All your subjects are ranked by exam question frequency — highest priority first.',
      position: 'bottom',
      route: '/dashboard',
      waitMs: 800,
    },
    {
      target: 'tour-subject-grid',
      title: 'Subject Cards',
      description: 'Each card shows a subject with its priority score. Click any card to run an AI analysis on it and see what topics are most likely to appear.',
      position: 'top',
      route: '/dashboard',
      waitMs: 500,
    },
    // Only show "Today's Focus" step if topSubject exists
    ...(topSubject ? [{
      target: 'tour-today-focus',
      title: "Today's Focus",
      description: 'Your highest-priority subject is pinned here. Start here every study session for maximum exam yield.',
      position: 'left' as const,
      route: '/dashboard',
      waitMs: 500,
    }] : []),
    {
      target: 'tour-nav-analysis',
      title: 'Analysis',
      description: 'Run a deep AI scan on any subject. Get unit priority rankings, most-asked topics, and repeated questions from 10 years of past papers.',
      position: 'bottom',
      route: '/analysis',
      waitMs: 900,
    },
    {
      target: 'tour-analysis-subject',
      title: 'Pick a Subject to Analyse',
      description: 'Select any subject from the dropdown, choose your exam type (Semester / Mid), then hit "Analyse Papers" to see the full breakdown.',
      position: 'bottom',
      route: '/analysis',
      waitMs: 700,
    },
    {
      target: 'tour-nav-papers',
      title: 'Papers Browser',
      description: 'Browse all 70+ previous question papers. Filter by subject, regulation, year range, or exam category to find exactly what you need.',
      position: 'bottom',
      route: '/papers',
      waitMs: 900,
    },
    {
      target: 'tour-papers-filters',
      title: 'Powerful Filters',
      description: 'Narrow down by regulation (R22/R20/R18), exam category (Mid-1, Mid-2, Semester), and year range. All filters update the results instantly.',
      position: 'right',
      route: '/papers',
      waitMs: 700,
    },
    {
      target: 'tour-nav-profile',
      title: 'Your Profile',
      description: 'Update your semester, regulation, learning goals, and preparation level. Changing semester here refreshes your entire dashboard.',
      position: 'bottom',
      route: '/profile',
      waitMs: 900,
    },
    {
      target: 'tour-run-analysis-cta',
      title: "Ready? Let's Go.",
      description: 'Hit "Run New Analysis" any time to start a fresh analysis for any subject. Your journey to smarter exam prep starts now.',
      position: 'bottom',
      route: '/dashboard',
      waitMs: 800,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="dashboard" />

      {/* Guided Tour overlay */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={completeTour}
          onSkip={completeTour}
        />
      )}

      <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">

        {/* ── Welcome Header ────────────────────────────────────────────── */}
        <section className="mb-xl" data-tour="tour-dashboard" style={{ animation: 'fadeInUp 0.5s ease forwards' }}>
          <div className="flex items-start justify-between gap-base">
            <div>
              <h1 className="font-headline text-headline-lg text-on-surface mb-xs">
                Welcome back, {displayName}
              </h1>
              <p className="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest">
                Exam Intelligence · {profile.regulation} · Semester {profile.current_semester}
              </p>
            </div>
            {/* Tour trigger button — always visible so user can replay */}
            <button
              onClick={() => setShowTour(true)}
              className="shrink-0 flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-xl text-body-sm text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all"
            >
              <Icon name="search" size={16} />
              <span className="hidden sm:inline">Platform Tour</span>
            </button>
          </div>
        </section>

        {/* ── Getting Started Guide (shown only until first analysis is run) ── */}
        {isFirstTime && (
          <section className="mb-xxl" style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.05s' }}>
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
                    <div key={step.n} className="relative z-10 flex gap-md">
                      {/* Step number */}
                      <div className={`w-14 h-14 rounded-2xl ${step.bg} border ${step.border} flex flex-col items-center justify-center shrink-0`}>
                        <span className={`font-headline text-[11px] ${step.color} uppercase tracking-widest leading-none mb-px`}>Step</span>
                        <span className={`font-headline text-[22px] leading-none ${step.color}`}>{step.n}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-xs mb-xs">
                          <Icon name={step.icon} size={16} color={step.color} filled />
                          <h3 className="font-headline text-[16px] text-on-surface">{step.title}</h3>
                        </div>
                        <p className="text-on-surface-variant text-body-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
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
          <section className="mb-lg" style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.03s' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-base">
              <button
                onClick={() => navigate('/analysis')}
                className="glass-card bg-surface border border-primary/20 p-lg rounded-xl flex items-center gap-md hover:-translate-y-1 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <Icon name="analytics" size={24} color="text-primary" filled />
                </div>
                <div className="text-left">
                  <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Run Analysis</h3>
                  <p className="text-body-sm text-on-surface-variant">Scan any subject</p>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/papers')}
                className="glass-card bg-surface border border-outline-variant p-lg rounded-xl flex items-center gap-md hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Icon name="library_books" size={24} color="text-on-surface-variant" />
                </div>
                <div className="text-left">
                  <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Browse Papers</h3>
                  <p className="text-body-sm text-on-surface-variant">{paperCount}+ documents</p>
                </div>
              </button>

              <button
                onClick={() => window.open('https://forms.gle/your-feedback-form', '_blank')}
                className="glass-card bg-surface border border-outline-variant p-lg rounded-xl flex items-center gap-md hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                  <Icon name="feedback" size={24} color="text-on-surface-variant" />
                </div>
                <div className="text-left">
                  <h3 className="font-headline text-[16px] text-on-surface group-hover:text-primary transition-colors">Send Feedback</h3>
                  <p className="text-body-sm text-on-surface-variant">Help us improve</p>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* ── Attention Banner (shown only after first analysis — top subject highlight) ─ */}
        {!isFirstTime && topSubject && (
          <section className="mb-xxl" style={{ animation: 'fadeInUp 0.5s ease forwards', animationDelay: '0.05s' }}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                {sortedSubjects.map((subject, idx) => {
                  // Score is 0 for new users or subjects with no activity — never fabricate
                  const score  = priorityScores[subject.id] ?? 0
                  const hasData = hasUserActivity && score > 0
                  // Only show priority badges if the user has real activity to rank against
                  const label  = (hasAnyScores && hasUserActivity) ? priorityLabel(idx) : null
                  const border = (hasAnyScores && hasUserActivity) ? priorityBorder(idx) : 'border-outline-variant'

                  return (
                    <div
                      key={subject.id}
                      onClick={() => navigate(`/analysis?subject_id=${subject.id}`)}
                      className={`glass-card bg-[#111113] border ${border} p-lg rounded-2xl flex flex-col justify-between cursor-pointer group transition-all duration-500 ease-out hover:-translate-y-1 shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] ${
                        border === 'border-primary/50' || border === 'border-primary/30' 
                          ? 'hover:border-[#ff6600]/30' 
                          : 'border-[#1e1e22] hover:border-[#ff6600]/30'
                      }`}
                      style={{
                        animation: `fadeInUp 0.5s ease forwards`,
                        animationDelay: `${(idx + 2) * 0.07}s`,
                        opacity: 0,
                      }}
                    >
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
                            Sem {subject.semester} · {subject.regulation}
                          </span>
                          <span className="text-primary font-bold text-body-sm flex items-center gap-xs group-hover:gap-md transition-all">
                            View Analysis
                            <Icon name="arrow_right" size={18} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="glass-card rounded-2xl p-xxl text-center">
                <Icon name="library_books" size={64} color="text-on-surface-variant" className="mb-base block" />
                <h3 className="font-headline text-headline-md text-on-surface mb-sm">No Subjects Found</h3>
                <p className="text-on-surface-variant text-body-md mb-xl max-w-sm mx-auto">
                  No subjects for {profile.regulation} Semester {profile.current_semester}.
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
              <div className="bg-surface border border-primary/20 rounded-2xl overflow-hidden" data-tour="tour-today-focus">
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
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg">
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
            </div>

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
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center justify-between p-md bg-surface border border-outline-variant rounded-xl hover:border-primary/40 transition-all group"
                >
                  <div className="flex items-center gap-md">
                    <Icon name={action.icon} color="text-primary" />
                    <span className="font-body-md text-on-surface">{action.label}</span>
                  </div>
                  <Icon name="chevron_right" color="text-on-surface-variant" className="group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
