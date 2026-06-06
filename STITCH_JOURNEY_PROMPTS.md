# PaperIQ — Complete Stitch Journey Prompts

**Status**: Ready for Generation  
**Created**: June 5, 2026  
**Source**: PRODUCT_EXPERIENCE_CONTEXT.md (approved)  
**Purpose**: Google Stitch screen generation prompts

---

## Generation Instructions

**For each screen**:
1. Copy the prompt below into Google Stitch
2. Review generated design against success criteria
3. Approve design before moving to next screen
4. Do NOT implement until all 8 screens approved

**Focus on**:
- Product feeling, not form layouts
- Student confidence, not data visualization
- Time saved messaging on every screen
- Mobile-first design

---

## Screen 1: Landing Page

### Stitch Prompt

```
Design a landing page for PaperIQ — a student exam preparation platform.

CORE PROMISE:
"Stop wasting hours searching WhatsApp groups for previous papers."

HERO SECTION:
- Headline: "Stop Searching WhatsApp Groups for Previous Papers"
- Subheadline: "AI analyzes 10 years of exams. Know what to study in 5 seconds."
- Hero visual: Split-screen comparison
  * Left side: Chaotic WhatsApp screenshots (blurred messages, scattered PDFs)
  * Right side: Clean PaperIQ analysis interface with clear priorities
- Primary CTA: "Get Started — Upload Hall Ticket" (large, orange #f97316, hero-sized)
- Trust signals below CTA:
  * "5,730 questions analyzed"
  * "10 subjects ready"
  * "60% AI classification coverage"

FEATURES SECTION (3 cards):
1. 📊 Smart Analysis
   "AI finds patterns across 10 years of exam papers"
   
2. 🎯 Priority Insights
   "Know exactly what to study first, backed by evidence"
   
3. ⚡ Instant Results
   "5 seconds, not 5 hours of manual organization"

TIME SAVED MESSAGING:
"Students save 4-6 hours of manual paper organization"

DESIGN SYSTEM:
- Background: #07070d (near-black)
- Cards: #1a1a1f (dark gray)
- Text: white primary, #a0a0a0 secondary
- Accent: #f97316 (orange for CTAs)
- Font: Space Grotesk (headings), Geist (body)
- Mobile-first, max-width 1200px desktop

EMOTIONAL GOAL:
Student feels: "I need to try this. This solves my exact problem."

NOT a dashboard. NOT a college portal. NOT a form application.
This is a student time-saving platform.
```

### Success Criteria
- [ ] Hero CTA is unmissable (orange, large)
- [ ] Split-screen visual shows clear before/after
- [ ] "Time saved" messaging prominent
- [ ] Trust signals build credibility
- [ ] Mobile responsive

---

## Screen 2: Signup / Login

### Stitch Prompt

```
Design a signup/login screen for PaperIQ.

GOAL:
Minimal friction signup — student wants to see analysis fast.

LAYOUT:
Centered card on dark background (#07070d).

SIGNUP OPTIONS (for new users):
- "Continue with Google" (OAuth button, primary style)
- "Continue with Email" (magic link, no password)
- Small text: "Takes 10 seconds"

LOGIN FORM (for returning users):
- Email input only (passwordless)
- "Send Magic Link" button
- "New user? Sign up above"

NO PASSWORD FIELDS.
NO multi-field registration form.
NO complexity.

TIME SAVED MESSAGING:
"Join 100+ MLRIT students saving 4-6 hours per exam"

DESIGN SYSTEM:
- Background: #07070d
- Card: #1a1a1f with subtle border
- Input fields: #2a2a2f with white text
- Primary button: #f97316 (orange)
- Font: Geist (body text)

EMOTIONAL GOAL:
Student feels: "This should be quick. I just want to see the analysis."

LOADING STATE:
"Creating your account..." (spinner, 1-2 seconds)

Mobile-first design.
```

### Success Criteria
- [ ] OAuth is most prominent option
- [ ] No password complexity
- [ ] Time saved messaging present
- [ ] Loading state shown
- [ ] Clean, minimal form

---

## Screen 3: Onboarding — Hall Ticket Upload (HERO FEATURE)

### Stitch Prompt

