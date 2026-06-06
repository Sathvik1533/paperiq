# Screen 04: Analysis Results — Stitch Design Prompt

## Context from Previous Screens
- **Landing approved**: Dark theme with orange accent, academic credibility focus
- **Onboarding approved**: Hall ticket + manual paths, Google OAuth, stepper with checkmarks
- **Dashboard approved**: Subject cards with priority indicators, welcome section, recent analysis sidebar

---

## Updated Navigation Architecture

### Approved MVP Navigation Structure
Based on verified backend capabilities and actual PaperIQ features:

**Primary Navigation**: `Dashboard | Analysis | Papers | Profile`

- **Dashboard** — Student home with subject overview (`/dashboard`)
- **Analysis** — Subject analysis results - current page (`/analysis`) 
- **Papers** — Browse past papers with filters (`/papers`)
- **Profile** — Student profile and settings (`/profile`)

**Navigation Context for This Screen**:
```
PaperIQ | [Dashboard] [Analysis] [Papers] [Profile] | [Run New Analysis] [•]
```
Where Analysis tab is highlighted (current page), Run New Analysis is primary CTA (orange), and [•] is profile menu.

---

## Screen Purpose
The Analysis Results screen is the **core value delivery screen** of PaperIQ. This is where students see actionable exam intelligence after running analysis on a subject. It transforms raw question data into strategic study insights.

## User Mental State on Arrival
- **Expectation**: "Show me exactly what to study and why"
- **Urgency**: "I need to know which topics are most important for my exam"
- **Trust**: "Prove this analysis is based on real data, not guesses"
- **Action**: "Give me a clear next step - what should I study first?"

---

## Design Requirements

### 1. Page Header (Subject Context)

**Content**:
```
[Subject Code] — [Subject Name]
[Exam Category] Analysis • [Regulation] • Updated [X hours ago]
```

**Example**:
```
CS301 — Data Structures
Mid-Term 2 Analysis • R22 • Updated 3 hours ago
```

**Layout**:
- Left-aligned, full-width header bar
- Background: `rgba(255, 255, 255, 0.03)`
- Border-bottom: `rgba(255, 255, 255, 0.08)` 1px solid
- Padding: 24px 32px
- Subject name: Space Grotesk, 24px, white
- Metadata line: DM Mono, 12px, `rgba(255, 255, 255, 0.6)`

**Right-side Actions**:
- "Export PDF" button (ghost, white border)
- "Share Analysis" button (ghost, white border)
- "Refresh Data" icon button (circular, orange on hover)

---

### 2. Priority Score Hero (Top Visual Anchor)

**Purpose**: Immediately show the subject's urgency level

**Content**:
```
┌────────────────────────────────────┐
│ PRIORITY SCORE                     │
│                                    │
│        94%                         │
│   [████████████████░░]             │
│                                    │
│ CRITICAL — Focus on this subject  │
│ Based on 47 papers analyzed        │
└────────────────────────────────────┘
```

**Visual Design**:
- Large number: DM Mono, 72px, `#f97316` (orange)
- Horizontal bar: 100% width, 12px height, rounded ends
- Bar fill: orange gradient (`#f97316` → `#fb923c`)
- Bar background: `rgba(255, 255, 255, 0.1)`
- Label text: Space Grotesk, 16px, white
- Sublabel: DM Mono, 14px, `rgba(255, 255, 255, 0.6)`

**Priority Level Labels**:
- **90-100%**: "CRITICAL — Focus on this subject" (red dot indicator)
- **70-89%**: "HIGH ATTENTION — Prioritize soon" (orange dot)
- **50-69%**: "MODERATE — Standard preparation" (yellow dot)
- **Below 50%**: "LOW PRIORITY — Stable coverage" (green dot)

**Data Source**:
- `report_builder.py` → `calculate_priority_score()`
- Formula: topic frequency × coverage gaps × recency weight
- Backend endpoint: `POST /api/analysis/generate` or `POST /api/analysis/simple`

---

### 3. Key Insights Panel (Actionable Takeaways)

**Purpose**: Surface the 3-5 most important findings from the analysis

