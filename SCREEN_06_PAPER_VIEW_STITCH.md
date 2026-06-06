# Screen 06: Individual Paper View — Stitch Design Prompt

## Context from Previous Screens
- **Papers Browser approved**: Filter sidebar, 2-column grid, paper cards with metadata
- **Analysis Results approved**: Priority scores, topic frequency, unit distribution
- **User journey**: Papers Browser → clicks "View Paper" on a card → lands here

---
## Responsive Breakpoints (ALL Screens)
- **Desktop**: 1280×1024+
- **Tablet**: 768×1024
- **Mobile**: 390×884

---

## Screen Purpose
The Individual Paper View is the **question-level inspection screen**. It allows students to:
1. **View all questions** from a specific past paper
2. **See question metadata** (marks, part, unit, topic)
3. **Filter questions** by part (A/B), unit, or topic
4. **Understand paper structure** (Part A vs Part B distribution)
5. **Access evidence trail** (paper source, exam date, regulation)
6. **Navigate between papers** (previous/next paper in collection)

This is NOT a practice test. This is a **paper archive viewer** with structured question data.

---

## User Mental State on Arrival
- **Verification**: "Show me the actual questions from this paper"
- **Structure**: "How is this paper organized? What's in Part A vs Part B?"
- **Context**: "Which topics appear in this specific paper?"
- **Comparison**: "How does this paper compare to others?"

---

## Navigation Context

**Navigation Bar**:
```
PaperIQ | [Dashboard] [Analysis] [Papers] [Profile] | [Run New Analysis] [•]
```
Where **Papers** tab is highlighted (user is still in Papers section, viewing a specific paper).

**Breadcrumb Navigation** (below navbar):
```
Papers > Data Structures > Mid-Term 2 — December 2024
```

---

## Design Requirements

### 1. Paper Header (Paper Metadata)

**Content**:
```
┌────────────────────────────────────────────────────────┐
│ Data Structures                                        │
│ Mid-Term 2 — December 2024                            │
│                                                        │
│ R22 • 18 Questions • 50 Total Marks • 90 Minutes     │
└────────────────────────────────────────────────────────┘
```

**Layout**:
- Full-width header bar
- Background: `rgba(255, 255, 255, 0.03)`
- Border-bottom: `rgba(255, 255, 255, 0.08)` 1px solid
- Padding: 24px 32px (desktop), 16px 20px (mobile)
- Subject name: Space Grotesk, 24px (desktop), 20px (mobile), white, bold
- Exam type + date: Space Grotesk, 16px (desktop), 14px (mobile), `rgba(255, 255, 255, 0.8)`
- Metadata line: DM Mono, 13px (desktop), 11px (mobile), `rgba(255, 255, 255, 0.6)`
- Separator dots: `rgba(255, 255, 255, 0.4)`

**Right-side Actions** (desktop only):
- "Download PDF" button (ghost, white border) — future feature
- "Back to Papers" link (orange text, arrow icon)

---

### 2. Paper Structure Summary (Visual Overview)

**Purpose**: Show Part A vs Part B distribution at a glance

**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ PAPER STRUCTURE                                         │
├─────────────────────────────────────────────────────────┤
│ Part A: Short Questions                                 │
│ 10 Questions • 2 Marks Each • 20 Total Marks           │
│ [██████████████████████████░░░░░░░░░░░] 55.6%         │
│                                                         │
│ Part B: Long Questions                                  │
│ 8 Questions • Varied Marks • 30 Total Marks            │
│ [████████████████░░░░░░░░░░░░░░░░░░░░] 44.4%         │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Border: `rgba(255, 255, 255, 0.08)` 1px solid
- Background: `rgba(255, 255, 255, 0.03)`
- Border-radius: 12px
- Padding: 24px (desktop), 16px (mobile)
- Section labels: Space Grotesk, 16px, white, bold
- Metadata line: DM Mono, 13px, `rgba(255, 255, 255, 0.6)`
- Progress bars: orange fill `#f97316`, background `rgba(255, 255, 255, 0.1)`
- Bar height: 8px, rounded ends
- Percentage: DM Mono, 14px, orange `#f97316`, aligned right

**Data Source**:
- Part A count: `questions.filter(q => q.part === "A").length`
- Part B count: `questions.filter(q => q.part === "B").length`
- Total marks calculation: sum of all `questions[].marks`
- Percentage: `(part_marks / total_marks) * 100`

---

### 3. Question Filter Bar (Above Question List)

**Purpose**: Allow students to filter questions by part, unit, or topic

**Content** (horizontal filter pills):
```
[All Questions] [Part A] [Part B] | [All Units ▼] [All Topics ▼]
```

