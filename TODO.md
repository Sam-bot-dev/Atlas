## Atlas Mock DB Fix - Implementation TODO

### Status: 0/21 ✅ In Progress

**Phase 1: Schema & Seed (2 steps)**
- [x] ~~1. Update `backend/prisma/schema.prisma`: Add `isDemo Boolean @default(false)` to `Business` model~~ ✅
- [x] ~~2. Update `backend/prisma/seed.js`: Set `isDemo: true` for all 6 seeded businesses~~ ✅

**Phase 2: Backend CRUD (4 steps)**
- [x] ~~3. Create `backend/controllers/businessController.js`: Implement GET/POST/PUT/GET/:id for /businesses~~ ✅
- [x] ~~4. Create `backend/routes/businessRoutes.js`: Mount businessController~~ ✅
- [x] ~~5. Update `backend/server.js`: Add `app.use('/api/v1/businesses', businessRoutes)`~~ ✅
- [ ] 6. Add basic controllers for metrics/insights/actions (GET/POST list/create) to support persistence

**Phase 3: Frontend Data & Landing (4 steps)**
- [x] ~~7. Update `src/data.jsx`: Rename to `MOCK_BUSINESSES`, add `isDemo: true`~~ ✅
- [x] ~~8. Update `src/landing.jsx`: Add visible demo creds: "demo@atlas.ai / atlas123". Demo → demo mode~~ ✅
- [ ] 9. Update `src/App.jsx`: Track `isDemoMode`, separate demo/real business loading/switcher
- [ ] 10. Update `src/shell.jsx`: Demo badge, disable switcher/edit if demo. Welcome business for new users

**Phase 4: Dashboard Read-Only (3 steps)**
- [ ] 11. Update `src/overview.jsx`: Disable edit buttons/actions if `business.isDemo`
- [ ] 12. Update `src/pages.jsx`: Show "Upgrade to edit" CTA in demo mode
- [ ] 13. Update business switcher: Demo tab vs Real tab

**Phase 5: Auth & Onboarding Flow (3 steps)**
- [ ] 14. Update `src/api.jsx`: `demoLogin()` sets demo flag
- [ ] 15. Post-auth: If no businesses → auto-create welcome business → onboarding complete screen
- [ ] 16. Ensure new/existing users always get personalized (non-demo) dashboard

**Phase 6: Testing & Deploy (5 steps)**
- [ ] 17. `npx prisma generate && npx prisma db push`
- [ ] 18. `cd backend && npm run seed`
- [ ] 19. Test flows: Demo (read-only mock) vs Login (editable real) vs Signup (new welcome business)
- [ ] 20. Test edits persist for real businesses
- [ ] 21. Update render.yaml + deploy

**Next step:** Phase 3 step 8 → Add demo credentials to src/landing.jsx

*Completed steps will be marked ✅ and crossed out*

