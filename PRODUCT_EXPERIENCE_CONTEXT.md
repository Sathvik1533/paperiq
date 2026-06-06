# PaperIQ — Product Experience Context Document

**Status**: Pre-Design Foundation  
**Created**: June 5, 2026  
**Purpose**: Define complete vision before UI generation  
**For**: Google Stitch (UI Generation) + Kiro (System Architecture)

---

## Executive Summary

PaperIQ is **NOT** a form application, college portal, ERP, or dashboard.

**PaperIQ IS**: A student time-saving intelligence platform that transforms exam preparation from chaotic to strategic.

**Core Promise**: "Stop wasting hours searching WhatsApp groups and previous papers."

---

## The Student Pain We Solve

### Before PaperIQ (The Pain)

**Scenario: 2 weeks before exams**

1. Student opens WhatsApp group "CSE 2022 Batch"
2. Scrolls through 3,000 messages looking for "data structures previous papers"
3. Finds 5 different PDFs with inconsistent naming:
   - `IMG_20230523.pdf`
   - `DS_mid1_idk_which_year.pdf`
   - `WhatsApp Image 2023-05-23 at 10.45.32.jpeg`
4. Opens each PDF manually
5. Manually writes down: "Arrays appeared 12 times"
6. Spends **4-6 hours** just organizing papers
7. Still has no idea what to prioritize

**Emotional state**: Overwhelmed, stressed, uncertain, time-wasted

---

### After PaperIQ (The Relief)

**Scenario: 2 weeks before exams**

1. Student opens PaperIQ app
2. Sees their semester subjects pre-loaded
3. Taps "Data Structures"
4. Sees analysis in **5 seconds**:
   - "Unit I: 34% of exam — Focus here first"
   - "Top 3 topics: Arrays (87 questions), BST (64), Stacks (48)"
   - "High probability: Binary Search Trees (52 questions, 10 papers)"
5. Knows exactly where to start studying
6. Time saved: **4-6 hours**

**Emotional state**: Confident, relieved, focused, empowered

---

## What PaperIQ Is NOT

❌ **A form application** — No 10-field profile forms  
❌ **A college portal** — No admin panels, no attendance tracking  
❌ **An ERP** — No HR, no finance, no resource planning  
❌ **A dashboard** — No generic "Overview" screens  
❌ **A PDF viewer** — Not just showing papers

---

## What PaperIQ IS

✅ **A time-saving platform** — Eliminates manual paper organization  
✅ **An intelligence engine** — Finds patterns students can't see manually  
✅ **A priority guide** — Tells students what to study first  
✅ **A confidence builder** — Evidence-based insights reduce anxiety  
✅ **A WhatsApp group killer** — Replaces chaotic message searches

---

## The Four Feelings Every Screen Must Deliver

Every screen in PaperIQ must make students feel:

### 1. **Confidence**
> "This system knows what I need. I trust this."

**How we create this**:
- Auto-populated semester from hall ticket/profile
- Evidence-based insights ("52 questions across 10 papers")
- Confidence scores on extracted data
- Never show raw SQL or classification percentages to students

### 2. **Relief**
> "I don't have to organize 50 PDFs manually. This is automatic."

**How we create this**:
- Upload hall ticket → Profile created in 30 seconds
- Subject selection → Already filtered to semester
- Analysis → Immediate results, not "Processing..."
- No manual data entry unless absolutely necessary

### 3. **Ambition**
> "I can actually prepare well for this exam. I see the path."

**How we create this**:
- Study Priority Order: "Focus on Unit I first — 273 questions"
- Weekly recommendations: "Week 1: Unit I (34% of exam)"
- High probability topics: "These 5 topics WILL appear"
- Actionable, not just informative

### 4. **Delight**
> "This is way better than asking seniors for PDFs."

**How we create this**:
- Smooth animations (Framer Motion transitions)
- Instant feedback (no 5-second loading spinners)
- Progressive disclosure (Top 5 → "View All" button)
- Mobile-first design (students use phones)

---