**Visual Design**:
- Pill-style buttons (rounded, border `rgba(255, 255, 255, 0.08)`)
- Active state: orange background `#f97316`, white text
- Inactive state: transparent background, white text, border
- Hover state: background `rgba(255, 255, 255, 0.05)`
- Separator: vertical line `rgba(255, 255, 255, 0.2)` between sections
- Dropdowns: white text, chevron icon, opens below button

**Behavior**:
- "All Questions" selected by default (shows both Part A and B)
- "Part A" click → filters to only Part A questions
- "Part B" click → filters to only Part B questions
- "All Units" dropdown → shows list of units present in this paper
- "All Topics" dropdown → shows list of topics present in this paper
- Multiple filters can be applied (e.g., Part A + Unit III)

**Mobile Adaptation** (390×884):
- First row: [All Questions] [Part A] [Part B]
- Second row: [All Units ▼] [All Topics ▼]
- Stack vertically, full width buttons

---

### 4. Questions List (Main Content)

**Purpose**: Display all questions from the paper with metadata

**Question Card Structure**:
```
┌─────────────────────────────────────────────────────────┐
│ Q1 • Part A • 2 Marks                          Unit III │
│                                                          │
│ Define stack and explain its operations.                │
│                                                          │
│ Topic: Stacks • Classification: Data Structures         │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Border: `rgba(255, 255, 255, 0.08)` 1px solid
- Background: `rgba(255, 255, 255, 0.03)`
- Background on hover: `rgba(255, 255, 255, 0.05)`
- Border-radius: 8px (smaller than paper cards, these are list items)
- Padding: 20px (desktop), 16px (mobile)
- Question number: DM Mono, 14px, orange `#f97316`
- Metadata line (Part, Marks, Unit): DM Mono, 12px, `rgba(255, 255, 255, 0.6)`
- Question text: Space Grotesk, 15px (desktop), 14px (mobile), white, line-height 1.6
- Topic line: DM Mono, 11px, `rgba(255, 255, 255, 0.5)`, italic

**Layout**:
- Single column list (all breakpoints)
- 12px gap between cards
- Max 20 questions per page (pagination below)

**Data Source**:
- Backend: `GET /api/papers/{paper_id}/questions`
- Returns: array of question objects with full metadata

**Question Object Format** (from backend):
```json
{
  "question_number": 1,
  "part": "A",
  "question_text": "Define stack and explain its operations.",
  "marks": 2,
  "unit_number": 3,
  "unit_name": "Unit III",
  "topic_name": "Stacks",
  "classification_confidence": 0.85
}
```

---

### 5. Question Card States

**Normal State**:
- Border: `rgba(255, 255, 255, 0.08)`
- Background: `rgba(255, 255, 255, 0.03)`

**Hover State** (desktop only):
- Border: `rgba(255, 255, 255, 0.12)`
- Background: `rgba(255, 255, 255, 0.05)`
- Cursor: pointer (if clickable for future features)

**Part A Questions**:
- Left border accent: 3px solid orange `#f97316`

**Part B Questions**:
- Left border accent: 3px solid `#10b981` (green, differentiates from Part A)

**Unclassified Questions** (no topic_name):
- Topic line shows: "Topic: Not classified"
- Topic text color: `rgba(255, 255, 255, 0.3)` (dimmed)

---

### 6. Paper Navigation (Between Papers)

**Purpose**: Allow quick navigation to previous/next paper without returning to browser

**Content** (fixed at bottom of screen):
```
[← Previous Paper]          [Back to Papers]          [Next Paper →]
```

**Visual Design**:
- Fixed position bar at bottom of viewport
- Background: `rgba(7, 7, 13, 0.95)` (semi-transparent dark)
- Backdrop blur: 12px
- Border-top: `rgba(255, 255, 255, 0.08)` 1px solid
- Padding: 16px 32px (desktop), 12px 20px (mobile)
- Button style: ghost (white border, white text)
- Active button: orange background `#f97316`, white text
- Hover: background `rgba(255, 255, 255, 0.05)`

**Behavior**:
- "Previous Paper" → navigates to previous paper in filtered list from Papers Browser
- "Next Paper" → navigates to next paper in filtered list
- "Back to Papers" → returns to Papers Browser with filters preserved
- If no previous paper, disable "Previous Paper" button (grey out)
- If no next paper, disable "Next Paper" button (grey out)

**Mobile Adaptation**:
- Buttons become icons only: [←] [Grid Icon] [→]
- Center button opens Papers Browser
- Full-width bar, evenly spaced

---

### 7. Empty State (No Questions Found)

