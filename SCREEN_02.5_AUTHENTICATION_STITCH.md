# Screen 2.5: Authentication — Stitch Product Design Prompt

## Context
Student clicked "Start Analysis" on landing page. They're excited to see exam insights. Authentication is one quick step between them and clarity.

**Goal:** Make sign-up feel like progress toward insights, not account creation bureaucracy.

**Core Principle:** Show value before asking for commitment. This is Step 1 of their exam confidence journey.

---

## User Emotion at This Moment

**What they're feeling:**
- **Excited** — "I'm about to see which topics matter"
- **Impatient** — "Just show me the insights"
- **Slightly skeptical** — "Is this worth signing up for?"
- **Pragmatic** — "Okay, I need an account to see personalized stuff"

**What they need to feel:**
- **Progress, not friction** — This step gets them closer to insights
- **Trust** — Their data is safe, this is worth it
- **Reassurance** — Signing up unlocks real value
- **Speed** — This takes 30 seconds, not 5 minutes

---

## The Visual Story: Progress, Not Gatekeeping

### Progress Indicator (Always Visible)

**Top of screen, subtle but clear:**
```
Step 1 of 3 • Account → Step 2 of 3 • Setup → Step 3 of 3 • Insights
     ████            ░░░░░░              ░░░░░░

You're on: Account
```

