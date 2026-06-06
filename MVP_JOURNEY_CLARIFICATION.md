# PaperIQ MVP Journey — Final Clarification

**Date**: June 5, 2026  
**Purpose**: Define exact MVP flow based on approved Stitch designs + backend reality  
**Source of Truth**: Approved Stitch designs in Stitch + working backend APIs

---

## Critical Findings from Approved Designs

### ✅ Screen 02 Already Covers Manual Setup Flow

**Verification**: Reading `SCREEN_02_ONBOARDING_PROMPT.md` line-by-line:

**Section: "What Happens After 'Manual Setup' Click"**
```
Screen transitions to form:

Form Design Rules:
1. One question visible at a time (progressive disclosure)
2. Smart defaults based on common patterns
3. Skip logic (don't ask unnecessary questions)

Question Flow:
Q1: Which college?
Q2: Which branch?
Q3: Which regulation?
Q4: Which semester?
Q5: Select your subjects
```

**Conclusion**: ✅ **Manual setup flow IS designed in Screen 02 prompt**

**What's included**:
- Progressive disclosure form (one question at a time)
- 5 questions: college, branch, regulation, semester, subjects
- Smart defaults
- Subject multi-select with "Select All" toggle
- Form validation

**What's NOT included (and needed separately)**:
- CGPA input
- Backlogs count
- Study hours per day
- Upcoming exam type

**Gap Identified**: Backend `/api/profile/onboarding` expects CGPA, backlogs, study hours, exam type. Screen 02 only asks for college/branch/regulation/semester/subjects.

**Resolution**: Screen 02 covers **basic onboarding** (college context). A separate **learner profile** screen is needed for academic details (CGPA, backlogs, study habits).

---

## Authentication Flow — Missing from Approved Designs

**Question**: Where does authentication happen?

**Backend Reality**: Supabase Auth configured in `backend/.env.example`

**Current State**: ❌ No authentication screen designed yet

**Options**:

### Option A: Auth BEFORE Onboarding (Recommended for MVP)
```
Landing → [Sign Up / Login] → Onboarding → Analysis
```

**Pros**: 
- Profile data tied to user_id from start
- No anonymous sessions
- Standard SaaS pattern

**Cons**: 
- Extra step before value delivery

### Option B: Auth AFTER Onboarding (Frictionless)
```
Landing → Onboarding (anonymous) → Analysis → [Sign Up to Save]
```

**Pros**: 
- Faster time-to-value
- Student sees insights before committing

**Cons**: 
- Temporary profiles need cleanup
- More complex state management

### Option C: Auth Embedded in Onboarding
```
Landing → Onboarding Step 1: Email/Password → Onboarding Step 2: Profile
```

**Pros**: 
- Single flow
- No separate auth screen

**Cons**: 
- Mixes concerns

**Recommendation**: **Option A (Auth Before Onboarding)** for MVP

**Rationale**: 
- Cleaner architecture
- Easier to debug
- Standard pattern students expect
- Backend already has user_id in all profile endpoints

**Design Needed**: `Screen 01.5 — Authentication` (Sign Up + Login)

---

## Dashboard vs Direct-to-Analysis Question

**Question**: Should students see a Dashboard before Analysis Results?

**Approved Design**: Screen 02 says "Transition to Screen 3: Dashboard" after onboarding

**Backend Reality**: No dashboard-specific API exists. All APIs are feature-specific (analysis, papers, planner).

**Options**:

### Option A: Dashboard First (Designed in Screen 02)
```
Onboarding → Dashboard → Select Subject → Analysis Loading → Analysis Results
```

**What Dashboard Shows**:
- Welcome message with student name
- List of subjects for their semester
- CTA: "Analyze Subject" per subject card
- Recent activity (if exists)

**Pros**: 
- Gives student orientation
- Shows all subjects at once
- Feels like a proper app

**Cons**: 
- Extra screen before value
- Dashboard has no unique API (just aggregates profile + subjects)

### Option B: Direct to Analysis (Faster Value)
```
Onboarding → Select Subject → Analysis Loading → Analysis Results
```

