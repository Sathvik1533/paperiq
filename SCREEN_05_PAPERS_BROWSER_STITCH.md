# Screen 05: Papers Browser — Stitch Design Prompt

## Context from Previous Screens
- **Analysis Results approved**: Priority scores, topic frequency, unit distribution with evidence-based insights
- **Dashboard approved**: Subject cards with priority indicators, welcome section, recent analysis
- **Navigation approved**: `Dashboard | Analysis | Papers | Profile` with Papers tab highlighted here

---

## Responsive Breakpoints (ALL Future Screens)
- **Desktop**: 1280×1024+ 
- **Tablet**: 768×1024
- **Mobile**: 390×884

All layouts must be designed and tested for these three breakpoints.

---

## Screen Purpose
The Papers Browser is the **discovery and access layer** for past examination papers. It allows students to:
1. **Browse all available papers** by subject, year, and exam type
2. **Filter papers** by regulation, exam category, and year range
3. **View paper metadata** (questions count, marks, exam date)
4. **Access individual papers** to see question details
5. **Understand paper availability** (which years/types are covered)

This is NOT a document viewer. This is a **structured paper catalog** with intelligent filtering.

---

## User Mental State on Arrival
- **Exploration**: "What papers are available for my subject?"
- **Specificity**: "I need Mid-Term 2 papers from the last 3 years"
- **Verification**: "Does this platform actually have recent papers?"
- **Access**: "Show me the questions from this specific paper"

---

## Navigation Context

**Navigation Bar**:
```
PaperIQ | [Dashboard] [Analysis] [Papers] [Profile] | [Run New Analysis] [•]
```
Where **Papers** tab is highlighted (current page).

---

## Design Requirements

### 1. Page Header (Papers Context)

**Content**:
```
Past Examination Papers
Browse and filter papers by subject, year, and exam type
```

**Layout**:
- Left-aligned, full-width header
- Background: `rgba(255, 255, 255, 0.03)`
- Border-bottom: `rgba(255, 255, 255, 0.08)` 1px solid
- Padding: 24px 32px (desktop), 16px 20px (mobile)
- Title: Space Grotesk, 28px (desktop), 22px (mobile), white
- Subtitle: `rgba(255, 255, 255, 0.6)`, 14px (desktop), 12px (mobile)

**Right-side Actions** (desktop only):
- Search bar: `rgba(255, 255, 255, 0.08)` border, 280px width
- Placeholder: "Search papers by title or year..."
- Icon: magnifying glass, `rgba(255, 255, 255, 0.4)`

---

### 2. Filter Sidebar (Left Column — Desktop/Tablet)

**Purpose**: Allow students to narrow down papers by multiple criteria

**Content**:
```
┌─────────────────────────────┐
│ FILTERS                     │
├─────────────────────────────┤
│ Subject                     │
│ [Data Structures ▼]         │
│                             │
│ Regulation                  │
│ [R22 ▼]                     │
│                             │
│ Exam Category               │
│ ☐ Mid-Term 1               │
│ ☐ Mid-Term 2               │
│ ☑ End-Semester             │
│ ☐ Assignments              │
│                             │
│ Year Range                  │
│ [2021] ━━━━━━━ [2025]      │
│                             │
│ [Reset Filters]             │
│ [Apply Filters]             │
└─────────────────────────────┘
```

**Visual Design**:
- Fixed width: 280px (desktop), 240px (tablet)
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `rgba(255, 255, 255, 0.08)` 1px solid
- Border-radius: 12px
- Padding: 24px
- Section labels: DM Mono, 12px, `rgba(255, 255, 255, 0.6)`, uppercase
- Dropdowns: white border, 14px Space Grotesk
- Checkboxes: orange `#f97316` when checked
- Year range slider: orange fill, white handles

**Behavior**:
- Subject dropdown: populated from user's registered subjects
- Regulation: auto-filled from user profile (R22)
- Exam category: multi-select checkboxes
- Year range: dual-handle slider (min 2021, max 2025)
- "Apply Filters" button: orange background, white text
- "Reset Filters" button: ghost style, white border

