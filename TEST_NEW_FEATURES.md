# Testing New Features - Quick Guide

## 🧪 Feature Testing Instructions

### 1. Global Search (Cmd+K) - **5 min**

**Test Steps:**
1. Open the app in browser
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
3. Command palette should appear
4. Type "dashboard" → should show Dashboard option
5. Press Enter → should navigate to Dashboard
6. Press `Cmd+K` again
7. Type "settings" → should show Settings option
8. Press `Esc` → palette should close

**Expected Results:**
- ✅ Palette opens instantly on keyboard shortcut
- ✅ Fuzzy search works (e.g., "dash" finds "Dashboard")
- ✅ Navigation works on selection
- ✅ Closes on Esc or clicking outside
- ✅ Shows recent actions

**Files to Check:**
- `frontend/src/components/CommandPalette.tsx`
- `frontend/src/App.tsx`

---

### 2. Quick Action Buttons - **3 min**

**Test Steps:**
1. Log in to the app
2. Navigate to `/dashboard`
3. Look for quick action buttons section (3 cards)
4. Click "Run Analysis" → should go to `/analysis`
5. Go back, click "Browse Papers" → should go to `/papers`
6. Check "Send Feedback" button → should show feedback link

**Expected Results:**
- ✅ Three cards visible: Run Analysis, Browse Papers, Send Feedback
- ✅ Cards have hover effects (lift up, shadow)
- ✅ Icons render correctly
- ✅ Navigation works
- ✅ Only shown for returning users (not first-time)

**Files to Check:**
- `frontend/src/pages/Dashboard.tsx` (search for "Quick Actions")

---

### 3. Accessibility Features - **10 min**

#### A. Skip to Content
1. Open any page
2. Press `Tab` key once
3. "Skip to main content" link should appear at top-left
4. Press `Enter` → should jump to main content

#### B. Keyboard Navigation
1. Press `Tab` repeatedly
2. All interactive elements should have visible focus outline (orange, 2px)
3. Navigate to a subject card on Dashboard
4. Press `Enter` or `Space` → should trigger card action

#### C. Screen Reader (if available)
1. Enable VoiceOver (Mac: Cmd+F5) or NVDA (Windows)
2. Navigate through Dashboard
3. Subject cards should announce: name, code, priority score, top topic
4. All buttons should have proper labels

**Expected Results:**
- ✅ Skip link appears on first Tab press
- ✅ Focus indicators are visible and consistent
- ✅ All interactive elements are keyboard accessible
- ✅ Screen reader announces content properly

**Files to Check:**
- `frontend/src/index.css` (search for "Accessibility")
- `frontend/src/utils/accessibility.ts`
- `frontend/src/App.tsx` (skip-link)

---

### 4. Settings Page - **3 min**

**Test Steps:**
1. Navigate to `/settings`
2. Find "Display" section
3. Look for theme setting
4. Should show "Dark" mode with moon icon
5. Should show "Light mode coming soon" message
6. Toggle "Compact Mode" → should save to DB
7. Toggle "Reduce Motion" → should save to DB

**Expected Results:**
- ✅ Theme section displays correctly
- ✅ All toggles work and save
- ✅ Success message appears after save
- ✅ Settings persist after page reload

**Files to Check:**
- `frontend/src/pages/Settings.tsx` (Display section)
- `frontend/src/store/prefsStore.ts` (theme field)

---

### 5. Backfill Exam Dates Script - **2 min**

**Test Steps:**
1. Open terminal
2. Navigate to project root
3. Run: `cd backend`
4. Run: `python scripts/backfill_exam_dates.py`
5. Watch output for:
   - Number of papers found
   - Number of papers updated
   - Sample of backfilled dates
   - Verification statistics

**Expected Results:**
- ✅ Script runs without errors
- ✅ Papers get exam_date values
- ✅ Verification shows coverage percentage
- ✅ Sample output shows reasonable dates (2015-2030)

**Files to Check:**
- `backend/scripts/backfill_exam_dates.py`
- Check Supabase: `papers` table → `exam_date` column should be filled

---

### 6. Mobile Navigation - **5 min**

