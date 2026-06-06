# Screen 2.5: Authentication — Stitch Prompt

## Context
Student clicked "Start Analysis" on landing page. They're ready to get exam insights. Authentication is one quick step between them and clarity.

**Goal:** Make sign-up feel like progress, not bureaucracy. Show value before asking for commitment.

**Core Principle:** This isn't account creation — it's unlocking personalized insights. Authentication = Step 1 of their exam confidence journey.

---

## User Psychology at This Moment

**What they're thinking:**
- "Do I really need to create an account?"
- "Will this take long?"
- "Can I trust this with my college email?"
- "What if I forget my password?"

**What they're feeling:**
- Impatient (just want to see the analysis)
- Slightly suspicious (new tool, asking for credentials)
- Pragmatic (knows they probably need to sign up)

**What they need:**
- Clear value proposition (why sign up?)
- Fast authentication (< 30 seconds)
- Trust signals (privacy, data security)
- Easy recovery (forgot password)

---

## Screen Layout

### Hero Section (Top 1/3 of viewport)

**Visual:** Dark background (#07070d), centered layout, subtle gradient glow

**Headline (Space Grotesk, 42px, center-aligned):**
```
Get Your Exam Insights in 30 Seconds
```

**Subheadline (Geist, 18px, white/60, center-aligned):**
```
Sign up to analyze 47 papers and see what really matters for your exams
```

**Trust Indicator (below subheadline, white/40, 14px):**
```
🔒 Your data is private. We never share your information.
```

---

## Two Authentication Screens

### Screen 2.5A: Sign Up (New Users)

**Layout:** Single card, center of viewport

```
┌──────────────────────────────────────────────┐
│  PaperIQ                        [← Back]     │
│                                              │
│  Create Your Account                         │
│  Start building your exam confidence         │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🔵 Continue with Google              │  │ ← PRIMARY (emphasized)
│  └──────────────────────────────────────┘  │
│                                              │
│  ──────────── or ────────────               │
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
│  ✓ At least 8 characters                    │
│                                              │
│  Confirm Password                            │
│  ┌──────────────────────────────────────┐  │
│  │ ••••••••                    👁        │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Create Account                       │  │ ← Orange CTA
│  └──────────────────────────────────────┘  │
│                                              │
│  Already have an account? [Log In]          │
│                                              │
│  By signing up, you agree to our            │
│  [Terms of Service] and [Privacy Policy]    │
└──────────────────────────────────────────────┘
```

**Design Specifications:**

**Card**:
- Width: 440px (desktop), 90vw (mobile), max 500px
- Background: white/5
- Border: 1px solid white/10
- Border radius: 16px
- Padding: 48px 40px

**Google Button (Primary)**:
- Full width
- Height: 48px
- Background: white (not transparent)
- Text color: #1F1F1F
- Google logo icon (left side)
- Font: Geist, 16px, font-weight 500
- Border radius: 8px
- Hover: slight scale (1.02), shadow elevation
- Tap: scale (0.98)

**Divider**:
- Text: "or" in white/40
- Lines: 1px solid white/10 on both sides

**Input Fields**:
- Height: 48px
- Background: white/5
- Border: 1px solid white/10
- Border radius: 8px
- Padding: 12px 16px
- Font: Geist, 16px
- Placeholder: white/40
- Focus: border changes to orange (#f97316)
- Eye icon (password toggle): white/60, right side

**Password Requirements** (below password field):
- Small text (14px, white/40)
- Checkmark icon when requirement met (turns emerald #10b981)
- Real-time validation

**Create Account Button**:
- Full width
- Height: 48px
- Background: #f97316 (orange)
- Text: white, Geist, 16px, font-weight 600
- Border radius: 8px
- Hover: scale 1.02, brightness 110%
- Tap: scale 0.98
- Disabled state: opacity 40%, cursor not-allowed

**"Already have account" link**:
- Geist, 14px, white/60
- "Log In" part is orange (#f97316), underline on hover

**Terms/Privacy links**:
- Geist, 12px, white/40
- Underline on hover

---

### Screen 2.5B: Login (Returning Users)

**Layout:** Same card structure as Sign Up, simplified fields

```
┌──────────────────────────────────────────────┐
│  PaperIQ                        [← Back]     │
│                                              │
│  Welcome Back                                │
│  Continue where you left off                 │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🔵 Continue with Google              │  │ ← PRIMARY
│  └──────────────────────────────────────┘  │
│                                              │
│  ──────────── or ────────────               │
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
│  │ Log In                               │  │ ← Orange CTA
│  └──────────────────────────────────────┘  │
│                                              │
│  Don't have an account? [Sign Up]           │
└──────────────────────────────────────────────┘
```

**Key Differences from Sign Up**:
- No password confirmation field
- "Forgot Password?" link (white/60, underline on hover)
- Shorter copy (no terms/privacy)
- "Don't have account" link at bottom

---

### Screen 2.5C: Forgot Password

**Layout:** Minimal form, single input

```
┌──────────────────────────────────────────────┐
│  PaperIQ                        [← Back]     │
│                                              │
│  Reset Your Password                         │
│  We'll send you a reset link                 │
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
│  Remember your password? [Log In]            │
└──────────────────────────────────────────────┘
```

**After clicking "Send Reset Link":**
```
┌──────────────────────────────────────────────┐
│  ✓ Check Your Email                          │
│                                              │
│  We sent a password reset link to:          │
│  you@college.edu                            │
│                                              │
│  Didn't receive it? [Resend]                │
│  [Back to Login]                            │
└──────────────────────────────────────────────┘
```

---

## Authentication Flow & States

### Sign Up Flow

**Step 1: User clicks "Continue with Google"**
```
→ Opens Supabase Google OAuth popup
→ User authorizes with Google account
→ Popup closes
→ User lands on Onboarding (Screen 02A)
```

**Step 2: User fills email/password form**
```
→ Real-time validation (email format, password strength)
→ "Create Account" button disabled until valid
→ Click "Create Account"
→ Loading spinner on button: "Creating account..."
→ Success: redirect to Onboarding (Screen 02A)
→ Error: show error message below button
```

### Login Flow

**Step 1: User clicks "Continue with Google"**
```
→ Opens Supabase Google OAuth popup
→ User authorizes
→ If first-time: redirect to Onboarding (Screen 02A)
→ If returning: redirect to Dashboard (Screen 03)
```

**Step 2: User fills email/password**
```
→ Click "Log In"
→ Loading spinner: "Logging in..."
→ Success: redirect to Dashboard (Screen 03)
→ Error: "Invalid email or password" below button
```

### Forgot Password Flow

```
User enters email → Click "Send Reset Link"
→ Loading: "Sending..."
→ Success: Show "Check Your Email" message
→ User clicks link in email
→ Opens password reset page
→ User enters new password
→ Redirect to Login
```

---

## Error States (Critical)

### Invalid Email Format
```
Email field:
┌──────────────────────────────────────┐
│ notanemail                     ⚠️   │
└──────────────────────────────────────┘
⚠️ Please enter a valid email address
```

### Password Too Weak
```
Password field:
┌──────────────────────────────────────┐
│ 123                            ⚠️   │
└──────────────────────────────────────┘
⚠️ Password must be at least 8 characters
```

### Email Already Exists (Sign Up)
```
Below "Create Account" button:
⚠️ This email is already registered. [Log In instead?]
```

### Wrong Email or Password (Login)
```
Below "Log In" button:
⚠️ Invalid email or password. [Forgot Password?]
```

### Network Error
```
⚠️ Connection failed. Please check your internet and try again.
[Retry]
```

### Google OAuth Canceled
```
(No error message — silently return to auth screen)
```

---

## Loading States

### Button Loading (Sign Up / Login)
```
┌──────────────────────────────────────┐
│ [spinner] Creating account...       │ ← Spinner inside button
└──────────────────────────────────────┘
```

### Google OAuth Loading
```
(Popup opens immediately, no loading state needed on main screen)
```

---

## Success States

### Sign Up Success
```
→ Brief toast: "✓ Account created!" (2 seconds)
→ Immediate redirect to Onboarding (Screen 02A)
```

### Login Success (First-time user)
```
→ Toast: "✓ Welcome to PaperIQ!"
→ Redirect to Onboarding (Screen 02A)
```

### Login Success (Returning user)
```
→ Toast: "✓ Welcome back, Sathvik!"
→ Redirect to Dashboard (Screen 03)
```

### Password Reset Email Sent
```
→ Show "Check Your Email" card (see Screen 2.5C above)
```

---

## Validation Rules

### Email
- Required
- Must match email format regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Real-time validation (on blur, not on every keystroke)

### Password (Sign Up)
- Required
- Minimum 8 characters
- Real-time validation (show checkmark when requirement met)
- Optional: could add strength indicator (weak/medium/strong)

### Password Confirmation (Sign Up)
- Required
- Must match password field
- Real-time validation (on blur)

### Password (Login)
- Required
- No validation (just submit)

---

## Motion & Interaction

### Card Entrance
```javascript
// Framer Motion
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
```

### Google Button Hover
```javascript
whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
transition={{ duration: 0.15 }}
```

### CTA Button Press
```javascript
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

### Input Focus
```javascript
// CSS transition (no Framer Motion needed)
transition: border-color 200ms ease
```

### Error Message Appearance
```javascript
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.2 }}
```

### Password Toggle (Eye Icon)
```javascript
// Click toggles input type between "password" and "text"
// Icon changes from eye-off to eye
// Smooth 150ms transition
```

---

## Copy Principles

**Encouraging, not demanding:**
- ✓ "Get Your Exam Insights in 30 Seconds"
- ✗ "You must create an account to continue"

**Fast, not bureaucratic:**
- ✓ "Continue with Google" (not "Sign Up with Google")
- ✓ "Create Account" (not "Register" or "Submit")

**Transparent about privacy:**
- ✓ "🔒 Your data is private. We never share your information."
- ✗ (silence about data usage)

**Friendly, not corporate:**
- ✓ "Welcome Back" (not "Please enter your credentials")
- ✓ "Don't have an account?" (not "New user?")

---

## Mobile Responsive Design

**Breakpoint: 640px**

**Changes on mobile**:
- Card width: 90vw (not fixed 440px)
- Padding: 32px 24px (reduced from 48px 40px)
- Font sizes: slightly smaller
  - Headline: 36px (from 42px)
  - Body: 15px (from 16px)
- Button height: 44px (from 48px) — iOS tap target minimum
- Stack Google button and form vertically (no side-by-side)

---

## Backend Integration

### Supabase Auth Configuration

**Sign Up with Email/Password**:
```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    emailRedirectTo: `${window.location.origin}/onboarding`,
  }
})
```

**Login with Email/Password**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
})
```

