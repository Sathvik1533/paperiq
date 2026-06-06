# Screen 03: Dashboard — Stitch Design Prompt

## Context from Previous Screens
- **Authentication approved**: Google OAuth, email/password, password reset
- **Onboarding stepper approved**: Account → Profile → Analysis (with checkmarks, orange highlight, backend-driven state)
- **User has completed onboarding** and is now landing on their first post-login experience

---

## Screen Purpose
The Dashboard is the **first screen a student sees after successful onboarding**. It functions as:
1. **Welcome hub** — greet the user by name, acknowledge their profile
2. **Subject overview** — show all registered subjects with priority indicators
3. **Recent analysis snapshot** — surface the most recent exam analysis or insight
4. **Navigation hub** — clear paths to Analysis Results, Subject Details, Profile Settings
5. **High-priority alerts** — subjects needing attention (low coverage, upcoming exams)

---

## User Mental State on Arrival
- Relief: onboarding is done, no more forms
- Curiosity: "What does this platform actually show me?"
- Urgency: "Which subjects need my attention right now?"
- Confidence: "I can navigate this easily and find what I need"

---

## Design Requirements

### 1. Welcome Section (Top of Page)
**Purpose**: Personal greeting + contextual status

**Content**:
- Greeting: "Welcome back, [First Name]" (warm, not generic)
- Subtext: "Here's your exam intelligence for [Current Semester]" (dynamic from profile)
- Visual indicator: small avatar or initial badge (orange circle with first letter)

**Layout**:
- Left-aligned, above the fold
- DM Mono for name (institutional weight)
- Space Grotesk for "Welcome back"
- White text on #07070d background

**Behavior**:
- Name pulled from `learner_profiles.full_name`
- Semester from `learner_profiles.current_semester`
- If first login after onboarding: add micro-animation (fade-in + slight scale-in, 400ms)

---

### 2. Subject Overview Cards (Primary Content Area)

**Purpose**: Show all registered subjects with real-time priority indicators

**Card Structure** (one per subject):
```
┌─────────────────────────────────────────────┐
│ [Subject Code] Subject Name                 │
│ Priority: [94%] (orange bar indicator)      │
│ Coverage: [124/180 questions analyzed]      │
│ Next Exam: [Mid-Term 2 — 12 days]          │
│ [View Analysis →]                           │
└─────────────────────────────────────────────┘
```

**Data Sources**:
- Subject list: `SELECT DISTINCT subject_code, subject_name FROM questions WHERE regulation = [user.regulation]`
- Priority score: from `report_builder.py` — topic frequency × coverage gaps
- Coverage: count of analyzed questions for this subject
- Next exam: from academic calendar (if available) or `exam_category` field

**Visual Design**:
- Border: `rgba(255, 255, 255, 0.08)` (1px solid)
- Background: `rgba(255, 255, 255, 0.03)` on hover → `rgba(255, 255, 255, 0.05)`
- Border radius: 12px
- Padding: 24px
- Grid layout: 2 columns on desktop, 1 column on mobile

**Priority Indicator**:
- Horizontal bar (orange `#f97316` fill, grey `rgba(255, 255, 255, 0.1)` background)
- Width = priority percentage
- Label: DM Mono, 14px, `#f97316`
- Bar height: 6px, rounded ends

**Card Hover**:
- Border color: `rgba(255, 255, 255, 0.12)`
- Background: `rgba(255, 255, 255, 0.05)`
- "View Analysis →" text color: `#f97316`
- Transition: 150ms ease

**High-Priority Alert** (if priority > 85%):
- Add small orange dot indicator (6px circle) next to subject name
- Tooltip on hover: "High priority — focus here first"

---

### 3. Recent Analysis Snapshot (Right Sidebar on Desktop, Below Cards on Mobile)

**Purpose**: Surface the most recent insight or analysis run

**Content**:
```
┌─────────────────────────────────────────┐
│ Latest Analysis                         │
│ [Subject Code] — [Exam Category]       │
│ Generated: [2 hours ago]               │
│                                         │
│ Top Insight:                            │
│ "DBMS Unit III appears in 88% of      │
│  recent papers — prioritize now."      │
│                                         │
│ [See Full Report →]                    │
└─────────────────────────────────────────┘
```

