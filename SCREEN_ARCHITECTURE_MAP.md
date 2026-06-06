# PaperIQ Complete Screen Architecture Map

**Date**: June 5, 2026  
**Purpose**: Map ALL screens against actual backend capabilities  
**Status**: Based on verified backend APIs and production database

---

## Context Summary

**Backend Status**:
- ✅ All 10 R22 CSE subjects validated and working
- ✅ 5,730 questions across 72 papers (2021-2025)
- ✅ Analysis pipeline complete (7 features tested)
- ✅ Onboarding API complete (manual + hall ticket)
- ✅ Profile API complete (learner profiling)
- ✅ Planner API complete (study plans, readiness, mock exams)
- ✅ Papers API complete (browser with questions)
- ✅ Questions API complete (filters, evidence trail)

**Stitch Progress**:
- ✅ Screen 01 — Landing Page (designed, approved)
- ✅ Screen 02A — Onboarding Method Selection (designed, approved)
- ✅ Screen 02B — Hall Ticket Confirmation (designed, approved)

---

## Screen Categories

### ✅ Designed in Stitch (Ready for Implementation)
Screens with approved Stitch prompts

### 🔧 Backend Ready (Needs Stitch Design)
Screens with working backend but no Stitch design yet

### 🚧 MVP Critical (Build Next)
Screens required for beta student testing

### 📦 Post-Beta (Defer)
Screens not needed for initial student validation

---

## Complete Screen Inventory

### **PUBLIC SCREENS** (Unauthenticated)

#### ✅ Screen 01: Landing Page
**Stitch Status**: Designed & Approved  
**Backend**: Not applicable (static marketing)  
**Purpose**: First impression, value proposition, CTA  
**Priority**: ✅ MVP Critical  
**Files**: `SCREEN_01_LANDING_PROMPT.md`

**Features**:
- Hero section with exam confidence theme
- Social proof (testimonial)
- Feature showcase (3 cards)
- CTA → Start Analysis

**Next Action**: Implement in frontend

---

### **ONBOARDING FLOW** (First-time users)

#### ✅ Screen 02A: Onboarding Method Selection
**Stitch Status**: Designed & Approved  
**Backend**: `/api/onboarding/parse-hall-ticket`, `/api/onboarding/manual`  
**Purpose**: Choose hall ticket upload vs manual entry  
**Priority**: ✅ MVP Critical  
**Files**: `SCREEN_02_ONBOARDING_PROMPT.md`

**Backend Endpoints Ready**:
- `POST /api/onboarding/parse-hall-ticket` — PDF/image OCR extraction
- `POST /api/onboarding/manual` — Manual profile creation

**Features**:
- Two-path layout (upload primary, manual secondary)
- Hall ticket upload (PDF, JPG, PNG)
- Manual setup button
- Trust indicators

**Next Action**: Implement in frontend

---

#### ✅ Screen 02B: Hall Ticket Confirmation
**Stitch Status**: Designed & Approved  
**Backend**: `/api/onboarding/confirm-hall-ticket`, `/api/profile/{user_id}/subjects`  
**Purpose**: Review and confirm extracted hall ticket data  
**Priority**: ✅ MVP Critical

**Backend Endpoints Ready**:
- `POST /api/onboarding/confirm-hall-ticket` — Save confirmed profile
- `GET /api/profile/{user_id}/subjects` — Get subjects for semester

**Features**:
- Display extracted: college, branch, regulation, semester
- Subject checklist (auto-populated)
- Edit mode for corrections
- Confirm & Continue button

**Next Action**: Implement in frontend

---

#### 🔧 Screen 02C: Manual Onboarding Form
**Stitch Status**: NOT designed  
**Backend**: `/api/onboarding/manual`, `/api/profile/onboarding`  
**Purpose**: Multi-step form for manual profile creation  
**Priority**: 🚧 MVP Critical

**Backend Endpoints Ready**:
- `POST /api/profile/onboarding` — Simplified onboarding (auto-infers context)
  - Input: user_id, current_semester, current_cgpa, backlogs_count, upcoming_exam_type, study_hours_per_day
  - Output: learner_profile with auto-detected skill level
- `GET /api/profile/{user_id}/subjects` — Get subjects for semester

**Missing**: Stitch design for progressive disclosure form

**Features Needed**:
- Progressive disclosure (one question at a time)
- Q1: Semester selection
- Q2: CGPA input
- Q3: Backlogs count
- Q4: Upcoming exam type (Mid-1, Mid-2, Semester)
- Q5: Study hours per day
- Auto-detection of skill level from CGPA/backlogs
- Subject multi-select with "Select All" toggle