**Mobile Adaptation** (390×884):
- Sidebar becomes a slide-out drawer
- Trigger: "Filters" button at top of page (icon + text)
- Drawer slides from left, 320px width
- Overlay: `rgba(0, 0, 0, 0.6)` backdrop
- Close button: X icon in top-right corner

---

### 3. Papers Count Summary (Above Grid)

**Purpose**: Show how many papers match current filters

**Content**:
```
Showing 47 papers • End-Semester • 2021-2025 • R22
```

**Visual Design**:
- Single line above paper grid
- DM Mono, 14px (desktop), 12px (mobile)
- Number (47) in orange `#f97316`
- Separator dots: `rgba(255, 255, 255, 0.4)`
- Applied filters shown inline (End-Semester, 2021-2025)

**Behavior**:
- Updates dynamically when filters change
- Shows "0 papers found" if no results
- Filter tags are clickable to remove individual filters

---

### 4. Papers Grid (Main Content Area)

**Purpose**: Display papers as scannable cards with key metadata

**Card Structure** (one per paper):
```
┌─────────────────────────────────────────────┐
│ Data Structures                             │
│ Mid-Term 2 — December 2024                  │
│                                             │
│ 📄 18 Questions  •  50 Marks  •  R22       │
│                                             │
│ Part A: 10 Q's (2 marks)                   │
│ Part B: 8 Q's (varied marks)               │
│                                             │
│ [View Paper →]                              │
└─────────────────────────────────────────────┘
```

**Visual Design**:
- Border: `rgba(255, 255, 255, 0.08)` 1px solid
- Background: `rgba(255, 255, 255, 0.03)`
- Background on hover: `rgba(255, 255, 255, 0.05)`
- Border-radius: 12px
- Padding: 24px (desktop), 16px (mobile)
- Subject name: Space Grotesk, 18px (desktop), 16px (mobile), white, bold
- Exam metadata: Space Grotesk, 14px, `rgba(255, 255, 255, 0.8)`
- Icon + stats line: DM Mono, 13px, `rgba(255, 255, 255, 0.6)`
- Part breakdown: DM Mono, 12px, `rgba(255, 255, 255, 0.5)`
- "View Paper" button: orange text, underline on hover

**Grid Layout**:
- **Desktop (1280×1024+)**: 2 columns, 24px gap
- **Tablet (768×1024)**: 2 columns, 16px gap
- **Mobile (390×884)**: 1 column, 12px gap

**Data Source**:
- Backend: `GET /api/papers?subject_id={id}&regulation={reg}&exam_category={cat}&year_min={min}&year_max={max}`
- Returns: array of paper objects with metadata

---

### 5. Paper Card Metadata Display

**Metadata Elements** (from backend response):
- **Title**: `{subject_name}` (from papers.title or subject lookup)
- **Subtitle**: `{exam_type} {exam_category} — {exam_month} {exam_year}`
- **Question count**: `{parsed_questions.length} Questions`
- **Total marks**: `{max_marks} Marks`
- **Regulation badge**: `{regulation}` (e.g., R22)
- **Part A count**: Count where `part === "A"`
- **Part B count**: Count where `part === "B"`

**Badge Styling**:
- Regulation badge: orange `#f97316` background, white text, 6px radius, 4px padding
- Displayed inline with stats line

---

### 6. Empty State (No Papers Found)

**When to Show**: Filters return zero results

**Content**:
```
┌─────────────────────────────────────┐
│                                     │
│       No papers found               │
│                                     │
│ Try adjusting your filters:         │
│ • Expand year range                 │
│ • Select different exam categories  │
│ • Check other subjects              │
│                                     │
│ [Reset All Filters]                 │
└─────────────────────────────────────┘
```