**Data Source**:
- Query: `SELECT * FROM analysis_sessions ORDER BY created_at DESC LIMIT 1`
- If no analysis yet: show placeholder with "Run your first analysis" CTA

**Visual Design**:
- Same card style as subject cards
- Background: `rgba(255, 255, 255, 0.03)`
- Top insight text: white, 14px, Space Grotesk
- Timestamp: `rgba(255, 255, 255, 0.4)`, DM Mono, 12px

---

### 4. Navigation Paths (Always Visible)

**Primary Actions** (top-right, always accessible):
- "Run New Analysis" (orange button, primary CTA)
- "View All Reports" (ghost button, white border)
- Profile icon (top-right corner, opens dropdown)

**Profile Dropdown** (on icon click):
- Full name
- Email
- "Edit Profile" link
- "Academic Integrity Statement" link
- "Log Out" link

---

### 5. Empty State (First-Time User, No Analysis Yet)

**When to Show**: User completed onboarding but has not run any analysis

**Content**:
```
┌─────────────────────────────────────────┐
│ Your Dashboard is Ready                 │
│                                         │
│ Run your first analysis to see:        │
│ • Subject priority rankings            │
│ • Question frequency patterns          │
│ • Recommended study focus              │
│                                         │
│ [Upload Hall Ticket & Start →]        │
└─────────────────────────────────────────┘
```

**Visual**:
- Centered on page
- Illustration: simple icon of a document + checkmark (not a full illustration, minimal)
- CTA: orange button, 48px height, Space Grotesk 16px
- Subtext: `rgba(255, 255, 255, 0.6)`

---

### 6. Onboarding Stepper Reminder (If Incomplete)

**When to Show**: User logged in but onboarding status ≠ "completed"

**Behavior**:
- Show stepper at top of dashboard (above welcome section)
- Current step highlighted in orange
- Completed steps show checkmarks
- Future steps greyed out
- "Complete your setup to unlock full analysis" subtext
- CTA: "Continue Setup →" (orange, routes to incomplete step)

**Data Source**:
- `learner_profiles.onboarding_status` (values: "account_created", "profile_completed", "analysis_ready", "completed")

---

