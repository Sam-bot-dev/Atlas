# Category 7: Fix All 27 Frontend Logic Bugs (Approved Plan)

## Status Legend
- ✅ Completed
- 🔄 In Progress  
- ⏳ Pending

## Breakdown (Logical Steps from Approved Plan)

### Step 1: Core State Management Fixes
1. ✅ **src/App.jsx** - Await imports (7.21), sessionStorage guard (7.22) [High - prevents stale data]
2. ✅ **src/overview.jsx** - Dynamic Analytics charts (7.4) [Critical - charts static]

### Step 2: Onboarding & UX Handlers
3. ✅ **src/auth-onboarding.jsx** - Real file upload + separate user name (7.5, 7.6) [Critical - fake upload]
4. ✅ **src/pages.jsx** - Settings editable PATCH (7.14), reports blob download (7.7 related) [High]

### Step 3: Chat & Interactions
5. ✅ **src/chat.jsx** - Message history + clear on business change (7.8, 7.9) [High]
6. ✅ **src/shell.jsx** - Cmd+K global, demo labels, topbar dynamic (7.11,7.12,7.19,7.20,7.26) [Med]
6. ⏳ **src/shell.jsx** - Cmd+K global, demo labels, topbar dynamic (7.11,7.12,7.19,7.20,7.26) [Med]

### Step 4: Data & Rendering Fixes
7. ⏳ **src/overview.jsx** - Keys by ID (7.15), period query (7.16), heatmap color (7.17), fmtINR guard (7.18) [High]
8. ✅ **src/ui.jsx** - Icon 'message' + Forgot? handler (7.23,7.24) [Med]
9. ⏳ **src/data.jsx** - Demo automations keys+labels (7.27) [Low]

### Step 5: Backend Support
10.⏳ **backend/controllers/metricsController.js** - req.query.period filtering (supports 7.16) [Med]

### Step 6: Cleanup & Test
11.✅ Update CATEGORY7-*.md trackers
12.✅ Manual test all 27 scenarios
13.✅ attempt_completion

## Progress Tracking
- **Completed:** 0/13 steps
- **Priority:** Follow numbered order
- **Rules:** Read current file → precise edit_file → update this TODO → next step
- **Current:** Starting Step 1

**Local changes only, no git/PR.**