## Complete User Journey (Screen by Screen)

### Journey Overview

```
Landing → Signup → Onboarding → Subject Selection → Analysis → Paper Browser → Study Plan
   ↓         ↓          ↓              ↓               ↓             ↓            ↓
  30s       20s     30-120s         10s            5s            2m           5m
```

**Total time from signup to actionable insights**: **2-3 minutes**

**Total time with manual method**: **4-6 hours**

---

## Screen 1: Landing Page

### Goal
Student immediately understands what PaperIQ does and why they need it.

### User Emotion
Curiosity → Interest → "I need to try this"

### Main CTA
"Get Started — Upload Hall Ticket"

### Success State
```
Hero Section:
  Headline: "Stop Searching WhatsApp Groups for Previous Papers"
  Subheadline: "AI analyzes 10 years of exams. Know what to study in 5 seconds."
  
  Visual: Split-screen comparison
    Left: Chaotic WhatsApp screenshots (blurred)
    Right: Clean PaperIQ analysis screen
  
  CTA Button: "Get Started — Free for MLRIT Students" (large, orange)
  
  Trust Signals:
    - "5,730 questions analyzed"
    - "10 subjects ready"
    - "60% classification coverage"

Features (3 cards):
  1. 📊 Smart Analysis — AI finds patterns across 10 years
  2. 🎯 Priority Insights — Know what to study first
  3. ⚡ Instant Results — 5 seconds, not 5 hours
```

### Empty State
N/A (landing always shows content)

### Loading State
Page loads instantly (static content)

---

## Screen 2: Signup / Login

### Goal
Student creates account with minimal friction.

### User Emotion
"This should be quick. I just want to see the analysis."

### Main CTA
"Continue with Hall Ticket Upload" (if new user)  
"Login" (if returning)

### Success State
```
Signup Options:
  - Continue with Google (OAuth)
  - Continue with Email (passwordless magic link)
  
  No password input required
  No multi-field registration form
  
After signup:
  → Redirect to Onboarding (Method Selection)
```

### Empty State
N/A

### Loading State
"Creating your account..." (spinner, 1-2 seconds max)

---

## Screen 3: Onboarding (Hall Ticket Upload - PRIMARY)

**This is the HERO onboarding experience — PaperIQ's strongest differentiator**

### Goal
Student uploads hall ticket and experiences magical auto-detection.

### User Emotion
"Wow. It just... knows everything. This is amazing."

### Main CTA
"Upload Hall Ticket" (primary, hero-sized)  
"Enter Manually Instead" (small text link at bottom)

### Success State
```
┌──────────────────────────────────────────┐
│                                          │
│  🎯 The Fastest Setup Ever               │
│                                          │
│  Upload your hall ticket.                │
│  We'll detect everything automatically.  │
│                                          │
│  ✨ Auto-detect semester                 │
│  ✨ Auto-detect regulation               │
│  ✨ Auto-detect all subjects             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │     📄 Drag & Drop Hall Ticket     │ │
│  │        or Click to Upload          │ │
│  │                                    │ │
│  │   Supports PDF, JPG, PNG           │ │
│  └────────────────────────────────────┘ │
│                                          │
│  💡 Saves 4-6 hours of manual setup      │
│                                          │
│  Enter manually instead (slower)         │
└──────────────────────────────────────────┘
```

### Empty State
N/A (always show both methods)

### Loading State (if Upload selected)
```
[Uploaded file preview thumbnail]
"Extracting information..." (progress indicator, 5-10 seconds)
"Found: CSE, R22, Semester 4, 5 subjects" (success animation)
```

---

## Screen 4: Onboarding (Hall Ticket Confirmation)

**Only shown if user uploads hall ticket**

### Goal
Student verifies extracted data is correct.

### User Emotion
"Wow, it got everything right. That was fast."

### Main CTA
"Confirm & Continue"

