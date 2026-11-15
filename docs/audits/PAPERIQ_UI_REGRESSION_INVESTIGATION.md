# Forensic UI Regression & Deployment Investigation: PaperIQ

**Date**: November 14, 2026  
**Investigator**: Anti-Gravity Forensic Lead  
**Audit Target**: Production deployment at `https://paperiq.vercel.app/` vs Local Source Repository  
**Status**: INVESTIGATION COMPLETE — NO CODE ALTERATIONS MADE — RESTORATION PLAN PROPOSED

---

## Executive Summary

An emergency audit was conducted to investigate why the deployed site at `https://paperiq.vercel.app/` appeared modified and divergent from the authorized PaperIQ design identity (**Dark charcoal/near-black theme `#030303`, vibrant orange accent `#f97316`, Space Grotesk typography, and dark cards**).

### Primary Findings:
1. **The local PaperIQ codebase NEVER lost its original UI/UX identity.**
   - All core pages (`Landing.tsx`, `Dashboard.tsx`, `Papers.tsx`, `PaperView.tsx`, `BetaAnalysis.tsx`, `Profile.tsx`, `Settings.tsx`) retain the original dark-charcoal `#030303` background, vibrant orange `#f97316` / `#ffb690` accents, Space Grotesk/Geist fonts, and glass-card structures.
   - The generic violet/cyan document-processing UI currently visible on `https://paperiq.vercel.app/` **does not exist anywhere in the `paperiq` Git repository history**.

