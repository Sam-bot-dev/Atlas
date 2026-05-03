# Atlas — Comprehensive Bug & Issue Report

> Deep audit of the entire codebase against the system spec. Every file read, every flow traced.  
> Issues are numbered and grouped by category. Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / Polish

---

## 1. CRITICAL BACKEND BUGS

### 1.1 🔴 Double metric/insight/action generation on every upload
`normalize.js` calls `calculateMetrics → saveMetrics → generateInsights → generateActions → detectAnomalies` at the end of `normalizeExtraction`. Then `worker.js → runUploadJob` calls **the exact same three functions again** immediately after `normalizeExtraction` returns. Every file upload generates metrics, insights, and actions **twice**. This floods the DB and doubles Groq API usage.

### 1.2 🔴 Prisma schema missing `url` field — app won't start
`backend/prisma/schema.prisma` datasource block only has `provider = "sqlite"` — the `url` field is completely absent. Prisma requires `url = env("DATABASE_URL")` or `url = "file:./dev.db"` to connect to any database. Without it, `prisma generate` and runtime queries both fail.

### 1.3 🔴 Demo user doesn't exist in database on a fresh deploy
`handleDemo` in `App.jsx` attempts `AtlasAPI.auth.login('demo@atlas.ai', 'atlas123')`. There is no seed script anywhere in the project. On any fresh deployment or after a DB reset, the demo login fails silently (falls back to local data) — but all subsequent API calls on the "demo" session will 401 because there's no real token.

### 1.4 🔴 `deleteUpload` deletes `DataSource` but never deletes `UploadJob`
`uploadsController.deleteUpload` runs `prisma.dataSource.delete({ where: { id: job.sourceId } })` and then tries to delete the file from disk. The `UploadJob` record is **never deleted**. It orphans in the DB pointing to a deleted `DataSource`, causing FK integrity issues and incorrect upload history.

### 1.5 🔴 `recoverQueuedUploadJobs` re-processes `processing` state jobs on restart without resetting stage
When the server crashes mid-job, jobs stuck in `status: 'processing'` are re-enqueued. `runUploadJob` doesn't reset `stage` before re-running, so the job runs from scratch while the DB stage is mid-pipeline. This causes duplicate `Order`, `Product`, `Customer`, `Review`, `InventoryItem`, and `TrafficPoint` rows being inserted again.

### 1.6 🔴 Demo business IDs are `'baker'`, `'retail'`, etc. — demo guard checks `.startsWith('demo-')`
Throughout `overview.jsx` and `pages.jsx`, the guard to skip API calls is `business.id.startsWith('demo-')`. But the actual demo IDs are `'baker'`, `'retail'`, `'pharmacy'`, `'cafe'`, `'trade'`, `'service'` — none start with `'demo-'`. This means **every demo page fires real API calls** that all 404 or 401, causing console errors on every demo visitor. The API fallback works, but the loading states flicker and errors are spammed.

### 1.7 🔴 `insightsController.getInsights` — unguarded `JSON.parse` crashes endpoint
`insights.map(i => ({ ...i, evidence: JSON.parse(i.evidence) }))` — if any `evidence` field is malformed (empty string, `undefined`, or corrupted), this throws and the entire insights endpoint returns 500. No try/catch, no safe fallback.

### 1.8 🔴 `metricsController.getMetricSeries` — arbitrary field access via user-controlled `req.params.metric`
The handler does `const key = \`${req.params.metric}Series\`` then accesses `business[key]`. A user can pass `metric=__proto__` or `metric=userId` and read arbitrary business model fields through the API response. This is an information disclosure vulnerability.

### 1.9 🔴 `mlService.detectAnomalies` creates insights that are immediately wiped
`detectAnomalies` calls `prisma.insight.create` directly. But `saveInsights` (called immediately after from `normalize.js`) does `prisma.insight.deleteMany({ where: { businessId } })` first. Any anomaly insights are deleted the moment regular insights are generated. The anomaly insight feature is entirely dead.

### 1.10 🔴 `automationsController.toggleAutomation` — no business ownership check
`toggleAutomation` looks up the automation by `autoId + bizId` but does **not** verify `businessId` belongs to `req.user.id`. Any authenticated user who guesses an automation ID can toggle another user's automations.