## Layout Structure (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│ [Logo]                      [Run Analysis] [All Reports] [•] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Welcome back, Sathvik                                      │
│ Here's your exam intelligence for Semester 6               │
│                                                            │
├───────────────────────────────┬────────────────────────────┤
│ [Subject Card 1]              │ Latest Analysis            │
│ [Subject Card 2]              │ [Snapshot Card]            │
│ [Subject Card 3]              │                            │
│ [Subject Card 4]              │                            │
│ [Subject Card 5]              │                            │
│ [Subject Card 6]              │                            │
└───────────────────────────────┴────────────────────────────┘
```

---

## Layout Structure (Mobile)

```
┌────────────────────────────────┐
│ [Logo]                     [•] │
├────────────────────────────────┤
│ Welcome back, Sathvik          │
│ Semester 6 Intelligence        │
├────────────────────────────────┤
│ [Run Analysis Button]          │
│ [All Reports Button]           │
├────────────────────────────────┤
│ Latest Analysis                │
│ [Snapshot Card]                │
├────────────────────────────────┤
│ [Subject Card 1]               │
│ [Subject Card 2]               │
│ [Subject Card 3]               │
│ ...                            │
└────────────────────────────────┘
```

---

## Interaction Patterns

### On First Load
1. Fade-in animation for welcome section (300ms delay)
2. Stagger subject cards (50ms delay per card, top to bottom)
3. Slide-in animation for recent analysis sidebar (400ms delay)

### On Card Click
- Navigate to `/analysis/[subject_code]` (full analysis page for that subject)
- Micro-feedback: card background briefly changes to `rgba(255, 255, 255, 0.08)` for 100ms

### On "Run New Analysis" Click
- Navigate to `/onboarding/analysis` (hall ticket upload screen)
- If user already has a hall ticket: navigate to `/analysis/new`

### On "View All Reports" Click
- Navigate to `/reports` (archive of all past analyses)

---

## Data Fetching Strategy

**On page load**:
```typescript
// Frontend API calls
const user = await fetch('/api/profile/me')  // learner profile
const subjects = await fetch(`/api/subjects?regulation=${user.regulation}`)
const recentAnalysis = await fetch('/api/analysis/recent')
const priorities = await fetch(`/api/analysis/priorities?user_id=${user.id}`)
```

**Backend routes required** (if not yet built):
- `GET /api/profile/me` → returns `learner_profiles` row for logged-in user
- `GET /api/subjects?regulation=R22` → returns distinct subjects for that regulation
- `GET /api/analysis/recent?user_id={id}` → returns most recent analysis session
- `GET /api/analysis/priorities?user_id={id}` → returns subject priority scores

---

## Success Metrics (Four Feelings)

### 1. Confidence
- User sees their name immediately (not "User" or email)
- Subjects listed match their actual enrolled courses
- Priority indicators are non-zero (proof the system has data)

### 2. Relief
- No overwhelming data dump
- Clear "next action" CTAs (Run Analysis, View Report)
- No confusion about where to go next

### 3. Ambition
- High-priority subjects spark "I should focus there"
- Recent insight shows the platform is actively analyzing
- "Run New Analysis" CTA invites immediate action

### 4. Delight
- Smooth animations (not jarring)
- Orange accent sparingly used (CTAs + priority bars only)
- Card hover states feel responsive
- Name greeting feels personal

---

## Implementation Notes (Not Design)

**Stepper persistence**:
- Query `onboarding_status` from `learner_profiles` on every dashboard load
- If status ≠ "completed", render stepper at top with current step highlighted
- Stepper component reads state from backend, not local storage

**Priority calculation**:
- Use `report_builder.py` logic: topic frequency × coverage gap
- Store in `analysis_sessions` table as `priority_score` column (0-100)
- Cache per subject, refresh on new analysis run

**Responsive behavior**:
- Desktop: 2-column subject grid + sidebar
- Tablet: 1-column subject grid + sidebar below
- Mobile: 1-column stack (analysis snapshot → subjects)

---

## Edge Cases

| Case | Behavior |
|------|----------|
| No subjects found for regulation | Show "No subjects available — contact support" message |
| No recent analysis | Show "Run your first analysis" empty state |
| Onboarding incomplete | Show stepper reminder at top |
| First login (< 5 min after signup) | Add "👋 Welcome to PaperIQ" banner above welcome section |
| User clicks subject with no data | Redirect to `/analysis/new` with subject pre-selected |

---

## Visual Reference Screens (Approved Context)

- **Authentication screens**: login, signup, password reset (all dark theme, orange CTA, DM Mono + Space Grotesk)
- **Onboarding stepper**: approved visual in `SCREEN_02.5_AUTHENTICATION_STITCH.md` (orange highlight, checkmarks, 3 steps)
- **Analysis preview cards**: seen in authentication screen mockup (priority score, question count, recommendation)

---

## Final Checklist Before Stitch Generation

- [ ] Name greeting dynamic from `learner_profiles.full_name`
- [ ] Semester pulled from `learner_profiles.current_semester`
- [ ] Subject cards show real priority scores (not hardcoded)
- [ ] Recent analysis snapshot pulls from `analysis_sessions` table
- [ ] Empty state shown if no analysis exists
- [ ] Stepper rendered if onboarding incomplete
- [ ] High-priority subjects (>85%) show orange dot indicator
- [ ] All CTAs route to correct backend endpoints
- [ ] Mobile layout tested (1-column stack)
- [ ] Animations respect `prefers-reduced-motion`

---

## Approved — Ready for Stitch Conversion

This prompt defines the Dashboard screen. When converting to code:
1. Wire subject cards to `/api/subjects` endpoint
2. Wire recent analysis to `/api/analysis/recent` endpoint
3. Wire priority scores to `report_builder.py` calculation
4. Persist stepper state via `learner_profiles.onboarding_status`
5. Ensure all data is backend-driven, not hardcoded

**Do not modify Authentication screens or onboarding stepper design.**
**Proceed to implementation when ready.**