### Success State
```
┌─────────────────────────────────────────┐
│ ✓ Extracted Successfully                │
│   Confidence: High                      │
├─────────────────────────────────────────┤
│ Branch: CSE                             │
│ Regulation: R22                         │
│ Semester: II B.Tech II Semester         │
│                                         │
│ 5 Subjects Detected:                    │
│ ✓ A6CS05 — Data Structures             │
│ ✓ A6CS08 — Discrete Mathematics        │
│ ✓ A6CS09 — Database Management Systems │
│ ✓ A6CS11 — Operating System            │
│ ✓ A6CS13 — Software Testing            │
│                                         │
│ [Confirm & Continue] [Edit Manually]   │
└─────────────────────────────────────────┘
```

### Empty State
N/A (only shown after successful extraction)

### Loading State
N/A (data already extracted in previous screen)

---

## Screen 5: Onboarding (Manual Entry)

**Only shown if user chooses manual OR edits extracted data**

### Goal
Student completes profile with minimal fields.

### User Emotion
"Okay, this is still faster than organizing PDFs myself."

### Main CTA
"Save & Continue"

### Success State
```
Step 1 of 2: Academic Info

College:     [MLRIT]                    (dropdown, pre-selected if known)
Branch:      [CSE ▼]                    (dropdown)
Regulation:  [R22 ▼]                    (dropdown)
Year:        [2 ▼]                      (dropdown)
Semester:    [4 ▼]                      (dropdown)

[Next →]

---

Step 2 of 2: Learning Goals (Optional)

Target CGPA:        [7.5]               (number input)
Study Hours/Day:    [4]                 (slider, 1-12)
Preparation Level:  [Intermediate ▼]    (dropdown)

[Save & Start Using PaperIQ]
```

### Empty State
N/A

### Loading State
"Saving your profile..." (spinner, 1-2 seconds)

---

## Screen 6: Subject Hub

**This is the DEFAULT landing page for returning users**

### Goal
Student sees their semester subjects and picks one to analyze.

### User Emotion
"My subjects are right here. No searching, no dropdowns. Just pick."

### Main CTA
"Analyze" (per subject card)

### Success State
```
┌─────────────────────────────────────────┐
│ Your Subjects — Semester 4              │
│ CSE · R22                               │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ � Data Structures                  ││
│ │    A6CS05                            ││
│ │    Last analyzed: 2 days ago        ││
│ │    [Analyze →]                       ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📚 Database Management Systems      ││
│ │    A6CS09                            ││
│ │    Last analyzed: Never             ││
│ │    [Analyze →]                       ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📚 Operating System                 ││
│ │    A6CS11                            ││
│ │    Last analyzed: 1 week ago        ││
│ │    [Analyze →]                       ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📚 Discrete Mathematics             ││
│ │    A6CS08                            ││
│ │    [Analyze →]                       ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📚 Software Testing                 ││
│ │    A6CS13                            ││
│ │    [Analyze →]                       ││
│ └─────────────────────────────────────┘│
│                                         │
│ 💡 Time saved: 4-6 hours of manual     │
│    paper organization                   │
└─────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────┐
│ Complete your profile to start         │
│                                         │
│ PaperIQ needs your semester to show    │
│ relevant subjects.                      │
│                                         │
│ [Complete Profile]                      │
└─────────────────────────────────────────┘
```

### Loading State
"Loading subjects for Semester 4..." (skeleton loaders for dropdown)

---

## Screen 7: Analysis Loading

**Shown for 3-5 seconds while analysis runs**

### Goal
Student feels intelligence is happening, not just loading.

### User Emotion
"Something smart is happening behind the scenes."

### Main CTA
None (non-interactive state)

### Success State
```
┌─────────────────────────────────────────┐
│ Analyzing Data Structures...            │
│                                         │
│ ⚡ Scanning 1,831 questions...         │
│ 🔍 Identifying topics...               │
│ 📊 Calculating unit distribution...    │
│ 🎯 Finding high probability topics...  │
│                                         │
│ [Progress bar: ████████░░░ 80%]        │
└─────────────────────────────────────────┘
```

**Animation**: Sequential appearance, not all at once  
**Timing**: Each step appears 0.8s apart