**Content**:
```
┌─────────────────────────────────────────────────┐
│ 🔥 KEY INSIGHTS                                 │
├─────────────────────────────────────────────────┤
│ 1. Trees & Graphs appeared in 88% of papers    │
│    → Study Unit III first (highest frequency)  │
│                                                 │
│ 2. Normalization tested in 76% of Mid-Terms    │
│    → DBMS conceptual questions dominate        │
│                                                 │
│ 3. Unit V coverage is weak (34% analyzed)      │
│    → Expect File I/O questions this semester   │
│                                                 │
│ [View Detailed Breakdown →]                    │
└─────────────────────────────────────────────────┘
```

**Visual Design**:
- Border: `rgba(255, 255, 255, 0.08)` 1px solid
- Background: `rgba(255, 255, 255, 0.03)`
- Border-radius: 12px
- Padding: 24px
- Each insight: numbered list, Space Grotesk 15px
- Arrow bullets: orange `#f97316`
- "View Detailed Breakdown" link: underline on hover

**Data Source**:
- Generated from `most_asked_topics` array in analysis response
- Key insights extract top 3-5 topics with highest priority
- Evidence counts from `high_probability_topics_classified`

---

### 4. Topic Frequency Analysis (Ranked Data)

**Purpose**: Show exactly which topics appear most often, with percentages and evidence

**Content**:
```
┌──────────────────────────────────────────────────────────────┐
│ MOST ASKED TOPICS                                            │
├────────┬────────────────────────────┬─────────┬──────────────┤
│ RANK   │ TOPIC                      │ FREQ    │ EVIDENCE     │
├────────┼────────────────────────────┼─────────┼──────────────┤
│ #1     │ Arrays                     │ 87 Q's  │ Very High    │
│ #2     │ Binary Search Trees        │ 64 Q's  │ High         │
│ #3     │ Sorting Algorithms         │ 52 Q's  │ High         │
│ #4     │ Graph Algorithms           │ 38 Q's  │ Medium       │
│ #5     │ Hash Tables               │ 31 Q's  │ Medium       │
└────────┴────────────────────────────┴─────────┴──────────────┘
[Show All 10 Topics →]
```

**Visual Design**:
- Table header: DM Mono, 12px, `rgba(255, 255, 255, 0.6)`, uppercase
- Table rows: Space Grotesk, 14px, white
- Frequency column: DM Mono, 16px, orange `#f97316`
- Priority badges: 
  - Very High: `#dc2626` (red)
  - High: `#f97316` (orange) 
  - Medium: `#10b981` (green)
- Hover state: row background → `rgba(255, 255, 255, 0.05)`

**Data Source**:
- `most_asked_topics` array from backend analysis response
- Format: `[{"topic": "Arrays", "count": 87, "priority": "Very High"}]`

---

### 5. Unit Distribution Breakdown (Visual Coverage)

**Purpose**: Show which syllabus units are heavily tested vs. lightly covered

**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ UNIT DISTRIBUTION                                       │
├─────────────────────────────────────────────────────────┤
│ Unit I    [████████████████████] 34.3% (273 questions) │
│ Unit II   [██████░░░░░░░░░░░░░░] 10.1% (80 questions)  │
│ Unit III  [████████████░░░░░░░░] 16.6% (132 questions) │
│ Unit IV   [████████████████░░░░] 20.4% (162 questions) │
│ Unit V    [██████████████░░░░░░] 18.6% (148 questions) │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Horizontal bar chart (same style as priority bar)
- Bar fill: gradient based on percentage
  - **30%+**: green gradient (`#10b981` → `#34d399`)
  - **15-29%**: orange gradient (`#f97316` → `#fb923c`) 
  - **<15%**: red gradient (`#dc2626` → `#ef4444`)
- Bar background: `rgba(255, 255, 255, 0.1)`
- Unit label: Space Grotesk, 14px, white
- Percentage: DM Mono, 16px, color-coded to match bar
- Question count: `rgba(255, 255, 255, 0.6)`, 12px

**Data Source**:
- `unit_distribution_classified` object from backend analysis response
- Format: `{"Unit I": 34.3, "Unit II": 10.1, "Unit III": 16.6, "Unit IV": 20.4, "Unit V": 18.6}`

---

### 6. High Probability Topics (Evidence-Based Predictions)

**Purpose**: Show topics most likely to appear in upcoming exams with supporting evidence

