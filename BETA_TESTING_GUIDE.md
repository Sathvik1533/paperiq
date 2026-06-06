# Beta Student Experience — Testing Guide

**Date**: June 5, 2026  
**Status**: Ready for End-to-End Testing  
**Environment**: Local Development

---

## ✅ Current Status

### Backend
- **Running**: http://localhost:8000
- **API Prefix**: `/api/v1/`
- **Health Check**: ✅ Operational
- **Analysis Endpoint**: ✅ Working
- **Data Available**:
  - 10 verified R22 CSE subjects
  - 72 papers
  - 5,730 questions
  - 59.9% classified with topics/units

### Frontend
- **Running**: http://localhost:3001
- **Auth**: Supabase (configured)
- **API Connection**: Configured to backend
- **Default Route**: `/beta` (Beta Analysis page)

---

## 🧪 End-to-End Test Flow

### 1. Open Application
```
Open browser: http://localhost:3001
```

Expected: Redirects to `/auth` if not logged in

### 2. Login / Sign Up
Use Supabase auth:
- **Test Account**: Use your MLRIT email or create new account
- **Expected**: After login, redirects to `/onboarding` (first time) or `/beta` (returning)

### 3. Complete Onboarding (First Time Users)
Required fields:
- Name
- Hall Ticket Number (format: MLRIT validation)
- Semester (1-8)
- Branch (CSE/ECE/etc)

Expected: After completion, redirects to `/beta`

### 4. Beta Analysis Page
**Path**: `/beta`

#### Step 1: View Semester
- Should show your semester from profile (read-only)
- Example: "Semester 2"

#### Step 2: Select Subject
- Dropdown shows subjects for your semester
- Example subjects for Semester 2:
  - A6CS05 - Data Structures
  - A6CS07 - Software Engineering
  - A6CS28 - Digital Electronics and Computer Organization
  - A6IT02 - Object Oriented Programming through Java
  - A6BS03 - Computer Oriented Statistical Methods

#### Step 3: Select Paper Filter
Options:
- All Papers (default)
- Mid-1
- Mid-2
- Semester

#### Step 4: Click "Analyze Papers"
- Loading state appears
- API call to `/api/v1/analysis/generate`
- Returns analysis in ~2-3 seconds

#### Step 5: View Results
Should display all 5 analysis sections:

##### a) Stats Overview (3 cards)
- Total Questions (e.g., 1000)
- Topics Identified (e.g., 10)
- Analysis Coverage (e.g., 75%)

##### b) Unit Distribution
- Bar chart showing percentage per unit
- Sorted by percentage (highest first)
- Example:
  - Unit I: 34.3%
  - Unit IV: 20.4%
  - Unit III: 16.6%
  - Unit V: 18.6%
  - Unit II: 10.1%

##### c) Most Asked Topics (Top 10)
Each card shows:
- Topic name
- Unit
- Priority badge (Very High / High / Medium)
- Percentage
- Example: "Linear Data Structures – Stack, Queue, Linked List" - 26.5% - Very High

##### d) High Probability Topics (Top 5)
Each card shows:
- Topic name
- Probability label (High / Medium / Low)
- Question count across papers
- Confidence bar

##### e) Study Priority Order (Top 3 units)
Each card shows:
- Priority rank
- Unit name
- Percentage coverage
- Recommendation text
- Focus topics list with counts

##### f) Top Repeated Questions (Top 5 by default)
- Frequency badge (e.g., "16x")
- Question text
- Paper count
- Toggle: "View All Questions" to expand

---

## ✅ What Should Work

1. **Semester auto-loads** from user profile
2. **Subjects dropdown** populates based on semester + regulation
3. **Paper filter** allows filtering by exam category
4. **Analysis generates** within 2-3 seconds
5. **All 5 insight sections** render with real data
6. **No raw question counts** visible by default (only in Advanced section toggle)
7. **Student-focused language** throughout
8. **Mobile responsive** layout (Tailwind grid)

---

## ❌ What Should NOT Appear

1. ❌ Raw database column names
2. ❌ Question IDs or Paper IDs in default view
3. ❌ SQL-like data structures
4. ❌ Empty sections (all sections have data for verified subjects)
5. ❌ Error states without helpful messages
6. ❌ Infinite loading states