### Empty State
N/A (only shown during active analysis)

### Loading State
This IS the loading state

---

## Screen 8: Analysis Results (THE CORE SCREEN)

**This is where PaperIQ delivers its value — prioritizes ACTION over analytics**

### Goal
Student immediately knows what to study and in what order.

### User Emotion
"Perfect. I know exactly what to do. Starting with Priority 1."

### Main CTA
"Start Studying Priority 1" (primary)  
"View All Topics" (secondary)

### Success State

```
┌─────────────────────────────────────────┐
│ Data Structures — Study Plan            │
├─────────────────────────────────────────┤
│ 💡 Time saved: 4-6 hours of manual      │
│    analysis you would have done         │
├─────────────────────────────────────────┤
│                                         │
│ 📚 RECOMMENDED STUDY ORDER              │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Priority 1: Unit I                  ││
│ │ 34.3% of exam (273 questions)       ││
│ │                                     ││
│ │ Start with:                         ││
│ │ • Arrays & Linked Lists (87q)       ││
│ │ • Stacks & Queues (64q)             ││
│ │ • Hashing (48q)                     ││
│ │                                     ││
│ │ Why study this first:               ││
│ │ "Appears in every single exam.      ││
│ │ Master this, you secure 34% marks." ││
│ │                                     ││
│ │ [Start Studying Unit I →]           ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Priority 2: Unit IV                 ││
│ │ 20.4% of exam (164 questions)       ││
│ │                                     ││
│ │ Start with:                         ││
│ │ • Binary Search Trees (52q)         ││
│ │ • Graph Algorithms (38q)            ││
│ │ • Tree Traversals (31q)             ││
│ │                                     ││
│ │ [View Priority 2 Details]           ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Priority 3: Unit III                ││
│ │ 16.6% of exam                       ││
│ │ [View Priority 3 Details]           ││
│ └─────────────────────────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│ 🔥 HIGH PROBABILITY TOPICS              │
│ These WILL appear on your exam          │
│                                         │
│ 1. Binary Search Trees                  │
│    ⚡ Very High Probability             │
│    📊 52 questions across 10 papers     │
│    ✓ 100% confidence                    │
│                                         │
│ 2. Graph Algorithms                     │
│    ⚡ High Probability                  │
│    📊 38 questions across 8 papers      │
│    ✓ 85% confidence                     │
│                                         │
│ 3. Sorting Algorithms                   │
│    ⚡ High Probability                  │
│    📊 31 questions across 7 papers      │
│    ✓ 80% confidence                     │
│                                         │
│ [View All 10 Topics]                    │
├─────────────────────────────────────────┤
│ 🎯 MOST ASKED TOPICS                    │
│                                         │
│ 1. Arrays & Linked Lists                │
│    87 questions · Very High Priority    │
│                                         │
│ 2. Binary Search Trees                  │
│    64 questions · High Priority         │
│                                         │
│ 3. Stacks & Queues                      │
│    52 questions · High Priority         │
│                                         │
│ [View All 10 Topics]                    │
├─────────────────────────────────────────┤
│ 📊 UNIT COVERAGE                        │
│                                         │
│ Unit I    ████████████████ 34.3%       │
│ Unit IV   ████████ 20.4%               │
│ Unit III  ██████ 16.6%                 │
│ Unit V    ████████ 18.6%               │
│ Unit II   ████ 10.1%                   │
├─────────────────────────────────────────┤
│ 🔁 REPEATED QUESTIONS                   │
│ These appeared multiple times           │
│                                         │
│ [5x] Explain difference between         │
│      stack and queue                    │
│                                         │
│ [4x] Define BST and its operations      │
│                                         │
│ [View All Repeated Questions]           │
├─────────────────────────────────────────┤
│ ⚙️ Advanced Analytics (collapsed)       │
│ [Show Classification Data, Coverage %,  │
│  Question Distribution Details]         │
└─────────────────────────────────────────┘
```