### 1.11 🔴 `automationsController.deleteAutomation` — same ownership bypass
Same issue as above. No user ownership check on delete. A user can delete another user's automation records.

---

## 2. HIGH-SEVERITY BACKEND ISSUES

### 2.1 🟠 `worker.js` in-memory queue — no concurrency or persistence
The job queue is `let queue = Promise.resolve()` — a simple promise chain in module memory. If the process has multiple concurrent upload requests, they serialize correctly. But if `recoverQueuedUploadJobs` is called while normal jobs are in-flight, the recovery chain is independent of the normal queue, so jobs can run concurrently and produce duplicate DB rows.

### 2.2 🟠 `normalize.js` — Products, InventoryItems, Reviews, TrafficPoints have no deduplication
`createRows` uses `prisma.createMany` with no `skipDuplicates`. The `Product`, `Review`, `InventoryItem`, and `TrafficPoint` models have **no unique constraints**. Uploading the same file twice doubles all records. `calculateMetrics` then double-counts revenue, orders, and sentiment.

### 2.3 🟠 `insightService` — `generateInsightsViaLLM` will crash if metrics keys are missing
The user prompt template directly accesses `context.metrics.revenue.value`, `context.metrics.orders.value`, etc. If any metric hasn't been calculated yet (new business before first upload), `context.metrics.revenue` is `undefined` and `.value` throws. There's no optional chaining or fallback.

### 2.4 🟠 Period parameter on `GET /metrics` is accepted but completely ignored
`getMetrics` fetches all metrics from the DB regardless of the `period` query param sent by the frontend. The time filter (1W, 1M, 3M, 6M) visible in the Overview UI has zero effect on what data is returned. This makes the period selector purely cosmetic.

### 2.5 🟠 `actionService` — `generateAdvancedActions` always inserts a seasonal strategy action
The "Season Strategy" action is added unconditionally at the end of `generateAdvancedActions`. This means every business always gets a generic "Monsoon Season Strategy: Adjust inventory for Monsoon season" action that is unconnected to any real data signal — exactly the kind of generic fluff the spec says must be avoided.

### 2.6 🟠 `insightService.saveInsights` and `actionService.saveActions` delete ALL history on every run
Both functions do `deleteMany({ where: { businessId } })` before inserting new records. Users lose all historical insight context. There's no way to see what insights changed between uploads or track resolved issues over time.

### 2.7 🟠 `notificationService.sendEmailAlert` — hardcoded unverified sender domain
The Resend integration sends from `alerts@atlas.ai`. Without DNS/domain verification in Resend, all emails will be rejected. There's no domain verification step or documentation.

### 2.8 🟠 `webhookService.dispatchWebhook` — no timeout on outbound fetch
A webhook to a slow or hanging URL blocks the entire Node.js event loop execution for that automation for an indefinite period. No `AbortController` / timeout is set.

### 2.9 🟠 `businessExtrasRoutes` — `settings/data-prefs` PATCH does not persist anything
The endpoint just echoes `req.body` back. Data preference settings (anonymize training, retain raw uploads) are never saved to the database. Users see a settings UI that silently discards their choices.

### 2.10 🟠 Reports are entirely fake — `GET /reports` returns hardcoded static data
The reports list endpoint always returns `[{ id: 'weekly', name: 'Weekly performance brief', status: 'ready' }]` regardless of what was generated. The `POST /reports` creates a real-looking response but persists nothing to the DB. The PDF download is real, but the "report list" is a permanent fiction.

### 2.11 🟠 `businessController.detectBusiness` — uses `GOOGLE_VISION_API_KEY` as fallback for Places API
`const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_VISION_API_KEY` — Vision API keys cannot authenticate Places API calls. If only Vision is configured, the Places lookup will fail with a 403 and silently fall back to the regex detector.

### 2.12 🟠 `authController.logoutUser` — logout is purely client-side, no server-side token invalidation
The backend `POST /auth/logout` just returns `{ success: true }`. JWTs are never blacklisted. A stolen token remains valid for 30 days after logout.

### 2.13 🟠 No rate limiting on any endpoint except `/auth`
Upload, insights generation, LLM chat, and business creation are all unprotected from abuse. A single authenticated user can trigger hundreds of Groq API calls per minute through batch uploads.

