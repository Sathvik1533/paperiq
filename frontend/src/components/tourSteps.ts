import type { TourStep } from './GuidedTour'

export const APP_TOUR_STEPS: TourStep[] = [
  // ── DASHBOARD (Steps 1-3) ──
  {
    target: 'tour-dashboard',           // <section data-tour="tour-dashboard"> in Dashboard.tsx:281
    title: 'Welcome to PaperIQ',
    description: 'This is your Dashboard — your command centre. It shows all your enrolled subjects and their priority scores based on past exam patterns.',
    position: 'bottom',
    route: '/dashboard',
    waitMs: 600,
  },
  {
    target: 'tour-subject-grid',        // <div data-tour="tour-subject-grid"> in Dashboard.tsx:478
    title: 'Your Subject Cards',
    description: 'Each card is one of your subjects. Click any card to run an analysis and see which topics are most likely to appear in your exam.',
    position: 'top',
  },
  {
    target: 'tour-today-focus',         // <div data-tour="tour-today-focus"> in Dashboard.tsx:624
    title: "Today's Focus",
    description: "This sidebar widget always highlights your highest-priority subject. Start here for maximum exam yield.",
    position: 'left',
  },
  // ── ANALYSIS (Steps 4-6) ──
  {
    target: 'tour-analysis-subject',    // <div data-tour="tour-analysis-subject"> in BetaAnalysis.tsx:241
    title: 'Pick Your Subject',
    description: 'Select a subject from this dropdown. PaperIQ will scan every past exam paper for that subject.',
    position: 'bottom',
    route: '/analysis',
    waitMs: 900,
  },
  {
    target: 'tour-run-analysis-cta',    // <button data-tour="tour-run-analysis-cta"> in NavBar.tsx:152
    title: 'Run the Analysis',
    description: 'Hit this button to let our AI scan 10 years of question papers. You\'ll get a ranked priority list, heatmap, and predicted topics.',
    position: 'bottom',
  },
  // ── PAPERS (Step 7) ──
  {
    target: 'tour-papers-filters',      // <aside data-tour="tour-papers-filters"> in Papers.tsx:299
    title: 'Browse Past Papers',
    description: 'Every question paper in our database is here. Filter by subject, semester, regulation, or exam type — and open any paper to read it.',
    position: 'right',
    route: '/papers',
    waitMs: 900,
  },
  // ── PROFILE (Step 8) ──
  {
    target: 'tour-profile-hero',        // <div data-tour="tour-profile-hero"> in Profile.tsx:286
    title: 'Your Academic Profile',
    description: 'Keep your semester and regulation updated here. PaperIQ uses this to pull the right subjects and question papers for you.',
    position: 'bottom',
    route: '/profile',
    waitMs: 900,
  },
  // ── NAVBAR (Step 9) ──
  {
    target: 'tour-nav-dashboard',       // <a data-tour="tour-nav-dashboard"> in NavBar.tsx
    title: 'Navigation',
    description: 'Use this navigation bar to move between Dashboard, Analysis, Papers, and Profile at any time. You\'re all set!',
    position: 'bottom',
    route: '/dashboard',
    waitMs: 600,
  },
]