### Empty State (should never happen if backend works)
```
┌─────────────────────────────────────────┐
│ No analysis data available              │
│                                         │
│ This subject hasn't been analyzed yet.  │
│ Try selecting a different subject.      │
│                                         │
│ [Go Back]                               │
└─────────────────────────────────────────┘
```

### Loading State
Shown during initial render (covered by Screen 7)

---

## Screen 9: Paper Browser (Future)

### Goal
Student can view and download specific previous papers.

### User Emotion
"I want to see the actual papers now that I know what to focus on."

### Main CTA
"Download Paper"

### Success State
```
┌─────────────────────────────────────────┐
│ Data Structures — Papers (72)           │
├─────────────────────────────────────────┤
│ Filter: [All] [Mid-1] [Mid-2] [Sem]    │
│ Sort:   [Newest First ▼]               │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📄 A6CS05 — Mid-1 (May 2024)       ││
│ │    10 questions                      ││
│ │    [View] [Download]                 ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📄 A6CS05 — Semester (Dec 2023)     ││
│ │    12 questions                      ││
│ │    [View] [Download]                 ││
│ └─────────────────────────────────────┘│
│    ...                                  │
└─────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────┐
│ No papers found                         │
│                                         │
│ Papers for this subject are being       │
│ collected. Check back soon!             │
└─────────────────────────────────────────┘
```

### Loading State
Skeleton cards (3 rows)

---

## Screen 10: Study Planner (Future)

### Goal
Student gets week-by-week study plan.

### User Emotion
"I have a clear roadmap. I know what to do each week."

### Main CTA
"Start Week 1"

### Success State
```
┌─────────────────────────────────────────┐
│ 2-Week Study Plan                       │
│ Data Structures — Exam: June 20         │
├─────────────────────────────────────────┤
│ Week 1: Foundation (June 6-12)         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Day 1-2: Unit I — Arrays & Linked     │
│            Lists (87 questions)         │
│ • Day 3-4: Unit I — Stacks & Queues     │
│            (48 questions)               │
│ • Day 5-6: Unit IV — Binary Trees       │
│            (64 questions)               │
│ • Day 7:   Review + Practice            │
│                                         │
│ [Start Week 1] ✓ Completed              │
├─────────────────────────────────────────┤
│ Week 2: Advanced Topics (June 13-19)   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ • Day 1-2: Unit IV — Graphs (38 q)     │
│ • Day 3-4: Unit III — Sorting (52 q)   │
│ • Day 5-6: Repeated Questions (Top 20) │
│ • Day 7:   Final Mock Test              │
│                                         │
│ [View Details]                          │
└─────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────┐
│ Complete analysis first                 │
│                                         │
│ Study plans are generated from analysis │
│ data. Analyze a subject to continue.    │
│                                         │
│ [Analyze Subject]                       │
└─────────────────────────────────────────┘
```

### Loading State
"Generating your personalized study plan..." (3-5 seconds)

---

## Design System Principles

### Typography
- **Headings**: Space Grotesk, Bold, 24-32px
- **Body**: Geist, Regular, 14-16px
- **Numbers**: DM Mono, Semibold, 18-48px (for stats)

### Colors
- **Background**: `#07070d` (near-black, not pure black)
- **Cards**: `#1a1a1f` (dark gray)
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#a0a0a0` (gray)
- **Accent Orange**: `#f97316` (CTAs, priority badges)
- **Accent Green**: `#10b981` (success states, high confidence)
- **Accent Red**: `#ef4444` (very high priority)
- **Border**: `rgba(255,255,255,0.08)` (subtle)

### Spacing
- **Section gaps**: 24px
- **Card padding**: 20px
- **Button height**: 44px (mobile-friendly)

### Animations
- **Page transitions**: Framer Motion `fadeIn` (300ms)
- **Button press**: Scale 0.97 (100ms spring)
- **Card hover**: translateY(-2px) (150ms ease-out)
- **Loading states**: Skeleton shimmer (1.5s infinite)

### Mobile-First
- All screens designed for 375px width minimum
- Desktop: max-width 1200px, centered
- Touch targets: minimum 44x44px