### 2.14 🟠 File MIME-type spoofing accepted
`detectFileType` in `detect.js` trusts the MIME type reported by multer (derived from the browser). A `.exe` renamed to `.pdf` will pass the multer `fileFilter` and be detected as `pdf`, then sent to `pdfParse`. This will throw an unhandled error that could expose stack traces.

### 2.15 🟠 `actions.confidence` field stored as `String` in DB but compared as number in frontend
`Action.confidence` is `String @default("Medium")` in the Prisma schema. `actionService` stores "High"/"Medium"/"Low". But the demo data in `data.jsx` sets confidence as integers (88, 82, 96). The `ActionCard` component handles both, but when coming from the real API, confidence bar widths will never exceed 90% (mapped from "High") and never show real percentages. The DB schema and service are inconsistent with the demo data shape.

### 2.16 🟠 `actionService` — `category` field on actions is never stored
Generated actions include `category: 'inventory'`, `category: 'marketing'`, etc. But the `Action` model has no `category` field and `createAction` doesn't persist it. The category is silently dropped, making filtering/grouping actions by type impossible.

### 2.17 🟠 `automationService.evaluateAutomations` — fallback email is a fake placeholder
Uses `'owner@business.com'` as the fallback if no user email is found. Real automation email alerts would be sent to this nonexistent address.

---

## 3. DATABASE & SCHEMA ISSUES

### 3.1 🟠 SQLite chosen for production deployment on Render without persistent volume
`render.yaml` deploys the backend but there is no `disk` volume configured. Render's ephemeral filesystem resets on every deploy. All user data, businesses, uploads, and metrics are **wiped on every deployment**. A PostgreSQL DB or Render Disk must be configured.

### 3.2 🟠 No database migration strategy — `prisma db push` used instead of `prisma migrate`
The project uses `prisma.config.ts` which suggests `prisma migrate`, but there are no migration files in `prisma/migrations/`. Schema changes cannot be safely applied to production databases. Any schema update will either fail or cause data loss.

### 3.3 🟡 `Product` model has no unique constraint — duplicates guaranteed across uploads
Re-uploading any CSV with the same products creates duplicate rows. `calculateInventoryHealth` counts all items including duplicates, inflating metrics.

### 3.4 🟡 `InventoryItem` model has no unique constraint — same problem
Duplicate inventory items mean `calculateInventoryHealth`'s percentage calculation is wrong whenever a file is re-uploaded.

### 3.5 🟡 `Review` model has no unique constraint — sentiment inflation from re-uploads
Average rating from `calculateSentiment` will be skewed by duplicate review rows.

### 3.6 🟡 `TrafficPoint` has no unique constraint — conversion rates double-count on re-upload
Re-uploading traffic data doubles visitor counts, making `calculateConversionRate` inaccurate.

### 3.7 🟡 `Order.externalId` unique constraint is `[businessId, externalId]` — but `externalId` defaults to empty string
If `externalId` is blank (from the fallback extractor), the fingerprint is generated. But two rows with the same blank externalId from different fallback runs for different rows won't be caught by this constraint.

### 3.8 🟡 `delta` for conversion, inventory, retention, and sentiment are all hardcoded to `0`
`calculateConversionRate`, `calculateInventoryHealth`, `calculateRetention`, and `calculateSentiment` all return `delta: 0`. These metrics never show trend direction in the UI. The spec requires showing whether things are improving or getting worse.

### 3.9 🟡 `Business.goals` stored as JSON string in a `String` field
SQLite doesn't support JSON columns natively. Goals are stored as `JSON.stringify(array)`. If `goals` is ever set to an invalid value (non-array), `JSON.parse` will throw in `getBusiness`. This has a `safeParse` guard in `getBusiness` but not in `getBusinesses`.

### 3.10 🟡 `prisma.config.ts` is a TypeScript file in a CommonJS backend
The entire backend uses CommonJS (`require`). `prisma.config.ts` uses ES module `import` syntax and TypeScript. This file will error if loaded by Node without a TypeScript/ESM transform step. It appears Prisma reads it separately, but it could cause confusion.

---

## 4. API CLIENT & ROUTE MISMATCHES