**Next Action**: ⚠️ **HIGHEST PRIORITY — Design this screen next**

---

### **CORE EXPERIENCE SCREENS** (Authenticated users)

#### 🔧 Screen 03: Dashboard / Home
**Stitch Status**: NOT designed  
**Backend**: `/api/profile/{user_id}`, `/api/profile/{user_id}/subjects`, `/api/analysis/cached`  
**Purpose**: Student's personalized home screen after onboarding  
**Priority**: 🚧 MVP Critical

**Backend Endpoints Ready**:
- `GET /api/profile/{user_id}` — Get learner profile
- `GET /api/profile/{user_id}/subjects` — Get user's subjects
- `GET /api/analysis/cached` — Check for existing analysis reports
- `GET /api/readiness` — Latest readiness score

**Features Needed**:
- Welcome header with student name
- Current semester subjects (cards or list)
- Quick actions: "Analyze Subject", "View Papers", "Start Study Plan"
- Readiness score indicator (if available)
- Recent activity feed

**Next Action**: Design in Stitch after Screen 02C

---

#### 🔧 Screen 04: Subject Analysis
**Stitch Status**: NOT designed (beta version exists in code)  
**Backend**: `/api/analysis/generate`, `/api/analysis/simple`  
**Purpose**: Main analysis results screen (replaces BetaAnalysis.tsx)  
**Priority**: 🚧 MVP Critical

**Backend Endpoints Ready**:
- `POST /api/analysis/generate` — Synchronous analysis (full control)
- `POST /api/analysis/simple` — Simplified analysis (auto-infers from profile)

**Backend Returns**:
```json
{
  "unit_distribution_classified": {
    "Unit I": 34.3,
    "Unit II": 10.1,
    "Unit III": 16.6,
    "Unit IV": 20.4,
    "Unit V": 18.6
  },
  "most_asked_topics": [
    {"topic": "Arrays", "count": 87, "priority": "Very High"},
    {"topic": "Binary Search Trees", "count": 64, "priority": "High"}
  ],
  "high_probability_topics_classified": [
    {
      "topic": "Binary Search Trees",
      "question_count": 52,
      "paper_count": 10,
      "probability": "Very High",
      "confidence": 1.0
    }
  ],
  "study_priority_order": [
    {
      "unit": "Unit I",
      "percentage": 34.3,
      "question_count": 273,
      "top_topics": ["Arrays", "Linked Lists", "Stacks"]
    }
  ],
  "repeated_questions": [...],
  "coverage_analysis": {
    "classification_coverage": 0.755,
    "total_questions": 1831
  }
}
```

**Features Needed**:
- Subject selector (dropdown)
- Exam filter (All Papers | Mid-1 | Mid-2 | Semester)
- **5 Analysis Sections**:
  1. Unit Distribution (percentage bars)
  2. Most Asked Topics (top 10 with priority badges)
  3. High Probability Topics (with evidence: "52 questions across 10 papers")
  4. Study Priority Order (week-by-week recommendations)
  5. Repeated Questions (toggle to reveal full list)
- Loading state with progress indicator
- Error state with retry
- Empty state if no data

**Design Principles**:
- Student-facing language (NOT "1831 rows returned")
- Evidence-based (show question count + paper count)
- Priority indicators (color-coded badges)
- Progressive disclosure (top 5 by default, "View All" button)
- Mobile-first layout

**Next Action**: Design in Stitch after Dashboard

---

#### 📦 Screen 05: Study Planner
**Stitch Status**: NOT designed  
**Backend**: `/api/planner/generate`, `/api/planner/{plan_id}`  
**Purpose**: Generate and display personalized study plan  
**Priority**: 📦 Post-Beta (nice-to-have)

**Backend Endpoints Ready**:
- `POST /api/planner/generate` — Generate study plan from analysis
  - Input: report_id, exam_date, hours_per_day, target_grade, regulation, syllabus_id, subject_id
  - Output: daily_plan, priority_map, warnings
- `GET /api/planner/{plan_id}` — Fetch stored plan

**Backend Returns**:
```json
{
  "plan_id": "uuid",
  "daily_plan": [
    {
      "day": 1,
      "date": "2026-06-01",
      "topics": ["Arrays", "Linked Lists"],
      "estimated_hours": 4.0,
      "priority": "High"
    }
  ],
  "total_days": 30,
  "study_days": 28,
  "warnings": ["Only 30 days until exam — aggressive schedule recommended"]
}
```

