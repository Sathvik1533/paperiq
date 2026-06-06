# PaperIQ Screen Preservation Registry

**Master Visual Archive**: `/Users/k.sathvik/paperiq/stitch_export/`
**Total Items**: 21
**Last Updated**: June 5, 2026

**Purpose**: Permanent record of all Stitch-exported screens. No screen shall be discarded without explicit approval.

---

## Classification System

- **CORE** = Must be implemented for MVP launch
- **VARIANT** = Alternative state/design for specific conditions
- **ASSET** = Design reference, illustration, or style guide

---

## Complete Screen Registry

| # | Screen Name | Type | Implementation Status | Route Mapping | Notes |
|---|------------|------|---------------------|---------------|-------|
| 1 | `paperiq_landing_page_1` | CORE | 📝 Documented | `/` | Primary landing page. Hero + features + CTA |
| 2 | `paperiq_landing_page_2` | VARIANT | ⏸️ Preserved | `/` (alt) | Alternative landing layout. A/B test candidate |
| 3 | `authentication_login` | CORE | 📝 Documented | `/login` | Email/password login form |
| 4 | `authentication_sign_up` | CORE | 📝 Documented | `/signup` | Basic email signup form |
| 5 | `authentication_sign_up_official_oauth` | CORE | 📝 Documented | `/signup` | OAuth-enabled signup (Google) - PRIMARY AUTH SCREEN |
| 6 | `authentication_premium_sign_up_refined` | VARIANT | ⏸️ Preserved | `/signup/premium` | Premium tier signup flow. Future monetization |
| 7 | `authentication_forgot_password` | CORE | 📝 Documented | `/forgot-password` | Password reset flow |
| 8 | `authentication_refined_onboarding_insights_preview` | VARIANT | ⏸️ Preserved | `/signup/preview` | Post-signup teaser. Engagement hook |
| 9 | `onboarding_select_path` | CORE | 📝 Documented | `/onboarding/step-1` | Hall ticket upload OR manual entry choice |
| 10 | `onboarding_confirm_details` | CORE | 📝 Documented | `/onboarding/step-2` | Confirmation: Name, Semester, Regulation |
| 11 | `paperiq_dashboard_refined_intelligence` | CORE | 📝 Documented | `/dashboard` | PRIMARY DASHBOARD - Subject cards + analytics |
| 12 | `paperiq_dashboard_sathvik` | VARIANT | ⏸️ Preserved | `/dashboard` (personalized) | User-specific personalization variant |
| 13 | `analysis_results_interactive_intelligence` | CORE | 📝 Documented | `/analysis/:subjectId` | PRIMARY ANALYSIS - 7 features + insights |
| 14 | `analysis_results_data_structures` | VARIANT | ⏸️ Preserved | `/analysis/:subjectId` (alt) | Alternative analysis layout. May replace primary |
| 15 | `papers_browser_academic_intelligence_catalog` | CORE | 📝 Documented | `/papers` | PRIMARY PAPERS BROWSER - Grid + filters |
| 16 | `papers_browser_empty_state` | VARIANT | ⏸️ Preserved | `/papers` (empty) | First-time user state. No papers uploaded yet |
| 17 | `individual_paper_data_structures_mid_term_2` | CORE | 📝 Documented | `/papers/:paperId` | Paper view: PDF + question list + filters |
| 18 | `a_subtle_minimalist_vector_illustration_for_an_empty_state` | ASSET | ⏸️ Preserved | N/A | SVG/PNG for empty states across app |
| 19 | `paperiq_product_experience` | ASSET | ⏸️ Preserved | N/A | Product vision mockup. Reference only |
| 20 | `paperiq_dark_premium/DESIGN.md` | ASSET | ✅ Active | N/A | Design system specification. Source of truth |
| 21 | `paperiq_dashboard_specifications.txt` | ASSET | ✅ Active | N/A | Dashboard PRD. Implementation requirements |

---

## Status Legend

- ✅ **Active** = Currently used in implementation
- 📝 **Documented** = Comprehensive spec exists (SCREEN_XX_*.md)
- ⏸️ **Preserved** = Archived for future use, not discarded
- 🚧 **In Progress** = Implementation underway
- ❌ **Deprecated** = Replaced by newer version (none currently)

---

## Implementation Priority

### Phase 1: MVP Core Screens (7 screens)
**Status**: Documented ✅ | **Ready for Implementation**: YES

1. Landing Page 1
2. Authentication (OAuth signup)
3. Onboarding (2 steps)
4. Dashboard (refined intelligence)
5. Analysis Results (interactive intelligence)
6. Papers Browser
7. Individual Paper View

### Phase 2: Essential Variants (4 screens)
**Status**: Preserved | **Timeline**: Post-MVP Launch

1. **Papers Browser Empty State** - Critical for first-time UX
2. **Forgot Password Flow** - Required for production auth
3. **Authentication Login** - Returning users
4. **Alternative Analysis Layout** - Based on user feedback

### Phase 3: Premium & Personalization (5 screens)
**Status**: Preserved | **Timeline**: Premium Tier Launch

1. Premium Sign Up Refined
2. Onboarding Insights Preview
3. Dashboard Sathvik (personalized)
4. Landing Page 2 (A/B test)

### Phase 4: Assets & Polish
**Status**: Active/Preserved