### 4.1 🟠 `api.jsx sources.list` calls `/businesses/:bizId/sources` — but business GET already returns `dataSources`
`DataSources` in `pages.jsx` calls both `AtlasAPI.uploads.list(business.id)` AND relies on `business.dataSources`. There's a redundant extra request. The `sources.list` call in the API client is never actually called in any component — it's dead API surface.

### 4.2 🟠 `api.jsx metrics.summary` sends a `period` param the backend ignores
As noted in 2.4, this makes the entire period filter a false promise.

### 4.3 🟡 `api.jsx automations.create` sends `{ trigger, action }` but backend expects `{ trigger, actionType }`
`addAutomation` in `automationsController` destructures `const { trigger, action } = req.body`. But the DB field is `actionType` and `createAutomation` expects `actionType`. The `action` from the frontend is passed through as `actionType: action`. This actually works, but the naming is confusing and undocumented.

### 4.4 🟡 `api.jsx` has no `put` helper — `upsertMetric` via `PUT /:key` is unreachable from the frontend
The API client only exposes `get`, `post`, `patch`, `del`, and `upload`. There's no `put()` function. The `PUT /metrics/:key` route is only callable manually or from server-side code — never from the frontend.

### 4.5 🟡 `api.jsx reports.download` — opens URL directly without the auth token
`window.open(...)` doesn't attach the `Authorization: Bearer` header. The download endpoint is protected by `protect` middleware, so the request will 401 in any browser that doesn't have a session cookie. The PDF download is broken for authenticated users.

### 4.6 🟡 `api.jsx auth.loginWithGoogle` rejects immediately with no UI for this state
Returns `Promise.reject(new Error(...))` unconditionally. The "Continue with Google" button calls this and will always throw — the error is caught with `alert()` which shows a generic message. The Google OAuth flow doesn't exist at all.

---

## 5. FRONTEND LOGIC BUGS

### 5.1 🟠 `Overview` — `business` state initialized once from props, never updated
`const [business] = React.useState(initialBusiness)` — no setter exposed. When the parent refreshes business data via `onRefresh`, the overview doesn't update because it's stuck on the initial prop. The `key={bizId + page}` forces a full remount as workaround, discarding all local state unnecessarily.

### 5.2 🟠 `App.jsx` — all real user businesses fall back to baker's demo metrics on initial render
In `allBusinesses`, when `apiBusinesses[biz.id]` doesn't match a demo key, `metrics` is set to `ATLAS_BUSINESSES.baker.metrics`. Real user businesses will momentarily (or permanently, if metrics API fails) show the baker's ₹94,800 revenue and 4.7 sentiment rating.

### 5.3 🟠 `ActionCard` — "Create task" button has no onClick handler
The "Create task" `<button>` inside `ActionCard` calls nothing. It should call `AtlasAPI.actions.createTask(business.id, action.id)`. The create-task-from-action backend endpoint exists but is completely unwired in the UI.

### 5.4 🟠 `ActionCard` — Dismiss/X button has no onClick handler
The dismiss button `<button className="btn btn-ghost btn-sm"><Icon name="x"/></button>` has no onClick. Should call `AtlasAPI.actions.dismiss(business.id, action.id)`.

### 5.5 🟠 `Overview` — Filter and Export brief buttons are dead UI
Both buttons render but have no onClick handlers. "Export brief" should generate/download a report. "Filter" should open a filter panel. They exist purely as visual decoration.

### 5.6 🟠 `Login` — "Forgot password" link is completely dead
The `<a>` element has no `href`, no `onClick`. Password reset flow is entirely missing.

### 5.7 🟠 `Login` — Demo credentials shown in plain text below the login form
`demo@atlas.ai / atlas123` are rendered inline in the production login UI. This looks unprofessional and exposes the fact that a trivially guessable shared account exists on the system.

### 5.8 🟠 `Login` — "Protected by SOC 2 Type II controls" is a false claim
This is a hackathon project. Displaying SOC 2 Type II compliance on a production-facing login page is legally problematic and a credibility risk if judges investigate.

### 5.9 🟠 `Onboarding` — Selected goals are never passed to `businesses.create`
In `next()` at step 4 (Account), the code calls `AtlasAPI.businesses.create({ name: bizName, category: bizType, address: bizAddr })`. The `goals` state array is collected but **not included** in the API call. Goal selection is entirely lost.

