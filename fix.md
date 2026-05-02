# Atlas — Hackathon Fix List

> Full audit against `Project.txt`. Every gap, every stub, every missing feature.  
> Ordered by impact on winning. Fix the top items first.

---

## 🔴 CRITICAL — Breaks the core spec promise

### 1. Google Places API — Business Detection Is Fake

**File:** `backend/controllers/businessController.js` → `detectBusiness()`

The spec explicitly calls this out as a **"🔥 Innovation"** feature. The current implementation is pure keyword regex:

```js
if (/baker|bakery|cake|bread/.test(text)) category = 'Home Baker';
if (/cafe|coffee|tea/.test(text)) category = 'Cafe';
```

This is not Google Places. There is no `GOOGLE_PLACES_API_KEY` in `.env.example` (only `GOOGLE_VISION_API_KEY` which is for OCR). Judges will check this.

**Fix:**
- Add `GOOGLE_PLACES_API_KEY` to `.env.example`.
- Call `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` with the business name + address.
- Pull back: `name`, `formatted_address`, `types[]`, `rating`, `user_ratings_total`, `place_id`.
- Store `placeId` in the Business record (the DB column already exists).
- Show actual fetched rating and category in the Detection step of Onboarding — not hardcoded "FH" initials and a fixed "Home Baker".
- If no Places API key, fall back to the regex (label it as fallback in UI).

---

### 2. Frontend Reads Static `data.jsx`, Not the API

**Files:** `src/overview.jsx`, `src/pages.jsx`

The `Overview`, `Analytics`, and all dashboard pages read `business.metrics`, `business.insights`, `business.actions` directly from the prop. That prop ultimately comes from `ATLAS_BUSINESSES` in `data.jsx` — hardcoded static JSON — not from the backend API.

The API endpoints for metrics, insights, and actions all **exist and work** in the backend. They are just never called by the frontend after the initial business load.

**Fix:**
- In `Overview.jsx`, add `useEffect` hooks that call:
  - `AtlasAPI.metrics.summary(business.id, period)` → replace `business.metrics`
  - `AtlasAPI.insights.list(business.id)` → replace `business.insights`
  - `AtlasAPI.actions.list(business.id)` → replace `business.actions`
- Fall back to static data if API returns empty (for demo businesses that have no real DB records).
- Add loading skeletons while fetching.

---

### 3. The "Explain" Button Is Dead

**File:** `src/overview.jsx` → `InsightCard`

```jsx
<button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-3)' }}>
  Explain <Icon name="arrow-right" size={11}/>
</button>
```

There is no `onClick` handler. The backend has a working `explainInsight` endpoint at `GET /api/v1/businesses/:bizId/insights/:insightId/explain`. It is wired in routes. It is never called.

**Fix:**
- Add `onClick` to open a slide-over or modal with the full explanation.
- Call `AtlasAPI.insights.explain(business.id, insight.id)`.
- Display the explanation text and evidence array.

---

### 4. `/ask` Endpoint Is Not AI — It Returns a Stored Insight

**File:** `backend/routes/businessExtrasRoutes.js` → `POST /ask`

```js
const answer = insight
  ? `${insight.title}: ${insight.body}`
  : `${business.name} has ...`;
```

This returns the first row from the `insights` table as a string. It does not call Groq. It ignores the user's actual question entirely.

**Fix:**
- Wire this to Groq with a system prompt that includes business context (type, location, recent metrics).
- Pass the user's `query` field to the LLM.
- Use `llama-3.3-70b-versatile` (already in `.env.example`).
- If no Groq key, return a clear static fallback — not a fake "AI" answer.
- Add an "Ask Atlas" input field somewhere visible in the UI (sidebar or overview header).

---

### 5. Onboarding Doesn't Actually Register the User Properly

**File:** `src/auth-onboarding.jsx` → `Onboarding` component, `next()` function

```js
const email = bizName.replace(/\s+/g, '').toLowerCase() + '@example.com';
const user = await AtlasAPI.auth.signup({ email, password: 'password123', name: bizName });
```

