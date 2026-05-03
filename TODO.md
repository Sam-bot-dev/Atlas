# Atlas Prisma Fix TODO

## Steps from approved plan:
- [x] 1. Edit backend/prisma/schema.prisma - remove invalid `url` line from datasource
- [x] 2. cd backend && npx prisma generate
- [x] 3. npx prisma db push
- [x] 4. Test: npm run dev (✓ DB connects "successfully", no Prisma schema errors; separate firebase-admin missing)
- [ ] 5. attempt_completion

