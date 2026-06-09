# Guided Tour Testing Checklist

## Pre-Testing Setup

### 1. Clear Tour State
```javascript
// Open browser console (F12) and run:
localStorage.removeItem('paperiq_tour_complete_v1')
```

### 2. Ensure You Have Profile Setup
- ✅ User is logged in
- ✅ Profile has current_semester set
- ✅ Profile has regulation set
- ✅ At least 1 subject exists for your semester

### 3. Start Fresh
```
Navigate to: http://localhost:3000/dashboard
Wait for page to fully load
```

---

## Step-by-Step Testing

### Step 1: Dashboard Welcome ✅
**Target**: `tour-dashboard`
**Expected**:
- [ ] Spotlight appears around dashboard header after ~800ms
- [ ] Tooltip appears with title "Your Dashboard"
- [ ] Progress shows "Step 1 of 9"
- [ ] Progress bar at ~11%
- [ ] First progress dot is glowing orange
- [ ] Icon is pulsing

**Actions to Test**:
- [ ] Hover over "Next →" button (should lift up)
- [ ] Hover over "Skip tour" (should brighten)
- [ ] Press Enter (advances to step 2)

---

### Step 2: Subject Cards ✅
**Target**: `tour-subject-grid`
**Expected**:
- [ ] Spotlight highlights the subject card grid
- [ ] Tooltip shows "Subject Cards"
- [ ] Progress shows "Step 2 of 9"
- [ ] Second progress dot is glowing

**Actions to Test**:
- [ ] Click "← Back" button (goes back to step 1)
- [ ] Click "Next →" again (goes to step 3)

---

### Step 3: Today's Focus ✅ (Conditional)
**Target**: `tour-today-focus`
**Expected**:
- [ ] Only appears if you have subjects with analysis data
- [ ] Highlights the top-priority banner
- [ ] Tooltip shows "Today's Focus"
- [ ] Progress shows "Step 3 of 9" (or skips if no data)

**Skip Scenario**:
- [ ] If no analysis data exists, tour skips to step 4
- [ ] Console logs: `[Tour] Target not found... SKIPPING`

---

### Step 4: Navigate to Analysis ⚠️ **Critical Test**
**Target**: `tour-nav-analysis`
**Expected**:
- [ ] Page navigates from /dashboard to /analysis
- [ ] Wait time: 1800ms (long pause is normal)
- [ ] Navbar "Analysis" tab gets highlighted
- [ ] Tooltip shows "Run a deep AI scan..."
- [ ] Progress shows "Step 4 of 9"

**Console Logs to Check**:
```
[Tour] Step 4/9: {target: 'tour-nav-analysis', route: '/analysis', ...}
[Tour] Navigating to: /analysis
[Tour] Waiting 1800ms for page to load...
[Tour] Attempt 1/20 - Looking for: tour-nav-analysis
[Tour] Found element: tour-nav-analysis
[Tour] Showing tooltip for: tour-nav-analysis
```