```
Design the Hall Ticket Upload onboarding screen for PaperIQ.

THIS IS THE HERO FEATURE — PaperIQ's strongest differentiator.

GOAL:
Student uploads hall ticket and experiences MAGICAL auto-detection.

HEADLINE:
"🎯 The Fastest Setup Ever"

SUBHEADLINE:
"Upload your hall ticket. We'll detect everything automatically."

AUTO-DETECTION CALLOUTS (with sparkle icons):
✨ Auto-detect semester
✨ Auto-detect regulation  
✨ Auto-detect all subjects

UPLOAD AREA (hero-sized, centered):
Large drag-and-drop zone with:
- 📄 Icon
- "Drag & Drop Hall Ticket"
- "or Click to Upload"
- "Supports PDF, JPG, PNG"

Make this feel MAGICAL and EFFORTLESS.

TIME SAVED MESSAGING (prominent):
"💡 Saves 4-6 hours of manual setup"

FALLBACK OPTION (small, bottom):
"Enter manually instead (slower)" — small text link, not a button

DESIGN SYSTEM:
- Background: #07070d
- Upload zone: dashed border #f97316 (orange), #1a1a1f fill
- Hover: solid border #f97316
- Font: Space Grotesk (headline), Geist (body)
- Sparkle icons next to auto-detect callouts

EMOTIONAL GOAL:
Student feels: "Wow. It just... knows everything. This is amazing."

NOT a form toggle.
NOT equal options.
THIS is the primary path.

Mobile-first, large touch targets.
```

### Success Criteria
- [ ] Upload zone is hero-sized and unmissable
- [ ] Auto-detection callouts feel magical
- [ ] Time saved messaging prominent
- [ ] Manual option clearly secondary
- [ ] Mobile-friendly drag-drop

---

## Screen 4: Hall Ticket Confirmation

### Stitch Prompt

```
Design the Hall Ticket Confirmation screen for PaperIQ.

GOAL:
Student verifies extracted data — feels amazed at accuracy.

SUCCESS BADGE (top, prominent):
"✓ Extracted Successfully"
"Confidence: High" (green badge)

EXTRACTED DATA (clean cards):
Branch: CSE
Regulation: R22  
Semester: II B.Tech II Semester

SUBJECTS DETECTED (list with checkmarks):
✓ A6CS05 — Data Structures
✓ A6CS08 — Discrete Mathematics
✓ A6CS09 — Database Management Systems
✓ A6CS11 — Operating System
✓ A6CS13 — Software Testing

Show 5 subjects with clean checkmark icons.

TIME SAVED REMINDER:
"💡 Manual entry would have taken 3-5 minutes"

ACTIONS (2 buttons):
- "Confirm & Continue" (primary, orange #f97316, large)
- "Edit Manually" (secondary, gray outline, smaller)

DESIGN SYSTEM:
- Background: #07070d
- Card: #1a1a1f
- Success badge: #10b981 (green)
- Checkmarks: #10b981
- Font: Space Grotesk (headings), Geist (body), DM Mono (codes)

EMOTIONAL GOAL:
Student feels: "Wow, it got everything right. That was fast."

Show data in clean, scannable format.
Not a form — just verification.

Mobile-first.
```

### Success Criteria
- [ ] Success badge is celebratory
- [ ] Data is scannable at a glance
- [ ] Subjects clearly listed with checkmarks
- [ ] Time saved reminder present
- [ ] Primary CTA unmissable

---

## Screen 5: Manual Onboarding (Fallback)

### Stitch Prompt

```
Design the Manual Onboarding screen for PaperIQ.

ONLY shown if student skips hall ticket upload.

GOAL:
Complete profile with MINIMAL fields — no unnecessary data collection.

PROGRESS INDICATOR:
"Step 1 of 2: Academic Info"

FIELDS (Step 1):
- College: [MLRIT] (dropdown, pre-selected)
- Branch: [CSE ▼] (dropdown)
- Regulation: [R22 ▼] (dropdown)
- Year: [2 ▼] (dropdown: 1-4)
- Semester: [4 ▼] (dropdown: 1-8)

FIELDS (Step 2):
"Step 2 of 2: Learning Goals (Optional)"
- Target CGPA: [7.5] (number input)
- Study Hours/Day: [4] (slider, 1-12)
- Preparation Level: [Intermediate ▼] (dropdown)

TIME COMPARISON MESSAGE:
"⏱️ Hall ticket upload is 3x faster (30s vs 2-3 minutes)"

ACTIONS:
- Step 1: [Next →] button
- Step 2: [Save & Start Using PaperIQ] button

DESIGN SYSTEM:
- Background: #07070d
- Card: #1a1a1f
- Input fields: #2a2a2f
- Labels: #a0a0a0
- Accent: #f97316
- Font: Geist

EMOTIONAL GOAL:
Student feels: "Okay, this is still faster than organizing PDFs myself."

Clean, minimal form.
No bloat fields.

Mobile-first.
```

### Success Criteria
- [ ] Only essential fields shown
- [ ] Progress indicator clear
- [ ] Time comparison shown
- [ ] Two-step flow logical
- [ ] Mobile-friendly inputs