**When to Show**: Paper has no parsed questions (should not happen in MVP, but defensive)

**Content**:
```
┌─────────────────────────────────────┐
│                                     │
│ No questions available              │
│                                     │
│ This paper has not been processed   │
│ yet or questions could not be       │
│ extracted.                          │
│                                     │
│ [Back to Papers]                    │
└─────────────────────────────────────┘
```

**Visual Design**:
- Centered in main content area
- Icon: document with X (subtle, not prominent)
- Heading: Space Grotesk, 18px, white
- Body text: 14px, `rgba(255, 255, 255, 0.6)`, line-height 1.5
- Button: orange background, white text

---

### 8. Loading State

**When to Show**: While fetching paper and questions from API

**Content**:
```
┌─────────────────────────────────────┐
│ [Skeleton header bar]               │
├─────────────────────────────────────┤
│ [Skeleton structure summary]        │
├─────────────────────────────────────┤
│ [Skeleton question card 1]          │
│ [Skeleton question card 2]          │
│ [Skeleton question card 3]          │
└─────────────────────────────────────┘
```

**Visual Design**:
- Same card dimensions as real question cards
- Background: `rgba(255, 255, 255, 0.05)`
- Shimmer: gradient sweep left-to-right, 1.4s infinite
- Show 5 skeleton cards initially

---

## Layout Structure (Desktop 1280×1024)

```
┌────────────────────────────────────────────────────────────┐
│ PaperIQ | [Dashboard] [Analysis] [Papers] [Profile]    [•] │
│ Papers > Data Structures > Mid-Term 2 — December 2024      │
├────────────────────────────────────────────────────────────┤
│ Data Structures                        [Download PDF] [Back]│
│ Mid-Term 2 — December 2024                                 │
│ R22 • 18 Questions • 50 Marks • 90 Minutes                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ PAPER STRUCTURE                                        │ │
│ │ Part A: 10 Questions • 20 Marks [███████░░░] 55.6%    │ │
│ │ Part B: 8 Questions • 30 Marks [█████░░░░░] 44.4%     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [All Questions] [Part A] [Part B] | [All Units▼] [Topics▼]│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Q1 • Part A • 2 Marks                        Unit III  │ │
│ │ Define stack and explain its operations.              │ │
│ │ Topic: Stacks • Classification: Data Structures       │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Q2 • Part A • 2 Marks                         Unit I   │ │
│ │ What is an array? Explain its advantages.             │ │
│ │ Topic: Arrays • Classification: Data Structures       │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Q3 • Part B • 10 Marks                       Unit III  │ │
│ │ Explain binary search tree operations with examples.  │ │
│ │ Topic: Binary Search Trees • Data Structures          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│                    ... more questions ...                  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ [← Previous Paper]  [Back to Papers]  [Next Paper →]      │
└────────────────────────────────────────────────────────────┘
```

---

## Layout Structure (Tablet 768×1024)

```
┌────────────────────────────────────────────────────┐
│ PaperIQ | [Dash] [Analysis] [Papers] [Profile] [•] │
│ Papers > Data Structures > Mid-Term 2              │
├────────────────────────────────────────────────────┤
│ Data Structures                          [Back]    │
│ Mid-Term 2 — December 2024                         │
│ R22 • 18 Q's • 50 Marks • 90 Min                   │
├────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐ │
│ │ PAPER STRUCTURE                                │ │
│ │ Part A: 10 Q's • 20 Marks [████░░] 55.6%      │ │
│ │ Part B: 8 Q's • 30 Marks [███░░░] 44.4%       │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ [All] [Part A] [Part B] | [Units▼] [Topics▼]      │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ Q1 • Part A • 2 Marks              Unit III    │ │
│ │ Define stack and explain operations.          │ │
│ │ Topic: Stacks                                 │ │
│ └────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────┐ │
│ │ Q2 • Part A • 2 Marks               Unit I     │ │
│ │ What is an array? Explain advantages.         │ │
│ │ Topic: Arrays                                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│              ... more questions ...                │
│                                                    │
├────────────────────────────────────────────────────┤
│ [← Previous]  [Back to Papers]  [Next →]          │
└────────────────────────────────────────────────────┘
```

---

## Layout Structure (Mobile 390×884)