**What to Watch**:
- [ ] URL changes to /analysis
- [ ] Analysis page loads completely
- [ ] Tour waits patiently (don't rush it!)
- [ ] Highlight appears on navbar, not subject picker

---

### Step 5: Subject Picker ⚠️ **Critical Test**
**Target**: `tour-analysis-subject`
**Expected**:
- [ ] Stays on /analysis page (no navigation)
- [ ] Highlights the entire subject picker card
- [ ] Tooltip shows "Pick a Subject to Analyse"
- [ ] Progress shows "Step 5 of 9"
- [ ] Wait time: 700ms

**Console Logs to Check**:
```
[Tour] Already on correct route: /analysis
[Tour] Attempt 1/20 - Looking for: tour-analysis-subject
[Tour] Found element: tour-analysis-subject
[Tour] Element rect: DOMRect {x: ..., y: ..., width: ..., height: ...}
[Tour] Showing tooltip for: tour-analysis-subject
```

**If This Fails**:
- Check console for error logs
- Verify element has `data-tour="tour-analysis-subject"` attribute
- Increase wait time if needed

---

### Step 6: Navigate to Papers ✅
**Target**: `tour-nav-papers`
**Expected**:
- [ ] Navigates from /analysis to /papers
- [ ] Wait time: 1800ms
- [ ] Navbar "Papers" tab highlighted
- [ ] Tooltip shows "Browse all 70+ previous papers"
- [ ] Progress shows "Step 6 of 9"

---

### Step 7: Filter Sidebar ✅
**Target**: `tour-papers-filters`
**Expected**:
- [ ] Stays on /papers
- [ ] Highlights left sidebar filters
- [ ] Tooltip shows "Powerful Filters"
- [ ] Progress shows "Step 7 of 9"
- [ ] Wait time: 700ms

---

### Step 8: Navigate to Profile ✅
**Target**: `tour-nav-profile`
**Expected**:
- [ ] Navigates from /papers to /profile
- [ ] Wait time: 1800ms
- [ ] Navbar "Profile" dropdown highlighted
- [ ] Tooltip shows "Your Profile"
- [ ] Progress shows "Step 8 of 9"

---

### Step 9: Final CTA ✅
**Target**: `tour-run-analysis-cta`
**Expected**:
- [ ] Navigates back to /dashboard
- [ ] Wait time: 1600ms
- [ ] Highlights "Run New Analysis" button in navbar
- [ ] Tooltip shows "Ready? Let's Go."
- [ ] Progress shows "Step 9 of 9"
- [ ] Progress bar at 100%
- [ ] All 9 progress dots visible
- [ ] Button text changes to "🚀 Get Started!"

**Final Actions**:
- [ ] Click "Get Started!" button
- [ ] Tour completes and disappears
- [ ] localStorage now has `paperiq_tour_complete_v1 = "1"`

---

## Visual Element Tests

### Progress Dots
- [ ] Step 1: Dot 1 glowing orange, rest gray
- [ ] Step 5: Dots 1-5 orange (completed), dot 5 glowing, 6-9 gray
- [ ] Step 9: All dots orange, dot 9 glowing

### Icon Animation
- [ ] Explore icon pulses smoothly
- [ ] Pulse cycle: 1.0 → 1.05 → 1.0 scale
- [ ] Duration: 2 seconds per cycle

### Button Hover States
- [ ] "Next →" button lifts on hover
- [ ] "← Back" button brightens on hover  
- [ ] "Skip tour" link brightens on hover
- [ ] All transitions are smooth (0.2s ease)

### Progress Bar
- [ ] Orange gradient (not flat color)
- [ ] Glowing effect visible
- [ ] Smooth width transition (0.4s ease)

### Keyboard Hints
- [ ] `Enter` and `Esc` styled as keyboard keys
- [ ] Monospace font
- [ ] Visible border and background

---

## Browser Compatibility Tests

### Desktop

#### Chrome
- [ ] All 9 steps complete
- [ ] Animations smooth
- [ ] No console errors

#### Firefox
- [ ] All 9 steps complete
- [ ] Animations smooth
- [ ] No console errors

#### Safari
- [ ] All 9 steps complete
- [ ] Animations smooth
- [ ] No console errors

### Mobile

#### Mobile Safari (iOS)
- [ ] All steps complete
- [ ] Touch works (no keyboard)
- [ ] Overlay blocks page interaction
- [ ] Animations don't lag

#### Mobile Chrome (Android)
- [ ] All steps complete
- [ ] Touch works
- [ ] Overlay blocks page interaction

---

## Accessibility Tests

### Keyboard Navigation
- [ ] Press `Enter` → advances step
- [ ] Press `Esc` → exits tour
- [ ] Tab key focuses buttons
- [ ] Space bar on button → activates

### Reduced Motion
```javascript
// Enable in browser settings or system preferences
```
- [ ] Animations disabled/simplified
- [ ] Tour still functional
- [ ] No jarring movements

### Screen Reader (Optional)
- [ ] Tour announces step numbers
- [ ] Button labels are clear
- [ ] Progress is communicated

---

## Edge Cases

### Slow Network
- [ ] Navigate slowly between pages
- [ ] Tour waits patiently (up to 20 retries)
- [ ] Eventually skips if element never appears
- [ ] Console shows retry logs

### Missing Data
- [ ] No subjects → tour adjusts gracefully
- [ ] No analysis data → skips "Today's Focus" step
- [ ] Empty pages → tour continues to next step

### Mid-Tour Reload
- [ ] Refresh page during tour
- [ ] Tour restarts from beginning
- [ ] No broken state

### Multiple Tours
- [ ] Complete tour once
- [ ] Reload page
- [ ] Tour should not appear again
- [ ] Manual trigger still works via "Platform Tour" button

---

## Performance Checks

### Load Time
- [ ] Tour starts within 1 second of page load
- [ ] No jank or stuttering
- [ ] Smooth transitions throughout

### Memory
- [ ] No memory leaks
- [ ] Tour cleans up after completion
- [ ] Event listeners removed

### Animation FPS
- [ ] Animations run at 60fps (or 30fps on mobile)
- [ ] No dropped frames
- [ ] Smooth progress bar

---

## Known Issues to Watch For

### Issue: Tour Hangs at Step 4-5
**Symptom**: Gets stuck navigating to Analysis
**Debug**:
1. Check console for retry attempts
2. Look for "Element not found" errors
3. Verify wait times are sufficient
4. Check if element has correct data-tour attribute

### Issue: Tooltip Appears Before Element Loads
**Symptom**: Spotlight on wrong location or invisible element
**Debug**:
1. Check visibility detection is working
2. Increase wait time for that step
3. Verify element is actually in DOM

### Issue: Progress Dots Don't Update
**Symptom**: All dots stay gray or wrong color
**Debug**:
1. Check CSS animations are loading
2. Verify step counter is incrementing
3. Check browser console for errors

---

## Success Criteria

✅ **Must Pass**:
- [ ] All 9 steps complete without manual intervention
- [ ] Steps 4-5 transition works reliably
- [ ] No console errors
- [ ] Visual elements all render correctly
- [ ] Tour can be skipped at any time
- [ ] Tour can be restarted from dashboard button

✅ **Should Pass**:
- [ ] Animations are smooth
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Mobile friendly

✅ **Nice to Have**:
- [ ] Works on slow networks
- [ ] Graceful degradation
- [ ] Accessibility features work

---

## Reporting Issues

If you find a problem, capture:

1. **Step Number**: Which step failed?
2. **Target**: What element was it looking for?
3. **Console Logs**: What errors appeared?
4. **Screenshot**: Visual state when it failed
5. **Browser**: Chrome/Firefox/Safari version
6. **Network**: Fast/Slow/Offline

Example Report:
```
❌ Tour failed at Step 5
Target: tour-analysis-subject
Error: "Target not found after 20 retries"
Console: [Tour] Element not found, retrying in 1200ms...
Browser: Chrome 120.0
Screenshot: [attached]
```

---

## Quick Fix Commands

### Reset Tour
```javascript
localStorage.removeItem('paperiq_tour_complete_v1')
location.reload()
```

### Force Skip Current Step
```javascript
// Press Esc key
```

### Manual Trigger
```
Click "Platform Tour" button on dashboard
```

### View All Tour Elements
```javascript
Array.from(document.querySelectorAll('[data-tour]'))
  .map(el => el.getAttribute('data-tour'))
```

---

**Testing Status**: ⬜ Not Started | 🟡 In Progress | ✅ Passed | ❌ Failed

Mark each checkbox as you test. Good luck! 🚀
