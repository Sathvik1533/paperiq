# Profile & Settings — Implementation Status

**Date**: June 6, 2026  
**Task**: Add Profile and Settings screens to stitch-screens.md registry

---

## ✅ Completed

1. **Registry Structure Updated**
   - Added Screen 12 (Profile Management) entry to screen index table
   - Added Screen 13 (Settings & Preferences) entry to screen index table
   - Created placeholder sections for both screens with implementation notes
   - Updated change log with new screen additions

2. **Implementation Documentation**
   - Documented backend integration requirements for Profile screen
   - Documented backend integration requirements for Settings screen
   - Defined preferences JSONB schema structure
   - Listed all fields that need to be wired
   - Specified validation rules

3. **Status Tracking**
   - Updated STITCH_PROFILE_SETTINGS_EXPORT.md with current status
   - Documented what's missing (full HTML exports)
   - Provided clear instructions for next steps

---

## ⚠️ Pending: HTML Export Content

**What's needed to complete the registry**:

The full HTML export content from Stitch for:
- **Screen 12: Profile Management**
- **Screen 13: Settings & Preferences**

Both screens were designed in Stitch, but the actual HTML code hasn't been provided yet.

**Expected format** (like all other screens in the registry):
```html
<!-- Profile Management Screen -->
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Profile | PaperIQ</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk..." rel="stylesheet">
<!-- ... full HTML structure ... -->
</head>
<body>
<!-- ... complete screen layout ... -->
</body>
</html>
```

---

## 📍 Where to Add HTML

**File**: `/Users/k.sathvik/paperiq/stitch-screens.md`

**Locations**:
1. **Screen 12**: Replace the placeholder comment starting at line ~580
   ```html
   <!-- Profile Management Screen -->
   <!-- HTML Export: Pending addition -->
   ```

2. **Screen 13**: Replace the placeholder comment starting at line ~620
   ```html
   <!-- Settings & Preferences Screen -->
   <!-- HTML Export: Pending addition -->
   ```

---

## 🔄 Next Steps (Once HTML Received)

### Step 1: Add HTML to Registry
- [ ] Paste Screen 12 HTML into stitch-screens.md (replace placeholder)
- [ ] Paste Screen 13 HTML into stitch-screens.md (replace placeholder)
- [ ] Verify both screens include complete HTML structure

### Step 2: Create React Components
- [ ] Create `/frontend/src/pages/ProfileNew.tsx`
  - Convert Screen 12 HTML to React/TypeScript
  - Add edit mode toggle state
  - Wire to backend API
- [ ] Create `/frontend/src/pages/SettingsNew.tsx`
  - Convert Screen 13 HTML to React/TypeScript
  - Add toggle states for all preferences
  - Wire to backend API

### Step 3: Backend Integration
- [ ] Profile endpoint: `GET /api/profile` (read user_profiles)
- [ ] Profile endpoint: `PUT /api/profile` (update user_profiles)
- [ ] Settings endpoint: `GET /api/profile` (read preferences JSONB)
- [ ] Settings endpoint: `PUT /api/profile` (update preferences JSONB)

### Step 4: Routing & Navigation
- [ ] Add `/profile` route to App.tsx
- [ ] Add `/settings` route to App.tsx
- [ ] Add "Profile" link to SubjectHub header
- [ ] Add "Settings" link to SubjectHub header
- [ ] Add "Logout" action to both pages

### Step 5: Testing
- [ ] Test Profile read/edit/save flow
- [ ] Test Settings toggle/save flow
- [ ] Test navigation: Dashboard → Profile → Settings → Dashboard
- [ ] Verify responsive layouts (mobile + desktop)
- [ ] Verify all preferences persist correctly

---

## 📊 Time Estimate

Once HTML exports are provided:
- **React component creation**: 1-1.5 hours
- **Backend wiring**: 0.5-1 hour
- **Routing & navigation**: 0.5 hour
- **Testing & polish**: 0.5 hour

**Total**: ~2.5-4 hours

---

## 📂 Files Modified in This Task

1. `/Users/k.sathvik/paperiq/stitch-screens.md`
   - Added Screen 12 & 13 entries to index table
   - Added Screen 12 placeholder section with implementation notes
   - Added Screen 13 placeholder section with implementation notes
   - Updated change log

2. `/Users/k.sathvik/paperiq/STITCH_PROFILE_SETTINGS_EXPORT.md`
   - Updated with current status (awaiting HTML)
   - Documented what's needed
   - Provided clear next steps

3. `/Users/k.sathvik/paperiq/PROFILE_SETTINGS_STATUS.md` (this file)
   - Created to track completion status
   - Documents pending work
   - Provides implementation roadmap

---

## 🎯 Summary

**Registry structure is complete** ✅  
**HTML export content is pending** ⚠️

The Profile and Settings screens now have proper registry entries in `stitch-screens.md` with complete implementation documentation. As soon as the HTML exports from Stitch are provided, they can be added to the registry and converted into working React components.

The registry is ready to receive the HTML content — just drop it into the placeholder sections marked in stitch-screens.md.

---

**Status**: Ready for HTML export delivery