The onboarding flow auto-generates `priyasbakes@example.com` with `password123` as the password. The user never sees these credentials. They cannot log back in after closing the tab.

**Fix:**
- Add a **Step 0 or Step 4** that collects `email` and `password` from the user before completing onboarding.
- Use those values in the `AtlasAPI.auth.signup()` call.
- After signup, store the JWT token and show a "Check your email" or "Account created" confirmation.

---

### 6. "Continue with Google" Button Throws an Error

**File:** `src/auth-onboarding.jsx` → `Login` component

```jsx
<button className="btn btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
  <Icon name="google" size={16}/>
  Continue with Google
</button>
```

There is no `onClick` handler on this button. The `AtlasAPI.auth.loginWithGoogle` method explicitly throws:
```js
loginWithGoogle: () => Promise.reject(new Error('Google login is not configured yet. Use email login.')),
```

If a judge clicks this button, nothing happens — the button is completely silent. This looks broken.

**Fix (Option A — real OAuth):** Implement Google OAuth using Passport.js on the backend with `passport-google-oauth20`.

**Fix (Option B — hackathon acceptable):** Add `onClick` that shows a `alert("Google sign-in coming soon — use email login below.")` or disable the button with a tooltip. Don't leave a dead silent button.

---

### 7. Reports Are Plain Text Files With No Content

**File:** `backend/routes/businessExtrasRoutes.js` → `GET /reports/:reportId/download`

```js
res.type('text/plain').send(`Atlas report for ${business.name}\nReport: ${req.params.reportId}\n`);
```

The spec calls for reports. The download endpoint sends two lines of plain text with the business name. The frontend "Export" button in Analytics does nothing either.

**Fix:**
- Generate a real JSON or Markdown weekly report using metrics + insights.
- Serve it as `application/json` or `text/markdown` with a proper `Content-Disposition` filename.
- Better: Use a library like `pdfkit` or `jsPDF` (frontend) to generate a downloadable PDF with the business's key metrics, top insights, and recommended actions.

---

## 🟡 IMPORTANT — Spec features listed but incomplete or missing from UI

### 8. Demo Businesses Don't Trigger the AI Pipeline

**File:** `backend/prisma/seed.js`

`seed.js` exists and creates demo business records in the DB. But the 6 demo businesses in the frontend (`data.jsx`) are standalone hardcoded objects that never connect to these DB records. When a judge clicks "Home Baker" on the landing page, they get `baker` from `ATLAS_BUSINESSES` — static JSON, not DB-fetched.

**Fix:**
- After seeding, save the seeded business IDs somewhere the frontend knows (or use fixed string IDs in seed).
- When `handleDemo('baker')` is called, either fetch from the API with the seeded ID, or ensure the static fallback data is rich enough and labeled as demo.
- The Groq insight generation should be triggered for demo businesses on seed so DB insights exist.

---

### 9. Upload Processing Has No Real-Time Status in UI

**File:** `src/pages.jsx` → `DataSources`

The file upload flow calls `AtlasAPI.uploads.upload()` and sets a `processing` state, but there is no polling loop to check `AtlasAPI.uploads.status()` until the job completes. The user has no idea if their file finished processing.

**Fix:**
- After upload, poll `AtlasAPI.uploads.status(business.id, uploadId)` every 2 seconds.
- Show a progress indicator: `Uploading → Extracting → Normalizing → Done`.
- On completion, refresh the metrics/insights panels automatically.
- Show the extracted record count: "Found 142 orders, 38 products".

---

### 10. Automation System Has No Frontend Trigger UI

**File:** `src/pages.jsx` → `Automations`

The Automations page likely shows a static list. The backend has `evaluateAutomations()`, `createAutomation()`, and `getSuggestedAutomations()` all implemented. The frontend never calls `AtlasAPI.automations.suggested()` or `AtlasAPI.automations.create()`.

**Fix:**
- Fetch and display suggested automations from `AtlasAPI.automations.suggested(business.id)`.
- Wire the "Enable" toggles to `AtlasAPI.automations.toggle()`.
- Show `lastRunAt` for each active automation.
- Add a "+ New Automation" button that calls `AtlasAPI.automations.create()` with a trigger/action pair.