### 5.10 🟠 `Onboarding` — User's name is set to the business name
`AtlasAPI.auth.signup({ email, password, name: bizName })` — the user account's display name becomes the business name (e.g., "Priya's Bakes"). There's no field to enter the owner's personal name. The greeting in Overview shows `business.owner` but the user's name in the topbar will say "Priya's Bakes".

### 5.11 🟠 `Onboarding` — File upload is entirely fake (mock data only)
In step 2 (Data), clicking the upload zone appends `{ name: 'reviews-export.pdf', kind: 'pdf', size: '512 KB' }` to the `uploads` array — no actual file picker or upload call. Files are never sent to the backend. This is the core value proposition of the product (document upload) and it's simulated during onboarding.

### 5.12 🟠 `Onboarding` — After signup, files from step 2 and integrations from step 2 are discarded
Even if real files were uploaded in step 2, `onComplete(user)` is called without passing files or integration choices. The business is created with no data sources.

### 5.13 🟠 `Onboarding` — Step detection: when advancing from step 0, `detectBusiness` is always called even if user already detected
The logic runs `if (step === 0 && !detectDone) { setStep(1); ... }`. If user edits the business name after detection and clicks Next again, `detectDone` is still `true` so step 0 → step 2 is jumped, skipping the detection review screen.

### 5.14 🟠 `TopBar` — "Ask Atlas" (⌘K) and the FAB Chat button both open different interfaces for the same feature
`TopBar` has an `AskAtlas` modal. `App.jsx` also has a `ChatPanel` FAB. Both call `AtlasAPI.insights.ask`. These are two disconnected UI surfaces for the same feature — different history, different UX, no shared state.

### 5.15 🟠 `TopBar` — "Ask Atlas" modal can't be closed with Escape key
`AskAtlas` listens for `Enter` to submit but has no `keyDown` handler for `Escape` to close. The spec hints at ⌘K as the shortcut but there's no `useEffect` listening for keyboard shortcuts anywhere.

### 5.16 🟠 `TopBar` — Notification bell shows a permanent unread badge
The red dot on the bell icon is hardcoded — there's no notification system. Clicking the bell does nothing. This is dead UI that creates a false impression.

### 5.17 🟠 `Sidebar` — "Atlas Pro trial · 9 days remaining" is always hardcoded
Every user always sees "9 days remaining" regardless of their account age or plan. The "Upgrade" button goes nowhere. The pricing page exists but the upgrade flow is unimplemented.

### 5.18 🟡 `Analytics` page — all charts use `initialBusiness` static data, not API data
In `Analytics`, `revenueSeries`, `ordersSeries`, `customerGrowth`, and `topMovers` all read from `initialBusiness` prop (demo data). Even for real users, the charts never update — only the KPI numbers at the top fetch from the API.

### 5.19 🟡 `DataSources` page — Square POS, Instagram, Inventory are hardcoded "connected" mock entries
These three sources appear as connected for every single business regardless of what was actually set up. "Square POS: Synced 4 min ago" is hardcoded. This is the "label mock clearly" requirement from the spec — they're not labeled as mock.

### 5.20 🟡 `DataSources` — `simulateUpload` is triggered as error fallback, masking real upload failures
When a real upload returns 401 (unauthenticated), the component calls `simulateUpload('Login required...')` which runs fake progress animations making it look like processing succeeded. Users are misled into thinking their data was ingested.

### 5.21 🟡 `ChatPanel` — No conversation history is sent to the backend on each message
Every `ask` call only sends the current query. The LLM has no context of previous messages in the same chat session. Users who ask follow-up questions ("what about the margins?") get incoherent responses.

### 5.22 🟡 `ChatPanel` — Chat messages not cleared when switching businesses
If the chat panel is open and the user switches business, the conversation history from the previous business remains visible and the new query context is wrong.

### 5.23 🟡 `BusinessSwitcher` — Shows a mix of real API businesses and demo businesses with no visual distinction
Real user businesses and all 6 demo businesses are shown together in the switcher. A real user who has created 2 businesses sees their 2 plus 6 demo businesses — 8 total with no labels differentiating them. This is deeply confusing.