**Visual Design**:
- Centered in grid area
- Icon: document with slash (subtle, not prominent)
- Heading: Space Grotesk, 20px, white
- Suggestions: bulleted list, 14px, `rgba(255, 255, 255, 0.6)`
- Button: orange background, white text

---

### 7. Loading State

**When to Show**: While fetching papers from API

**Content**:
```
┌─────────────────────────────────────┐
│ [Skeleton card 1]                   │
│ [Shimmer animation]                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [Skeleton card 2]                   │
│ [Shimmer animation]                 │
└─────────────────────────────────────┘
```

**Visual Design**:
- Same card dimensions as real cards
- Background: `rgba(255, 255, 255, 0.05)`
- Shimmer: gradient sweep left-to-right, 1.4s infinite
- No content placeholders (just empty card shapes)

---

### 8. Pagination (If Papers > 20)

**Purpose**: Handle large result sets without overwhelming UI

**Content** (bottom of grid):
```
[← Previous]  Page 1 of 3  [Next →]
```

**Visual Design**:
- Centered below grid
- DM Mono, 14px
- Previous/Next: white border buttons, orange text on hover
- Page count: `rgba(255, 255, 255, 0.6)`
- Active page: orange `#f97316` text

**Behavior**:
- Default: 20 papers per page
- URL updates with `?page=2` on navigation
- Scroll to top when page changes

**Mobile Adaptation**:
- Buttons become icons only (← and →)
- Page count remains visible

---

## Layout Structure (Desktop 1280×1024)

```
┌────────────────────────────────────────────────────────────┐
│ PaperIQ | [Dashboard] [Analysis] [Papers] [Profile]    [•] │
├────────────────────────────────────────────────────────────┤
│ Past Examination Papers               [Search papers...]   │
│ Browse and filter papers by subject, year, and exam type   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌─────────────────┐  ┌──────────────────────────────────┐ │
│ │ FILTERS         │  │ Showing 47 papers • End-Sem      │ │
│ │                 │  ├──────────────────────────────────┤ │
│ │ Subject         │  │ ┌──────────────┐ ┌──────────────┐│ │
│ │ [Data Struct▼]  │  │ │ Paper Card 1 │ │ Paper Card 2 ││ │
│ │                 │  │ └──────────────┘ └──────────────┘│ │
│ │ Regulation      │  │ ┌──────────────┐ ┌──────────────┐│ │
│ │ [R22 ▼]         │  │ │ Paper Card 3 │ │ Paper Card 4 ││ │
│ │                 │  │ └──────────────┘ └──────────────┘│ │
│ │ Exam Category   │  │ ┌──────────────┐ ┌──────────────┐│ │
│ │ ☐ Mid-1         │  │ │ Paper Card 5 │ │ Paper Card 6 ││ │
│ │ ☐ Mid-2         │  │ └──────────────┘ └──────────────┘│ │
│ │ ☑ End-Sem       │  │                                  │ │
│ │                 │  │ [← Previous] Page 1 of 3 [Next →]│ │
│ │ Year Range      │  └──────────────────────────────────┘ │
│ │ [2021]━━━[2025] │                                       │
│ │                 │                                       │
│ │ [Reset]         │                                       │
│ │ [Apply Filters] │                                       │
│ └─────────────────┘                                       │
└────────────────────────────────────────────────────────────┘
```

---

## Layout Structure (Tablet 768×1024)

```
┌────────────────────────────────────────────────────┐
│ PaperIQ | [Dash] [Analysis] [Papers] [Profile] [•] │
├────────────────────────────────────────────────────┤
│ Past Examination Papers                            │
│ Browse and filter                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────┐  ┌───────────────────────────────┐   │
│ │ FILTERS  │  │ Showing 47 papers • End-Sem   │   │
│ │          │  ├───────────────────────────────┤   │
│ │ Subject  │  │ ┌───────────┐ ┌───────────┐   │   │
│ │ [DS ▼]   │  │ │ Paper 1   │ │ Paper 2   │   │   │
│ │          │  │ └───────────┘ └───────────┘   │   │
│ │ Reg      │  │ ┌───────────┐ ┌───────────┐   │   │
│ │ [R22▼]   │  │ │ Paper 3   │ │ Paper 4   │   │   │
│ │          │  │ └───────────┘ └───────────┘   │   │
│ │ Category │  │                               │   │
│ │ ☑ End-Sem│  │ [← Prev] Page 1 of 3 [Next →] │   │
│ │          │  └───────────────────────────────┘   │
│ │ [Reset]  │                                      │
│ │ [Apply]  │                                      │
│ └──────────┘                                      │
└────────────────────────────────────────────────────┘
```