**Design:**
- Thin progress bar at very top (4px height)
- Orange (#f97316) for completed/current, white/20 for upcoming
- Step labels in DM Mono, 12px, white/40
- Current step in white/80, slightly larger

**Why this matters:** Students see authentication as progress, not a barrier.

---

## Screen Layout

### Hero Section (Top 30% of viewport)

**Visual:** Dark background with subtle gradient glow radiating from center

**Headline (Space Grotesk, 40px, center-aligned):**
```
Unlock Your Exam Insights
```

**Subheadline (Geist, 18px, white/60, center-aligned):**
```
See high-probability topics and save 4-6 hours of blind studying
```

**Trust Indicator (below subheadline, white/40, 14px, center):**
```
🔒 Your data stays private. Built for students, by students.
```

---

## Two Screens: Sign Up & Login

### Screen 2.5A: Sign Up (New Users)

**Main Card (Center of viewport)**

```
┌──────────────────────────────────────────────┐
│  Step 1 of 3 • Account                       │ ← Progress indicator
│                                              │
│  Unlock Your Exam Insights                   │
│  See high-probability topics and save        │
│  4-6 hours of blind studying                 │
│                                              │
│  🔒 Your data stays private                  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🔵 Continue with Google              │  │ ← PRIMARY (90% visual emphasis)
│  │ Sign up in 5 seconds                 │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ──────── or use email ────────             │
│                                              │
│  Email                                       │
│  ┌──────────────────────────────────────┐  │
│  │ you@college.edu                      │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Password                                    │
│  ┌──────────────────────────────────────┐  │
│  │ ••••••••                    👁        │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Create Account                       │  │ ← Orange CTA
│  └──────────────────────────────────────┘  │
│                                              │
│  Already have an account? [Log In]          │
└──────────────────────────────────────────────┘
```

**Key Visual Hierarchies:**

1. **Google Button Dominates** (90% emphasis)
   - Largest button (height: 56px vs 48px for others)
   - White background (not dark like everything else)
   - Google logo + "Continue with Google" + "Sign up in 5 seconds" subtext
   - Slight glow/elevation effect
   - Positioned first, centered, impossible to miss

2. **Divider Deemphasized** (10% emphasis)
   - Very subtle: "──── or use email ────" in white/20
   - Small text: 12px
   - Purpose: Make email path feel secondary

3. **Email Form Minimal** (backup path)
   - Smaller inputs than Google button
   - No password strength requirements shown
   - Simple, fast, functional

---

### Value Preview Card (Right Side — Desktop Only)

**Appears next to main auth card on desktop (>1024px)**

```
┌──────────────────────────────────────┐
│  What You'll See Inside              │
│                                      │
│  📊 Unit Distribution                │
│     Unit I: 34% of all questions     │
│     █████████░░░░░                   │
│                                      │
│  🎯 High Probability Topics          │
│     • Binary Search Trees            │
│       52 questions across 10 papers  │
│     • Sorting Algorithms             │
│       48 questions across 9 papers   │
│                                      │
│  ⏱️ Study Priority Order             │
│     Week 1-2: Focus Unit I (34%)     │
│     Week 3: Focus Unit IV (20%)      │
│                                      │
│  [Blurred for demo effect]           │
│  Sign up to see your personalized    │
│  analysis →                          │
└──────────────────────────────────────┘
```

**Design:**
- Card background: white/5 with subtle border
- Content slightly blurred (backdrop-filter: blur(2px))
- Orange "Sign up to see" CTA at bottom
- Shows REAL data structure students will get
- Makes signup feel like unlocking something valuable

**On Mobile (<1024px):**
- Hide this card completely
- Keep focus on fast authentication

---

### Screen 2.5B: Login (Returning Users)

**Same structure, different copy:**

```
┌──────────────────────────────────────────────┐
│  Welcome Back to Your Insights               │
│  Pick up where you left off                  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🔵 Continue with Google              │  │ ← Same 90% emphasis
│  └──────────────────────────────────────┘  │
│                                              │
│  ──────── or use email ────────             │
│                                              │
│  Email                                       │
│  ┌──────────────────────────────────────┐  │
│  │ you@college.edu                      │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Password                                    │
│  ┌──────────────────────────────────────┐  │
│  │ ••••••••                    👁        │  │
│  └──────────────────────────────────────┘  │
│  [Forgot Password?]                         │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Log In                               │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  Don't have an account? [Sign Up]           │
└──────────────────────────────────────────────┘
```

**Changes from Sign Up:**
- Headline: "Welcome Back" (familiar, not new)
- Forgot Password link (subtle, white/60)
- No progress indicator (returning users know the flow)

---

### Screen 2.5C: Forgot Password (Modal or Inline)

**Minimal, focused:**

```
┌──────────────────────────────────────────────┐
│  Reset Your Password                         │
│  We'll email you a link                      │
│                                              │
│  Email                                       │
│  ┌──────────────────────────────────────┐  │
│  │ you@college.edu                      │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Send Reset Link                      │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  [Back to Login]                            │
└──────────────────────────────────────────────┘
```

**After success:**
```
✓ Check Your Email

We sent a reset link to:
you@college.edu

[Back to Login]
```

---

## Visual Design Specifications

### Card Design
- **Size**: 480px wide (desktop), 90vw (mobile), max 520px
- **Background**: white/5 with 1px white/10 border
- **Border radius**: 20px (softer than usual 16px)
- **Padding**: 48px 40px
- **Shadow**: Subtle elevation (0 8px 24px rgba(0,0,0,0.3))

### Google Button (Primary CTA)
- **Height**: 56px (taller than standard 48px)
- **Background**: Pure white (#FFFFFF)
- **Text**: #1F1F1F (dark gray, not black)
- **Google logo**: Official colors, left side, 24px
- **Text**: "Continue with Google" (Geist, 17px, font-weight 600)
- **Subtext**: "Sign up in 5 seconds" (Geist, 13px, #666, below main text)
- **Border radius**: 10px
- **Hover**: Scale 1.03, shadow elevation increase
- **Tap**: Scale 0.97

### Email/Password Inputs
- **Height**: 48px
- **Background**: white/5
- **Border**: 1px solid white/10
- **Border radius**: 10px
- **Padding**: 14px 16px
- **Font**: Geist, 16px
- **Placeholder**: white/40
- **Focus**: Border changes to orange (#f97316), no glow

### Create Account / Login Button
- **Height**: 48px
- **Background**: #f97316 (orange)
- **Text**: White, Geist, 16px, font-weight 600
- **Border radius**: 10px
- **Full width**
- **Hover**: Brightness 110%, scale 1.02
- **Tap**: Scale 0.98

### Divider
- **Text**: "or use email" (not "or")
- **Font**: Geist, 12px, white/20
- **Lines**: 1px solid white/10, extends to edges

### Links
- **"Already have account" / "Don't have account"**: Geist, 14px, white/60
- **Action link ("Log In" / "Sign Up")**: Orange #f97316, underline on hover

---

## Copy Principles

### Value-First, Not Form-First

**❌ Don't Say:**
- "Create an account to continue"
- "Sign up to access PaperIQ"
- "Register to get started"

**✅ Do Say:**
- "Unlock Your Exam Insights"
- "See high-probability topics and save 4-6 hours"
- "Know what to study first"

### Progress, Not Gatekeeping

**❌ Don't Say:**
- "You must sign up to proceed"
- "Account required"

**✅ Do Say:**
- "Step 1 of 3 • Account"
- "Quick setup to personalize your insights"

### Trust, Not Surveillance

**❌ Don't Say:**
- "We collect your data to improve our service"
- "By signing up, you agree to our 47-page terms"

**✅ Do Say:**
- "🔒 Your data stays private"
- "Built for students, by students"

---

## Emotional Design Details

### Micro-Copy That Builds Confidence

**On Google Button:**
- "Continue with Google"
- "Sign up in 5 seconds" (subtext)

**Why**: "Continue" feels like progress. "5 seconds" sets expectation of speed.

**On Email Form:**
- Label: "Email" (not "Email Address" — shorter)
- Placeholder: "you@college.edu" (specific domain, relatable)

**Why**: Brevity respects student's time. Familiar domain builds trust.

**On Password Field:**
- Label: "Password" (not "Choose a password" — directive, not choice)
- No strength requirements visible (only validate on submit)

**Why**: Less friction. Requirements feel like gatekeeping.

---

## States & Interactions

### Loading State (Button Clicked)

**Google Button:**
```
┌──────────────────────────────────────┐
│ [spinner] Connecting to Google...   │
└──────────────────────────────────────┘
```

**Email Button:**
```
┌──────────────────────────────────────┐
│ [spinner] Creating your account...   │
└──────────────────────────────────────┘
```

**Design**: Small spinner (16px) left side, text dims to white/60, button disabled

---

### Error State (Friendly, Not Scary)

**Email Already Exists:**
```
Below "Create Account" button:
⚠️ This email is already registered. [Log in instead?]
```

**Invalid Email/Password (Login):**
```
⚠️ Email or password incorrect. [Forgot password?]
```

**Design**: Amber warning icon, white/80 text, orange link

**Tone**: Helpful, not scolding. Links to solution immediately.

---

### Success State (Brief Celebration)

**After Sign Up:**
```
✓ Account Created!
  Loading your setup...
```

**Design**: 
- Emerald checkmark icon (#10b981)
- Appears for 1.5 seconds
- Smooth fade to next screen
- No jarring redirect

---

## Motion & Transitions

### Card Entrance (Page Load)
```
Fade in + slide up
Duration: 500ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)
```

### Button Hover (Google Primary)
```
Scale: 1.03
Shadow: increase elevation
Duration: 200ms
```

### Button Press
```
Scale: 0.97
Duration: 100ms
Spring: slight bounce back
```

### Input Focus
```
Border color transition: 200ms ease
```

### Error Message Appearance
```
Fade in + slide down from top
Duration: 300ms
```

### Screen Transition (Success → Next)
```
Crossfade
Duration: 400ms
Smooth, no flash
```

---

## Mobile Responsive Changes

**Breakpoint: 768px**

### Changes:
- Card width: 90vw (not fixed 480px)
- Padding: 32px 24px (reduced)
- Font sizes:
  - Headline: 36px (from 40px)
  - Body: 15px (from 16px)
- Button height: 52px Google, 44px others
- Hide value preview card completely
- Progress indicator stays but smaller text

**Key Principle**: Mobile prioritizes speed. Desktop adds value preview.

---

## What Happens Next (User Mental Model)

### After Sign Up Success:
```
✓ Account Created
  → Step 2 of 3 • Setup (Onboarding Screen 02)
```

### After Login Success (Returning User):
```
✓ Welcome Back
  → Dashboard (your subjects)
```

**Design**: Brief success state (1.5s) → smooth transition

**No jarring redirects.** Flow feels continuous.

---

## Design Tokens (Match Landing/Onboarding)

**Colors:**
- Background: #07070d (dark)
- Card: white/5 with white/10 border
- Google button: #FFFFFF
- Orange CTA: #f97316
- Text: white (headings), white/80 (body), white/60 (secondary)
- Error: #EF4444 (red-orange, not pure red)
- Success: #10b981 (emerald)

**Typography:**
- Headlines: Space Grotesk, 40px (mobile 36px), weight 600
- Body: Geist, 16-18px, weight 400
- Buttons: Geist, 16-17px, weight 600
- Captions: Geist, 12-14px, weight 400

**Spacing:**
- Card padding: 48px 40px (mobile: 32px 24px)
- Input spacing: 16px between fields
- Button margin-top: 24px
- Section spacing: 32px

**Borders & Radius:**
- Card: 20px border-radius
- Inputs: 10px border-radius
- Buttons: 10px border-radius

---

## The Value Unlock Moment

### Why This Design Works:

1. **Progress Indicator** — Students see authentication as Step 1, not a barrier
2. **Google Button Dominance** — 90% of students will use this (fastest path)
3. **Value Preview Card** — Desktop users see what they're unlocking
4. **Outcome-Based Copy** — "Save 4-6 hours" not "Create account"
5. **Minimal Friction** — No password requirements, no confirmations, no captchas
6. **Celebration Micro-Moment** — Success state feels rewarding

**Students don't sign up for an account.**  
**They unlock their exam insights.**

That's the emotional frame this design creates.

---

## Open Questions for Stitch

1. Should progress indicator be at top of page or inside card?
2. Should value preview card have subtle animation (numbers counting up)?
3. Should we show a small "10,000+ students trust PaperIQ" social proof badge?
4. Should password field have a "show/hide" toggle icon or not?

---

**End of Screen 2.5 Prompt — Product Design Focus**

This is a product experience prompt, not an implementation spec.  
Focus on emotion, visual hierarchy, value communication, premium experience.
