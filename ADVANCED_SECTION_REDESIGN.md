# Advanced Section Redesign - Student-Focused

## Problem: Old "Export My Data" Was Useless
**Before:**
- Single button: "Export My Data"
- Downloaded a JSON file with just:
  - User email
  - Text: "Available on request"
- No real value for students

---

## Solution: Practical Student Tools

**After:** Three useful actions students actually need:

### 1. 🔄 Reset Tutorial
**Student need:** "I skipped the tutorial too fast, how do I see it again?"

**What it does:**
- Clears `localStorage` flag for tutorial completion
- Next page load shows the guided tour again
- Non-destructive (doesn't affect any data)

**Technical:**
```javascript
localStorage.setItem('paperiq_tour_completed', 'false')
```

---

### 2. 🧹 Clear All Cache
**Student need:** "My analysis results look weird" / "App is acting strange"

**What it does:**
- Clears `localStorage` (except auth tokens)
- Clears `sessionStorage`
- Removes cached analysis results
- Preserves login session
- Shows confirmation before clearing

**Technical:**
```javascript
// Save auth token
const authData = localStorage.getItem('supabase.auth.token')

// Clear everything
localStorage.clear()
sessionStorage.clear()

// Restore auth (keep user logged in)
if (authData) localStorage.setItem('supabase.auth.token', authData)
```

**Safety:** User must confirm with dialog before clearing

---

### 3. 📧 Email Support
**Student need:** "I have a problem and need help"

**What it does:**
- Opens default email client
- Pre-fills support email: `support@paperiq.in`
- Includes user's email in body for context
- Subject: "PaperIQ Support Request"

**Technical:**
```javascript
window.open(
  'mailto:support@paperiq.in?subject=PaperIQ Support Request&body=User: ' + user?.email,
  '_blank'
)
```

---

## Visual Design

### Layout
```
┌─────────────────────────────────────────┐
│ 🛠️ Advanced                             │
├─────────────────────────────────────────┤
│ Reset Tutorial                          │
│ Show the guided tour again on next...  │
│ [🔄 Reset]                              │
│ ─────────────────────────                │
│ Clear All Cache                         │
│ Remove cached analysis results and...  │
│ [🗑️ Clear Cache] (red)                  │
│ ─────────────────────────                │
│ Having Issues?                          │
│ Contact support for help                │
│ [✉️ Email Support]                      │
└─────────────────────────────────────────┘
```

### UI Details
- Each action has:
  - Title (bold)
  - Description text (small, gray)
  - Button with icon
  - Divider between sections
- Destructive action (Clear Cache) uses red accent
- All buttons have smooth spring animations
- Success toast appears after actions

---

## Student Use Cases

### 1. New Student Joins Mid-Semester
**Scenario:** Friend recommends PaperIQ, student signs up, skips tutorial thinking "I'll figure it out"

**Solution:** Next day realizes they need help → Settings → Advanced → Reset Tutorial → guided through app properly

---

### 2. Shared Computer in College Lab
**Scenario:** Student logs in on lab computer, analysis shows old cached results from different account

**Solution:** Settings → Advanced → Clear All Cache → fresh data loaded

---

### 3. Bug or Strange Behavior
**Scenario:** Subject hub not loading, weird error messages, or UI glitches

**Solution:** 
1. Settings → Advanced → Clear Cache (fixes 80% of issues)
2. If still broken → Email Support button → student can report with their email already included

---

### 4. Moving to New Phone
**Scenario:** Student got new phone, wants to reset everything and start fresh

**Solution:** 
- Clear Cache → removes old local data
- Reset Tutorial → shows them the ropes on new device
- All profile data preserved (it's on server)

---

## Technical Implementation

### Files Changed
- `/frontend/src/pages/Settings.tsx` - Replaced Advanced section

### Dependencies
- No new dependencies
- Uses existing framer-motion for animations
- Uses native browser APIs (localStorage, mailto)

### Safety Features
1. **Clear Cache has confirmation dialog**
2. **Auth token is preserved** (user stays logged in)
3. **Profile data on server is untouched** (only local cache cleared)
4. **Non-destructive actions** (Reset Tutorial, Email Support)

---

## Why This Works Better

### Old "Export My Data"
- ❌ Exported almost nothing
- ❌ Students don't care about JSON files
- ❌ No practical use case
- ❌ Feels like a placeholder

### New Advanced Tools
- ✅ Solves real student problems
- ✅ Each action has clear purpose
- ✅ Non-technical explanations
- ✅ Safe with confirmations
- ✅ Immediate feedback (success toasts)

---

## Beta Testing Script

Ask beta testers:

1. **Reset Tutorial**
   - "You accidentally closed the tutorial. How would you see it again?"
   - Expected: Navigate to Settings → Advanced → Reset Tutorial

2. **Clear Cache**
   - "The app is showing weird old data. How would you fix it?"
   - Expected: Settings → Advanced → Clear Cache

3. **Get Help**
   - "You found a bug. How would you report it?"
   - Expected: Settings → Advanced → Email Support

---

## Future Enhancements

Could add later if needed:
- **Download Study Report** (PDF summary of all analyses)
- **Sign Out All Devices** (revoke all sessions)
- **Diagnostic Report** (for bug reports with logs)
- **Beta Feedback** (quick feedback form for beta testers)

But start simple with these 3 core actions.

---

## Success Metrics

Track (if analytics enabled):
- How often students use Reset Tutorial (indicates unclear onboarding)
- How often Clear Cache is used (indicates caching issues)
- Email Support click rate (indicates confusion/bugs)

High usage = need to improve the underlying feature
Low usage = advanced section is for edge cases (as intended)
