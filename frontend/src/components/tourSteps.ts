import type { TourStep } from './GuidedTour'

export const APP_TOUR_STEPS: TourStep[] = [
  // ── DASHBOARD ──
  {
    target: 'tour-welcome',
    title: 'Welcome to PaperIQ',
    description: 'This is your Dashboard — your command centre. It shows all your enrolled subjects and their priority scores based on past exam patterns.',
    position: 'bottom',
    route: '/dashboard',
    waitMs: 600,
  },
  {
    target: 'tour-subject-grid',
    title: 'Your Subject Cards',
    description: 'Each card is one of your subjects. Click any card to run an analysis and see which topics are most likely to appear in your exam.',
    position: 'top',
  },
  {
    target: 'tour-sidebar-focus',
    title: "Today's Focus",
    description: "This sidebar widget always highlights your highest-priority subject. Start here for maximum exam yield.",
    position: 'left',
  },
  // ── ANALYSIS ──
  {
    target: 'tour-analysis-subject',
    title: 'Pick Your Subject',
    description: 'Select a subject from this dropdown. PaperIQ will scan every past exam paper for that subject.',
    position: 'bottom',
    route: '/analysis',
    waitMs: 800,
  },
  {
    target: 'tour-analysis-filter',
    title: 'Choose Exam Type',
    description: 'Filter by All Papers or Semester exam. Mid-1 and Mid-2 filters are coming soon.',
    position: 'bottom',
  },
  {
    target: 'tour-analysis-run',
    title: 'Run the Analysis',
    description: 'Hit this button to let our AI scan 10 years of question papers. You\'ll get a ranked priority list, heatmap, and predicted topics.',
    position: 'top',
  },
  // ── PAPERS ──
  {
    target: 'tour-papers-list',
    title: 'Browse Past Papers',
    description: 'Every question paper in our database is here. You can filter by year, subject, or exam type — and open any paper to read it.',
    position: 'top',
    route: '/papers',
    waitMs: 800,
  },
  // ── PROFILE ──
  {
    target: 'tour-profile-academic',
    title: 'Your Academic Profile',
    description: 'Keep your semester and regulation updated here. PaperIQ uses this to pull the right subjects and question papers for you.',
    position: 'right',
    route: '/profile',
    waitMs: 800,
  },
  {
    target: 'tour-navbar',
    title: 'Navigation',
    description: 'Use this navigation bar to move between Dashboard, Analysis, Papers, and Profile at any time.',
    position: 'bottom',
    route: '/dashboard',
    waitMs: 600,
  },
]
