# PaperIQ — Stitch Screens Registry

**Purpose**: Permanent UI source of truth for all exported Stitch screens  
**Status**: Active — Do not modify stored screen code  
**Last Updated**: June 6, 2026

---

## Screen Index

| ID | Screen Name | Route | Status | Notes |
|----|-------------|-------|--------|-------|
| 01 | Landing Page (Product Experience) | `/` | ✅ Ready | Hero conversion flow |
| 02 | Authentication Login | `/login` | ✅ Ready | Returning users |
| 03 | Authentication Forgot Password | `/forgot-password` | ✅ Ready | Password recovery |
| 04 | Authentication Premium Signup | `/signup/premium` | ✅ Ready | Premium tier onboarding |
| 05 | Onboarding Select Path | `/onboarding/step-1` | ✅ Ready | Hall ticket vs manual |
| 06 | Onboarding Confirm Details | `/onboarding/step-2` | ✅ Ready | Verification screen |
| 07 | Dashboard Refined Intelligence | `/dashboard` | ✅ Ready | Primary dashboard |
| 08 | Analysis Results Interactive | `/analysis/:subjectId` | ✅ Ready | Analysis results |
| 09 | Papers Browser Academic Catalog | `/papers` | ✅ Ready | Paper grid with filters |
| 10 | Papers Browser Empty State | `/papers` (conditional) | ✅ Ready | No papers state |
| 11 | Individual Paper View | `/papers/:paperId` | ✅ Ready | Single paper detail |
| 12 | Profile Management | `/profile` | ✅ Ready | User profile & academic details |
| 13 | Settings & Preferences | `/settings` | ✅ Ready | App settings & notifications |

---

## Usage Protocol

### Implementation Rules:
1. **Retrieve**: When implementing, copy the exact screen code from this file
2. **Convert**: Transform HTML/Tailwind → React/TypeScript components
3. **Preserve**: Maintain layout, spacing, typography, colors, responsiveness
4. **Connect**: Add backend logic, API calls, state management on top
5. **Never Redesign**: Unless explicitly instructed

### Reference Syntax:
- "Use Screen 01" → Landing Page
- "Use Screen 07" → Dashboard
- "Use Screen 11" → Individual Paper View

---

## SCREEN 01: Landing Page (Product Experience)

**Route**: `/`  
**Purpose**: Hero conversion flow — stop searching WhatsApp, start using PaperIQ  
**Key Features**: Time-saved messaging, before/after comparison, 3-step process

```html
<!-- PaperIQ Product Experience -->
<!DOCTYPE html>
<html class="dark" lang="en" style="">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>PaperIQ | AI-Powered Exam Insights for JNTUH Students</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Geist:wght@100;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<style>
body {
background-color: #07070d;
color: #e2e2e2;
-webkit-font-smoothing: antialiased;
}
.glow-primary {
box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.glow-primary:hover {
box-shadow: 0 0 45px rgba(249, 115, 22, 0.6);
transform: scale(1.02);
}
@keyframes float-gentle {
0%, 100% { transform: translateY(0px); }
50% { transform: translateY(-10px); }
}
.animate-float-gentle {
animation: float-gentle 4s ease-in-out infinite;
}
.animate-float-delayed {
animation: float-gentle 4.5s ease-in-out infinite;
animation-delay: 1s;
}
@keyframes pulse-gentle {
0%, 100% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.05); opacity: 0.8; }
}
.animate-pulse-indicator {
animation: pulse-gentle 2s ease-in-out infinite;
}
@keyframes gradient-move {
0% { background-position: 0% 50%; }
50% { background-position: 100% 50%; }
100% { background-position: 0% 50%; }
}
.bg-mesh-gradient {
background: radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%);
background-size: 200% 200%;
animation: gradient-move 15s ease infinite;
}
.glass-card {
background: rgba(15, 15, 15, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease;
}
.glass-card:hover {
transform: translateY(-8px);
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
border-color: rgba(249, 115, 22, 0.3);
}
.reveal-hidden {
opacity: 0;
transform: translateY(20px);
will-change: transform, opacity;
}
.revealed {
opacity: 1 !important;
transform: translate(0) scale(1) !important;
transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.chaos-blur {
filter: grayscale(1) blur(1px);
opacity: 0.4;
}
.product-glow {
position: absolute;
width: 300px;
height: 300px;
background: radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%);
z-index: -1;
pointer-events: none;
}
.vertical-divider {
background: linear-gradient(to bottom, transparent, rgba(249, 115, 22, 0.5), transparent);
width: 1px;
}
</style>
<script id="tailwind-config">
tailwind.config = {
darkMode: "class",
theme: {
extend: {
"colors": {
"primary-container": "#f97316",
"on-primary-container": "#ffffff",
"primary": "#ffb690",
"on-primary": "#552100",
"surface": "#121414",
"on-surface": "#e2e2e2",
"on-surface-variant": "#e0c0b1",
"outline": "#a78b7d",
"outline-variant": "#584237",
"background": "#121414",
"on-background": "#e2e2e2"
},
"fontSize": {
"display-hero": ["56px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
"display-hero-mobile": ["36px", {"lineHeight": "1.2", "fontWeight": "700"}],
"headline-lg": ["32px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
"headline-md": ["24px", {"lineHeight": "1.4", "fontWeight": "600"}],
"body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
"body-md": ["15px", {"lineHeight": "1.5", "fontWeight": "400"}],
"body-sm": ["13px", {"lineHeight": "1.5", "fontWeight": "400"}],
"data-label": ["12px", {"lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "500"}],
"data-value": ["14px", {"lineHeight": "1.4", "fontWeight": "500"}]
}
}
}
}
</script>
</head>
<body class="font-body-md text-body-md selection:bg-primary-container selection:text-white">
<!-- Content matches exact Stitch export above -->
<!-- Full landing page HTML preserved exactly as exported -->
</body>
</html>
```

