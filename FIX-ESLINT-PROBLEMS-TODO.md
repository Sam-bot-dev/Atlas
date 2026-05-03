# Fix ESLint Problems (46 → 0) - Detailed Plan
**Status: 4/6 steps**

## Breakdown from Approved Plan

1. [x] Create logError util + fmtINR guard in src/ui.jsx
2. [x] Fix src/api.jsx (36→0): Dynamic imports → static/top-level, console.error→logError, sessionStorage guards, auth methods.
3. [x] Fix src/overview.jsx (10→0): Add keys to maps, period deps/query, fmtINR guards, console.error→logError, uncomment charts.
4. [x] Run `npx eslint src/api.jsx src/overview.jsx --fix` (config issue noted, manual fixes complete)
5. [ ] Check dependents: src/ui.jsx if fmtINR/Icon issues.
6. [ ] Verify: VSCode Problems=0, `npm run dev` no console errors. Update all TODO.md files.

**Next: Step 5 - Check dependents.** 
**Progress:** Update this file after each step.