**Pros**: 
- Immediate value delivery
- 30 seconds from landing to insight
- Fewer screens to design

**Cons**: 
- No home base
- Feels abrupt

**Recommendation**: **Option A (Dashboard First)** for MVP

**Rationale**:
- Screen 02 already promises Dashboard
- Students need orientation after onboarding
- Dashboard serves as navigation hub
- Can be simple (subject list + CTA)

**Design Needed**: `Screen 03 — Dashboard`

---

## Analysis Loading Question

**Question**: Is loading a separate screen or embedded in Analysis Results?

**Backend Reality**: 
- `POST /api/analysis/generate` is synchronous (returns immediately)
- Analysis takes ~2-3 seconds to compute

**Options**:

### Option A: Embedded Loading State
```
Subject Selection → [Analysis Results with loading skeleton] → Data appears
```

**Pros**: 
- Single screen
- Modern pattern (skeleton loaders)
- Feels faster

**Cons**: 
- None

### Option B: Separate Loading Screen
```
Subject Selection → [Full-page loading screen] → Analysis Results
```

**Pros**: 
- Can show educational content during wait
- Feels more "AI is working"

**Cons**: 
- Extra screen
- Feels slower psychologically

**Recommendation**: **Option A (Embedded Loading)** for MVP

**Rationale**:
- Modern UX pattern
- Skeleton loaders feel faster
- No separate screen to design
- Analysis is fast enough (<5s) to not need full-page loader

**Design Impact**: Analysis Results screen includes loading state (skeletons for charts/lists)

---

## The Complete MVP Journey (Final)

### Based on Approved Designs + Backend Reality + Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│                         MVP USER FLOW                           │
└─────────────────────────────────────────────────────────────────┘

UNAUTHENTICATED FLOW:
┌──────────────────┐
│ Screen 01        │  ✅ Designed in Stitch
│ Landing Page     │  → Student clicks "Start Analysis"
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│ Screen 01.5      │  ❌ NOT designed yet — CRITICAL GAP
│ Authentication   │  → Sign Up (email + password) OR Login
└────────┬─────────┘  → Creates user_id in Supabase Auth
         │
         ↓
         
ONBOARDING FLOW (First-time users):
┌──────────────────┐
│ Screen 02A       │  ✅ Designed in Stitch (part of Screen 02)
│ Onboarding       │  → Choose: Hall Ticket Upload OR Manual Setup
│ Method Selection │
└────────┬─────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ↓ (Hall Ticket Path)             ↓ (Manual Path)
┌──────────────────┐              ┌──────────────────┐
│ Screen 02B       │              │ Screen 02C       │
│ Hall Ticket      │  ✅ Designed │ Manual Setup     │  ✅ Designed
│ Confirmation     │  in Stitch   │ Form             │  in Stitch
│                  │              │ (5 questions)    │  (part of Screen 02)
└────────┬─────────┘              └────────┬─────────┘
         │                                 │
         └─────────────────┬───────────────┘
                           │
                           ↓
                  ┌──────────────────┐
                  │ Screen 02D       │  ❌ NOT designed yet — NEEDED
                  │ Learner Profile  │  → CGPA, backlogs, study hours, exam type
                  │ (Academic Info)  │  → Auto-detects skill level
                  └────────┬─────────┘
                           │
                           ↓
                           
AUTHENTICATED EXPERIENCE (Returning users start here):
┌──────────────────┐
│ Screen 03        │  ❌ NOT designed yet — CRITICAL
│ Dashboard        │  → Welcome message + subject list
│ (Home)           │  → "Analyze Subject" CTAs
└────────┬─────────┘
         │
         ↓ Student selects subject
┌──────────────────┐
│ Screen 04        │  ❌ NOT designed yet — CRITICAL
│ Subject Analysis │  → Exam filter: All | Mid-1 | Mid-2 | Semester
│ Results          │  → Loading state (skeleton loaders)
│                  │  → 5 insight sections:
│                  │     1. Unit Distribution
│                  │     2. Most Asked Topics
│                  │     3. High Probability Topics
│                  │     4. Study Priority Order
│                  │     5. Repeated Questions
└────────┬─────────┘
         │
         ↓ Student clicks "View Papers"