**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ HIGH PROBABILITY TOPICS                                 │
├─────────────────────────────────────────────────────────┤
│ Binary Search Trees                                     │
│ → 52 questions across 10 papers                        │
│ → Probability: Very High (Confidence: 1.0)             │
│                                                         │
│ Arrays                                                  │
│ → 48 questions across 9 papers                         │
│ → Probability: Very High (Confidence: 0.96)            │
│                                                         │
│ Sorting Algorithms                                      │
│ → 31 questions across 8 papers                         │
│ → Probability: High (Confidence: 0.84)                 │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Card-based layout (not table)
- Each topic is a mini-card within the larger panel
- Topic name: Space Grotesk, 16px, white, bold
- Evidence line: DM Mono, 14px, `rgba(255, 255, 255, 0.8)`
- Probability: orange `#f97316`, confidence in parentheses
- Separator: `rgba(255, 255, 255, 0.1)` 1px line between topics

**Data Source**:
- `high_probability_topics_classified` array from backend response
- Format: `[{"topic": "Binary Search Trees", "question_count": 52, "paper_count": 10, "probability": "Very High", "confidence": 1.0}]`

---

### 7. Study Priority Order (Actionable Recommendations)

**Purpose**: Convert analysis into a concrete study sequence

**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ STUDY PRIORITY ORDER                                    │
├─────────────────────────────────────────────────────────┤
│ Priority 1: Unit I (34.3% of exam)                     │
│ Top Topics: Arrays (87), Linked Lists (64), Stacks (48)│
│ Recommendation: Focus on this unit - 273 questions     │
│                                                         │
│ Priority 2: Unit IV (20.4% of exam)                    │ 
│ Top Topics: BST (52), Graphs (38), Trees (31)          │
│ Recommendation: Focus on this unit - 162 questions     │
│                                                         │
│ Priority 3: Unit V (18.6% of exam)                     │
│ Top Topics: Sorting (31), Hashing (24), Heaps (19)     │
│ Recommendation: Study after Units I & IV - 148 questions│
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Priority sections clearly separated with subtle dividers
- Priority number: DM Mono, 18px, orange `#f97316`
- Unit percentage: DM Mono, 16px, white
- Top topics: Space Grotesk, 14px, comma-separated
- Topic counts in parentheses: DM Mono, 12px, `rgba(255, 255, 255, 0.6)`
- Recommendation text: italic, `rgba(255, 255, 255, 0.8)`

**Data Source**:
- `study_priority_order` array from backend response
- Format: `[{"unit": "Unit I", "percentage": 34.3, "question_count": 273, "top_topics": ["Arrays", "Linked Lists", "Stacks"]}]`

---

### 8. Coverage Analysis Summary

**Purpose**: Show overall analysis completeness and confidence

**Content**:
```
┌─────────────────────────────────────────────────────────┐
│ ANALYSIS COVERAGE                                       │
├─────────────────────────────────────────────────────────┤
│ Total Questions Analyzed: 1,831                         │
│ Classified Questions: 1,382 (75.5%)                     │
│ Coverage Quality: High Confidence                       │
│                                                         │
│ Papers Included: 2021-2025 (5 years)                   │
│ Regulation: R22 CSE                                     │
└─────────────────────────────────────────────────────────┘
```

**Visual Design**:
- Simple information panel (not a chart)
- Key numbers: DM Mono, 16px, orange `#f97316` 
- Labels: Space Grotesk, 14px, white
- Percentage in parentheses: `rgba(255, 255, 255, 0.6)`
- Coverage quality indicator based on classification percentage

**Data Source**:
- `coverage_analysis` object from backend response
- Format: `{"classification_coverage": 0.755, "total_questions": 1831, "classified_questions": 1382}`

---

## Layout Structure (Desktop)