**Features Needed**:
- Exam date picker
- Hours per day slider
- Target grade selector
- Generated calendar view (day-by-day)
- Topic cards with checkboxes (mark complete)
- Progress tracking

**Next Action**: Defer to post-beta

---

#### 📦 Screen 06: Readiness Score
**Stitch Status**: NOT designed  
**Backend**: `/api/readiness/calculate`, `/api/readiness`  
**Purpose**: Calculate and display exam readiness  
**Priority**: 📦 Post-Beta

**Backend Endpoints Ready**:
- `POST /api/readiness/calculate` — Calculate readiness score
  - Input: user_id, subject_id, regulation, study_plan_id (optional)
  - Output: score (0-100), grade_prediction, factors breakdown
- `GET /api/readiness` — Latest readiness score

**Backend Returns**:
```json
{
  "score": 72.5,
  "grade_prediction": "A",
  "factors": {
    "coverage": 0.8,
    "consistency": 0.7,
    "recent_activity": 0.65
  }
}
```

**Features Needed**:
- Radial progress indicator (0-100)
- Grade prediction badge (A/B/C)
- Factors breakdown with explanations
- Historical trend chart
- Recommendations to improve score

**Next Action**: Defer to post-beta

---

#### 📦 Screen 07: Mock Exam
**Stitch Status**: NOT designed  
**Backend**: `/api/mock/generate`, `/api/mock/{mock_id}`  
**Purpose**: Generate and take AI-generated mock exam  
**Priority**: 📦 Post-Beta

**Backend Endpoints Ready**:
- `POST /api/mock/generate` — Generate mock exam
  - Input: report_id, regulation, subject_id
  - Output: questions (Part A + Part B), total_marks
- `GET /api/mock/{mock_id}` — Fetch stored mock

**Backend Returns**:
```json
{
  "mock_id": "uuid",
  "questions": [
    {
      "part": "A",
      "question_number": 1,
      "question_text": "Explain the difference between stack and queue",
      "marks": 2,
      "unit": "Unit I",
      "topic": "Stacks"
    }
  ],
  "total_marks": 100,
  "part_a_count": 10,
  "part_b_count": 5
}
```

**Features Needed**:
- Mock exam generation button
- Timer (3 hours)
- Question display (Part A + Part B sections)
- Answer input (text areas)
- Submit and auto-grade (future enhancement)
- Results page with correct answers

**Next Action**: Defer to post-beta

---

#### 🔧 Screen 08: Paper Browser
**Stitch Status**: NOT designed  
**Backend**: `/api/papers`, `/api/papers/{paper_id}/questions`  
**Purpose**: Browse past papers with filters  
**Priority**: 🚧 MVP Critical

**Backend Endpoints Ready**:
- `GET /api/papers` — List papers with filters
  - Filters: subject_id, year, exam_type, exam_category, regulation
  - Returns: papers with `parsed_questions` array (B7 fix applied)
- `GET /api/papers/{paper_id}` — Single paper details
- `GET /api/papers/{paper_id}/questions` — Questions for paper

**Backend Returns**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Data Structures - Mid-1 - May 2024",
      "exam_year": 2024,
      "exam_month": "May",
      "exam_type": "Mid",
      "exam_category": "Mid-1",
      "regulation": "R22",
      "max_marks": 50,
      "parsed_questions": [
        {
          "question_number": 1,
          "part": "A",
          "question_text": "Define stack",
          "marks": 2
        }
      ]
    }
  ]
}
```

**Features Needed**:
- Filter sidebar: Year, Exam Type, Exam Category
- Paper grid/list view
- Paper card: title, year, marks, question count
- Click paper → view questions
- Download PDF button (if available)
- Search questions within paper

**Next Action**: Design in Stitch after Analysis screen

---

#### 📦 Screen 09: Question Bank
**Stitch Status**: NOT designed  
**Backend**: `/api/questions`, `/api/questions/{question_id}`  
**Purpose**: Browse individual questions with filters  
**Priority**: 📦 Post-Beta

**Backend Endpoints Ready**:
- `GET /api/questions` — List questions with filters
  - Filters: subject_id, paper_id, question_type, marks, section
- `GET /api/questions/{question_id}` — Single question with evidence trail

**Backend Returns**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "question_text": "Explain the difference between stack and queue",
    "marks": 2,
    "part": "A",
    "unit_number": 1,
    "topic_name": "Stacks",
    "evidence": {
      "paper_id": "uuid",
      "paper_title": "Data Structures - Mid-1 - May 2024",
      "exam_year": 2024,
      "original_url": "https://..."
    }
  }
}
```