---

## Layout Structure (Mobile 390×884)

```
┌────────────────────────────────┐
│ PaperIQ                    [•] │
│ [D][A][Papers][P]              │
├────────────────────────────────┤
│ Past Examination Papers        │
│ [Filters 🎛]     [Search 🔍]   │
├────────────────────────────────┤
│ Showing 47 papers              │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ Data Structures            │ │
│ │ Mid-Term 2 — Dec 2024      │ │
│ │ 18 Q's • 50 Marks • R22    │ │
│ │ [View Paper →]             │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Data Structures            │ │
│ │ End-Semester — May 2024    │ │
│ │ 22 Q's • 100 Marks • R22   │ │
│ │ [View Paper →]             │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ DBMS                       │ │
│ │ Mid-Term 1 — Oct 2024      │ │
│ │ 20 Q's • 50 Marks • R22    │ │
│ │ [View Paper →]             │ │
│ └────────────────────────────┘ │
│                                │
│ [← Prev] Page 1/3 [Next →]     │
└────────────────────────────────┘
```

**Mobile Filters Drawer** (when "Filters" button clicked):
```
┌────────────────────────────────┐
│ [←] Filters              [X]   │
├────────────────────────────────┤
│ Subject                        │
│ [Data Structures ▼]            │
│                                │
│ Regulation                     │
│ [R22 ▼]                        │
│                                │
│ Exam Category                  │
│ ☐ Mid-Term 1                  │
│ ☐ Mid-Term 2                  │
│ ☑ End-Semester                │
│ ☐ Assignments                 │
│                                │
│ Year Range                     │
│ [2021] ━━━━━━━ [2025]         │
│                                │
│ [Reset Filters]                │
│ [Apply Filters]                │
└────────────────────────────────┘
```

---

## Interaction Patterns

