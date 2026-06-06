# Screen 1: Landing Page — Complete Stitch Prompt

**Status**: Ready for Manual Generation  
**Philosophy**: Recognition over explanation. Students feel "this is literally my problem" within 3 seconds.

---

## Copy This Entire Prompt Into Google Stitch

```
Design a landing page for PaperIQ.

THIS IS NOT A MARKETING PAGE.
THIS IS A PRODUCT RECOGNITION EXPERIENCE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## THE 4 FEELINGS (All Required Within 3 Seconds)

Every element must create:
1. **Confidence** — "This tool understands my exact situation"
2. **Relief** — "Finally, someone gets how painful this is"  
3. **Ambition** — "I could actually ace this exam"
4. **Delight** — "This feels premium, not another college tool"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## COMPLETE DESIGN SYSTEM

### Colors (System A — Dark Premium)
```
Background:        #07070d   (near-black, never pure black)
Surface/Cards:     #0f0f0f   (elevated elements)
Border Subtle:     rgba(255, 255, 255, 0.08)
Border Medium:     rgba(255, 255, 255, 0.12)

Text Primary:      #ffffff   (headlines)
Text Secondary:    rgba(255, 255, 255, 0.6)   (body text)
Text Tertiary:     rgba(255, 255, 255, 0.4)   (captions)

Accent Primary:    #f97316   (orange — CTAs, highlights)
Accent Glow:       rgba(249, 115, 22, 0.3)   (button glow)

Status Success:    #10b981   (emerald — relief, completion)
Status Info:       #3b82f6   (blue — data points)

FORBIDDEN:
- Pure black #000000
- Pure white backgrounds
- Generic purple gradients
- Inter or Roboto fonts
```

### Typography
```
Display (hero headline):
  Font: Space Grotesk
  Weight: 700 (Bold)
  Size: 56px (desktop) / 40px (mobile)
  Line-height: 1.1em (tight for impact)
  Letter-spacing: -0.02em

Headlines (section titles):
  Font: Space Grotesk
  Weight: 600 (Semibold)
  Size: 32px (desktop) / 24px (mobile)
  Line-height: 1.2em

Body Large:
  Font: Geist
  Weight: 400 (Regular)
  Size: 18px
  Line-height: 1.6em (readable)

Body Default:
  Font: Geist
  Weight: 400
  Size: 16px
  Line-height: 1.5em

Body Small / Captions:
  Font: Geist
  Weight: 400
  Size: 14px
  Line-height: 1.4em

Numbers / Data:
  Font: JetBrains Mono
  Weight: 500 (Medium)
  Size: varies
  Use for: stats, metrics, counts
```

### Spacing Scale
Use ONLY these values: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px

### Border Radius
- Small (badges, chips): 8px
- Medium (buttons, inputs): 12px
- Large (cards): 16px
- XL (hero elements): 20px

### Shadows & Elevation
```
Subtle: 0 1px 2px rgba(0, 0, 0, 0.3)
Medium: 0 4px 12px rgba(0, 0, 0, 0.4)
Strong: 0 8px 24px rgba(0, 0, 0, 0.5)
Glow:   0 0 24px rgba(249, 115, 22, 0.3)  (for CTA)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SECTION 1: HERO (Above Fold — Recognition, Not Explanation)

### Layout Structure
- Full viewport height minimum
- Max-width: 1200px, centered with 24px horizontal padding
- Vertical padding: 96px top, 128px bottom (desktop)
- Split into two zones: Content (left 50%) + Visual (right 50%)

### Content Zone (Left Side)

**Kicker Text** (appears first, small, uppercase):
```
Font: Geist Medium, 12px, uppercase
Color: rgba(255, 255, 255, 0.6)
Letter-spacing: 0.1em
Text: "EXAM PREPARATION FOR JNTUH STUDENTS"
Margin-bottom: 16px
```

**Hero Headline** (The Recognition Moment):
```
Font: Space Grotesk Bold, 56px (desktop) / 40px (mobile)
Color: #ffffff
Line-height: 1.1em
Max-width: 600px

Text:
"You Have 47 Papers to Analyze.
We Already Did It."

Visual Treatment:
- "47 Papers" in accent orange (#f97316)
- Two lines, tight spacing
- Each line fades in sequentially (stagger 100ms)
- No period after "It" (cleaner)
```