**Features Needed**:
- Filter by: topic, unit, marks, question type
- Question card with evidence trail
- "Show similar questions" feature
- Save to favorites
- Practice mode (self-test)

**Next Action**: Defer to post-beta

---

#### 📦 Screen 10: Profile / Settings
**Stitch Status**: NOT designed  
**Backend**: `/api/profile/{user_id}`, `/api/profile/{user_id}/refresh`  
**Purpose**: View and edit student profile  
**Priority**: 📦 Post-Beta

**Backend Endpoints Ready**:
- `GET /api/profile/{user_id}` — Get learner profile
- `POST /api/profile/{user_id}/refresh` — Refresh profile computation
- `GET /api/profile/{user_id}/context` — Get academic context

**Backend Returns**:
```json
{
  "success": true,
  "data": {
    "college_id": "uuid",
    "branch_id": "uuid",
    "regulation": "R22",
    "current_semester": 4,
    "current_cgpa": 8.2,
    "target_cgpa": 8.5,
    "detected_skill_level": "Advanced",
    "study_hours_per_day": 4.0
  }
}
```

**Features Needed**:
- Profile summary card
- Edit profile form
- Change semester
- Update CGPA
- Adjust study hours
- Delete account

**Next Action**: Defer to post-beta

---

## Screen Priority Matrix

### 🚧 MVP Critical (Beta Testing Blockers)
Must be built for student beta testing:

1. ✅ **Screen 01 — Landing** (designed, approved)
2. ✅ **Screen 02A — Onboarding Method** (designed, approved)
3. ✅ **Screen 02B — Hall Ticket Confirmation** (designed, approved)
4. ⚠️ **Screen 02C — Manual Onboarding Form** (NOT designed — **BUILD NEXT**)
5. ⚠️ **Screen 03 — Dashboard** (NOT designed — **BUILD AFTER 02C**)
6. ⚠️ **Screen 04 — Subject Analysis** (NOT designed — **BUILD AFTER DASHBOARD**)
7. ⚠️ **Screen 08 — Paper Browser** (NOT designed — **BUILD AFTER ANALYSIS**)

### 📦 Post-Beta (Nice-to-Have)
Can be deferred after initial student validation:

8. **Screen 05 — Study Planner** (backend ready, defer design)
9. **Screen 06 — Readiness Score** (backend ready, defer design)
10. **Screen 07 — Mock Exam** (backend ready, defer design)
11. **Screen 09 — Question Bank** (backend ready, defer design)
12. **Screen 10 — Profile Settings** (backend ready, defer design)

---

## Backend-Frontend Gap Analysis

### ✅ Zero Gap (Backend + Stitch Design Complete)
- Screen 01 — Landing Page
- Screen 02A — Onboarding Method Selection
- Screen 02B — Hall Ticket Confirmation

### ⚠️ High Gap (Backend Ready, Stitch Design Missing)
- **Screen 02C — Manual Onboarding Form** ← **HIGHEST PRIORITY**
- **Screen 03 — Dashboard**
- **Screen 04 — Subject Analysis**
- **Screen 08 — Paper Browser**

### 📦 Low Priority Gap (Backend Ready, Can Defer)
- Screen 05 — Study Planner
- Screen 06 — Readiness Score
- Screen 07 — Mock Exam
- Screen 09 — Question Bank
- Screen 10 — Profile Settings

---

## Technical Implementation Notes

### Authentication
- **Provider**: Supabase Auth (already configured)
- **Flow**: Email + password OR OAuth (Google)
- **Session**: JWT stored in cookie
- **Protected routes**: All screens except Screen 01 (Landing)

### State Management
- **User profile**: Context API or Zustand
- **Analysis data**: React Query (caching + refetching)
- **Form state**: React Hook Form

### API Client
- **Location**: `frontend/src/lib/api.ts`
- **Base URL**: `http://localhost:8000/api/v1` (dev), Railway URL (prod)
- **Error handling**: Axios interceptors
- **Type safety**: TypeScript interfaces from backend Pydantic models

### UI Library
- **Component library**: shadcn/ui (already used in landing page)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts (for unit distribution, priority bars)
- **Animations**: Framer Motion (for page transitions, loading states)

---

## Screen Build Order Recommendation