**Google OAuth**:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    }
  }
})
```

**Password Reset**:
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`,
})
```

**Get Current Session**:
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

---

## Redirect Logic (Critical)

### After Successful Sign Up
```
Check if user has completed onboarding:
  → Query: SELECT * FROM user_profiles WHERE id = user.id
  → If exists: redirect to Dashboard (Screen 03)
  → If not exists: redirect to Onboarding (Screen 02A)
```

### After Successful Login
```
Same as sign up — check user_profiles table
```

### After Google OAuth
```
1. Supabase redirects to /auth/callback
2. Callback page extracts session
3. Check if first-time user (no user_profiles record)
4. Redirect accordingly
```

---

## Security Considerations

### Password Requirements
- Minimum 8 characters (enforced)
- No maximum length (let Supabase handle)
- No complexity requirements (8 chars is sufficient for student app)

### Email Verification
- Supabase sends verification email automatically
- User can log in before verifying (better UX)
- Remind to verify in Dashboard later (toast message)

### Session Management
- JWT stored in httpOnly cookie (Supabase default)
- Auto-refresh on expiry
- Logout clears session completely

### Rate Limiting
- Supabase handles rate limiting automatically
- 4 failed login attempts → temporary lockout
- Show message: "Too many attempts. Please try again in 5 minutes."

---

## Edge Cases to Handle

**User closes Google OAuth popup**:
- No error message
- Return to auth screen silently

**User's email already exists (Sign Up)**:
- Show: "This email is already registered. [Log In instead?]"
- Link goes to Login screen with email pre-filled

**User forgets password (Login)**:
- "Forgot Password?" link always visible
- Takes to Screen 2.5C

**User clicks "Back" button**:
- Returns to Landing Page (Screen 01)

**Network error during submission**:
- Show: "Connection failed. Check internet and try again. [Retry]"
- Retry button re-submits form

**Supabase service down**:
- Show: "Service temporarily unavailable. Try again in a moment."
- Auto-retry after 5 seconds (max 3 retries)

---

## Success Metrics

**Primary**: % of students who complete sign up within 1 minute
**Secondary**: Google OAuth vs Email/Password usage ratio
**Tertiary**: Forgot Password usage rate (lower = better UX)

**If sign up takes >1 minute on average**:
- Reduce password requirements
- Simplify form fields
- Improve error messaging

---

## Design Tokens (Match Screen 01 & 02)

**Colors**:
- Background: #07070d
- Card background: white/5
- Card border: white/10
- Input background: white/5
- Input border: white/10 (white/20 hover, orange focus)
- Primary CTA: #f97316 (orange)
- Google button: white background, #1F1F1F text
- Text: white (headings), white/80 (labels), white/60 (placeholders)
- Error: #EF4444 (red)
- Success: #10b981 (emerald)

**Typography**:
- Headline: Space Grotesk, 42px (mobile: 36px), font-weight 600
- Subheadline: Geist, 18px (mobile: 16px), font-weight 400
- Input labels: Geist, 14px, font-weight 500
- Input text: Geist, 16px (mobile: 15px), font-weight 400
- Button text: Geist, 16px, font-weight 600
- Helper text: Geist, 12-14px, font-weight 400

**Spacing**:
- Card padding: 48px 40px (mobile: 32px 24px)
- Input margin: 16px between fields
- Button margin: 24px above button
- Divider margin: 24px top and bottom

**Borders & Radius**:
- Card: border-radius 16px
- Inputs: border-radius 8px
- Buttons: border-radius 8px
- Google button: border-radius 8px

---

## Tech Stack Notes

**Frontend**:
- Next.js 14 App Router
- Supabase Auth (@supabase/auth-helpers-nextjs)
- React Hook Form (form validation)
- Zod (schema validation)
- Framer Motion (animations)

**Backend**:
- Supabase Auth (already configured)
- Google OAuth (set up in Supabase dashboard)

**Environment Variables Needed**:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Final Checklist Before Implementation

- [ ] Google OAuth configured in Supabase dashboard
- [ ] Redirect URLs whitelisted in Supabase
- [ ] Email templates customized (welcome, password reset)
- [ ] Environment variables set in Vercel/deployment
- [ ] Auth callback route created (/auth/callback)
- [ ] Session persistence tested (refresh page, still logged in)
- [ ] Password reset flow tested end-to-end
- [ ] Mobile responsive design verified
- [ ] Error states all designed and handled
- [ ] Loading states smooth (no flash of content)

---

## What Happens After Authentication Complete

**New User (First-time)**:
```
Sign Up Success → Onboarding (Screen 02A) → Profile Setup → Dashboard
```

**Returning User**:
```
Login Success → Dashboard (Screen 03) → (user selects action)
```

---

**End of Screen 2.5 Prompt**

This authentication layer is the foundation. All subsequent screens assume the user is authenticated and has a valid session.