**Why This Works:**
- Specific number (47) feels real, not generic
- "We already did it" = instant relief
- Student thinks: "Wait, they analyzed MY papers?"

**Subheadline** (The Promise):
```
Font: Geist Regular, 18px
Color: rgba(255, 255, 255, 0.6)
Line-height: 1.6em
Max-width: 540px
Margin-top: 24px

Text:
"Stop scrolling WhatsApp groups for last year's papers.
Upload your Hall Ticket. Get personalized insights in 30 seconds."

Visual Treatment:
- Two lines, balanced
- "30 seconds" in success green (#10b981)
- Fades in after headline (200ms delay)
```

**Primary CTA Button** (Unmissable):
```
Text: "Upload Hall Ticket — Get Started"
Size: Large (56px height minimum)
Padding: 16px 48px
Font: Space Grotesk Semibold, 18px
Background: #f97316 (orange)
Border-radius: 12px
Margin-top: 48px

Visual Effects:
- Subtle glow: 0 0 24px rgba(249, 115, 22, 0.3)
- Right arrow icon → (16px, same color as text)
- Hover: scale(1.02) + stronger glow
- Tap: scale(0.97) spring animation

Icon:
- Small arrow → positioned 8px after text
- NOT decorative — signals forward motion
```

**Secondary Action** (Below CTA):
```
Font: Geist Regular, 14px
Color: rgba(255, 255, 255, 0.4)
Margin-top: 16px

Text: "or enter details manually"
Link: underline on hover, color transitions to accent
```

**Trust Signals** (Single Row Below CTA):
```
Layout: Horizontal list, centered, 24px gaps
Font: Geist Medium, 14px
Color: rgba(255, 255, 255, 0.5)
Margin-top: 32px

Items:
✓ 5,730 questions analyzed
✓ 10 subjects ready  
✓ 60% AI coverage

Icon: Small checkmark (12px) before each
Visual: Subtle fade-in stagger (50ms between each)
```

**Time Saved Callout**:
```
Layout: Pill-shaped badge
Background: rgba(16, 185, 129, 0.1)  (success green with 10% opacity)
Border: 1px solid rgba(16, 185, 129, 0.3)
Padding: 12px 20px
Border-radius: 100px (full pill)
Margin-top: 32px
Max-width: fit-content

Content:
Icon: 💡 (16px) or sparkle icon
Text: "Students save 4-6 hours of manual organization"
Font: Geist Medium, 14px
"4-6 hours" in #10b981 (success green), bold

Visual: Subtle pulse animation (2s loop, very subtle scale 1.0 → 1.02)
```

### Visual Zone (Right Side)

**Product Screenshot** (Actual PaperIQ UI, NOT illustration):
```
Layout: 
- Floating card with subtle shadow
- Border: 1px solid rgba(255, 255, 255, 0.08)
- Border-radius: 20px
- Padding: 24px
- Background: #0f0f0f

Content Shown:
1. Subject header: "Data Structures — R22 Regulation"
2. Priority section showing:
   "Priority 1: Unit I — Trees & Graphs (34% of exam)"
3. Topic list with numbers:
   - Arrays (87 questions)
   - Binary Search Trees (64 questions)
   - Graphs (52 questions)
4. Visual: small bar chart showing unit distribution

Visual Treatment:
- Screen should feel ALIVE (not static)
- Subtle gradient overlay from top-left
- Micro-animations:
  * Numbers count up on load (300ms)
  * Progress bars fill in (400ms, stagger 50ms)
  * Subtle hover: entire card lifts slightly
- Shadow: 0 8px 32px rgba(0, 0, 0, 0.6)
```

**Alternative Visual** (Before/After Split):
```
If showing comparison:

LEFT (40% width) — "Before PaperIQ":
- Blurred WhatsApp screenshots
- Chaotic file names visible: "IMG_20230523.pdf", "idk_which_year.pdf"
- Desaturated colors (grayscale with slight sepia)
- Text overlay: "4-6 hours wasted organizing"
- Visual weight: LIGHTER (secondary element)

RIGHT (60% width) — "After PaperIQ" — DOMINANT:
- Clean PaperIQ interface (full color)
- Shows organized analysis
- Text overlay: "5 seconds to insights"
- Visual weight: HEAVIER (primary element)
- Subtle glow around interface

Divider: Thin vertical line with subtle glow
Label in center: "vs" or arrow → showing transformation
```