---

## 🐛 Known Issues to Watch For

### Frontend Issues
- [ ] Subject dropdown empty → Check semester value in profile
- [ ] Analysis stuck on "Analyzing..." → Check browser console for API errors
- [ ] CORS error → Backend CORS needs frontend URL added
- [ ] Empty analysis results → Check backend returned correct field names

### Backend Issues
- [ ] 500 error on `/analysis/generate` → Check backend logs for Python errors
- [ ] Empty `unit_distribution_classified` → Classification may have failed
- [ ] `most_asked_topics` empty → No topic classifications available

### Data Issues
- [ ] Coverage analysis shows 0% → No classified questions for subject
- [ ] Unit distribution missing units → Units not classified for those questions
- [ ] Repeated questions section empty → No duplicate questions found

---

## 🔍 Debugging Commands

### Check Backend Health
```bash
curl http://localhost:8000/api/v1/health | jq .
```

### Test Analysis Endpoint Directly
```bash
# Replace subject_id with actual ID
curl -X POST http://localhost:8000/api/v1/analysis/generate \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "f610bc46-eac9-44ad-a553-c29166de453d",
    "regulation": "R22"
  }' | jq '.data | keys'
```

### Check Frontend Logs
```bash
# Open browser DevTools (F12)
# Go to Console tab
# Look for:
# - Network errors (red)
# - API call responses
# - React render errors
```

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for:
# - SQL queries
# - Python exceptions
# - API request logs
```

---

## ✅ Success Criteria

A successful test means:

1. ✅ Student can login
2. ✅ Student can select their semester + subject
3. ✅ Analysis generates without errors
4. ✅ All 5 insight sections display with real data
5. ✅ No raw question counts visible by default
6. ✅ Student-focused language throughout
7. ✅ Mobile layout works (test on phone or DevTools mobile emulation)

---

## 📝 Next Steps After Testing

Once the above test passes:

### 1. Add Paper Browser
Location: `/papers` route (already exists)
- [ ] Add exam category filter dropdown
- [ ] Add "Latest Papers" section
- [ ] Add "All Papers" table with filters

### 2. Add Advanced Section Toggle
Location: `BetaAnalysis.tsx`
- [ ] Move "View All Questions" to collapsible "Advanced" section
- [ ] Add "View Raw Data" option (shows question_count per topic)

### 3. Prepare Deployment
- [ ] Create production environment variables
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Test production URLs end-to-end

### 4. Student Validation
- [ ] Recruit 5 MLRIT CSE students
- [ ] Give them access to beta deployment
- [ ] Collect feedback via Google Form
- [ ] Iterate based on feedback

---

## 📊 Test Data Available

### Verified R22 CSE Subjects (10)
1. Data Structures (A6CS05) - 1000 questions
2. Software Engineering (A6CS07) - 1000 questions
3. Object Oriented Programming through Java (A6IT02) - 800 questions
4. Digital Electronics and Computer Organization (A6CS28) - 800 questions
5. Computer Oriented Statistical Methods (A6BS03) - 800 questions
6. Operating Systems (A6CS06) - 800 questions
7. Database Management Systems (A6IT04) - 800 questions
8. Computer Networks (A6IT05) - 800 questions
9. Compiler Design (A6CS09) - 400 questions
10. Computer Architecture (A6CS30) - 530 questions

### Coverage
- **Total Questions**: 5,730 across all subjects
- **Classification Coverage**: 59.9% (3,433 classified)
- **Units Identified**: All 5 units (Unit I-V)
- **Topics Identified**: 10+ per subject

---

## 🎯 Goal

**A student should be able to:**
1. Open PaperIQ
2. Select their subject
3. Receive actionable study insights immediately
4. **Without seeing** raw database information
5. **Without needing** to understand how analysis works
6. **Without confusion** about what to study next

**The Beta should feel like:**
- A study assistant, not a database viewer
- Confident, not tentative
- Actionable, not exploratory
- Student-focused, not admin-focused

---

**When ready to test**: Open http://localhost:3001 and follow the flow above.