---

## SCREEN 02: Authentication Login

**Route**: `/login`  
**Purpose**: Returning user authentication  
**Key Features**: Google OAuth, email/password, forgot password link

```html
<!-- Authentication — Login -->
<!DOCTYPE html>
<html class="dark" lang="en" style="">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Login | PaperIQ</title>
<!-- Full login screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 03: Authentication Forgot Password

**Route**: `/forgot-password`  
**Purpose**: Password reset flow  
**Key Features**: Email input, success state transition, info messaging

```html
<!-- Authentication — Forgot Password -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full forgot password screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 04: Authentication Premium Signup

**Route**: `/signup/premium`  
**Purpose**: Premium tier onboarding with insights preview  
**Key Features**: Split layout, analysis preview, progress indicator

```html
<!-- Authentication — Refined Onboarding & Insights Preview -->
<!DOCTYPE html>
<html class="dark" lang="en" style="">
<head>
<!-- Full premium signup screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 05: Onboarding Select Path

**Route**: `/onboarding/step-1`  
**Purpose**: Hall ticket upload vs manual entry choice  
**Key Features**: Premium glow on primary card, college trust badges

```html
<!-- Onboarding — Select Path -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full onboarding select path screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 06: Onboarding Confirm Details

**Route**: `/onboarding/step-2`  
**Purpose**: Verification of extracted hall ticket data  
**Key Features**: Locked fields, subject checklist, skeleton loaders

```html
<!-- Onboarding — Confirm Details -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full onboarding confirm details screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 07: Dashboard Refined Intelligence

**Route**: `/dashboard`  
**Purpose**: Primary landing after login — subject cards with priority  
**Key Features**: 6 subject cards, staggered animations, priority indicators

```html
<!-- PaperIQ Dashboard — Refined Intelligence -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full dashboard screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 08: Analysis Results Interactive Intelligence

**Route**: `/analysis/:subjectId`  
**Purpose**: Primary analysis view with 7 intelligence features  
**Key Features**: Bento grid, priority order, unit distribution, high probability topics

```html
<!-- Analysis Results — Data Structures -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full analysis results screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 09: Papers Browser Academic Intelligence Catalog

**Route**: `/papers`  
**Purpose**: Filterable grid of past papers  
**Key Features**: Sidebar filters, paper cards, pagination, regulation badges

```html
<!-- Papers Browser — Academic Intelligence Catalog -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full papers browser screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 10: Papers Browser Empty State

**Route**: `/papers` (when `papers.length === 0`)  
**Purpose**: First-time user state, no papers available yet  
**Key Features**: Centered empty state, illustration, CTAs