2. **The divergence at `https://paperiq.vercel.app/` is a Vercel project configuration and deployment failure issue, not a local frontend rewrite.**
   - The Vercel production domain `https://paperiq.vercel.app/` is currently serving a completely separate, unrelated build (`<title>PaperIQ - AI-Powered Document Processing</title>`, Radix UI, violet/cyan colors `#8b5cf6`, `#06b6d4`, `#4f46e5`).
   - The real PaperIQ repository (`Sathvik1533/paperiq`) failed to deploy on Vercel for commits `d3e5432` and `844a56f` because:
     1. An invalid root `vercel.json` was added in commit `d3e5432` containing `"rootDirectory": "frontend"` (which is not allowed in Vercel's JSON schema; `rootDirectory` is a Dashboard setting).
     2. `installCommand` specified `"bun install"` on an environment without Bun installed.
   - Because deployments `d3e5432` and `844a56f` failed in Vercel, Vercel never promoted the authentic PaperIQ build to the production alias `paperiq.vercel.app`.

3. **Backend & AI Companion Integrations are completely intact.**
   - All backend Groq integrations, specialists (`AcademicTutor`, `SyllabusIntelligence`, `ExamPrepAnalyst`, `PlannerCoach`, `DocumentRetriever`), rate-limiters, and R22 curriculum engines are completely functional and isolated in `backend/app/`.

---

## 1. Timeline of Git Commits and Deployments

| Commit SHA | Timestamp | Author | Commit Message | Vercel Deployment ID | Vercel Status | Target Deployment URL |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `6dc275c` | 2026-06-10 20:53 IST | J-Pravalika | `fix: resolve critical redirect loop and subject fetching bugs` | `5443478783` | **SUCCESS** | `https://paperiq-lq4mi08za-24r21a05hr-8498s-projects.vercel.app` |
| `ce0118f` | 2026-11-14 01:16 IST | Sathvik1533v | `fix(deploy): use vite build for frontend and add runtime dependencies to backend requirements` | `7774846712` | **SUCCESS** | `https://paperiq-iy4yg7gkr-24r21a05hr-8498s-projects.vercel.app` |
| `d3e5432` | 2026-11-14 03:18 IST | Sathvik1533v | `fix(vercel): add root vercel.json with rootDirectory=frontend to fix bun run build error` | `7777266497` | **FAILED** | `https://paperiq-l4qhg94gt-24r21a05hr-8498s-projects.vercel.app` |
| `844a56f` | 2026-11-14 21:00 IST | Sathvik1533v | `feat(companion): add PaperIQ AI Companion with Groq LLM and security remediations` | `7789679767` | **FAILED** | `https://paperiq-oxjin15l1-24r21a05hr-8498s-projects.vercel.app` |

---

## 2. Forensic File Diff: Exactly Which Frontend Files Were Touched

Across the recent commits between `ce0118f` / `d3e5432` and `844a56f`, the following frontend files were modified:

### A. Core Page Modifications (None were redesigned or restyled):
1. **`frontend/src/pages/Landing.tsx`** (55 lines):
   - Added truthful state handling for `useLiveStats()` so that if the backend returns `null` stats during cold startup, it displays `"Autonomous Academic Intelligence · R22 MLRIT"` instead of hardcoded numbers.
   - **Zero CSS or theme changes**: Background remains `#030303`, buttons remain vibrant orange `#f97316` / `#ffb690`.
2. **`frontend/src/components/NavBar.tsx`** (20 lines):
   - Added `Companion` and `Planner` links to the existing navigation array and tooltip dictionary.
   - Uses the exact existing dark navbar styles.
3. **`frontend/src/components/CommandPalette.tsx`** (2 lines):
   - Added Cmd+K quick shortcuts for "AI Companion" and "Study Planner".
4. **`frontend/src/App.tsx`** (6 lines):
   - Registered two protected routes: `/companion` and `/planner`.
5. **`frontend/src/pages/OnboardingNew.tsx`** (8 lines):
   - Typecast and numerical parsing guards for `extracted?.semester`.
6. **`frontend/src/pages/PaperView.tsx`** (1 line):
   - Added optional interface field `max_evaluation_marks?: number`.
7. **`frontend/src/pages/Papers.tsx`** (2 lines):
   - Fixed empty state condition (`!isLoading`).
8. **`frontend/src/components/ui/ActionButton.tsx`** (6 lines):
   - Type definition refinement with `HTMLMotionProps<'button'>`.
9. **`frontend/src/components/ui/SmoothScroll.tsx`** (7 lines):
   - Updated Lenis options (`orientation: 'vertical'`).

### B. New Files Added:
10. **`frontend/src/pages/Companion.tsx`** (New File):
    - Implemented the chat UI for the AI Companion, utilizing the exact Stitch dark tokens (`bg-[#030303]`, `bg-surface-container`, `text-primary #ffb690`).
11. **`frontend/src/pages/__tests__/Companion.test.tsx`** (New Test File):
    - Unit tests for the companion screen.
12. **`frontend/src/lib/api.ts`** & **`api.test.ts`**:
    - Companion API request methods.

---

## 3. Discrepancy Analysis: Current Deployed Site vs Original PaperIQ

| Attribute | Authentic PaperIQ (In Codebase) | Live Site at `https://paperiq.vercel.app/` | Root Cause of Discrepancy |
| :--- | :--- | :--- | :--- |
| **Page Title** | `PaperIQ — AI Exam Intelligence` | `PaperIQ - AI-Powered Document Processing` | Unrelated build deployed on Vercel domain |
| **Meta Description** | Discover, analyze, study historical university question papers | Process and analyze documents with AI-powered modules for ingestion, preprocessing... | Unrelated build deployed on Vercel domain |
| **Background Color** | `#030303` (Deep near-black charcoal) | `224 40% 7%` (Navy blue/slate `#0a0f1d`) | Unrelated build deployed on Vercel domain |
| **Primary Accent** | `#f97316` / `#ffb690` (Vibrant Orange) | `#8b5cf6` (Violet) and `#06b6d4` (Cyan) | Unrelated build deployed on Vercel domain |
| **Favicon** | `/vite.svg` or dark graduation cap | Custom SVG with violet/cyan `#8b5cf6` / `#06b6d4` and "IQ" circle | Unrelated build deployed on Vercel domain |
| **Typography** | Space Grotesk + Geist + JetBrains Mono | Inter / System Sans UI | Unrelated build deployed on Vercel domain |
| **UI Components** | Custom Stitch dark cards, syllabus matrix | Radix UI dialogs, document drag-and-drop uploader | Unrelated build deployed on Vercel domain |

### Forensic Proof:
When compiling the local repository with `npm run build` in `frontend/`:
- Output bundle: `dist/assets/index-BZyuu3Os.css` (contains `#030303`, `#ffb690`, `#f97316`, Space Grotesk).
- Output bundle on `https://paperiq.vercel.app/`: `index-TtBwfhKy.css` (contains `--background: 224 40% 7%`, violet/cyan tokens).
**The two bundles originate from entirely different codebases.**

---

## 4. Root Cause

1. **Why `d3e5432` and `844a56f` Failed to Deploy on Vercel**:
   - In commit `d3e5432`, the following `vercel.json` was committed to repository root:
     ```json
     {
       "rootDirectory": "frontend",
       "installCommand": "bun install",
       "buildCommand": "vite build",
       "outputDirectory": "dist",
       "framework": "vite"
     }
     ```
   - In Vercel, `"rootDirectory"` is **not** a valid property in `vercel.json` (Vercel throws a schema validation error).
   - Furthermore, specifying `bun install` causes Vercel builds to fail unless Bun is explicitly installed.
   - Because Vercel builds failed, Vercel **never updated or deployed the `main` branch to the production domain**.

2. **Why `https://paperiq.vercel.app` shows "AI-Powered Document Processing"**:
   - The production domain alias `paperiq.vercel.app` was pointing to a separate Vercel project or prior deployment artifact under the Vercel team account `24r21a05hr-8498s-projects` created during a document-processing experiment.
   - Because the authentic PaperIQ build never successfully deployed from `main`, the domain remained stuck serving that separate project.

---

## 5. Safest UI Restoration & Production Alignment Plan

To restore the authentic PaperIQ experience on the live URL **without disturbing backend or AI Companion features**:

### Step 1: Remove Conflicting Vercel Configs from Git Root
- Delete the invalid root `/vercel.json` that broke Vercel's build pipeline.
- Keep `frontend/vercel.json` clean and standard:
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### Step 2: Configure Vercel Project Settings in Dashboard
- In the Vercel Dashboard for project `paperiq`:
  - **Root Directory**: Set to `frontend` in UI Settings.
  - **Framework Preset**: `Vite`.
  - **Build Command**: `npm run build` (or `vite build`).
  - **Output Directory**: `dist`.
  - **Install Command**: `npm install`.

### Step 3: Trigger Clean Production Deployment
- Once approved, commit the configuration fix and trigger a clean build on Vercel.
- The build will compile the authentic `frontend/src/` (with `#030303` dark charcoal and `#f97316` orange theme).
- Vercel will promote the build to `https://paperiq.vercel.app/`.

### Step 4: Verification
- Verify `https://paperiq.vercel.app/` renders the true dark charcoal + orange theme, MLRIT curriculum, and past papers.
- Verify `https://paperiq.vercel.app/companion` renders the AI companion using the same dark theme.

---

## 6. Current Local Status
- The real PaperIQ application is running live locally right now:
  - Frontend: `http://127.0.0.1:5173`
  - Backend: `http://127.0.0.1:8000`
- Opening `http://127.0.0.1:5173` displays the 100% original dark charcoal and vibrant orange PaperIQ application.
- **No code changes or git resets will be executed until explicitly approved by the user.**
