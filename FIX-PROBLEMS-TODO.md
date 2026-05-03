# Fix 607 VSCode Problems - Detailed Plan
**Status: 1/8 steps - App.jsx syntax fixed (36→0 problems expected)**

## Breakdown from Approved Plan

1. [x] **Syntax fix src/App.jsx** (36→0): Move useEffect before return, merge duplicate JSX, extract hooks, add keys, fix dynamic imports.
2. [x] **Syntax fix src/pages.jsx** (571→0): Extract Tasks component, hoist exports, dedupe code, add imports, fix scopes.
3. [x] **Install ESLint deps**: `npm i -D eslint eslint-plugin-react eslint-plugin-react-hooks globals`
4. [x] **Create .eslintrc.js**: Basic React config + auto-fix.
5. [ ] **Run lint:fix**: `npx eslint src/**/*.jsx --fix`
6. [ ] **TODO CATEGORY7 fixes**: overview.jsx (7.15-7.18), shell.jsx (7.12,7.19,7.20), ui.jsx (7.23), data.jsx (7.27)
7. [ ] **Verify**: VSCode problems=0, `npm run dev` no errors, charts/dynamic features work.
8. [ ] **Complete**: Update all TODO.md files, attempt_completion.

**Next: Step 1 - App.jsx fixes.** Edit after reading dependent code if needed.
**Progress:** Update this file after each step.