---

### 11. Email & WhatsApp Notifications Are `console.log` Stubs

**File:** `backend/services/notificationService.js`

Both `sendEmailAlert` and `sendWhatsAppAlert` just print to the console. For a hackathon demo, if an automation triggers an alert, nothing visibly happens.

**Fix (minimum for hackathon):**
- Integrate [Resend](https://resend.com) (free tier, 100 emails/day, 2-minute setup) for email.
- Add `RESEND_API_KEY` to `.env.example`.
- On automation trigger → send a real email to the business owner's registered email.
- Show a "notification sent" toast in the UI when an automation fires.

---

### 12. Settings Page Has No Goal Persistence

**File:** `src/pages.jsx` → `Settings`

The goals selected in onboarding (Step 4) are saved to the DB via `AtlasAPI.settings.updateGoals()`. But the Settings page likely doesn't re-fetch or display current goals, and changes may not persist visually.

**Fix:**
- On Settings mount, call `AtlasAPI.settings.get(business.id)` and pre-fill the form.
- On save, call `AtlasAPI.settings.update()` and show a success toast.
- Make goal changes actually influence the insight/action priority (at least pass goals as context to Groq in `insightService.js`).

---

### 13. Login Form Has Hardcoded Demo Credentials

**File:** `src/auth-onboarding.jsx` → `Login`

```js
const [email, setEmail] = React.useState('demo@atlas.ai');
const [password, setPassword] = React.useState('password123');
```

These are pre-filled as default values in the input fields. Users see `demo@atlas.ai` and `password123` when they open the login form. This looks unpolished and exposes that the system is half-demo.

**Fix:** Set both initial states to `''`. Add a small "Demo account: demo@atlas.ai / password123" helper text below the form if you want judges to be able to log in with a pre-made account.

---

### 14. Missing Rate Limiting on Auth Endpoints

**File:** `backend/server.js`

No `express-rate-limit` or similar middleware on `/api/v1/auth/login` or `/api/v1/auth/signup`. Trivial to brute-force.

**Fix:**
```js
const rateLimit = require('express-rate-limit');
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
```

---

## 🟢 ADDITIONS — Features not in spec that would materially boost your winning chances

### 15. Add an "Ask Atlas" Chat Panel

**Why:** Every hackathon judge will ask "can I talk to it?" The `/ask` endpoint exists but is unreachable from the UI. A visible chat input transforms the demo moment.

**What to build:**
- A collapsible panel in the dashboard (bottom-right corner or sidebar footer).
- Input field: "Ask anything about your business…"
- On submit → call `AtlasAPI.ask(business.id, query)` (fix #4 first to make it real).
- Show the AI response inline with a typewriter effect.
- Pre-seed 3 example questions: "Why did revenue drop last week?", "Which product should I restock?", "What's my peak sales hour?"

---

### 16. Google Business / Weather Context in Insights

**Why:** The spec mentions `"Low noon activity due to high temperature patterns"` as an example insight. This is currently aspirational — the insight engine has no weather data. But it's one of the most impressive demo moments.

**What to build:**
- Call OpenWeatherMap API (free tier) with the business's city from its `address` field.
- Pass current/seasonal temperature to `insightService.generateInsights()` as context.
- The Groq prompt will naturally produce weather-correlated insights if you give it the data.
- Show a small weather badge on the Overview page: "📍 Pune · 38°C · Affects foot traffic".

---

### 17. Real PDF Report Download

**Why:** Tangible deliverable. Judges love downloadable output that demonstrates the system worked.

**What to build:**
- Frontend: use `jsPDF` + `html2canvas` to snapshot the Overview panel.
- Or: backend endpoint that builds a Markdown report → converts to PDF via `puppeteer` (if Render plan supports it) or `pdfkit`.
- Report should include: business name, date range, 6 metrics with deltas, top 3 insights, top 3 recommended actions.
- "Download weekly brief" button in Reports page.

---

### 18. Live Insight Regeneration After Upload

**Why:** The demo arc in the spec is: Upload data → System analyzes → Dashboard updates. Right now, uploading a file does not trigger insight/metric regeneration. The dashboard stays static.

**What to build:**
- In `uploadsController.js` → after `enqueueUploadJob()` completes normalization, call `generateInsights()` and `generateActions()` from the services.
- Frontend: after upload polling shows "Done", auto-refresh the Overview panel.
- This creates the **live demo moment**: upload a CSV → watch the dashboard update in real time.

---

### 19. Competitive Benchmark Badges

**Why:** Business owners always want to know "how do I compare?" It's a 30-minute addition that makes the product feel mature.

**What to build:**
- Hardcode (or Groq-generate) category benchmarks: average revenue, conversion rate, review score for each business type.
- Show a small badge next to each metric: "↑ Above average for Cafes" or "↓ Below Pharmacy average".
- Data can be static JSON — it doesn't need to be real-time industry data for a hackathon.

---

### 20. Mobile Responsiveness (Sidebar Collapse)

**Why:** Judges often demo on a laptop in presentation mode at non-standard resolutions. The sidebar may overflow.

**What to build:**
- Add a hamburger toggle to `TopBar` for viewports under 900px.
- Collapse the sidebar to icon-only on small screens.
- This takes ~1 hour and avoids embarrassing layout breaks during live demo.

---

### 21. Onboarding Progress Persistence (Refresh-Safe)

**Why:** If a judge refreshes mid-onboarding, all state resets to step 1. Annoying.

**What to build:**
- Save onboarding state to `sessionStorage` on each step change.
- On mount, restore from `sessionStorage` if it exists.
- Clear on completion.

---

## 📋 QUICK CHECKLIST

| # | Issue | File(s) | Priority |
|---|-------|---------|----------|
| 1 | Google Places API not integrated | `businessController.js` | 🔴 Critical |
| 2 | Frontend reads static data, not API | `overview.jsx`, `pages.jsx` | 🔴 Critical |
| 3 | "Explain" button has no onClick | `overview.jsx` | 🔴 Critical |
| 4 | `/ask` endpoint ignores the query | `businessExtrasRoutes.js` | 🔴 Critical |
| 5 | Onboarding uses fake auto-generated email | `auth-onboarding.jsx` | 🔴 Critical |
| 6 | "Continue with Google" is a silent dead button | `auth-onboarding.jsx` | 🔴 Critical |
| 7 | Reports download is 2 lines of plain text | `businessExtrasRoutes.js` | 🔴 Critical |
| 8 | Demo businesses not connected to DB/AI | `seed.js`, `data.jsx` | 🟡 Important |
| 9 | Upload has no real-time status polling | `pages.jsx` | 🟡 Important |
| 10 | Automation UI doesn't call backend | `pages.jsx` | 🟡 Important |
| 11 | Email/WhatsApp notifications are console.log | `notificationService.js` | 🟡 Important |
| 12 | Settings don't pre-fill or persist | `pages.jsx` | 🟡 Important |
| 13 | Login has hardcoded demo credentials | `auth-onboarding.jsx` | 🟡 Important |
| 14 | No rate limiting on auth routes | `server.js` | 🟡 Important |
| 15 | No "Ask Atlas" chat panel in UI | New component | 🟢 Add |
| 16 | No weather context in insights | `insightService.js` | 🟢 Add |
| 17 | No real PDF report download | New / `pdfkit` | 🟢 Add |
| 18 | Upload doesn't trigger insight regeneration | `uploadsController.js` | 🟢 Add |
| 19 | No competitive benchmark badges | `data.jsx` / `overview.jsx` | 🟢 Add |
| 20 | No mobile sidebar collapse | `shell.jsx` | 🟢 Add |
| 21 | Onboarding state lost on refresh | `auth-onboarding.jsx` | 🟢 Add |

---

## 🏆 Minimum to be competitive

Fix **#1, #2, #3, #4, #5** and add **#15**. These five fixes + the chat panel turn Atlas from a well-designed demo shell into a system that actually does what the pitch claims. Everything else is polish. Without these five, a judge who goes off-script (clicks Explain, asks a question, signs up properly) will immediately find the gaps.