---

## Screen 6: Subject Hub (DEFAULT LANDING)

### Stitch Prompt

```
Design the Subject Hub screen for PaperIQ.

THIS IS THE DEFAULT LANDING PAGE for returning users.

GOAL:
Student sees their semester subjects and picks one to analyze.

HEADER:
"Your Subjects — Semester 4"
"CSE · R22" (small text)

SUBJECT CARDS (vertical list, 5 cards):
Each card shows:
- 📚 Icon
- Subject Name (large, bold)
- Subject Code (small, gray)
- "Last analyzed: X days ago" OR "Last analyzed: Never"
- [Analyze →] button (orange #f97316)

Example cards:
1. Data Structures (A6CS05)
2. Database Management Systems (A6CS09)
3. Operating System (A6CS11)
4. Discrete Mathematics (A6CS08)
5. Software Testing (A6CS13)

TIME SAVED MESSAGING (footer):
"💡 Time saved: 4-6 hours of manual paper organization"

DESIGN SYSTEM:
- Background: #07070d
- Cards: #1a1a1f with subtle border
- Card hover: slight elevation, border brightens
- Text: white primary, #a0a0a0 secondary
- CTA buttons: #f97316 (orange)
- Font: Space Grotesk (subject names), Geist (metadata)

EMOTIONAL GOAL:
Student feels: "My subjects are right here. No searching, no dropdowns. Just pick."

NOT a dropdown selector.
NOT a form.
Cards feel like direct actions.

Mobile-first, large touch targets.
```

### Success Criteria
- [ ] Cards are large and tappable
- [ ] "Analyze" CTAs prominent
- [ ] Last analyzed metadata shown
- [ ] Time saved messaging present
- [ ] Clean, scannable list

---

## Screen 7: Analysis Loading

### Stitch Prompt

```
Design the Analysis Loading screen for PaperIQ.

SHOWN FOR 3-5 SECONDS while analysis runs.

GOAL:
Student feels INTELLIGENCE is happening, not just loading.

HEADER:
"Analyzing Data Structures..."

INTELLIGENCE INDICATORS (sequential animation, each appears 0.8s apart):
⚡ Scanning 1,831 questions...
🔍 Identifying topics...
📊 Calculating unit distribution...
🎯 Finding high probability topics...

PROGRESS BAR:
Visual progress bar: ████████░░░ 80%

DESIGN SYSTEM:
- Background: #07070d
- Card: #1a1a1f centered
- Icons: #f97316 (orange)
- Text: white
- Progress bar: #f97316 fill, #2a2a2f background
- Font: Geist

ANIMATION:
Each indicator fades in sequentially.
NOT all at once.
Progress bar fills smoothly.

EMOTIONAL GOAL:
Student feels: "Something smart is happening behind the scenes."

NOT a generic spinner.
NOT "Please wait..."
Show WHAT is being analyzed.

Mobile-first.
```

### Success Criteria
- [ ] Sequential animation feels intelligent
- [ ] Progress bar shows actual progress
- [ ] Icons and text clear
- [ ] Not generic loading
- [ ] Mobile-centered

---

## Screen 8: Analysis Results (THE CORE SCREEN)

### Stitch Prompt