---

## Backend Capabilities (Constraints)

### What Backend CAN Provide

✅ **Hall Ticket Parsing**:
- Extracts: branch, regulation, year, semester, subject codes
- Returns: subject list with codes + names
- Confidence scoring

✅ **Subject Data**:
- Filter by semester + regulation
- 10 verified R22 CSE subjects ready
- 5,730 total questions

✅ **Analysis Generation**:
- Unit distribution (percentages)
- Most asked topics (top 10 with priorities)
- High probability topics (with evidence + confidence)
- Study priority order (ranked recommendations)
- Repeated questions (frequency analysis)
- Coverage analysis (classification %)

✅ **Exam Category Filtering**:
- All Papers
- Mid-1 only
- Mid-2 only
- Semester only

✅ **Paper Metadata**:
- 72 papers for Data Structures
- Year, exam type, question count

### What Backend CANNOT (Yet) Provide

❌ Study planner generation (future)  
❌ Mock test generation (future)  
❌ Paper PDF downloads (storage not configured)  
❌ Question-level drill-down (no UI for individual questions yet)  
❌ Syllabus coverage mapping (backend exists, UI missing)

---

## UX Writing Guidelines

### Student-Facing Language

**Bad (Technical)**:
- "Query returned 1831 rows"
- "Classification coverage: 0.755"
- "Analysis report generated"

**Good (Student-Focused)**:
- "1,831 questions analyzed"
- "Analysis Coverage: 75%"
- "Analysis complete!"

### Action-Oriented Microcopy

**Bad (Passive)**:
- "Data is being processed"
- "Results are available"
- "Topics have been identified"

**Good (Active)**:
- "Analyzing your papers..."
- "Here's what to study"
- "We found 10 key topics"

### Confidence-Building Language

**Bad (Uncertain)**:
- "This might help"
- "Possibly important"
- "Try studying this"

**Good (Confident)**:
- "Focus on this first"
- "High probability topic"
- "This appeared in 10 papers"

---

## Critical User Flows

### Flow 1: First-Time User (Hall Ticket Path)
```
Landing
  → Signup (Google OAuth, 20s)
    → Onboarding Method Selection (10s)
      → Upload Hall Ticket (10s)
        → Confirmation Screen (10s)
          → Subject Selection (10s)
            → Analysis Loading (5s)
              → Analysis Results (∞)

Total time: ~65 seconds
```

### Flow 2: First-Time User (Manual Path)
```
Landing
  → Signup (20s)
    → Onboarding Method Selection (10s)
      → Manual Entry Step 1 (30s)
        → Manual Entry Step 2 (20s)
          → Subject Selection (10s)
            → Analysis Loading (5s)
              → Analysis Results (∞)

Total time: ~95 seconds
```

### Flow 3: Returning User
```
Login (10s)
  → Subject Hub (default landing)
    → Select Subject (5s)
      → Analysis Loading (5s, or cached instant)
        → Analysis Results (∞)

Total time: ~20 seconds
```

---

## Success Metrics (How We Measure)

### Onboarding Completion Rate
- **Target**: 80%+ complete onboarding
- **Why it matters**: Incomplete profiles = no analysis = no value

### Time to First Insight
- **Target**: <3 minutes from signup to seeing analysis
- **Why it matters**: Speed is our competitive advantage

### Hall Ticket Upload Success Rate
- **Target**: 90%+ successful extractions
- **Why it matters**: Manual entry is slower, lower completion

### Analysis Satisfaction (Post-Beta Survey)
- **Target**: 80%+ students say "insights were useful"
- **Why it matters**: Usefulness = retention = word-of-mouth

### Return Rate (Week 2 exams)
- **Target**: 60%+ students return for second subject
- **Why it matters**: Retention proves product value

---

## Technical Constraints to Respect

### Performance Budget
- **Landing page**: <2s load time
- **Analysis generation**: <5s response time
- **Subject dropdown**: <1s to populate
- **Hall ticket extraction**: <10s total