### On Page Load
1. Fetch papers with default filters (all categories, last 5 years, user's regulation)
2. Show skeleton loading cards (4-6 cards)
3. Fade in paper cards with 50ms stagger
4. Display filter summary in count line

### On Filter Change
1. "Apply Filters" button click triggers API call
2. Show skeleton loading in grid area (don't remove existing cards immediately)
3. Update URL with filter params: `?subject=CS301&category=mid-2&year_min=2023&year_max=2025`
4. Fade out old cards, fade in new cards
5. Update papers count summary line

### On Paper Card Click
1. Navigate to `/papers/{paper_id}` (individual paper view — next screen to design)
2. Pass paper metadata in route state

### On Search Input
1. Debounce input (500ms)
2. Filter papers client-side first (title, year, month match)
3. If no client-side matches, trigger API call with search param
4. Show "No results for '[query]'" if zero matches

### On Mobile Filter Drawer
1. "Filters" button click opens drawer with slide-in animation (300ms ease-out)
2. Overlay backdrop dims main content
3. "Apply Filters" closes drawer and triggers filter API call
4. "X" button closes drawer without applying (resets to previous state)

---

## Data Fetching Strategy

**On page load**:
```typescript
const user = await fetch('/api/profile/me')  // get user's regulation
const subjects = await fetch('/api/profile/subjects')  // populate subject dropdown

const papers = await fetch('/api/papers', {
  params: {
    regulation: user.regulation,  // R22
    year_min: 2021,
    year_max: 2025,
    limit: 20,
    offset: 0
  }
})
```

**Backend endpoint** (already verified working):
- `GET /api/papers` with query params
- Filters: `subject_id`, `year`, `exam_type`, `exam_category`, `regulation`
- Returns: array of papers with `parsed_questions` included

**Response format** (from MVP verification):
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

---

## Success Metrics (Four Feelings)

### 1. Confidence
- User sees real paper titles (not placeholders)
- Question counts match actual parsed questions
- Years shown are recent (2021-2025)
- Papers display regulation badge (R22) matching user profile

### 2. Relief
- Filters narrow results immediately (not slow)
- Grid layout is scannable (2 columns desktop, not overwhelming list)
- Empty state is helpful (suggestions, not just "no results")
- Search works for both title and year

### 3. Ambition
- Large paper count (47 papers) shows comprehensive coverage
- Recent papers available (2024, 2025)
- Multiple exam categories covered (Mid-1, Mid-2, End-Sem)
- "View Paper" CTA invites exploration

### 4. Delight
- Smooth card animations (fade-in stagger)
- Filter drawer slides smoothly on mobile
- Hover states feel responsive (border color change)
- Orange accent sparingly used (badges, buttons)

---

## Edge Cases

| Case | Behavior |
|------|----------|
| No papers in database | Show "No papers available yet — check back soon" message |
| User has no subjects | Redirect to dashboard with "Complete profile first" notice |
| API timeout | Show "Failed to load papers — try again" with retry button |
| Search query returns 0 results | Show "No papers match '[query]'" with reset button |
| Filter combination returns 0 results | Show empty state with filter adjustment suggestions |
| Year range slider min > max | Disable "Apply Filters" button, show validation error |
| Mobile drawer open + orientation change | Close drawer, reset to grid view |

---

## Technical Implementation Requirements

**Skeleton loading animation**:
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

**Card fade-in stagger**:
```javascript
// Framer Motion stagger children
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}
```

**Mobile filter drawer**:
```javascript
// Slide-in from left
const drawerVariants = {
  closed: { x: '-100%' },
  open: { x: 0, transition: { type: 'tween', duration: 0.3 } }
}

// Backdrop overlay
<motion.div 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={closeDrawer}
  style={{ background: 'rgba(0, 0, 0, 0.6)' }}
/>
```

**Responsive grid**:
```css
.papers-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(2, 1fr);
}

@media (max-width: 768px) {
  .papers-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
```

---

## Final Checklist Before Implementation

- [ ] Navigation shows "Papers" tab as active/highlighted
- [ ] Filter sidebar populated from user profile (subjects, regulation)
- [ ] Papers grid fetches from `/api/papers` endpoint
- [ ] Paper cards show real question counts from `parsed_questions.length`
- [ ] Filter changes update URL and trigger new API call
- [ ] Empty state shows helpful suggestions
- [ ] Skeleton loading displays while fetching
- [ ] Mobile filter drawer slides in from left
- [ ] Pagination works for >20 papers
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Responsive layouts tested at all three breakpoints (1280×1024, 768×1024, 390×884)

---

## Approved — Ready for Implementation

This Papers Browser screen is the third core screen in the MVP user journey (after Dashboard and Analysis). When implementing:

1. **Wire to verified backend**: Use `GET /api/papers` endpoint (validated working)
2. **Use real data**: Paper titles, question counts, exam dates from actual database
3. **Match approved design**: Follow dashboard/analysis card styling, orange accent, DM Mono numbers
4. **Maintain navigation**: Show Papers tab as active, other tabs accessible
5. **Ensure mobile-first**: Filter drawer, single-column grid, touch-friendly targets
6. **Test all breakpoints**: Desktop (1280×1024), Tablet (768×1024), Mobile (390×884)

**Do not modify previous screens (Dashboard, Analysis, Authentication, Onboarding).**  
**Proceed to implementation when ready.**

**Next screen to design**: Individual Paper View (when user clicks "View Paper →" on a card)