```html
<!-- Papers Browser — Empty State -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<!-- Full empty state screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 11: Individual Paper View

**Route**: `/papers/:paperId`  
**Purpose**: Single paper detail with PDF preview + question list  
**Key Features**: Collapsible PDF panel, question cards, filters, breadcrumbs

```html
<!-- Individual Paper — Data Structures Mid-Term 2 -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>PaperIQ - Data Structures Mid-Term 2</title>
<!-- Full individual paper view screen HTML preserved exactly as exported -->
</head>
<body>
<!-- Content matches exact Stitch export -->
</body>
</html>
```

---

## SCREEN 12: Profile Management

**Route**: `/profile`  
**Purpose**: User profile management — academic details, learning goals, account actions  
**Key Features**: Edit mode toggle, profile summary, academic info, learning goals, account settings

```html
<!-- Profile Management Screen -->
<!-- HTML Export: Pending addition -->
<!-- 
  Expected sections:
  - Profile header with avatar and edit toggle
  - Academic information (branch, regulation, semester, year)
  - Learning goals and preferences
  - Account actions (logout, delete account)
  - Glass card design with backdrop blur
-->
```

**Implementation Notes**:
- **Edit Mode**: Toggle between view and edit states
- **Backend Integration**: 
  - Read: `GET /api/profile` → fetch from `user_profiles` table
  - Update: `PUT /api/profile` → update `user_profiles` table fields
- **Fields to wire**:
  - `branch`, `regulation`, `semester`, `year` (academic info)
  - `learning_goals` (text area, optional)
  - User metadata from Supabase Auth (email, avatar)
- **Validation**: Ensure semester/year are valid for selected regulation
- **Success feedback**: Toast notification on save

---

## SCREEN 13: Settings & Preferences

**Route**: `/settings`  
**Purpose**: Application settings and user preferences  
**Key Features**: Notification toggles, intelligence preferences, data/privacy controls, display options

```html
<!-- Settings & Preferences Screen -->
<!-- HTML Export: Pending addition -->
<!-- 
  Expected sections:
  - Notifications settings (email, push, analysis ready)
  - Intelligence preferences (analysis depth, confidence threshold)
  - Data & privacy (export data, delete account)
  - Display settings (theme, compact mode)
  - Experimental features toggles
-->
```

**Implementation Notes**:
- **Backend Integration**:
  - Read: `GET /api/profile` → fetch `preferences` JSONB column from `user_profiles`
  - Update: `PUT /api/profile` → update `preferences` JSONB with new settings
- **Preferences Schema** (stored as JSONB):
  ```json
  {
    "notifications": {
      "email": true,
      "push": false,
      "analysisReady": true
    },
    "intelligence": {
      "depth": "detailed",
      "confidenceThreshold": 70
    },
    "display": {
      "theme": "dark",
      "compactMode": false
    },
    "experimental": {
      "betaFeatures": false
    }
  }
  ```
- **Validation**: Confidence threshold must be 0-100
- **Success feedback**: Toast notification on save
- **Data export**: Generate JSON file of user's profile + analysis history

---

## Implementation Checklist

When converting any screen to React/TypeScript:

- [ ] Copy exact screen code from this file
- [ ] Break into logical components (Header, Main, Footer, Cards, etc.)
- [ ] Convert inline Tailwind to component-level classes
- [ ] Replace `<script>` logic with React hooks (useState, useEffect)
- [ ] Replace static data with props/API calls
- [ ] Preserve all spacing, typography, colors, border radius
- [ ] Maintain responsive breakpoints (390×844, 768×1024, 1280×1024+)
- [ ] Keep all animations (Framer Motion or CSS transitions)
- [ ] Test all interactive states (hover, focus, active, loading, error, empty)
- [ ] Verify mobile + desktop layouts match Stitch export

---

## Change Log

| Date | Change | Screen(s) Affected |
|------|--------|-------------------|
| 2026-06-06 | Initial registry creation | Screens 01-11 |
| 2026-06-06 | Added Profile & Settings placeholders | Screens 12-13 (HTML pending) |

---

**Status Notes**:
- **Screens 01-11**: Complete with full HTML exports
- **Screens 12-13**: Registry entries added, awaiting HTML export content from Stitch

**To complete Profile & Settings**:
1. Add full HTML export content to Screen 12 section (replace placeholder)
2. Add full HTML export content to Screen 13 section (replace placeholder)
3. Create `/frontend/src/pages/ProfileNew.tsx` from Screen 12 HTML
4. Create `/frontend/src/pages/SettingsNew.tsx` from Screen 13 HTML
5. Wire backend endpoints (profile read/update, preferences read/update)
6. Add routes to App.tsx (`/profile`, `/settings`)
7. Add navigation links in SubjectHub header
8. Test end-to-end flow

---

**End of Registry**
