# PaperIQ Complete Stitch Screen Inventory

**Date**: June 5, 2026
**Source**: Stitch Export (`stitch_export/`)
**Total Screens**: 20+ variants

---

## Screen Inventory by Category

### 1. LANDING PAGES (2 variants)
- `paperiq_landing_page_1` ✅
- `paperiq_landing_page_2` ✅

### 2. AUTHENTICATION (6 variants)
- `authentication_login` ✅
- `authentication_sign_up` ✅
- `authentication_sign_up_official_oauth` ✅
- `authentication_premium_sign_up_refined` ✅
- `authentication_forgot_password` ✅
- `authentication_refined_onboarding_insights_preview` ✅

### 3. ONBOARDING (2 screens)
- `onboarding_select_path` ✅
- `onboarding_confirm_details` ✅

### 4. DASHBOARD (2 variants)
- `paperiq_dashboard_refined_intelligence` ✅
- `paperiq_dashboard_sathvik` ✅ (personalized)

### 5. ANALYSIS RESULTS (2 variants)
- `analysis_results_data_structures` ✅
- `analysis_results_interactive_intelligence` ✅

### 6. PAPERS BROWSER (2 states)
- `papers_browser_academic_intelligence_catalog` ✅
- `papers_browser_empty_state` ✅

### 7. INDIVIDUAL PAPER VIEW (1 screen)
- `individual_paper_data_structures_mid_term_2` ✅

### 8. EMPTY STATE ILLUSTRATION
- `a_subtle_minimalist_vector_illustration_for_an_empty_state` ✅

### 9. PRODUCT EXPERIENCE
- `paperiq_product_experience` ✅

### 10. DESIGN SYSTEM
- `paperiq_dark_premium/DESIGN.md` ✅

---

## Approved MVP User Journey

Based on the complete Stitch export and existing documentation:

```
Landing → Authentication → Onboarding → Dashboard → Analysis → Papers → Paper View
```

### Detailed Flow:

1. **Landing** (`paperiq_landing_page_1` or `paperiq_landing_page_2`)
   - Hero section with value proposition
   - CTA: "Get Started" → Authentication

2. **Authentication** (`authentication_sign_up_official_oauth`)
   - Google OAuth
   - Email/Password
   - → Onboarding

3. **Onboarding** (`onboarding_select_path` → `onboarding_confirm_details`)
   - Path selection (Hall Ticket upload OR Manual entry)
   - Confirmation screen
   - → Dashboard

4. **Dashboard** (`paperiq_dashboard_refined_intelligence`)
   - Subject cards with priority indicators
   - Recent analysis snapshot
   - CTA: "Run New Analysis"
   - → Analysis Results

5. **Analysis Results** (`analysis_results_interactive_intelligence`)
   - 7 analysis features
   - Subject-specific insights
   - → Papers Browser (from subject card)

6. **Papers Browser** (`papers_browser_academic_intelligence_catalog`)
   - Grid of past papers with filters
   - Empty state variant available
   - → Individual Paper View

7. **Individual Paper View** (`individual_paper_data_structures_mid_term_2`)
   - PDF preview + question list
   - Classification indicators
   - Topic tags

---

## Currently Documented Screens (7)

✅ **SCREEN_01_LANDING_PROMPT.md**
✅ **SCREEN_02_ONBOARDING_PROMPT.md**
✅ **SCREEN_02.5_AUTHENTICATION_STITCH.md**
✅ **SCREEN_03_DASHBOARD_STITCH.md**
✅ **SCREEN_04_ANALYSIS_RESULTS_STITCH.md**
✅ **SCREEN_05_PAPERS_BROWSER_STITCH.md**
✅ **SCREEN_06_PAPER_VIEW_STITCH.md**

---

## Missing Documentation (Stitch Variants Not Yet Documented)

### Critical Gaps:

1. **Landing Page Variant 2** - `paperiq_landing_page_2`
2. **Premium Sign Up Refined** - `authentication_premium_sign_up_refined`
3. **Onboarding Insights Preview** - `authentication_refined_onboarding_insights_preview`
4. **Dashboard Sathvik** - `paperiq_dashboard_sathvik` (personalized variant)
5. **Papers Browser Empty State** - `papers_browser_empty_state`

### Additional Variants (Not Critical for MVP):

- Authentication variants (login, forgot password, basic sign up)
- Analysis Results variant (`analysis_results_data_structures`)
- Product Experience screen

---

## Design System Summary

**Source**: `paperiq_dark_premium/DESIGN.md`

### Color Palette:
- **Background**: `#07070d` (void black)
- **Surface**: `#0f0f0f` (cards, panels)
- **Surface Elevated**: `#161616` (modals, popovers)
- **Primary Orange**: `#f97316`
- **Text Primary**: `#e2e2e2`
- **Text Secondary**: `rgba(255, 255, 255, 0.6)`

### Typography:
- **Headings**: Space Grotesk (56px/36px/32px/24px)
- **Body**: Geist (18px/15px/13px)
- **Data/Metrics**: JetBrains Mono (14px/12px)

### Spacing System:
- xs: 4px
- sm: 8px
- md: 12px
- base: 16px
- lg: 24px
- xl: 32px
- xxl: 48px
- huge: 64px
- section: 96px

### Border Radius:
- sm: 4px (8px in original)
- md: 12px
- lg: 16px
- xl: 20px

### Responsive Breakpoints:
- **Mobile**: 390×844
- **Tablet**: 768×1024
- **Desktop**: 1280×1024+

---

## Next Steps

### Option 1: Document Missing Screens
Create comprehensive documentation for the 5 critical missing screens (especially empty states and premium features).

### Option 2: Begin Implementation
Use the 7 existing comprehensive markdown files as source of truth and begin frontend implementation immediately.

### Option 3: Consolidate Variants
Review which screen variants should be used for MVP:
- Landing: Which version? (page_1 vs page_2)
- Dashboard: Which version? (refined_intelligence vs sathvik)
- Analysis: Which version? (data_structures vs interactive_intelligence)

---

## Recommendation

**PROCEED WITH OPTION 2** - Begin implementation using existing 7 comprehensive documents.

**Reasoning**:
1. All 7 documents cover the complete MVP user journey
2. Backend is 100% operational
3. Missing screens are variants or empty states that can be added later
4. Time-to-market is critical for beta testing

**After MVP Launch**:
- Add empty state screens
- Add premium sign-up flow
- Add personalized dashboard variants
- Add additional landing page options

---

## File Access

All Stitch screens available at:
```
/Users/k.sathvik/paperiq/stitch_export/
```

Each folder contains:
- `screen.png` - Visual reference
- `code.html` - Generated HTML/CSS (where available)