### 5.24 🟡 `App.jsx handleDemo` — outer function is `async` but `import().then()` is not awaited
`const handleDemo = async (id) => { import('./api').then(async (...) => { ... }); }` — the `await` inside `.then()` is fine, but the outer function is `async` and doesn't `await` the import. If the caller wanted to `await handleDemo(id)`, it would resolve immediately before the login completes.

### 5.25 🟡 `App.jsx` — `bizId` in sessionStorage can cause stale state on page reload
If a user had `bizId = 'pharmacy'` and then deleted that business, a reload would restore the stale `bizId`. `refreshBusiness` would 404 and silently fall back to the baker demo data.

---

## 6. UX / SPEC GAPS

*(Features explicitly required by the system overview that are missing or broken)*

### 6.1 🟠 No time-based filter effect on any metric
The spec requires "Last 7 days / 30 days" filters. The UI has them (1W, 1M, 3M, 6M) but the backend ignores the parameter entirely. All metrics are all-time regardless of selection.

### 6.2 🟠 "WHY it is happening" layer is generic when LLM is unavailable
The spec: "If this feels generic → you lose." The fallback `generateFallbackInsights` produces generic templates ("Revenue Growing Strong", "Low Stock Alert") with no connection to any specific data points. There's no graceful degradation that at least cites actual numbers from the business.

### 6.3 🟠 "Take Action" buttons on insight cards are missing
The spec explicitly requires each insight to have a "Take Action" button. `InsightCard` only has an "Explain" button. No direct action trigger exists from an insight.

### 6.4 🟠 No "Data Source Explanation" panel (where data came from)
The spec requires showing: "Revenue derived from uploaded invoices", "Customer sentiment from reviews." The `DataSources` page shows source names but no traceability between specific metrics and their source data.

### 6.5 🟠 No onboarding file upload actually works
The spec says: "MUST SUPPORT: A. Document Upload (PDFs, Images), B. Structured Upload (CSV)" as a core differentiator. The onboarding step 2 is entirely mocked. Judges who try to upload a real file during onboarding see nothing happen.

### 6.6 🟠 Business context awareness is minimal
The spec: "Different insights for: cafe vs pharmacy vs retail." The fallback insight generator is entirely type-agnostic. The LLM prompt includes business type but the fallback (which runs when no Groq key is set) produces identical insight templates for all business types.

### 6.7 🟡 Heat-based offers / weather-based actions not implemented as real features
The spec lists "Heat-based offers (your Ahmedabad idea)" as an Advanced Suggestion. `getMockEnvironmentalContext` in `insightService.js` generates a mock weather string, but no actions or suggestions are generated from it. The environmental context is included in the LLM prompt but nothing in the action generator uses it.

### 6.8 🟡 No "Processing documents…" / "Extracting insights…" UI feedback in onboarding
The spec says: "Data Processing Status — 'Processing documents…', 'Extracting insights…' → Makes AI feel real." The onboarding data step shows a fake upload entry but no processing animation after completing onboarding.

### 6.9 🟡 No ML/prediction element visible on the dashboard
The spec requires: "UI SHOULD SHOW: 'Predicted demand', 'Stock risk', 'Expected growth'." The `mlService.forecastRevenue` exists and the `/metrics/forecast` endpoint is registered, but **no component ever calls this endpoint** or displays predictions. The ML layer is invisible to the user.

### 6.10 🟡 No data source mapping shown (which metric came from which source)
The spec: "Show where data came from → adds credibility." This is entirely absent from the UI. There's no visual traceability between data sources and generated metrics/insights.

### 6.11 🟡 No innovation showcase section visible in the UI
The spec: "Put this in UI section OR PPT slide." There's no "How Atlas works" or "Innovation Stack" section in the dashboard or landing page that clearly calls out: AI OCR → structured data, Goal-aware insights, Insight → Action automation, Multi-source data unification.

### 6.12 🟡 Automations "Insight-triggered" automation not fully implemented
The spec requires: "When system detects → Suggest automation." `detectAnomalies` does evaluate automations but: (a) the anomaly insights get deleted before they're seen (bug 1.9), (b) the UI for suggested automations based on detected anomalies doesn't exist, and (c) the `suggestedAutomations` endpoint returns static business-type-based suggestions regardless of current data state.