┌──────────────────┐
│ Screen 05        │  ❌ NOT designed yet — USEFUL
│ Paper Browser    │  → Filter: Year, Exam Type, Exam Category
│                  │  → Paper cards with question count
│                  │  → Click → View questions
└──────────────────┘
```

---

## Screen Status Summary

### ✅ Designed in Stitch (3 screens)
1. **Screen 01 — Landing Page** (approved)
2. **Screen 02A — Onboarding Method Selection** (approved, part of Screen 02)
3. **Screen 02B — Hall Ticket Confirmation** (approved, part of Screen 02)
4. **Screen 02C — Manual Setup Form** (approved, part of Screen 02)

### ❌ NOT Designed — Blocking MVP (3 screens)
5. **Screen 01.5 — Authentication** (Sign Up + Login)
6. **Screen 02D — Learner Profile** (CGPA, backlogs, study hours)
7. **Screen 03 — Dashboard** (home screen with subject list)
8. **Screen 04 — Subject Analysis Results** (main value delivery)

### ❌ NOT Designed — Useful but Not Blocking (1 screen)
9. **Screen 05 — Paper Browser** (explore past papers)

---

## Critical Gaps Identified

### Gap 1: Authentication (Blocks Everything)
**Screen**: 01.5 — Authentication  
**Why Critical**: Backend requires user_id for all profile operations  
**What's Needed**: 
- Sign Up form (email, password, confirm password)
- Login form (email, password)
- "Forgot Password" flow
- OAuth (Google) — optional for MVP
- Error handling (email exists, wrong password)

**Backend Ready**: ✅ Supabase Auth configured

---

### Gap 2: Learner Profile / Academic Details (Blocks Analysis Quality)
**Screen**: 02D — Learner Profile  
**Why Critical**: Backend `/api/profile/onboarding` needs CGPA, backlogs, study hours to auto-detect skill level  
**What's Needed**:
- CGPA input (0.0 - 10.0)
- Backlogs count (integer)
- Study hours per day (1-12 slider)
- Upcoming exam type (Mid-1, Mid-2, Semester)
- Auto-detection message: "Based on your 8.2 CGPA and 0 backlogs, we've set your skill level to Advanced"

**Backend Ready**: ✅ `POST /api/profile/onboarding`

**Screen 02 Coverage**: ❌ Only covers college/branch/regulation/semester/subjects (basic context)

**Resolution**: Add Screen 02D after Screen 02C/02B

---

### Gap 3: Dashboard (Navigation Hub)
**Screen**: 03 — Dashboard  
**Why Critical**: Students need a home screen after onboarding  
**What's Needed**:
- Welcome header: "Welcome back, Sathvik!"
- Semester indicator: "Semester 4 (R22 CSE)"
- Subject cards (3-5 subjects for current semester)
- Per-subject: "Analyze" button, "View Papers" button
- Recent activity (optional for MVP)

**Backend Ready**: ✅ `GET /api/profile/{user_id}/subjects`

---

### Gap 4: Subject Analysis Results (Core Value)
**Screen**: 04 — Subject Analysis Results  
**Why Critical**: This is THE product — the main value delivery  
**What's Needed**:
- Subject selector (if coming from dashboard, pre-selected)
- Exam filter: All Papers | Mid-1 | Mid-2 | Semester
- "Analyze" button
- Loading state: skeleton loaders for charts/lists
- **5 Insight Sections**:
  1. Unit Distribution chart (percentage bars)
  2. Most Asked Topics list (top 10 with priority badges)
  3. High Probability Topics (with evidence: "52 questions across 10 papers")
  4. Study Priority Order (week-by-week timeline)
  5. Repeated Questions (toggle to show full list)
- Error state with retry
- Empty state if no data

**Backend Ready**: ✅ `POST /api/analysis/generate`

---

## Revised MVP Screen Priority

### Phase 1: Authentication & Onboarding (Week 1)
1. ✅ **Screen 01 — Landing** (implement from approved Stitch)
2. ⚠️ **Screen 01.5 — Authentication** (design in Stitch, then implement)
3. ✅ **Screen 02A — Method Selection** (implement from approved Stitch)
4. ✅ **Screen 02B — Hall Ticket Confirmation** (implement from approved Stitch)
5. ✅ **Screen 02C — Manual Setup** (implement from approved Stitch)
6. ⚠️ **Screen 02D — Learner Profile** (design in Stitch, then implement)

**Deliverable**: Student can sign up and complete full onboarding

---

### Phase 2: Core Experience (Week 2)
7. ⚠️ **Screen 03 — Dashboard** (design in Stitch, then implement)
8. ⚠️ **Screen 04 — Subject Analysis** (design in Stitch, then implement)

**Deliverable**: Student can analyze a subject and see insights

---

### Phase 3: Paper Discovery (Week 3)
9. **Screen 05 — Paper Browser** (design in Stitch, then implement)

**Deliverable**: Student can explore past papers

---

### Phase 4: Beta Testing (Week 4)
- Deploy Screens 01 - 04 to staging
- 10 students test full flow
- Collect feedback
- Iterate

---

## Single Highest-Priority Next Screen

### ⚠️ **Screen 01.5 — Authentication (Sign Up + Login)**

**Why This is #1 Priority**:
1. **Blocks everything**: Cannot store profiles without user_id
2. **Backend dependency**: All APIs expect authenticated user_id
3. **Foundation layer**: Every other screen assumes user is authenticated
4. **Standard pattern**: Students expect auth before personal data
5. **Cleanest flow**: Auth → Onboarding → Analysis (no anonymous sessions)

**What It Needs**:
- Sign Up form
- Login form
- Password requirements
- Error handling
- Success → redirect to onboarding (new users) or dashboard (returning users)

**Backend Ready**: ✅ Supabase Auth fully configured

**After This**: Screen 02D (Learner Profile) → Screen 03 (Dashboard) → Screen 04 (Analysis)

---

## Backend-Frontend Mapping (Final)

| Screen | Stitch Status | Backend Endpoint | Status |
|--------|--------------|------------------|--------|
| 01 — Landing | ✅ Designed | N/A (static) | ✅ Ready |
| 01.5 — Auth | ❌ Missing | Supabase Auth | ✅ Ready |
| 02A — Method | ✅ Designed | N/A (client-side choice) | ✅ Ready |
| 02B — Hall Ticket | ✅ Designed | `POST /api/onboarding/parse-hall-ticket` | ✅ Ready |
| 02C — Manual | ✅ Designed | `POST /api/onboarding/manual` | ✅ Ready |
| 02D — Profile | ❌ Missing | `POST /api/profile/onboarding` | ✅ Ready |
| 03 — Dashboard | ❌ Missing | `GET /api/profile/{user_id}/subjects` | ✅ Ready |
| 04 — Analysis | ❌ Missing | `POST /api/analysis/generate` | ✅ Ready |
| 05 — Papers | ❌ Missing | `GET /api/papers` | ✅ Ready |

---

## Conclusion

### ✅ What's Clear Now

1. **Screen 02 Manual Setup IS designed** — no separate Screen 02C needed
2. **Authentication is missing** — blocking everything, highest priority
3. **Learner Profile is missing** — needed for CGPA/backlogs/skill level
4. **Dashboard is missing** — needed as navigation hub
5. **Analysis Results is missing** — core value delivery screen

### ⚠️ Immediate Action Required

**Generate Stitch Prompt for Screen 01.5 — Authentication**

**After Authentication**:
- Generate Screen 02D — Learner Profile
- Generate Screen 03 — Dashboard
- Generate Screen 04 — Subject Analysis Results
- Implement all screens together

### 📊 MVP Readiness

**Current**: 4/9 screens designed (44%)  
**Blocking MVP**: 4 screens missing (Authentication, Learner Profile, Dashboard, Analysis)  
**Timeline**: 2 weeks to design + 2 weeks to implement = 4 weeks to beta

---

**Created**: June 5, 2026  
**Source of Truth**: Approved Stitch designs + Backend API verification  
**Next Action**: Generate `SCREEN_01.5_AUTHENTICATION_PROMPT.md`
