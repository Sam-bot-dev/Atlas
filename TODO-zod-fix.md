# Fix Zod ReferenceError: z is not defined on Render Deployment

## Problem
`backend/lib/ingestion/schema.js` fails on Render because backend deps (zod) not installed. Render startCommand cds to backend/ but skips `npm install`.

## Steps
- [x] Step 1: Updated render.yaml with npm install in startCommand (full rewrite to fix YAML)

- [x] Step 2: Updated backend/Dockerfile with backend npm ci in runner stage
- [x] Step 3: Local test passed - schema.js loads without zod error
- [ ] Step 4: Git commit/push for Render auto-deploy
- [ ] Step 5: Verify fix & complete

**All steps ready - push to Render!**

