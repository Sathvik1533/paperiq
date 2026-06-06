# Screen 2: Onboarding Experience — Stitch Prompt

## Context
Student has just landed on PaperIQ. They clicked "Start Analysis" or "Get Started" from the landing page.

**Goal:** Make them feel understood and get their data with ZERO friction.

**Core Principle:** Hall Ticket Upload = primary path. Manual setup = backup option only.

---

## User Psychology at This Moment

**What they're thinking:**
- "Will this actually work for MY college?"
- "Do I have to fill out 10 forms?"
- "Can I trust this with my hall ticket?"
- "Will this take 5 minutes or 30 seconds?"

**What they're feeling:**
- Slightly anxious (new tool)
- Impatient (exams are coming)
- Skeptical (have they been burned by tools before?)

**What they need:**
- Reassurance PaperIQ knows their college/branch
- Proof this will be fast
- Clarity on what happens to their data

---

## Screen Layout

### Hero Section (Top 1/3 of viewport)
**Visual:** Soft gradient background (#07070d → slightly lighter), subtle border glow

**Headline (Space Grotesk, 40px):**
```
We'll set up your profile in 30 seconds
```

**Subheadline (Geist, 18px, white/60):**
```
Upload your hall ticket or enter details manually — your choice
```

**Trust Indicator (small text below, white/40, 14px):**
```
🔒 Your data stays private. We never share hall tickets.
```

---

### Two-Path Layout (Center Focus)

**Design Pattern:** Two cards side-by-side (desktop) or stacked (mobile)

#### Card 1: Hall Ticket Upload (PRIMARY — Emphasized)

**Visual:**
- Larger card, accent border (#f97316 or #10b981 subtle glow)
- Slightly elevated (shadow or border pulse on hover)

**Headline inside card:**
```
📸 Upload Hall Ticket (Fastest)
```

**Body text:**
```
We'll auto-fill your college, branch, regulation, and subjects.
Works for JNTUH, JNTUK, JNTUA, Osmania, and 50+ colleges.
```

**CTA Button (primary, accent color):**
```
Choose Hall Ticket
```

**Supporting text (below button, small, white/40):**
```
Supports: PDF, JPG, PNG • Max 5MB
```

**Interaction:**
- On click → File picker opens
- After upload → Instant visual feedback (progress bar or checkmark animation)
- Processing indicator: "Extracting details..." with skeleton loader

---

#### Card 2: Manual Setup (SECONDARY — Deemphasized)

**Visual:**
- Standard card, subtle border (white/10)
- No accent, no glow
- Slightly smaller or equal size to Card 1

**Headline inside card:**
```
✍️ Enter Details Manually
```

**Body text:**
```
Choose this if you don't have your hall ticket handy.
Takes 2 minutes.
```

**CTA Button (secondary, white/20 background, white text):**
```
Manual Setup
```

---

### What Happens After Hall Ticket Upload

**Step 1: OCR Processing (backend extracts data)**
- Student sees: animated progress bar with status text
- Messages cycle through:
  - "Reading hall ticket..."
  - "Detecting college and branch..."
  - "Finding your subjects..."
  - "Almost done..."

**Step 2: Confirmation Screen (extracted data shown for review)**

**Layout:**
```
✓ We found your details:

[Editable fields displayed as clean form:]
College: [MLRIT] (detected)
Branch: [CSE] (detected)
Regulation: [R22] (detected)
Semester: [Current/5th] (detected or dropdown)

[List of subjects with checkboxes:]
☑ Data Structures
☑ DBMS
☑ Operating Systems
☐ Advanced Java (uncheck if not taking this exam)

[Two buttons:]
[Confirm & Continue] (primary)
[Edit Details] (secondary)
```

**If OCR confidence is low on any field:**
- Mark field with amber warning icon
- Tooltip: "Please verify this field"

---

### What Happens After "Manual Setup" Click

**Screen transitions to form:**

**Form Design Rules:**
1. **One question visible at a time** (progressive disclosure, NOT all fields at once)
2. Smart defaults based on common patterns
3. Skip logic (don't ask unnecessary questions)

**Question Flow:**

**Q1: Which college?**
- Dropdown with autocomplete
- Top 10 popular colleges shown first
- "Don't see yours? Type to search" placeholder

**Q2: Which branch?**
- Conditional on college selection
- If JNTUH: CSE, ECE, EEE, MECH, CIVIL, IT
- Radio buttons or visual cards

**Q3: Which regulation?**
- R22, R20, R18, R16 (radio buttons)
- Most recent highlighted as default

**Q4: Which semester?**
- Dropdown: 1st to 8th
- Default: current semester based on date (Feb → 6th sem, Aug → 7th sem)

**Q5: Select your subjects**
- Checkboxes for all subjects in that semester
- Pre-checked by default
- "Select All" / "Deselect All" toggles

**Final Step:**
```
[Confirm & Continue] button (disabled until all required fields filled)
```

---

## Edge Cases to Handle

**Hall ticket upload fails (OCR error):**
- Message: "We couldn't read your hall ticket clearly. Try manual setup instead?"
- Buttons: [Try Another Photo] [Manual Setup]

**College not in database:**
- Message: "We don't have papers for [College Name] yet. Want to help us add it?"
- Button: [Request College] → opens form for college request
- Alternative: [Choose Another College]

**No subjects detected:**
- Fall back to manual subject selection
- Message: "We found your college and branch, but couldn't detect subjects. Please select them below."

---

## Motion & Interaction

**Card hover states:**
- Hall Ticket card: subtle scale (1.02), border glow intensifies
- Manual Setup card: subtle border color change

**Upload animation:**
- File picker opens
- On file select: card transforms into progress indicator
- Progress bar fills left-to-right with percentage
- On complete: checkmark animation (scale in with spring)

**Form transitions:**
- Each question fades in from bottom (y: 20 → 0)
- Previous question fades out to top
- Smooth, 300ms ease-out

**Button states:**
- Primary button: whileHover scale 1.02, whileTap scale 0.98
- Disabled state: opacity 40%, cursor not-allowed

---

## Copy Principles

**Reassuring, not salesy:**
- ✓ "We'll auto-fill your details"
- ✗ "Revolutionary AI-powered extraction"

**Specific, not vague:**
- ✓ "Takes 30 seconds"
- ✗ "Quick and easy"

**Transparent about data:**
- ✓ "Your hall ticket is processed once and never stored"
- ✗ (silence about data usage)

---

## Success Metrics (How to Know This Screen Works)

- **Primary metric:** % of users who complete onboarding within 2 minutes
- **Secondary:** Hall ticket upload completion rate vs manual setup
- **Tertiary:** Bounce rate on this screen (should be <20%)

**If bounce rate is high:**
- Hypothesis 1: Students don't trust hall ticket upload → add testimonial or demo video
- Hypothesis 2: Form feels too long → reduce fields or add progress indicator
- Hypothesis 3: No clear value → strengthen copy about what happens next

---

## Design Tokens (Match Screen 1)

**Colors:**
- Background: #07070d
- Card background: white/5
- Border: white/10 (default), accent on primary card
- Text: white (headings), white/80 (body), white/40 (supporting)
- Accent: #f97316 (orange) OR #10b981 (emerald)

**Typography:**
- Headlines: Space Grotesk, 32–40px, font-weight 600
- Body: Geist, 16–18px, font-weight 400
- Supporting: Geist, 14px, font-weight 400

**Spacing:**
- Section padding: 48px vertical, 24px horizontal (mobile)
- Card gap: 24px between cards
- Internal card padding: 32px

**Borders:**
- Default: 1px solid white/10
- Hover: 1px solid white/20
- Active/Primary: 1px solid accent with 8px blur glow

---

## What Happens After Onboarding Completes

**Transition to Screen 3: Dashboard**
- Brief loading state (1–2s): "Building your analysis..."
- Animated transition (fade + slide)
- Dashboard loads with their profile data pre-filled

**First-time user state on Dashboard:**
- Welcome message: "Welcome, [Name]! Here's what we found for you:"
- Highlight key insight immediately (e.g., "Data Structures appears in 68% of exams")
- CTA to explore further

---

## Build Order (For Implementation)

1. **Static layout (no interaction)** — two cards, hero text, footer
2. **Hall ticket upload flow** — file picker, progress bar, confirmation screen
3. **Manual setup flow** — progressive form, validation, state management
4. **Edge cases** — error states, empty states, loading states
5. **Motion polish** — Framer Motion animations, hover states
6. **Mobile responsive** — stack cards vertically, adjust font sizes

---

## Tech Stack Notes

**Frontend:**
- Next.js 14 App Router
- Framer Motion for animations
- React Hook Form for manual setup form
- Zod for validation

**Backend API Endpoints Needed:**
```
POST /api/onboarding/hall-ticket-upload
  → Accepts: multipart/form-data (file)
  → Returns: { college, branch, regulation, semester, subjects[] }

POST /api/onboarding/manual-setup
  → Accepts: { college_id, branch_id, regulation, semester, subject_ids[] }
  → Returns: { profile_id, status: "complete" }

GET /api/onboarding/colleges
  → Returns: [{ id, name, logo_url }]

GET /api/onboarding/subjects?college=X&branch=Y&regulation=Z&semester=N
  → Returns: [{ id, code, name, category }]
```

---

## Final Checklist Before Calling This Screen "Done"

- [ ] Hall ticket upload works end-to-end (file → OCR → confirmation)
- [ ] Manual setup works end-to-end (form → validation → submission)
- [ ] Error states handled (upload fails, college not found, network error)
- [ ] Mobile responsive (cards stack, text scales, buttons don't overlap)
- [ ] Loading states smooth (no blank screens, skeleton loaders present)
- [ ] Animations feel smooth (60fps, no jank)
- [ ] Copy is clear (tested with 3 non-technical users)
- [ ] Trust indicators visible (privacy statement, supported colleges)
- [ ] Form validation works (can't submit incomplete data)
- [ ] Navigation works (can go back to landing, forward to dashboard)

---

## Open Questions for Stitch

1. **Should we show sample hall ticket format?** (image showing what a valid hall ticket looks like)
2. **Should we add a "Skip Onboarding" option?** (for demo/testing — goes straight to dashboard with dummy data)
3. **Should we collect phone number or email at this stage?** (or defer to later for notifications)
4. **Should we show a brief "What happens next" explainer before upload?** (sets expectation: upload → analysis → insights)

---

**End of Screen 2 Prompt**

Proceed to build this screen after landing page is live.