```
┌────────────────────────────────┐
│ PaperIQ                    [•] │
│ [D][A][Papers][P]              │
├────────────────────────────────┤
│ [← Back]                       │
│ Data Structures                │
│ Mid-Term 2 — Dec 2024          │
│ R22 • 18 Q's • 50 Marks        │
├────────────────────────────────┤
│ PAPER STRUCTURE                │
│ Part A: 10 Q's • 20 Marks      │
│ [████████░░] 55.6%             │
│                                │
│ Part B: 8 Q's • 30 Marks       │
│ [██████░░░░] 44.4%             │
├────────────────────────────────┤
│ [All] [Part A] [Part B]        │
│ [All Units ▼] [Topics ▼]       │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ Q1 • Part A • 2M  Unit III │ │
│ │ Define stack and explain   │ │
│ │ its operations.            │ │
│ │ Topic: Stacks              │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Q2 • Part A • 2M   Unit I  │ │
│ │ What is an array?          │ │
│ │ Explain advantages.        │ │
│ │ Topic: Arrays              │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Q3 • Part B • 10M Unit III │ │
│ │ Explain binary search tree │ │
│ │ operations with examples.  │ │
│ │ Topic: BST                 │ │
│ └────────────────────────────┘ │
│                                │
│     ... more questions ...     │
│                                │
├────────────────────────────────┤
│ [←]    [Papers]    [→]         │
└────────────────────────────────┘
```

---

## Interaction Patterns

### On Page Load
1. Fetch paper metadata and questions from API
2. Show skeleton loading state (header + 5 question cards)
3. Fade in paper header (300ms)
4. Fade in structure summary (400ms delay)
5. Stagger question cards (50ms delay per card)

### On Filter Button Click
1. Update active filter state (orange background)
2. Filter questions client-side (instant, no API call)
3. Fade out filtered-out questions (150ms)
4. Fade in remaining questions (200ms)
5. Update question count in filter bar ("Showing 10 of 18 questions")

### On Unit/Topic Dropdown Select
1. Apply filter immediately (no "Apply" button needed)
2. Update active filters in URL: `?part=A&unit=3&topic=stacks`
3. Filter questions and update display
4. Close dropdown

### On Paper Navigation Click
1. "Previous Paper" → fetch previous paper_id from route state or API
2. Show loading state (skeleton cards)
3. Navigate to `/papers/{previous_paper_id}`
4. Scroll to top of page

### On Question Card Click (Future Feature)
1. Expand card to show more details (answer key, similar questions)
2. For MVP: no click action (cards are read-only)

---

## Data Fetching Strategy

**On page load**:
```typescript
const paperId = params.paper_id  // from URL /papers/{paper_id}

// Fetch paper metadata and questions in single call
const paper = await fetch(`/api/papers/${paperId}`)
// Backend includes parsed_questions array in response
```

**Backend endpoint** (already verified working):
- `GET /api/papers/{paper_id}`
- Returns: paper object with `parsed_questions` array included

**Response format** (from MVP verification):
```json
{
  "success": true,
  "data": {
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
        "marks": 2,
        "unit_number": 3,
        "unit_name": "Unit III",
        "topic_name": "Stacks",
        "classification_confidence": 0.85
      }
    ]
  }
}
```

**Previous/Next Paper Navigation**:
```typescript
// Store filtered paper list in route state when navigating from Papers Browser
// Or fetch adjacent papers from API
const adjacentPapers = await fetch(`/api/papers/adjacent`, {
  params: {
    current_paper_id: paperId,
    subject_id: paper.subject_id,
    regulation: paper.regulation
  }
})
// Returns: { previous_paper_id, next_paper_id }
```

---

## Pagination (Dynamic)

**Trigger**: If `parsed_questions.length > 20`

**Content** (bottom of question list, above navigation bar):
```
[← Previous]  Page {currentPage} of {totalPages}  [Next →]
```

**Behavior**:
- Calculate `totalPages = Math.ceil(questions.length / 20)`
- Show first 20 questions initially (page 1)
- "Next" button loads next 20 questions (client-side pagination, no API call)
- URL updates: `/papers/{paper_id}?page=2`
- Scroll to top of question list when page changes

**Visual Design**:
- Same style as Papers Browser pagination
- DM Mono, 14px
- Buttons: ghost style, orange text on hover
- Page count: `rgba(255, 255, 255, 0.6)`

**Dynamic Page Numbers**:
```typescript
// Do NOT hardcode [1] [2] [3] buttons
// Calculate dynamically:
const totalPages = Math.ceil(questions.length / pageSize)
const currentPage = parseInt(searchParams.get('page') || '1')

// Display format:
// Page 1 of 3 (not "1 2 3" buttons)
```

---

## Success Metrics (Four Feelings)

### 1. Confidence
- User sees actual question text (not "Question 1")
- Marks and part metadata are accurate
- Unit and topic classifications are visible
- Paper structure summary matches question distribution

### 2. Relief
- Questions are clearly separated (Part A vs Part B border accent)
- Filters work instantly (no loading delay)
- Navigation between papers is simple (fixed bottom bar)
- No overwhelming UI (single-column question list)