```
Design the Analysis Results screen for PaperIQ.

THIS IS WHERE PAPERIQ DELIVERS VALUE.

PRIORITIZE ACTION OVER ANALYTICS.

HEADER:
"Data Structures — Study Plan"

TIME SAVED BANNER (top, prominent):
"💡 Time saved: 4-6 hours of manual analysis you would have done"

SECTION ORDER (CRITICAL — follow exactly):

1. 📚 RECOMMENDED STUDY ORDER (priority 1)
   
   Priority 1 Card (expanded, large):
   - "Priority 1: Unit I"
   - "34.3% of exam (273 questions)"
   - "Start with:"
     * Arrays & Linked Lists (87q)
     * Stacks & Queues (64q)
     * Hashing (48q)
   - "Why study this first:"
     "Appears in every single exam. Master this, you secure 34% marks."
   - [Start Studying Unit I →] (large orange button)
   
   Priority 2 Card (collapsed):
   - "Priority 2: Unit IV"
   - "20.4% of exam (164 questions)"
   - [View Priority 2 Details] (smaller button)
   
   Priority 3 Card (collapsed):
   - "Priority 3: Unit III"
   - "16.6% of exam"
   - [View Priority 3 Details]

2. 🔥 HIGH PROBABILITY TOPICS
   "These WILL appear on your exam"
   
   List (top 3, expandable):
   1. Binary Search Trees
      ⚡ Very High Probability
      📊 52 questions across 10 papers
      ✓ 100% confidence
   
   2. Graph Algorithms
      ⚡ High Probability
      📊 38 questions across 8 papers
      ✓ 85% confidence
   
   [View All 10 Topics]

3. 🎯 MOST ASKED TOPICS
   
   List (top 3, expandable):
   1. Arrays & Linked Lists — 87 questions · Very High Priority
   2. Binary Search Trees — 64 questions · High Priority
   3. Stacks & Queues — 52 questions · High Priority
   
   [View All 10 Topics]

4. 📊 UNIT COVERAGE
   
   Horizontal bars:
   Unit I    ████████████████ 34.3%
   Unit IV   ████████ 20.4%
   Unit III  ██████ 16.6%
   Unit V    ████████ 18.6%
   Unit II   ████ 10.1%

5. 🔁 REPEATED QUESTIONS
   "These appeared multiple times"
   
   [5x] Explain difference between stack and queue
   [4x] Define BST and its operations
   
   [View All Repeated Questions]

6. ⚙️ ADVANCED ANALYTICS (collapsed)
   [Expandable section]
   "Show Classification Data, Coverage %, Question Distribution Details"

DESIGN SYSTEM:
- Background: #07070d
- Cards: #1a1a1f
- Priority badges: #ef4444 (red - very high), #f97316 (orange - high), #fbbf24 (yellow - medium)
- Progress bars: #f97316 fill
- Text: white primary, #a0a0a0 secondary
- Font: Space Grotesk (headings), Geist (body), DM Mono (numbers)

EMOTIONAL GOAL:
Student feels: "Perfect. I know exactly what to do. Starting with Priority 1."

NOT a dashboard.
NOT analytics first.
ACTION first — what to study NOW.

Mobile-first, large sections, clear hierarchy.
```

### Success Criteria
- [ ] Study Order is first and largest
- [ ] Time saved banner prominent
- [ ] "Start Studying" CTA unmissable
- [ ] Progressive disclosure (collapsed sections)
- [ ] Advanced analytics hidden by default
- [ ] Mobile-scrollable hierarchy

---

## Post-Generation Checklist

After ALL 8 screens generated in Stitch:

### Visual Consistency
- [ ] All screens use same color palette
- [ ] Typography consistent (Space Grotesk, Geist, DM Mono)
- [ ] Spacing rhythm consistent (16px, 24px, 32px)
- [ ] Button styles consistent
- [ ] Card styles consistent

### Emotional Goals Met
- [ ] Screen 1: "I need to try this"
- [ ] Screen 2: "This should be quick"
- [ ] Screen 3: "Wow, this is magical"
- [ ] Screen 4: "It got everything right"
- [ ] Screen 5: "Still faster than manual"
- [ ] Screen 6: "My subjects are right here"
- [ ] Screen 7: "Intelligence is happening"
- [ ] Screen 8: "I know what to do now"

### Time Saved Messaging
- [ ] Present on screens 1, 3, 4, 6, 8
- [ ] Consistently reinforces value

### Mobile-First
- [ ] All screens responsive at 375px
- [ ] Touch targets ≥44px
- [ ] Font sizes ≥14px
- [ ] Scrollable content fits mobile viewport

### Action-Oriented
- [ ] CTAs clear on every screen
- [ ] Primary actions unmissable
- [ ] Secondary actions clearly less prominent

---

## Implementation Approval Gates

**BEFORE Kiro implements ANY screen**:

### Gate 1: Complete Journey Approved
- [ ] All 8 Stitch designs reviewed
- [ ] User approves complete flow
- [ ] User approves emotional journey
- [ ] User approves visual consistency

### Gate 2: Technical Feasibility
- [ ] Backend APIs exist for all data needs
- [ ] Authentication flow mapped
- [ ] File upload mechanism understood
- [ ] Analysis generation confirmed working

### Gate 3: Implementation Priority
- [ ] Screen 1 (Landing) first
- [ ] Screens 2-5 (Onboarding flow) second
- [ ] Screens 6-8 (Core app) third

---

## Success Metrics

After implementation, measure:

1. **Onboarding Completion Rate**: 80%+ complete hall ticket upload
2. **Time to First Insight**: <3 minutes from signup to analysis
3. **Hall Ticket Success Rate**: 90%+ successful extractions
4. **Analysis Satisfaction**: 80%+ "insights were useful"
5. **Return Rate**: 60%+ return for second subject

---

**Created**: June 5, 2026  
**Status**: Ready for Stitch Generation  
**Source**: PRODUCT_EXPERIENCE_CONTEXT.md (approved with adjustments)  
**Next**: Generate each screen in Google Stitch using prompts above