**CRITICAL RULE**: 
The product UI IS the hero visual. Never generic illustrations, never decorative graphics, never stock photos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SECTION 2: THE PROBLEM (Show, Don't Tell)

### Layout
- Background: slightly lighter than main (#0a0a0d)
- Padding: 96px vertical (desktop) / 64px (mobile)
- Max-width: 1000px, centered

### Headline:
```
Font: Space Grotesk Semibold, 32px
Color: #ffffff
Text-align: center
Margin-bottom: 48px

Text: "The Manual Way vs The PaperIQ Way"
```

### Comparison Grid (Two Columns)

**Column 1: "Without PaperIQ" (Problem State)**
```
Card Style:
- Background: rgba(239, 68, 68, 0.05)  (red tint, 5% opacity)
- Border: 1px solid rgba(239, 68, 68, 0.2)
- Border-radius: 16px
- Padding: 32px

Icon: ❌ (24px, red #ef4444)

Timeline List:
Each item shows time + frustration

Hour 1: "Scrolling 3,000 WhatsApp messages"
Hour 2: "Opening random PDFs with names like 'IMG_20230523.pdf'"
Hour 3: "Manually counting: 'Arrays appeared... 12 times?'"
Hour 4: "Still not sure which unit is most important"
Hour 5-6: "Finally organized. Haven't studied yet."

Visual:
- Each item: small clock icon + text
- Font: Geist Regular, 16px
- Color: rgba(255, 255, 255, 0.6)
- Spacing: 16px between items
- Frustrated emoji or icon at bottom
```

**Column 2: "With PaperIQ" (Solution State)**
```
Card Style:
- Background: rgba(16, 185, 129, 0.05)  (green tint, 5% opacity)
- Border: 1px solid rgba(16, 185, 129, 0.2)
- Border-radius: 16px
- Padding: 32px

Icon: ✓ (24px, green #10b981)

Timeline List:
Second 1: "Upload Hall Ticket"
Second 5: "AI analyzes 10 years of papers"
Second 10: "See Priority 1: Unit I (34% of exam)"
Second 15: "See High Probability Topics"
Second 30: "Start studying"

Then: "4-6 hours saved"

Visual:
- Each item: checkmark icon + text
- Font: Geist Regular, 16px
- Color: rgba(255, 255, 255, 0.6)
- Spacing: 16px between items
- Success badge at bottom:
  Background: #10b981
  Text: "4-6 HOURS SAVED"
  Font: JetBrains Mono Bold, 14px
  Padding: 8px 16px
  Border-radius: 8px
```

### Bottom Callout:
```
Text: "Stop organizing. Start studying."
Font: Space Grotesk Medium, 24px
Color: #f97316 (orange)
Text-align: center
Margin-top: 48px
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SECTION 3: HOW IT WORKS (3 Steps, Not Features)

### Layout
- Background: #07070d (main background)
- Padding: 96px vertical (desktop) / 64px (mobile)
- Max-width: 1100px, centered

### Headline:
```
Font: Space Grotesk Semibold, 32px
Color: #ffffff
Text-align: center
Margin-bottom: 64px

Text: "Three Steps to Exam Clarity"
```

### Steps (Horizontal on Desktop, Vertical on Mobile)

**Step 1:**
```
Number Badge:
- Circle: 64px diameter
- Background: linear-gradient(135deg, #f97316, #fb923c)
- Text: "1"
- Font: Space Grotesk Bold, 28px
- Shadow: 0 4px 12px rgba(249, 115, 22, 0.4)

Title:
"Upload Hall Ticket"
Font: Space Grotesk Semibold, 24px
Margin-top: 24px

Description:
"Or enter your details manually. We'll auto-detect your semester, regulation, and subjects."
Font: Geist Regular, 16px
Color: rgba(255, 255, 255, 0.6)
Line-height: 1.5em
Max-width: 320px

Visual Element:
- Small animated upload icon or
- Mockup of hall ticket being uploaded
- Subtle scale animation on hover
```

**Step 2:**
```
Number Badge:
- Same style, number "2"

Title:
"AI Analyzes 10 Years"

Description:
"We've already processed thousands of previous papers. Your analysis happens in seconds, not hours."

Visual Element:
- Abstract representation of AI processing
- Animated progress indicators
- NOT: generic brain icon or robot
- YES: actual data flowing, bars filling
```

**Step 3:**
```
Number Badge:
- Same style, number "3"

Title:
"Study What Matters"

Description:
"See priority topics, high-probability questions, and unit coverage. Know exactly where to focus."

Visual Element:
- Small preview of results screen
- Highlighted "Priority 1" badge
- Checkmarks appearing
```

### Connectors Between Steps:
```
Visual: Right arrow → or dotted line
Color: rgba(255, 255, 255, 0.2)
Animated: Subtle flow animation (dots moving right)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SECTION 4: SOCIAL PROOF (Minimal, Credible)

### Layout
- Background: slight gradient (top: #07070d, bottom: #0a0a0d)
- Padding: 64px vertical
- Max-width: 900px, centered

### Stat Row:
```
Layout: Three columns, equal width
Font: Space Grotesk

Each Stat:
- Large Number:
  Font: Space Grotesk Bold, 48px
  Color: #f97316 (orange)
  Use JetBrains Mono for numbers
  
- Label:
  Font: Geist Regular, 16px
  Color: rgba(255, 255, 255, 0.6)
  Margin-top: 8px

Stats:
1. "5,730" — "Questions Analyzed"
2. "10" — "Subjects Covered"
3. "100+" — "Students Using PaperIQ"

Visual Treatment:
- Numbers count up on scroll into view
- Duration: 600ms
- Easing: ease-out
```

### Optional Testimonial:
```
Quote: 
"Saved me 6 hours before mid-terms. Actually knew what to study."
— 3rd Year CSE Student, MLRIT

Style:
- Font: Geist Regular, 18px, italic
- Color: rgba(255, 255, 255, 0.7)
- Border-left: 3px solid #f97316
- Padding-left: 24px
- Max-width: 600px
- Centered
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SECTION 5: FINAL CTA (Repeat Hero CTA)

### Layout
- Background: #0f0f0f (slightly elevated from main)
- Border-top: 1px solid rgba(255, 255, 255, 0.08)
- Padding: 96px vertical
- Text-align: center

### Headline:
```
Font: Space Grotesk Semibold, 40px (desktop) / 32px (mobile)
Color: #ffffff
Margin-bottom: 24px

Text: "Ready to Stop Wasting Time?"
```

### Subheadline:
```
Font: Geist Regular, 18px
Color: rgba(255, 255, 255, 0.6)
Margin-bottom: 48px

Text: "Join 100+ MLRIT students studying smarter, not harder."
```

### CTA Button (Same as Hero):
```
Text: "Upload Hall Ticket — Get Started"
Same styling as hero CTA
```

### Footer Note:
```
Font: Geist Regular, 14px
Color: rgba(255, 255, 255, 0.4)
Margin-top: 24px

Text: "Free for MLRIT students · Setup takes 30 seconds"
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## INTERACTION CONCEPTS (For Implementation)

### Scroll-Triggered Animations:
```
Hero section: Elements fade in sequentially on load
Problem section: Cards slide in from sides when scrolling into view
Steps section: Number badges scale in with stagger (100ms)
Stats: Numbers count up when visible
```

### Hover States:
```
Primary CTA: 
- scale(1.02)
- Glow intensifies
- Duration: 200ms
- Easing: ease-out

Cards:
- translateY(-4px)
- Shadow strengthens
- Duration: 200ms

Links:
- Color transitions to accent
- Underline appears
- Duration: 150ms
```

### Micro-Animations:
```
Trust signals: Checkmarks draw in (stroke animation)
Product screenshot: Subtle floating (translateY ±4px, 4s loop)
Time saved badge: Gentle pulse (scale 1.0 → 1.02, 2s loop)
Arrow icons: Slide right 4px on hover
```

### Performance:
```
All animations use transform and opacity only (GPU-accelerated)
No layout-triggering properties (width, height, top, left)
Reduced motion respected: @media (prefers-reduced-motion: reduce)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## MOBILE RESPONSIVE (375px+)

### Hero Section:
- Split-screen becomes stacked (visual on top, content below)
- Headline: 40px font size, maintain tight line-height
- CTA button: Full-width, 56px height minimum
- Padding: 24px horizontal, 48px vertical

### Problem Section:
- Two-column becomes single column
- Cards stack vertically, 24px gap
- Maintain card padding, reduce if needed

### Steps Section:
- Horizontal becomes vertical
- Steps stack, connectors rotate 90°
- Number badges: 56px (slightly smaller)

### All Text:
- Maintain readability minimum 14px
- Line-height increases slightly for mobile (1.6em)
- Touch targets: minimum 44px height

### Spacing:
- Reduce vertical padding: 64px → 48px
- Maintain horizontal padding: 24px minimum
- Increase gaps between sections for breathing room

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ACCESSIBILITY

### Color Contrast:
- All text meets WCAG AA (4.5:1 minimum)
- Primary text on dark background: 21:1
- Secondary text: verified 7:1+
- Accent orange on dark: verified for large text

### Focus States:
- All interactive elements have visible focus ring
- Focus ring: 2px solid #f97316, 4px offset
- Never remove outline without replacement

### Screen Readers:
- All images have alt text
- CTA buttons have descriptive labels
- Sections have proper heading hierarchy (h1 → h2 → h3)
- Skip to main content link (visually hidden)

### Keyboard Navigation:
- All interactive elements tabbable
- Logical tab order (top to bottom, left to right)
- Escape closes any overlays
- Enter/Space activates buttons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SUCCESS CRITERIA

A student landing on this page should:

✓ Understand the problem within 3 seconds (WhatsApp chaos)
✓ See the solution visually (organized analysis)  
✓ Know the exact benefit (4-6 hours saved)
✓ Feel confident clicking the CTA
✓ Never wonder "What is this for?"
✓ Feel all 4 emotions: Confidence, Relief, Ambition, Delight
✓ See actual product (not marketing fluff)
✓ Know exactly what action to take next

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## WHAT THIS IS NOT

❌ NOT a generic SaaS landing page with pricing tiers
❌ NOT a college portal with forms and menus
❌ NOT a dashboard with charts and tables
❌ NOT marketing speak with stock photos
❌ NOT feature-focused ("AI-powered", "Machine Learning")
❌ NOT explanation-heavy (students don't read, they scan)

## WHAT THIS IS

✅ Problem-solution story told in 3 seconds
✅ Clear before/after transformation
✅ Single unmissable action (Upload Hall Ticket)
✅ Evidence that time will be saved
✅ Premium student product feeling
✅ Actual product shown (not concepts)
✅ Student pain recognized immediately

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## VISUAL REFERENCES (Feel Like)

This should feel like:
- **Linear**: Clean, purposeful, premium product
- **Notion**: Obvious value prop, clarity
- **Vercel**: Confident, fast, modern
- **Arc Browser**: Delightful micro-interactions
- **Stripe**: Trustworthy, professional

This should NOT feel like:
- Generic Bootstrap template
- Overcomplicated SaaS with 10 sections
- Cheap with stock imagery  
- College portal (outdated, bureaucratic)
- Trying too hard with flashy animations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## GENERATE

Create a complete visual design for this landing page.

Focus on:
- The 4 Feelings framework
- Recognition over explanation
- Time saved messaging (4-6 hours)
- Unmissable CTA
- Premium feeling (not generic)
- Mobile-first responsive
- Actual product shown (not illustrations)

Do NOT generate code.
Do NOT create a Figma file.
Generate a complete visual design that shows:
- Exact layout
- Exact typography
- Exact colors
- Exact spacing
- Exact interactions (described)

This will be implemented in React + Framer Motion by Kiro.
```

---

## Next Steps After Pasting Into Stitch

1. **Review Generated Design**
   - Take screenshots of all sections
   - Share screenshots with me
   - I'll critique based on:
     * Is the CTA truly unmissable?
     * Does it hit all 4 feelings?
     * Is "time saved" prominent everywhere?
     * Does it feel premium (not generic)?
     * Is the hierarchy correct (one dominant element per section)?
     * Is actual product shown (not illustrations)?

2. **Refine If Needed**
   - Adjust prompt based on Stitch output
   - Re-generate with refinements
   - Iterate until design matches vision

3. **Approval Gate**
   - Once design approved, Kiro implements in React
   - Framer Motion for all interactions
   - Responsive implementation
   - Integration with existing routing

4. **Move to Screen 2 Only After Approval**
   - Same workflow repeats
   - One screen at a time
   - No parallel work

---

**Ready**: Copy the prompt above (everything inside the ``` block)  
**Waiting**: For you to share generated screenshots for review