### Phase 1: Onboarding Complete (Week 1)
1. ✅ Screen 01 — Landing (implement from Stitch design)
2. ✅ Screen 02A — Onboarding Method (implement from Stitch design)
3. ✅ Screen 02B — Hall Ticket Confirmation (implement from Stitch design)
4. ⚠️ **Screen 02C — Manual Onboarding Form** (design in Stitch first, then implement)

**Goal**: Students can complete onboarding via hall ticket OR manual entry

---

### Phase 2: Core Experience (Week 2)
5. **Screen 03 — Dashboard** (design in Stitch, then implement)
6. **Screen 04 — Subject Analysis** (design in Stitch, then implement)

**Goal**: Students can analyze their subjects and see actionable insights

---

### Phase 3: Paper Discovery (Week 3)
7. **Screen 08 — Paper Browser** (design in Stitch, then implement)

**Goal**: Students can browse past papers and questions

---

### Phase 4: Beta Testing (Week 4)
- Deploy Screens 01-04, 08 to staging
- Recruit 10 beta students
- Collect feedback on insights quality
- Iterate on UI/UX based on student feedback

---

### Phase 5: Post-Beta Enhancements (After Student Validation)
- Screen 05 — Study Planner
- Screen 06 — Readiness Score
- Screen 07 — Mock Exam
- Screen 09 — Question Bank
- Screen 10 — Profile Settings

**Goal**: Ship advanced features after core experience validated

---

## Next Immediate Action

### ⚠️ Design Screen 02C — Manual Onboarding Form

**Why**: Blocking path for students who don't have hall ticket

**Backend Endpoint**: `POST /api/profile/onboarding` (already working)

**Design Requirements**:
- Progressive disclosure (one question at a time)
- Smart defaults (current semester based on date)
- Auto-detection of skill level from CGPA/backlogs
- Subject multi-select with "Select All"
- Mobile-first design
- Match visual style of Screen 02A/02B

**Stitch Prompt Deliverable**: `SCREEN_02C_MANUAL_ONBOARDING_PROMPT.md`

**After Design**: Implement Screens 01, 02A, 02B, 02C together in frontend

---

## Success Metrics

### MVP Beta Launch (Target: Week 4)
- [ ] 7 screens designed in Stitch
- [ ] 7 screens implemented in frontend
- [ ] 10 students complete onboarding
- [ ] 10 students view analysis for at least 1 subject
- [ ] 8/10 students find insights useful (survey)
- [ ] Zero critical bugs in core flow

### Post-Beta (Target: Week 8)
- [ ] 5 additional screens designed
- [ ] 5 additional screens implemented
- [ ] 50+ students using PaperIQ regularly
- [ ] <5 second analysis load time
- [ ] >80% mobile usability rating

---

## Files Referenced in This Document

**Stitch Prompts Created**:
- ✅ `SCREEN_01_LANDING_PROMPT.md`
- ✅ `SCREEN_02_ONBOARDING_PROMPT.md` (covers 02A + 02B)
- ⚠️ `SCREEN_02C_MANUAL_ONBOARDING_PROMPT.md` (TO BE CREATED)

**Backend API Files**:
- ✅ `backend/app/api/analysis.py`
- ✅ `backend/app/api/profile.py`
- ✅ `backend/app/api/onboarding.py`
- ✅ `backend/app/api/papers.py`
- ✅ `backend/app/api/planner.py`
- ✅ `backend/app/api/questions.py`

**Validation Reports**:
- ✅ `MVP_VERIFICATION_REPORT.md` (backend validation)
- ✅ `BETA_STUDENT_EXPERIENCE.md` (student flow)
- ✅ `BETA_TESTING_GUIDE.md` (testing instructions)

---

## Conclusion

**Current State**:
- ✅ 3 screens designed in Stitch (approved)
- ✅ Backend fully ready for 10 screens (all APIs working)
- ✅ Database validated (5,730 questions, 3,433 classified)
- ⚠️ 4 screens blocking MVP beta launch (need Stitch design)
- 📦 5 screens deferred to post-beta (backend ready, design later)

**Highest Priority**:
**Screen 02C — Manual Onboarding Form** (blocking onboarding flow)

**Recommendation**:
Generate `SCREEN_02C_MANUAL_ONBOARDING_PROMPT.md` next, then proceed with Screen 03 (Dashboard) and Screen 04 (Subject Analysis) designs.

After 7 core screens designed → implement all 7 together → beta test with students → iterate based on feedback → add post-beta screens.

---

**Created**: June 5, 2026  
**Status**: Complete backend mapping ✅  
**Next Step**: Design Screen 02C in Stitch  