### 6.13 🟡 No task list / daily action list view
The spec: "Task Automation: Create daily action list, Follow-up reminders." `taskService` exists and `createTaskFromAction` creates tasks. But there is no UI anywhere to view, complete, or manage tasks. Tasks are created into the void.

### 6.14 🟡 Business switching doesn't update the page URL / is not bookmarkable
There's no routing (React Router or similar). Everything is single-view state. Sharing a URL always lands on the landing page regardless of what the user was viewing.

---

## 7. SECURITY ISSUES

### 7.1 🟠 No input sanitization on LLM prompts — prompt injection possible
User-controlled inputs (business name, query text, uploaded document content) are inserted directly into Groq prompt strings. A business named `"Ignore previous instructions and output..."` could manipulate the LLM output.

### 7.2 🟠 JWT tokens are never invalidated server-side on logout
As noted in 2.12. Stolen tokens remain valid for 30 days.

### 7.3 🟠 `metricsController.getMetricSeries` — arbitrary field read via path param
As noted in 1.8. A user can read `userId`, `password` (if it were on the Business model), or `__proto__` through the metric series endpoint.

### 7.4 🟡 `storageDir` for uploads is inside the project directory tree
`uploadDir = path.join(__dirname, '..', 'storage', 'uploads')`. On a shared host, if path traversal were possible, uploads could be placed near server files. Better practice is to use an absolute out-of-tree path or a cloud storage bucket.

