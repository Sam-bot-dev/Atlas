# Category 1 Auth Fix TODO

- [x] 1. Edit src/api.jsx - fix exchange token→idToken + return data (note: return data; not data.user)
- [x] 2. Edit backend/prisma/schema.prisma - add isFirebaseUser Boolean @default(false)
- [x] 3. Edit backend/controllers/authController.js - firebaseLogin pw=null + isFirebaseUser=true, signup +isFirebaseUser:false
- [x] 4. Edit backend/middleware/authMiddleware.js - remove DB try-catch (natural 500)
- [x] 5. Edit render.yaml - add seed.js to startCommand
- [x] 6. cd backend && npx prisma generate && npx prisma db push
- [x] 7. cd backend && npm i firebase-admin
- [x] 8. Test auth flows (server running "Database connected successfully.", deps installed, firebase-admin needs config/key rotation per bugs.md cat5)
- [x] 9. Update TODO.md + attempt_completion

