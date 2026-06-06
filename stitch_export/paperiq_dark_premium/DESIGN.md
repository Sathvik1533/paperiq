---
name: PaperIQ Dark Premium
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#37393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e0c0b1'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#a78b7d'
  outline-variant: '#584237'
  surface-tint: '#ffb690'
  primary: '#ffb690'
  on-primary: '#552100'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#9d4300'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#c8c5cf'
  on-tertiary: '#303037'
  tertiary-container: '#9b99a2'
  on-tertiary-container: '#323139'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#e4e1eb'
  tertiary-fixed-dim: '#c8c5cf'
  on-tertiary-fixed: '#1b1b22'
  on-tertiary-fixed-variant: '#47464e'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  data-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-value:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  huge: 64px
  section: 96px
---

## Brand & Style
The design system for PaperIQ is built on a "Dark Premium" aesthetic, optimized for deep focus and high-efficiency academic workflows. It targets a high-achieving student demographic that values speed, precision, and digital craftsmanship.

The visual style is a fusion of **Modern Corporate** and **Minimalist** influences, drawing inspiration from high-fidelity developer tools. It utilizes a near-black canvas to eliminate distractions, punctuated by sharp typography and high-contrast accents. The emotional response is one of "calm authority"—a digital environment that feels professional, fast, and intellectually empowering. Elements are defined by precise borders rather than heavy shadows, maintaining a flat but layered architectural feel.

## Colors
The palette is rooted in a "void" black background to maximize focus. Depth is created through a tiered grayscale hierarchy rather than traditional shadows.

- **Primary Canvas:** Use `#07070d` for the lowest level (backgrounds).
- **Surface Elevation:** Use `#0f0f0f` for cards, modals, and floating panels to create a subtle lift.
- **Accents:** The Primary Orange (`#f97316`) is used sparingly for critical actions and indicators. Use the `accent_glow` for hover states or high-importance status indicators to simulate a soft "light emission" effect.
- **Typography:** Primary text is pure white. Secondary and Tertiary levels use opacity rather than hex variations to ensure harmonious blending across different surface tints.

## Typography
This design system employs a three-tier typeface strategy:
1. **Space Grotesk** is used for headlines. Its geometric, technical quirks provide the "PaperIQ" character and distinguish it from generic productivity tools.
2. **Geist** handles all functional body text. Its high legibility and neutral tone are essential for long-form reading and note-taking.
3. **JetBrains Mono** is reserved for metadata, labels, and numerical data. This monospaced choice reinforces the tool's systematic and precise nature.

Ensure `display-hero` is only used for main landing sections or empty states; use `headline-lg` for standard page headers.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The main content container is capped at 1200px for readability, centered on the screen.

- **Grid:** Use a 12-column grid for desktop with 24px gutters.
- **Vertical Rhythm:** Spacing should be strictly applied in multiples of 4. Use `xxl` (48px) for separating major sections and `base` (16px) for internal component padding.
- **Responsibility:** On mobile, margins shrink to 16px and the 12-column grid collapses to a single column. Spacing values above `xl` (32px) should be reduced by 25% on mobile devices to maintain density.

## Elevation & Depth
Depth is expressed through **Tonal Layers** and **Subtle Outlines**. Avoid heavy drop shadows which can muddy the dark UI.

1. **Level 0 (Base):** `#07070d`. Used for the main app background.
2. **Level 1 (Surface):** `#0f0f0f`. Used for cards and sidebars. Must be outlined with `border_subtle`.
3. **Level 2 (Popovers/Modals):** `#161616`. These surfaces use the `Medium` shadow (0 4px 12px) to clearly separate from the main interface.
4. **Interactive States:** On hover, surfaces should brighten slightly or increase border opacity to `border_medium`. 

The "Glow" effect is reserved exclusively for the primary action button or active study session indicators to create a "focal point" in the dark environment.

## Shapes
The shape language is "Soft-Modern." Use `md` (12px) as the default for most UI components like cards and input fields. Smaller elements like tags or checkboxes should use `sm` (8px). Large layout containers or featured hero images should use `lg` (16px) or `xl` (20px) to feel more approachable.

## Components
- **Buttons:** 
  - *Primary:* Orange background, white text, 12px radius. On hover, apply the `Glow` shadow.
  - *Secondary:* Transparent background, `border_medium` outline. On hover, background becomes `rgba(255, 255, 255, 0.05)`.
- **Input Fields:** Background: `#0f0f0f`, Border: `border_subtle`, Radius: 12px. Focus state: Border becomes `Primary Orange`, with a 2px outer glow.
- **Cards:** Background: `#0f0f0f`, Border: `border_subtle`, Radius: 16px. Content padding: 24px.
- **Chips/Tags:** Background: `rgba(255, 255, 255, 0.06)`, Text: `JetBrains Mono` (data-label), Radius: 8px.
- **Lists:** Use `border_subtle` as a bottom-divider between items. Hover state for list items should be a subtle background shift to `#161616`.
- **Status Indicators:** Use 8px circles with high-vibrancy colors (`Success`, `Info`) paired with a 20% opacity background of the same color for the container.