```
┌────────────────────────────────────────────────────────────┐
│ PaperIQ | [Dashboard] [Analysis] [Papers] [Profile]    [•] │
├────────────────────────────────────────────────────────────┤
│ CS301 — Data Structures • Mid-Term 2 • R22    [Export PDF] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────────────────┐  ┌──────────────────────────────────┐ │
│ │ PRIORITY SCORE │  │ KEY INSIGHTS                     │ │
│ │     94%        │  │ 1. Trees & Graphs 88%            │ │
│ │ [████████████] │  │ 2. Normalization 76%             │ │
│ │ CRITICAL       │  │ 3. Unit V weak (34%)            │ │
│ └────────────────┘  └──────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ MOST ASKED TOPICS                                      │ │
│ │ #1  Arrays               87 Q's    Very High           │ │
│ │ #2  Binary Search Trees  64 Q's    High                │ │
│ │ #3  Sorting Algorithms   52 Q's    High                │ │
│ │ [Show All 10 Topics →]                                 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ UNIT DISTRIBUTION                                      │ │
│ │ Unit I   [████████████████████] 34.3% (273 questions) │ │
│ │ Unit II  [██████░░░░░░░░░░░░░░] 10.1% (80 questions)  │ │
│ │ Unit III [████████████░░░░░░░░] 16.6% (132 questions) │ │
│ │ Unit IV  [████████████████░░░░] 20.4% (162 questions) │ │
│ │ Unit V   [██████████████░░░░░░] 18.6% (148 questions) │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ HIGH PROBABILITY TOPICS  │  │ STUDY PRIORITY ORDER     │ │
│ │ Binary Search Trees      │  │ Priority 1: Unit I       │ │
│ │ → 52 questions, 10 papers│  │ Top Topics: Arrays...    │ │
│ │                          │  │                          │ │
│ │ Arrays                   │  │ Priority 2: Unit IV      │ │
│ │ → 48 questions, 9 papers │  │ Top Topics: BST...       │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ANALYSIS COVERAGE                                      │ │
│ │ Total Questions: 1,831 | Classified: 1,382 (75.5%)    │ │
│ │ Coverage Quality: High Confidence | Papers: 2021-2025  │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## Layout Structure (Mobile)

```
┌────────────────────────────────┐
│ PaperIQ                    [•] │
│ [Dashboard][Analysis][Papers]  │
├────────────────────────────────┤
│ CS301 — Data Structures        │
│ Mid-Term 2 • R22               │
│ [Export PDF]                   │
├────────────────────────────────┤
│ PRIORITY SCORE                 │
│      94%                       │
│ [████████████████████]         │
│ CRITICAL — Focus here          │
├────────────────────────────────┤
│ KEY INSIGHTS                   │
│ 1. Trees & Graphs 88%          │
│ 2. Normalization 76%           │
│ 3. Unit V weak (34%)           │
│ [View Details →]               │
├────────────────────────────────┤
│ MOST ASKED TOPICS              │
│ #1  Arrays         87 Q's      │
│ #2  BST           64 Q's       │
│ #3  Sorting       52 Q's       │
│ [Show All →]                   │
├────────────────────────────────┤
│ UNIT DISTRIBUTION              │
│ Unit I   [██████████] 34.3%    │
│ Unit II  [███░░░░░░░] 10.1%    │
│ Unit III [█████░░░░░] 16.6%    │
│ Unit IV  [███████░░░] 20.4%    │
│ Unit V   [██████░░░░] 18.6%    │
├────────────────────────────────┤
│ HIGH PROBABILITY TOPICS        │
│ Binary Search Trees            │
│ → 52 questions, 10 papers      │
│                                │
│ Arrays                         │
│ → 48 questions, 9 papers       │
├────────────────────────────────┤
│ STUDY PRIORITY ORDER           │
│ Priority 1: Unit I (34.3%)     │
│ Top: Arrays, Linked Lists      │
│                                │
│ Priority 2: Unit IV (20.4%)    │
│ Top: BST, Graphs, Trees        │
├────────────────────────────────┤
│ ANALYSIS COVERAGE              │
│ 1,831 questions analyzed       │
│ 1,382 classified (75.5%)       │
│ High confidence coverage       │
└────────────────────────────────┘
```

---

## Interaction Patterns

### On Page Load
1. Fade-in priority score with count-up animation (0 → 94% over 600ms)
2. Stagger key insights (100ms delay per insight)
3. Animate unit bars from left to right (clip-path reveal, 400ms per bar)
4. Fade-in table rows (50ms stagger)

### On Topic Row Click (in Most Asked Topics)
1. Row expands with slide-down animation (200ms ease-out)
2. Shows sample questions from that topic
3. Click again to collapse
4. Only one row expanded at a time (accordion behavior)

### On "Export PDF" Click
1. Button shows loading spinner (orange circular spinner)
2. Generate PDF server-side 
3. Download starts automatically
4. Button returns to normal state

### On "Show All Topics" Click
1. Table expands to show all topics (not just top 5)
2. Button text changes to "Show Less"
3. Smooth expand animation (max-height transition)

---

## Data Fetching Strategy

**On page load**:
```typescript
const subjectCode = params.subject  // from URL /analysis/CS301