### 3. Ambition
- Classified questions show topic names (not all "unclassified")
- Paper structure shows clear distribution (55.6% vs 44.4%)
- Filter dropdowns reveal available units and topics
- Previous/Next navigation encourages exploration

### 4. Delight
- Smooth question card animations (fade-in stagger)
- Filter buttons have clear active state (orange background)
- Part A/B color coding (orange vs green left border)
- Fixed navigation bar always accessible (no scrolling to find it)

---

## Edge Cases

| Case | Behavior |
|------|----------|
| No questions in paper | Show "No questions available" empty state |
| All questions unclassified | Show "Topic: Not classified" in grey text |
| Only Part A questions | Hide "Part B" filter button |
| Only Part B questions | Hide "Part A" filter button |
| Filter returns 0 results | Show "No questions match filters" message with reset button |
| First paper in list | Disable "Previous Paper" button (grey out) |
| Last paper in list | Disable "Next Paper" button (grey out) |
| Paper not found | Redirect to Papers Browser with error toast |

---

## Technical Implementation Requirements

**Client-side filtering**:
```typescript
const filteredQuestions = questions.filter(q => {
  const partMatch = selectedPart === 'all' || q.part === selectedPart
  const unitMatch = selectedUnit === 'all' || q.unit_number === selectedUnit
  const topicMatch = selectedTopic === 'all' || q.topic_name === selectedTopic
  return partMatch && unitMatch && topicMatch
})
```

**Part A/B left border accent**:
```css
.question-card[data-part="A"] {
  border-left: 3px solid #f97316; /* orange */
}

.question-card[data-part="B"] {
  border-left: 3px solid #10b981; /* green */
}
```

**Fixed navigation bar**:
```css
.paper-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(7, 7, 13, 0.95);
  backdrop-filter: blur(12px);
  z-index: 50;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

**Skeleton shimmer** (same as Papers Browser):
```css
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
```

**Dynamic pagination calculation**:
```typescript
const PAGE_SIZE = 20
const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE)
const currentPage = parseInt(searchParams.get('page') || '1')
const startIndex = (currentPage - 1) * PAGE_SIZE
const endIndex = startIndex + PAGE_SIZE
const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)
```

---

## Final Checklist Before Implementation

- [ ] Navigation shows "Papers" tab as active/highlighted
- [ ] Breadcrumb shows: Papers > Subject > Paper Title
- [ ] Paper header displays metadata from backend response
- [ ] Structure summary calculates Part A/B distribution dynamically
- [ ] Questions list renders from `parsed_questions` array
- [ ] Filter buttons work with client-side filtering (no API calls)
- [ ] Part A questions have orange left border accent
- [ ] Part B questions have green left border accent
- [ ] Unclassified questions show "Topic: Not classified" in grey
- [ ] Fixed navigation bar always visible at bottom
- [ ] Previous/Next paper navigation uses adjacent paper IDs
- [ ] Pagination calculated dynamically (not hardcoded [1][2][3])
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Responsive layouts tested at all three breakpoints (1280×1024, 768×1024, 390×884)

---

## Approved — Ready for Implementation

This Individual Paper View screen is the final core screen in the MVP Papers section. When implementing:

1. **Wire to verified backend**: Use `GET /api/papers/{paper_id}` endpoint (validated working)
2. **Use real data**: Questions, marks, parts, units, topics from actual database
3. **Match approved design**: Follow question card styling, orange accent, DM Mono numbers
4. **Maintain navigation**: Show Papers tab as active, breadcrumb navigation
5. **Ensure mobile-first**: Single-column question list, stacked filter buttons, fixed nav bar
6. **Test all breakpoints**: Desktop (1280×1024), Tablet (768×1024), Mobile (390×884)
7. **Dynamic pagination**: Calculate total pages from question count, never hardcode page numbers

**Do not modify previous screens (Dashboard, Analysis, Papers Browser, Authentication, Onboarding).**  
**Proceed to implementation when ready.**

---

## 📋 MVP Screen Completion Status

**Core MVP Screens Designed** (7/7 complete):
1. ✅ Screen 01 — Landing Page
2. ✅ Screen 02 — Onboarding Choice
3. ✅ Screen 02.5 — Authentication (Login/Signup)
4. ✅ Screen 03 — Dashboard
5. ✅ Screen 04 — Analysis Results
6. ✅ Screen 05 — Papers Browser
7. ✅ **Screen 06 — Individual Paper View** ← **JUST COMPLETED**

**All MVP screens designed and frozen. Ready for frontend implementation.**