**Test Steps:**
1. Open app on mobile device or resize browser to <768px
2. Hamburger menu (☰) should appear in top-left
3. Click hamburger → drawer should open from left
4. Navigation links should be visible
5. Click a link → should navigate
6. Bottom navigation bar should be visible
7. Tap icons in bottom nav → should navigate

**Expected Results:**
- ✅ Hamburger menu visible on mobile
- ✅ Drawer opens/closes smoothly
- ✅ All nav links accessible
- ✅ Bottom nav bar functional
- ✅ Touch targets are large enough (48px min)

**Files to Check:**
- `frontend/src/components/NavBar.tsx` (mobile menu logic)

---

### 7. Animations & Motion - **3 min**

**Test Steps:**
1. Navigate to `/dashboard`
2. Watch subject cards fade in with staggered timing
3. Hover over cards → should lift up with shadow
4. Look for any pulsing priority badges
5. Open browser DevTools
6. Set: `prefers-reduced-motion: reduce`
7. Reload page → animations should be minimal/instant

**Expected Results:**
- ✅ Cards animate in smoothly
- ✅ Hover effects work
- ✅ Animations respect reduced motion preference
- ✅ No janky or laggy animations

**Files to Check:**
- `frontend/src/index.css` (@keyframes, @media prefers-reduced-motion)
- `frontend/src/pages/Dashboard.tsx` (fadeInUp styles)

---

## 🎯 Quick Smoke Test (2 min)

If you're short on time, run this minimal test:

```bash
# 1. Start frontend
cd frontend && bun run dev

# 2. Open browser to http://localhost:5173
# 3. Press Cmd+K → should open command palette
# 4. Press Tab → should see "Skip to content" link
# 5. Navigate to Dashboard → should see quick action buttons
# 6. Hover over subject card → should see lift animation
# 7. Navigate to Settings → Display section should show theme

# 8. Run backfill (in separate terminal)
cd backend && python scripts/backfill_exam_dates.py
```

---

## 📋 Checklist

Copy this checklist and mark as you test:

```
FEATURE TESTING:
[ ] Global Search (Cmd+K) opens and works
[ ] Quick action buttons on Dashboard
[ ] Skip to content link (Tab to see)
[ ] Keyboard focus indicators visible
[ ] Settings → Display → Theme section
[ ] Backfill script runs successfully
[ ] Mobile hamburger menu works
[ ] Animations play smoothly
[ ] Cards hover effects work
[ ] Reduced motion is respected

ACCESSIBILITY:
[ ] All interactive elements keyboard accessible
[ ] Focus indicators visible (orange outline)
[ ] Screen reader labels present (if tested)
[ ] Skip link works

DATA:
[ ] exam_date column filled after backfill
[ ] Settings save to Supabase
[ ] Preferences persist after reload
```

---

## 🐛 Common Issues & Fixes

### Issue: Command palette doesn't open
- **Fix**: Check if `cmdk` package is installed: `cd frontend && bun add cmdk`
- **Fix**: Clear browser cache and reload

### Issue: Skip link not visible
- **Fix**: Make sure you press Tab first (it's hidden until focused)
- **Fix**: Check `index.css` has `.skip-link` styles

### Issue: Backfill script fails
- **Fix**: Ensure environment variables are set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Fix**: Check Python dependencies: `pip install -r requirements.txt`

### Issue: Animations not smooth
- **Fix**: Check browser performance
- **Fix**: Test in incognito mode (extensions can interfere)

---

## 📊 Success Criteria

All features pass if:

1. ✅ Command palette opens on Cmd+K and navigates correctly
2. ✅ Quick action buttons render and link to correct pages
3. ✅ Skip-to-content link appears on Tab and works
4. ✅ All interactive elements are keyboard accessible
5. ✅ Settings page shows theme section correctly
6. ✅ Backfill script updates papers.exam_date column
7. ✅ Mobile navigation works on small screens
8. ✅ Animations play without jank
9. ✅ Reduced motion preference is respected
10. ✅ No console errors or warnings

---

**Testing Environment:**
- Browser: Chrome/Firefox/Safari (latest)
- Screen sizes: Desktop (1920x1080), Tablet (768px), Mobile (375px)
- OS: macOS/Windows/Linux
- Screen reader: VoiceOver (Mac) or NVDA (Windows) - optional

**Last Updated**: June 7, 2026