// Single API call returns all analysis data
const analysis = await fetch(`/api/analysis/simple`, {
  method: 'POST',
  body: JSON.stringify({
    subject_id: subjectCode,
    regulation: user.regulation  // from user profile
  })
})
```

**Backend endpoint**:
- `POST /api/analysis/simple` (already verified working)
- Input: `{subject_id: string, regulation: string}`
- Returns complete analysis object with all 7 features

**Response format** (from MVP verification):
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
  "coverage_analysis": {
    "classification_coverage": 0.755,
    "total_questions": 1831,
    "classified_questions": 1382
  }
}
```

---

## Success Metrics (Four Feelings)

### 1. Confidence
- User sees real percentages based on 1,831 actual questions
- Topic rankings match their exam experience ("Yes, Arrays is always tested")
- Evidence is specific: "52 questions across 10 papers" not "appears frequently"
- Coverage percentage shows analysis quality (75.5% classified)

### 2. Relief
- No overwhelming data dump (top 5 topics visible, "Show All" expands)
- Clear visual hierarchy (priority score is largest, most prominent)
- Actionable study order (Priority 1, 2, 3 with specific units)
- Evidence supports every claim

### 3. Ambition
- High priority score triggers "I need to focus on this subject"
- Unit distribution shows gaps: "Unit V only 18.6% - opportunity to excel"
- Study priority gives concrete next steps: "Start with Unit I"
- High probability topics create urgency: "BST is Very High - study now"

### 4. Delight
- Smooth count-up animation on priority score (feels alive)
- Unit bars animate in sequence (satisfying progression)
- Orange accent used sparingly (CTAs + high-priority indicators only)
- Information density is high but not overwhelming

---

## Edge Cases

| Case | Behavior |
|------|----------|
| No analysis data | Show "No analysis available — run analysis first" empty state |
| Subject not found | Redirect to dashboard with error toast |
| Low classification (<50%) | Show warning: "Limited data - insights may not be comprehensive" |
| Only 1-2 papers analyzed | Show notice: "Analysis based on limited papers - confidence may be lower" |
| All units have equal distribution | Show as data (no artificial variation) |
| Topic with 0 questions | Don't show in "Most Asked Topics" table |

---

## Technical Implementation Requirements

**Priority score animation**:
```javascript
function animateNumber(el, from, to, duration = 600) {
  const start = performance.now()
  function tick(now) {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    el.textContent = Math.round(from + (to - from) * eased) + '%'
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
```

**Unit bar animations**:
```javascript
// Staggered clip-path reveal
gsap.fromTo(".unit-bar", 
  { clipPath: "inset(0 100% 0 0)" },
  { clipPath: "inset(0 0% 0 0)", duration: 0.4, stagger: 0.1, ease: "power2.out" }
)
```

**Responsive design**:
- Desktop: 2-column layout for bottom sections
- Tablet: 1-column layout, maintain card spacing
- Mobile: Full-width cards, reduced padding, smaller fonts

**Performance**:
- Analysis data fetched once on page load
- No real-time updates (analysis is historical)
- Skeleton loading during data fetch
- Error boundary for API failures

---

## Final Checklist Before Implementation

- [ ] Navigation shows "Analysis" tab as active/highlighted
- [ ] Priority score uses backend calculation (not hardcoded)
- [ ] Most Asked Topics table populated from `most_asked_topics` array
- [ ] Unit Distribution bars use `unit_distribution_classified` percentages
- [ ] High Probability Topics shows evidence (question + paper counts)
- [ ] Study Priority Order uses `study_priority_order` array
- [ ] Coverage Analysis shows `classification_coverage` percentage
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Mobile layout tested (stacked cards, readable fonts)
- [ ] Empty state shown if no analysis data exists
- [ ] Export PDF button disabled until data loads

---

## Approved — Ready for Implementation

This Analysis Results screen represents the core value delivery of PaperIQ. When implementing:

1. **Wire to verified backend**: Use `POST /api/analysis/simple` endpoint (validated working)
2. **Use real data**: All percentages, counts, and insights come from actual database queries
3. **Match approved design**: Follow dashboard card styling, orange accent, DM Mono numbers
4. **Maintain navigation**: Show Analysis tab as active, other tabs accessible
5. **Ensure mobile-first**: Most students will view analysis on phones

**Do not modify previous screens (Dashboard, Authentication, Onboarding).**  
**Proceed to implementation when ready.**