- Empty state illustrations
- Design system refinements
- Product experience references

---

## Route Mapping Table

| Route | Primary Screen | Variant Screens | State Conditions |
|-------|---------------|----------------|------------------|
| `/` | `landing_page_1` | `landing_page_2` | A/B test flag |
| `/login` | `authentication_login` | - | Returning users |
| `/signup` | `authentication_sign_up_official_oauth` | `authentication_sign_up`, `authentication_premium_sign_up_refined` | OAuth primary, premium flag |
| `/forgot-password` | `authentication_forgot_password` | - | Password reset |
| `/onboarding/step-1` | `onboarding_select_path` | - | First-time users |
| `/onboarding/step-2` | `onboarding_confirm_details` | - | After step 1 |
| `/dashboard` | `paperiq_dashboard_refined_intelligence` | `paperiq_dashboard_sathvik` | Personalization flag |
| `/analysis/:subjectId` | `analysis_results_interactive_intelligence` | `analysis_results_data_structures` | Layout preference |
| `/papers` | `papers_browser_academic_intelligence_catalog` | `papers_browser_empty_state` | `papers.length === 0` |
| `/papers/:paperId` | `individual_paper_data_structures_mid_term_2` | - | - |

---

## Variant Selection Logic

### When to Show Variants:

**Dashboard Personalization**:
```typescript
const dashboardVariant = user.preferences.showPersonalization 
  ? 'dashboard_sathvik' 
  : 'dashboard_refined_intelligence'
```

**Papers Browser Empty State**:
```typescript
const papersView = papers.length === 0 
  ? 'papers_browser_empty_state' 
  : 'papers_browser_academic_intelligence_catalog'
```

**Landing Page A/B Test**:
```typescript
const landingVariant = abTest.group === 'B' 
  ? 'landing_page_2' 
  : 'landing_page_1'
```

**Analysis Layout Preference**:
```typescript
const analysisLayout = user.preferences.analysisLayout === 'compact' 
  ? 'analysis_results_data_structures' 
  : 'analysis_results_interactive_intelligence'
```

---

## Preservation Rules

### DO NOT DELETE:
- Any screen marked as VARIANT - these represent intentional alternative designs
- Any screen marked as ASSET - these are reference materials
- Any screen without explicit deprecation approval

### MAY DEPRECATE:
- Only after:
  1. New version is implemented and tested
  2. User feedback confirms improvement
  3. Explicit approval documented in this registry
  4. Migration plan for affected routes

### ARCHIVE PROCESS:
1. Move to `stitch_export/deprecated/` folder
2. Update registry status to ❌ Deprecated
3. Add deprecation reason and replacement screen
4. Preserve for 6 months minimum before deletion

---

## Design Assets Reference

### Empty State Illustration
**Source**: `a_subtle_minimalist_vector_illustration_for_an_empty_state`
**Usage**: 
- Papers Browser (no papers)
- Analysis Results (no data)
- Dashboard (first-time user)
- Any feature with empty state

### Design System
**Source**: `paperiq_dark_premium/DESIGN.md`
**Usage**: All screens must follow this specification
**Key Specs**:
- Colors: `#07070d` (bg), `#f97316` (primary)
- Typography: Space Grotesk (headings), Geist (body), JetBrains Mono (data)
- Spacing: 4px increments
- Radius: 12px (default), 16px (cards)

### Dashboard Specifications
**Source**: `paperiq_dashboard_specifications.txt`
**Usage**: Dashboard implementation requirements
**Key Requirements**:
- Personalized greeting
- 6 subject cards max
- Priority bars
- Recent analysis sidebar
- "Run New Analysis" CTA

---

## Change Log

| Date | Change | Screen Affected | Approver |
|------|--------|----------------|----------|
| 2026-06-05 | Initial registry created | All 21 screens | System |
| - | - | - | - |

---

## Approval Process for Screen Changes

**Before discarding, deprecating, or replacing any screen:**

1. Document reason for change
2. Identify affected routes
3. Create migration plan
4. Update this registry with status change
5. Obtain explicit approval
6. Archive (do not delete) for 6 months

**No screen shall be removed from `stitch_export/` without following this process.**

---

## Master Archive Location

```
/Users/k.sathvik/paperiq/stitch_export/
├── paperiq_landing_page_1/
├── paperiq_landing_page_2/
├── authentication_login/
├── authentication_sign_up/
├── authentication_sign_up_official_oauth/
├── authentication_premium_sign_up_refined/
├── authentication_forgot_password/
├── authentication_refined_onboarding_insights_preview/
├── onboarding_select_path/
├── onboarding_confirm_details/
├── paperiq_dashboard_refined_intelligence/
├── paperiq_dashboard_sathvik/
├── analysis_results_interactive_intelligence/
├── analysis_results_data_structures/
├── papers_browser_academic_intelligence_catalog/
├── papers_browser_empty_state/
├── individual_paper_data_structures_mid_term_2/
├── a_subtle_minimalist_vector_illustration_for_an_empty_state/
├── paperiq_product_experience/
├── paperiq_dark_premium/DESIGN.md
└── paperiq_dashboard_specifications.txt
```

**This directory is the permanent visual source of truth.**
**All screens are preserved.**
**None shall be discarded without explicit approval.**