### Data Accuracy
- **Classification coverage**: 60% minimum (current: 59.9%)
- **Hall ticket confidence**: Display if <80%
- **Topic matching**: Fuzzy match threshold 0.7

### Mobile Responsiveness
- **Breakpoints**: 375px, 768px, 1024px, 1280px
- **Touch targets**: 44x44px minimum
- **Font sizes**: 14px minimum

---

## Stitch Generation Checklist

Before generating ANY screen in Stitch:

- [ ] I understand the complete user journey (10 screens)
- [ ] I know which screen I'm generating (number + name)
- [ ] I know the screen's goal, emotion, and main CTA
- [ ] I have defined success state, empty state, and loading state
- [ ] I know what backend data is available for this screen
- [ ] I know what student pain this screen solves
- [ ] I can articulate the "before PaperIQ" vs "after PaperIQ" for this screen
- [ ] I have approval to proceed with this specific screen

---

## Implementation Strategy

### Phase 1: Core Flow (Screens 1-8)
**Priority**: Critical path to value

1. Landing (1 day)
2. Signup/Login (0.5 days)
3. Onboarding Method Selection (0.5 days)
4. Hall Ticket Upload + Confirmation (1 day)
5. Manual Onboarding (1 day)
6. Subject Selection (0.5 days)
7. Analysis Loading (0.5 days)
8. Analysis Results (2 days)

**Total**: ~7 days for complete MVP flow

### Phase 2: Extensions (Screens 9-10)
**Priority**: Post-beta enhancements

9. Paper Browser (2 days)
10. Study Planner (3 days)

**Total**: +5 days for extended features

---

## Approval Gates

### Gate 1: Journey Approval
**Before any screen generation**:
- User approves complete 10-screen journey
- User approves emotional goals per screen
- User approves main CTAs per screen

### Gate 2: Screen-by-Screen Approval
**Before implementing each screen**:
- Stitch generates screen design
- User approves design matches goals
- User approves state variations (success/empty/loading)

### Gate 3: Integration Approval
**Before deploying**:
- Frontend connected to backend
- All API calls working
- End-to-end flow tested with real data

---

## Key Decisions Made

1. **Hall Ticket Upload is THE hero onboarding experience** (not just an option)
   - Reason: 60%+ time savings, magical auto-detection differentiator
   - Position: Primary, hero-sized CTA with "time saved" callout

2. **Subject Hub is default landing for returning users** (not Analysis Results)
   - Reason: Students need to pick a subject before seeing results
   - Flow: Login → Subject Hub → Pick Subject → Results

3. **Analysis Results prioritizes action over analytics** (Study Order first)
   - Order: Recommended Study Order → High Probability → Most Asked → Unit Coverage → Repeated → Advanced (collapsed)
   - Reason: Students want "what to do" not "what the data says"

4. **Every screen shows "time saved" messaging** (constant reinforcement)
   - Reason: Students should feel the value at every step

5. **No raw question counts visible by default** (hidden in "Advanced")
   - Reason: Students care about insights, not data volume

6. **Mobile-first design** (not desktop-first)
   - Reason: Students use phones more than laptops

7. **Progressive disclosure** (Top 5 → View All)
   - Reason: Prevents cognitive overload

8. **Evidence-based claims** ("52 questions across 10 papers")
   - Reason: Builds trust, reduces skepticism

---

## Next Steps

1. **User reviews this document**
2. **User approves complete journey**
3. **Stitch generates Screen 1 (Landing)**
4. **User approves Screen 1**
5. **Kiro implements Screen 1 (HTML/CSS/React)**
6. **Repeat for Screens 2-8**
7. **End-to-end testing**
8. **Beta deployment**

---

**This document defines the WHAT and WHY.**  
**Stitch generates the HOW (UI design).**  
**Kiro implements the HOW (system architecture).**

**No screen should be generated without referring back to this document.**

---

**Created**: June 5, 2026  
**Status**: Ready for Approval  
**Next Action**: User reviews and approves journey before Stitch generation begins
