# Fix 700 Terminal Problems - Master TODO

## Goal: Zero VSCode problems + Complete CATEGORY7 bugs + Working Prisma seed

**Status: 0/12 steps**

### Step 1: Prisma Fix ✅
- [x] Deleted backend/prisma.config.ts 
- [x] `npx prisma generate` success
- [x] `npx prisma db push` sync
- [x] `node backend/prisma/seed.js` → ✅ COMPLETE: All 6 businesses seeded!

**Status: 2/12 steps**
**Next:** Step 3 src/shell.jsx fixes (7.12,7.19,7.20)



### Step 2-5: Frontend Fixes (CATEGORY7 pending)
- [ ] src/overview.jsx: insight/action keys=id (7.15), period query (7.16), heatmap color var() (7.17), fmtINR(undefined) guard (7.18)
- [ ] src/shell.jsx: TopBar bell dynamic (7.19), Pro trial dynamic (7.20), demo labels (7.12)
- [ ] src/ui.jsx: Icon 'message' (7.23)
- [ ] src/data.jsx: demo automations human strings→keys (7.27)

### Step 6: Backend Support
- [ ] backend/controllers/metricsController.js: req.query.period filter (7.16 support)

### Step 7: Verify
- [ ] Update CATEGORY7-*.md trackers as ✅
- [ ] `npm run dev` → no console errors, charts dynamic, etc.
- [ ] VSCode problems → 0
- [ ] attempt_completion

**Next:** Start Step 1 Prisma fix.
**Rules:** One logical step → read_file relevant → edit_file precise → update this TODO → next.