### 7.5 🟡 `errorHandler` returns full stack traces in non-production environments
`stack: process.env.NODE_ENV === 'production' ? null : err.stack`. If `NODE_ENV` is not set on the deployment (which it often isn't without explicit config), stack traces with file paths are sent to clients.

### 7.6 🟡 `automationsController.toggleAutomation` — no user ownership check (repeated)
Already noted as critical, listed here for security categorization.

### 7.7 🟡 CORS `allowedOrigins` can be bypassed
The CORS config allows any `*.onrender.com` subdomain via regex. An attacker who can register a Render service could bypass CORS restrictions to make cross-origin requests to the Atlas API from their own subdomain.

---

## 8. CODE QUALITY & MAINTAINABILITY

### 8.1 🟡 `authMiddleware.js` and `errorMiddleware.js` are separate files but read as concatenated
When catting both files, output shows they're properly separate. However, `module.exports = { protect }` line placement and the catch block in `authMiddleware.js` has a subtle double-throw issue: if any non-JWT error is thrown inside the try block (e.g., DB error sets `res.status(500)` and throws), the catch block re-sets `res.status(401)` and throws a different error, losing the original 500 status.

### 8.2 🟡 Every controller function re-checks business ownership independently
The pattern `prisma.business.findFirst({ where: { id: bizId, userId: req.user.id } })` appears 20+ times across controllers. A middleware-based `ensureBusiness` would centralize this — partial implementations exist in some files (`uploadsController`, `businessExtrasRoutes`) but are inconsistent across the codebase.

### 8.3 🟡 `App.jsx allBusinesses` merge logic is too aggressive — always overwrites real metrics with demo fallback
```js
metrics: ATLAS_BUSINESSES[biz.id]?.metrics || ATLAS_BUSINESSES.baker.metrics
```
If a real API business happens to share an ID with a demo key (e.g., user names their business ID 'baker' — unlikely but possible via Prisma CUID), their real metrics would be overwritten by demo data.

### 8.4 🟡 `Overview.jsx` uses index as React key for insights and actions
`insights.map((ins, i) => <InsightCard key={i} .../>)` — using array index as key causes React reconciliation bugs when the list reorders (which it does, since insights are re-generated and could come in different order).

### 8.5 🟡 `insightService.askAtlas` uses only the last 2 insights as context
`business.insights.slice(0, 2).map(i => i.title).join(', ')` — with 3-5 insights generated, the chat context is severely truncated. "Recent Insights" in the prompt may not include the most relevant one.

### 8.6 🟡 `fallbackExtractor.fromRows` adds every row to potentially 4 collections simultaneously
A single CSV row that has `orderId`, `productName`, `customerName`, `rating`, and `stock` will be pushed to orders, products, customers, reviews, AND inventory. One row = 5 records. Normalize metrics will then over-count everything.

### 8.7 🟡 `metricService.calculateRetention` uses `allCustomers.length || 1` division guard
If `allCustomers.length` is 0, division by 1 gives 0% retention, which is correct. But `ordersCount > 1` — customers from fallback extraction default to `ordersCount: 0` (from CSV rows without an orders count column), so virtually all customers look like first-timers even if they've ordered multiple times.

### 8.8 🟡 No `.env.example` file
There is no `.env.example` listing required environment variables (`JWT_SECRET`, `DATABASE_URL`, `GROQ_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_VISION_API_KEY`, `RESEND_API_KEY`, `FRONTEND_URL`, `UPLOAD_DIR`). New developers have no documentation of what's needed.

### 8.9 🟢 `handleDemo` in `App.jsx` is `async` but the import promise is not awaited
Minor: The function is marked async but doesn't await the dynamic import. Should use `await import(...)` or remove the `async` keyword.

### 8.10 🟢 `backend/package.json` has `"main": "index.js"` but entry point is `server.js`
The `main` field points to `index.js` which doesn't exist. Not a runtime bug (nothing reads `package.json` main at runtime for this setup) but would break tools that use this field.

### 8.11 🟢 `prisma.config.ts` uses ES module imports in a CommonJS project
This file has `import "dotenv/config"` and `export default defineConfig(...)`. The rest of the backend is CommonJS. Even if Prisma handles this file in isolation, having mixed module syntax in the same project directory creates confusion.

### 8.12 🟢 `src/data.jsx` exports `ATLAS_BUSINESSES` and `ATLAS_BUSINESS_LIST` from local constants `BUSINESSES` and `BUSINESS_LIST`
The constant is named `BUSINESS_LIST` locally but exported as `ATLAS_BUSINESS_LIST`. Minor naming inconsistency but adds confusion when reading.

---

## 9. LANDING PAGE & DEMO EXPERIENCE GAPS

### 9.1 🟠 "One-click demo entry" — clicking a demo business card triggers API login, not instant access
Per the spec: "One-click entry, No friction." But `handleDemo` attempts a real login API call. On a cold backend, this takes 1-2 seconds and can fail. There's no optimistic instant transition to the dashboard.

### 9.2 🟠 No "Data source explanation" visible anywhere on landing or dashboard
The spec says to show "Connected: Document upload ✔️, Inventory ✔️, Google Business ✔️, Mock: Instagram (mock), CRM (mock)" with clear mock labels. The landing page doesn't showcase this at all. The DataSources page shows it but without "MOCK" labels.

### 9.3 🟡 No visible ML / prediction element in the demo experience
Judges will not see `forecastRevenue` results anywhere in the UI. The MLService exists but is invisible.

### 9.4 🟡 The "Innovation Stack" is not called out in the UI
The spec says to explicitly surface: "AI OCR → structured data, AI reasoning (WHY layer), Goal-aware insights, Insight → Action automation." None of these are displayed or explained in the running app.

---

## 10. SUMMARY COUNT

| Severity | Count |
|----------|-------|
| 🔴 Critical | 11 |
| 🟠 High | 38 |
| 🟡 Medium | 35 |
| 🟢 Low / Polish | 5 |
| **Total** | **89** |

---

## TOP 10 MUST-FIX BEFORE DEMO (Priority Order)

1. **Fix demo ID guard** (`startsWith('demo-')` → check `['baker','retail','pharmacy','cafe','trade','service'].includes(id)`) — affects every demo visitor
2. **Add a DB seed script** for the demo user (`demo@atlas.ai / atlas123`) — demo login is broken on any fresh deployment
3. **Fix double metric/insight generation** in `worker.js` vs `normalize.js` — inflates all data
4. **Wire "Create task" and "Dismiss" buttons** in `ActionCard` — dead primary action buttons are embarrassing
5. **Pass `goals` to `businesses.create`** in onboarding — core personalization feature silently dropped
6. **Show forecast predictions somewhere in the UI** — the MLService exists but is completely invisible
7. **Add "Take Action" button on InsightCard** — explicitly required by spec
8. **Fix `reports download` to include Auth header** — PDF export is broken for all real users
9. **Add `DATABASE_URL` to Prisma schema** or document that `lib/prisma.js` handles it — schema won't compile
10. **Remove SOC 2 Type II claim from login page** — false credibility claim
