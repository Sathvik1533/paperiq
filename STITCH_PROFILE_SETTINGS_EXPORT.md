# Stitch Exports — Profile & Settings

**Date**: June 6, 2026  
**Status**: ⚠️ **Awaiting Full HTML Exports**

---

## What's Needed

The Profile and Settings screens have been added to the `stitch-screens.md` registry (Screens 12 & 13), but the full HTML export content is not yet available.

**Current Status**:
- ✅ Screen 12 & 13 table entries added to registry
- ✅ Implementation notes documented
- ✅ Backend integration plan defined
- ❌ Full HTML exports from Stitch (missing)

---

## Expected Content

### Screen 12: Profile Management
**Full HTML export** containing:
- Profile header with avatar and edit/save toggle
- Academic information section (branch, regulation, semester, year)
- Learning goals text area
- Account actions (logout, delete account)
- Glass card design matching approved design system

### Screen 13: Settings & Preferences
**Full HTML export** containing:
- Notifications settings (toggles for email, push, analysis alerts)
- Intelligence preferences (analysis depth dropdown, confidence threshold slider)
- Data & privacy controls (export data button, delete account)
- Display settings (theme selector, compact mode toggle)
- Experimental features section

---

## How to Provide

Once the Stitch HTML exports are ready:

1. **Paste the complete HTML** for Screen 12 (Profile) into `stitch-screens.md` replacing the placeholder comment in the Screen 12 section
2. **Paste the complete HTML** for Screen 13 (Settings) into `stitch-screens.md` replacing the placeholder comment in the Screen 13 section
3. Ensure both exports include:
   - Complete `<!DOCTYPE html>` through `</html>`
   - All Tailwind CDN links
   - Font imports (Space Grotesk, Geist, JetBrains Mono)
   - Inline styles for animations and glass effects
   - All interactive elements (buttons, toggles, inputs)

---

## Design System Compliance

Both screens use the approved design system:
- Background: `#07070d`
- Accent: `#f97316` (orange)
- Success: `#10b981` (green)
- Glass cards: `rgba(15, 15, 15, 0.75)` with `backdrop-filter: blur(16px)`
- Fonts: Space Grotesk (headings), Geist (body), JetBrains Mono (numbers)
- Border: `rgba(255, 255, 255, 0.08)`

---

## Next Steps (Once HTML Received)

1. ✅ Replace placeholder HTML in stitch-screens.md with actual exports
2. Create React components:
   - `/frontend/src/pages/ProfileNew.tsx`
   - `/frontend/src/pages/SettingsNew.tsx`
3. Wire backend APIs:
   - Profile read/update endpoint
   - Preferences read/update endpoint
4. Add routes to `/frontend/src/App.tsx`
5. Add navigation links in SubjectHub header
6. Test complete flow: Dashboard → Profile (edit/save) → Settings (toggle/save)

---

**Waiting for**: Complete Stitch HTML exports for Profile and Settings screens.
