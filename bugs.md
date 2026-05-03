# Atlas — Complete Bug & Issue Registry

> Deep analysis of the entire frontend + backend codebase cross-referenced against the product spec.
> Every issue listed with file location, exact line-level detail, and impact severity.

---

## 🔴 CRITICAL — App-Breaking

### 1. `App.jsx` — `Overview` is imported but NEVER rendered
The `Overview` component (the core "What/Why/Next" screen) is imported but **never mounted anywhere**. The render tree only mounts `<Pages .../>`  for the dashboard. `Pages` has no overview tab. Clicking "Overview" in the sidebar sets `page='overview'` in App state, but since `Pages` ignores that prop and always starts at `activeTab='analytics'`, the entire signature feature of Atlas is invisible.

### 2. `App.jsx` + `pages.jsx` — Sidebar navigation completely disconnected from Pages
App manages `page` state. Sidebar reads it as `active`. But `Pages` has its own internal `activeTab = useState('analytics')` that never reads from props. Clicking any sidebar item calls `setPage('overview')` etc. in App, but Pages ignores it and always starts at `analytics`. The `key={bizId + page}` trick just remounts Pages, resetting it back to `analytics` every single time.

### 3. `App.jsx` — `handleDemo` destructures incorrectly from `loadAtlasAPI` (TypeError crash)
```js
// loadAtlasAPI() already extracts and returns the AtlasAPI object:
const loadAtlasAPI = useCallback(async () => {
    const { AtlasAPI } = await import('./api');
    return AtlasAPI;  // returns the object directly
}, []);

// But handleDemo tries to destructure it again:
const { AtlasAPI } = await loadAtlasAPI();  // destructuring an object = undefined
await AtlasAPI.auth.login(...)              // TypeError: Cannot read properties of undefined
```
Every demo click crashes at runtime.

### 4. `charts.jsx` — LineChart Y-coordinate math bug (operator precedence)
```js
// Line 29 — actual code:
y: padT + innerH - ((d[yKey] || 0 - minY) / range) * innerH,
// JS parses as: d[yKey] || (0 - minY)  — subtracts minY from 0, not from the value
// Correct form:
y: padT + innerH - (((d[yKey] || 0) - minY) / range) * innerH,
```
Every LineChart renders at wrong Y-positions. High values appear low, trend lines are inverted.

### 5. `schema.prisma` — SQLite datasource missing required `url` field
```prisma
datasource db {
  provider = "sqlite"
  // url field is completely absent
}
```
`prisma generate` and `prisma migrate` fail. The app cannot connect to any database.

### 6. `authMiddleware.js` — `user` variable is an implicit global
```js
// Line 23 — no const/let/var declaration:
user = await prisma.user.findUnique(...)
```
Creates a global variable. In concurrent requests, one request can overwrite another request's `user`, potentially allowing auth bypass or cross-user data leakage.

### 7. `auth-onboarding.jsx` — Onboarding file upload calls non-existent API method
```js
const res = await AtlasAPI.uploads.create(bizName || 'New Business', formData);
// AtlasAPI.uploads only has: upload(bizId, file) — no .create() method
// Also: no bizId exists at this onboarding step (business not created yet)
```
File uploads in Step 2 always throw TypeError and fail silently.

### 8. `pages.jsx` — `AtlasAPI.metrics.downloadTemplate()` does not exist
```js
const res = await AtlasAPI.metrics.downloadTemplate(); // method not in api.jsx
```
"Template" button in Analytics crashes with an uncaught TypeError.

---

## 🟠 SERIOUS — Feature-Level Breakage

### 9. `overview.jsx` — MetricTile components defined but never rendered
`MetricTile` component is defined, `metricKeys` array is declared, but zero metric tiles appear anywhere in the Overview JSX. The 6 key metrics (revenue, orders, conversion, inventory, retention, sentiment) are never displayed as individual tiles — violating the spec's most basic "WHAT IS HAPPENING" requirement.

### 10. `overview.jsx` — `metricKeys` and `fallbackMetric` declared but never used
```js
const metricKeys = ['revenue', 'orders', 'conversion', 'inventory', 'retention', 'sentiment'];
const fallbackMetric = { value: 0, delta: 0, label: 'No data', unit: '', period: '' };
// Neither variable is referenced anywhere in the JSX
```
Dead code — the metric tile grid was never wired up.

### 11. `overview.jsx` — Forecast fetched but never displayed
```js
const [forecast, setForecast] = React.useState(null);
const [loadingForecast, setLoadingForecast] = React.useState(false);
// forecast is fetched and set, but there is zero JSX that renders it
// loadingForecast is set but never used in any skeleton or conditional
```
The ML prediction section required by the spec (Predicted demand, Stock risk, Expected growth) is completely absent from the UI.

### 12. `overview.jsx` — Period filter (1W/1M/3M/6M) does nothing for demo businesses
```js
if (!initialBusiness.id ||
    ['baker', 'retail', 'pharmacy', 'cafe', 'trade', 'service'].includes(initialBusiness.id)) return;
```
The useEffect that re-fetches on period change exits immediately for all 6 demo businesses. Time filter UI renders but has zero effect — terrible for judges testing the demo.

### 13. `overview.jsx` — `takeAction` from insight cards is broken in two ways
```js
const actionId = `insight-${insight.id}`;  // demo insights have no .id field → undefined
const res = await AtlasAPI.actions.apply(initialBusiness.id, actionId);
if (res.ok) { ... }  // res is the parsed JSON body, not a Response object. res.ok is always undefined
```
"Take Action" buttons on insight cards silently fail 100% of the time.

### 14. `pages.jsx` — Automations page shows nothing for demo businesses
```js
if (!business?.id || business.isDemo) {
    setLoading(false);
    return;  // exits immediately
}
```
All 6 demo businesses have `isDemo: true`, so judges see a completely empty automations page even though rich `automations` and `suggestedAutomations` data is defined in `data.jsx`.

### 15. `pages.jsx` — Reports "Generate report" button has no onClick
```jsx
<button className="btn btn-primary" style={{ marginTop: 16 }}>
    Generate report
</button>
```
Clicking does nothing. Reports page is completely non-functional.

### 16. `pages.jsx` — Tasks "Complete" button has no onClick
```jsx
<button className="btn btn-success btn-sm">Complete</button>
```
Tasks cannot be completed. `AtlasAPI.tasks.create` and `AtlasAPI.tasks.delete` are also absent from `api.jsx`.

### 17. `pages.jsx` — DataSources always shows "Connected" for all sources including "available" ones
The status badge text is hardcoded to "Connected" unconditionally. Source 4 (Inventory system) has `status: 'available'` but shows "Connected." Sources are hardcoded and never loaded from the API based on the actual business.

### 18. `pages.jsx` — DataSources `handleDrop` never resets and never uploads
```js
const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setProcessing('Processing...');
    // Never resets processing state and never calls any upload API
};
```
Dropping a file shows "Processing file..." forever with no upload.

### 19. `pages.jsx` — Analytics chart range filter has no effect on charts
Range selection fetches new `metrics` via API, but all charts use `initialBusiness.revenueSeries` (from props, not API). Selecting 7D vs 1Y shows identical charts.

### 20. `pages.jsx` — Analytics "Customer Growth" shows the oldest value, not current
```js
{(initialBusiness.customerGrowth || [])[0]?.v || '0'}
// [0] = first (oldest) entry. Should be: [...].at(-1)?.v
```

### 21. `chat.jsx` — API call sends wrong payload format
```js
const res = await AtlasAPI.insights.ask(business.id, { query, context: messages });
// ask signature: ask(bizId, query) where query is a plain STRING
// Backend receives: { query: { query: '...', context: [...] } } — doubly nested
```
Chat panel sends malformed requests. Backend receives a nested object instead of a string query.

### 22. `chat.jsx` — Messages state initialized twice (causes flash bug)
Messages are initialized in `useState` AND reset in `useEffect` with the same content. The two initial message objects differ (`timestamp` vs no timestamp), causing a re-render on every mount.

### 23. `businessController.js` — `updateBusiness` accepts arbitrary field overwrites (security hole)
```js
const updates = req.body;  // No whitelist, no validation
await prisma.business.updateMany({ data: updates });
```
A user can send `{ userId: 'victim-id' }` to steal another user's business, or set `{ isDemo: false }` on demo data.

### 24. `businessController.js` — `getBusinesses` passes `NOT: false` which is invalid Prisma syntax
```js
NOT: isDemoFilter && { isDemo: false },  // evaluates to NOT: false when no demo filter
```
Invalid Prisma query operator. Can throw or return unexpected results.

### 25. `automationsController.js` — Toggle status values mismatch between frontend and backend
Backend toggles: `'active'` ↔ `'disabled'`  
Frontend assumes: `'active'` ↔ `'paused'`  
After one toggle, state permanently diverges. Automation shows "Paused" but backend has "disabled", so the next toggle sends the wrong status.

### 26. `automationsController.js` — `addAutomation` has no ownership check
```js
const addAutomation = asyncHandler(async (req, res) => {
    const created = await createAutomation({ businessId: req.params.bizId, ... });
    // No check that bizId belongs to req.user.id
```
Any authenticated user can add automations to any business by guessing a bizId.

### 27. `mlService.js` — Anomaly insights get deleted by regular insight generation
```js
// detectAnomalies creates insight without setting type (defaults to "regular"):
await prisma.insight.create({ data: { businessId, title, body, severity, evidence } });

// saveInsights (called every insight generation) deletes all "regular" type:
await prisma.insight.deleteMany({ where: { businessId, type: "regular" } });
```
Every insight regeneration wipes all anomaly insights, defeating the anomaly detection system.

### 28. `api.jsx` — `AtlasAPI.metrics.summary` silently ignores `period` parameter
```js
summary: (bizId) => get(`/businesses/${bizId}/metrics`),  // period param not used
// Called as: AtlasAPI.metrics.summary(initialBusiness.id, period)
```

### 29. `api.jsx` — `AtlasAPI.metrics.peakHours` also ignores `period` parameter
Same pattern — the second argument is silently dropped.

---

## 🟡 MODERATE — Broken UX / Logic Errors

### 30. `overview.jsx` — Filter and Export buttons have no handlers
```jsx
<button className="btn btn-sm"><Icon name="filter" size={13}/> Filter</button>
<button className="btn btn-primary btn-sm"><Icon name="download" size={13}/> Export brief</button>
```
Both buttons are completely non-functional. Judges see no response on click.

### 31. `overview.jsx` — `handleExplain` sends `undefined` as insightId for demo data
Demo insight objects have no `id` field. `AtlasAPI.insights.explain(bizId, undefined)` calls `.../insights/undefined/explain` → 404. The catch shows `insight.body` — same text already visible in the card below.

### 32. `overview.jsx` — `apply()` makes live API calls for demo businesses with no guard
For demos, `AtlasAPI.actions.apply(bizId, 'action-0')` hits the real backend which has no such action. No demo mode detection exists in the apply flow.

### 33. `shell.jsx` — User dropdown opens but renders nothing
```js
const [open, setOpen] = React.useState(false);
// button toggles open(!open) — but there is no JSX conditional on `open`
```
Clicking the user avatar sets state but no dropdown menu appears.

### 34. `shell.jsx` — TopBar has 4 unused props (`query`, `setQuery`, `onAsk`, `onSwitch`)
These are declared in the function signature but never passed from `App.jsx`.

### 35. `pages.jsx` — Settings inputs fire API call on every keystroke (no debounce)
```jsx
onChange={async (e) => {
    await AtlasAPI.businesses.update(business.id, { name: e.target.value });
    onRefresh();
}}
```
Typing a 20-char business name = 20 PATCH requests + 20 full UI refreshes.

### 36. `pages.jsx` — Automations shows `auto.actionType` but demo data uses `auto.action`
For demo businesses (which skip the API), `auto.actionType` is undefined. The automation description renders blank.

### 37. `pages.jsx` — Suggested automations title is blank for all demo data
```jsx
<div style={{ fontWeight: 500 }}>{sugg.title}</div>
```
Demo `suggestedAutomations` objects have `{ trigger, action }` — no `title` field. All suggested automation cards show an empty title.

### 38. `metricsController.js` — `getMetrics` filters out metrics not updated recently
```js
where: { businessId, updatedAt: { gte: periodStart } }
```
Metrics created once and never touched disappear from the dashboard after the time window expires. New users lose their dashboard metrics progressively over time.

### 39. `metricsController.js` — Excel import overwrites with last row only
Each row in the Excel file updates the same business record. 5 rows for 5 businesses = only the last row survives. All previous rows' data is overwritten.

### 40. `metricsController.js` — Excel temp files never cleaned up
`multer` saves to `uploads/` directory. The import handler never calls `fs.unlink`. Files accumulate indefinitely.

### 41. `mlService.js` — `detectAnomalies` `evaluateAutomations` callback is never passed by callers
```js
async function detectAnomalies(businessId, evaluateAutomations) {
    if (evaluateAutomations) { await evaluateAutomations(...); }  // Never runs
}
```
Insight-triggered automation (core spec feature) never fires.

### 42. `actionsController.js` — Dismissed actions still appear on page refresh
```js
// deleteAction sets status: 'dismissed'
// getActions: findMany({ where: { businessId } }) — no status filter
```
"Dismissed" actions reappear after refresh.

### 43. `actionsController.js` — `confidence` stored as String but demo data uses Numbers
Schema: `confidence String @default("Medium")`. Demo data has numeric values (e.g., `88`). Real backend returns `"Medium"` strings mapped by frontend to fixed 70/90/50% — never granular values.

### 44. `auth-onboarding.jsx` — "Forgot password" is a dead link
```jsx
<a style={{ cursor: 'pointer' }}>Forgot?</a>  // no href, no onClick
```

### 45. `auth-onboarding.jsx` — Login has no Enter key handler on inputs
Standard UX failure. Users must click the button; pressing Enter does nothing.

### 46. `auth-onboarding.jsx` — Detection step shows hardcoded business details
```jsx
<span>WhatsApp orders + local delivery</span>
<span className="mono">₹80K–1.5L</span>
```
These are hardcoded strings, not from the API response. Every business detected shows the same channel and revenue estimate regardless of what was actually found.

### 47. `auth-onboarding.jsx` — "Smart detected" badge shows even when detection uses regex fallback
User can't tell if Google Places matched or if a generic regex guess was used.

### 48. `auth-onboarding.jsx` — Step 0 allows Continue with empty business name
No validation guard on the business name field before proceeding to detection.

### 49. `App.jsx` — Fallback defaults to Priya's Bakes for any real user business load failure
```js
business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']}
```
A real user whose business fails to load silently sees Priya's Bakes data as their own.

### 50. `App.jsx` — Session state restoration ignores real user bizIds
On mount, `apiBusinesses` is always `[]` (not yet fetched). The session restore check `allIds.includes(s.bizId)` only ever includes demo IDs. Real user saved bizIds are always discarded.

### 51. `App.jsx` — `apiBusinesses` refetches on every bizId change (unnecessary)
```js
useEffect(() => { AtlasAPI.businesses.list()... }, [view, bizId, loadAtlasAPI]);
```
`bizId` in the dependency array means every business switch triggers a full list refetch.

### 52. `businessController.js` — Business creation ignores `goals` from onboarding
```js
const { name, category, type, location, address } = req.body;
// goals destructured in onboarding POST but not in createBusiness handler
```
Goals selected in onboarding Step 3 are never persisted.

### 53. `insightService.js` — Monsoon month range is off by one
```js
const isMonsoon = month >= 6 && month <= 9;  // month 9 = October — post-monsoon
// Should be: month >= 5 && month <= 8  (June–September)
```

### 54. `insightService.js` — Bengaluru temperature check uses wrong spelling
```js
if (location.toLowerCase().includes('bangalore')) temp -= 5;
// Demo cafe is in "Bengaluru, Karnataka" — this match never triggers
```

### 55. `insightService.js` — LLM max_tokens may truncate multi-insight JSON
`max_tokens: 1024` for a response requesting 3-5 structured insight objects. 5 detailed insights at ~200 tokens each ≈ 1000 tokens. The JSON can be cut mid-array, causing a `JSON.parse` failure that silently falls back to generic insights.

### 56. `backend/lib/ingestion/worker.js` — `recoverQueuedUploadJobs` sets `stage: null`
```js
data: { status: 'queued', stage: null }
// stage is String (non-nullable) in schema — will throw Prisma validation error
```
Server crash recovery breaks on every restart.

### 57. `pages.jsx` — `Pages` component `key` prop unmounts ALL sub-page state on navigation
```jsx
<Pages key={bizId + page} />
```
Every sidebar click unmounts and remounts the full Pages tree. All user input, scroll position, and filter state is lost on every navigation.

---

## 🔵 MINOR — Polish & Quality Issues

### 58. `charts.jsx` — SVG gradient ID collision across multiple chart instances
```js
id={`grad-${accent.replace(/[^a-z0-9]/gi, '')}`}
// Two LineCharts with accent="var(--ink-1)" → both get id="grad-varink1"
```
The last chart's gradient overwrites earlier ones — all charts end up using the wrong gradient.

### 59. `overview.jsx` — Insight section subtitle hardcodes a potentially wrong signal count
```jsx
· Atlas connected the dots across {Object.keys(metrics).length} signals
```
For demo businesses where API is skipped, this reflects raw object key count which varies by business.

### 60. `overview.jsx` — Explanation modal shows same text as the insight card below it
The catch block fallback sets `answer: insight.body` — identical to what's already visible in the insight card. The "Atlas Reasoning" modal adds no value for demo mode.

### 61. `shell.jsx` — Sidebar Pro trial widget is hardcoded and non-functional
`"Trial active"` and the "Upgrade" button have no connection to subscription state. The Upgrade button has no onClick.

### 62. `shell.jsx` — Notification bell is permanently disabled
```jsx
{false && <span ... background: 'var(--negative)'/>}
// Hardcoded false — notifications can never appear
```

### 63. `pages.jsx` — Analytics `Orders by day` renders a raw sum with no label
```jsx
{(initialBusiness.ordersSeries || []).reduce((s, d) => s + (d.v || 0), 0)}
```
Renders "1458" with zero context. No unit, no time range label.

### 64. `pages.jsx` — DataSources `fileInputRef` is created but no `<input>` exists in JSX
Dead code. Would throw NullReferenceError if `fileInputRef.current?.click()` were triggered.

### 65. `pages.jsx` — Import error messages disappear in 2 seconds (too fast to read)
```js
setTimeout(() => setImportMessage(''), 2000);
```
Error messages with potentially long text vanish before users can read them.

### 66. `api.jsx` — Token stored in both `sessionStorage` and `localStorage` redundantly
`setToken` writes to both. `getToken` reads sessionStorage first. Source of truth is ambiguous and could leave stale tokens in localStorage after logout.

### 67. `data.jsx` — Business list `name` shows generic category, not actual business name
```js
{ id: 'baker', name: 'Home Baker' }   // actual: "Priya's Bakes"
{ id: 'retail', name: 'Retail Shop' } // actual: "Vrindavan Textiles"
```
Business Switcher and landing page show "Home Baker" instead of "Priya's Bakes" — undermines the realism.

### 68. `firebase.js` — Full Firebase config including API key hardcoded in source
```js
apiKey: "AIzaSyDzk23WQSZaZGhRY0KNzbY5SLzJoGCqNVg",
```
Firebase credentials committed to the repository.

### 69. `landing.jsx` — Demo credentials visible in hero copy
```jsx
<span>demo@atlas.ai / atlas123</span>
```
Login credentials shown in marketing copy. Undermines professional presentation.

### 70. `landing.jsx` — "Product" and "Demo businesses" nav links use `href="#"`
Adds `#` to URL on click. Only Pricing and Docs navigate correctly. Mixed patterns on the same nav bar.

### 71. `landing.jsx` — "8 data integrations" in social proof doesn't match 4 sources shown
Social proof bar says 8, DataSources page shows 4. Inconsistency visible on the same product.

### 72. `insightService.js` — Fallback insight only triggers outside ±15% revenue delta
If delta is between -15% and +15%, zero revenue insight is generated. Most normal business days produce no fallback insight at all.

### 73. `pages.jsx` — Both a sidebar AND an in-page tab bar exist for the same navigation
The sidebar lists: Overview, Analytics, Data sources, Automations, Reports, Settings.  
Pages renders its own tab bar: Analytics, Data Sources, Tasks, Automations, Reports, Settings.  
Two nav systems, both visible, neither fully functional.

### 74. `App.jsx` — `currentUser` set but never used beyond TopBar name display
User context (name, email, subscription) is fetched but not used for feature gating, personalization, or passed to any sub-pages.

### 75. `businessExtrasRoutes.js` — PDF generation blocks Node.js event loop
pdfkit's `doc.end()` is synchronous and CPU-heavy. Large reports freeze the server for all concurrent users during generation.

### 76. `schema.prisma` — `Business` has duplicate type/category fields doing the same job
Both `type` and `category` represent business type. Controllers use them interchangeably. Records frequently have mismatched values between the two fields.

### 77. `metricsController.js` — `getMetricSeries` returns empty for all real businesses
This endpoint reads `revenueSeries`, `ordersSeries` etc. from Business model fields. These are only ever written by the Excel import. Any business not using Excel import gets `[]` for all series — no charts ever render.

### 78. No CSRF protection on any endpoint
All state-changing endpoints (`POST`, `PATCH`, `DELETE`) lack CSRF token validation.

### 79. No rate limiting outside auth endpoints
`/businesses/:bizId/ask`, `/uploads`, `/insights` have no rate limiting and can be abused freely.

---

## ⚪ SPEC COMPLIANCE — Missing Required Features

### 80. No heat-based / contextual innovation features in UI
Spec: "Heat-based offers (Ahmedabad idea)", "Time-based pricing." These are mentioned in insight text for the cafe but there's no dedicated UI feature or interactive section showcasing this innovation.

### 81. No visible ML / prediction layer
Spec: "UI SHOULD SHOW: Predicted demand, Stock risk, Expected growth." The ML service computes linear regression forecasts, but zero UI shows the output. Judges see no evidence of ML.

### 82. No data source attribution on insights
Spec: "Show where data came from — 'Revenue derived from uploaded invoices'." Insight cards have evidence tags but no "data derived from [source name]" attribution line.

### 83. No "Data Processing Status" animation
Spec: "'Processing documents…' / 'Extracting insights…' — Makes AI feel real." The DataSources drop zone shows plain text "Processing file..." but no step-by-step animated status.

### 84. Goals selected in onboarding have no visible effect on dashboard priorities
Spec: "These should affect dashboard priorities." Goals are not persisted (bug #52) and even if they were, the insight/action ranking doesn't use them.

### 85. Onboarding only shows 2 of the required integrations
Spec: "MUST SUPPORT: Google Business, Square, Instagram, Shopify (+more)." Onboarding only offers Google Business and Square POS.

### 86. No tooltip / metric explanation system
Spec: "Tooltips — Explain metrics." No tooltip exists anywhere in the dashboard.

### 87. Reports page is completely empty
Spec: "AI-generated summaries." The backend has a PDF generation endpoint, but the Reports page shows "No reports yet." with a broken Generate button.

### 88. No Innovation showcase section in dashboard
Spec: "Put your Innovation Stack in a UI section." Landing page has a brief AI OCR callout but nothing inside the dashboard itself labels or showcases the AI layers.

### 89. Automations "Add" button in suggested automations does nothing meaningful
The Add button calls no API and has no confirmation flow. The automation is not persisted.

### 90. No search in Business Switcher
With many businesses, the modal list is unsearchable. Spec implies smooth switching as a key feature.

---

## 🔧 TECHNICAL DEBT

### 91. `src/demoData.jsx` is dead code — never imported anywhere
Leftover from an earlier version. Creates confusion about which data file is canonical.

### 92. 8 TODO/FIX planning files committed to the repository root
`CATEGORY1-TODO.md`, `CATEGORY7-FULL-TODO.md`, `CATEGORY7-PART2-TODO.md`, `CATEGORY7-TODO.md`, `TODO-zod-fix.md`, `TODO.md`, `FIX-PROBLEMS-TODO.md`, `FIX-ESLINT-PROBLEMS-TODO.md` — all visible in the repo.

### 93. Previous `bugs.md` (40KB) and `fix.md` (20KB) committed and visible
Internal debug history exposed in the repository root.

### 94. SQLite in production loses data on Render.com deployments
Render uses ephemeral disk by default. The SQLite file is wiped on every deploy. Persistent disk or PostgreSQL is required.

### 95. Uploaded files stored on local disk (not object storage)
`multer({ dest: 'uploads/' })` — files don't persist across Render restarts, don't work with multiple server instances, aren't backed up.

### 96. No input sanitization on the `/ask` LLM endpoint
User query is passed directly into the LLM system prompt. Prompt injection attacks are possible.

### 97. No error boundary on individual dashboard sections
`ErrorBoundary.jsx` exists at app level only. A single chart crash (from bug #4) takes down the entire dashboard instead of isolating the failure.

### 98. `api.jsx` — `auth.me` performs a token exchange on every app mount
Every page load calls `auth.me` → `auth.exchange` → backend POST. Unnecessary server load and potential race condition with multiple open tabs.

### 99. `insightService.js` — `askAtlas` assembles metricsMap differently from `generateInsights`
`askAtlas` passes `Metric[]` objects as a map. `generateInsights` passes pre-calculated summary values. The LLM sees inconsistent metric shapes depending on which path called `gatherBusinessContext`.

### 100. No `metrics/template` route on backend to serve the CSV template
`/public/metrics-template.csv` exists but is not served via any API route. The frontend calls a non-existent endpoint.

### 101. `overview.jsx` — API fetch results overwritten when `initialBusiness` prop changes
```js
React.useEffect(() => {
    setMetrics(initialBusiness.metrics || {});  // resets state from props
}, [initialBusiness]);
```
If the API fetch completed successfully and updated `metrics`, a prop change resets them back to the stale prop value. Data flash occurs on business switch.

### 102. `insightService.js` — `saveInsights` deletes "regular" type but anomaly insights also default to "regular"
This is detailed in bug #27 but bears repeating as a design flaw: two separate systems write to the same `type: "regular"` bucket, and one system nukes the other's data on every run.

### 103. `businessExtrasRoutes.js` — `/sources/:sourceId/sync` marks source as `complete` immediately without doing any sync
```js
data: { status: 'complete', meta: JSON.stringify({ lastSyncAt: new Date() }) }
```
"Sync" is a no-op that just updates a timestamp. No actual data is fetched or refreshed.

### 104. `pages.jsx` — `Automations` component defines `Toggle` as a nested component inside render
```jsx
const Toggle = ({ auto }) => { ... };
return (...)
```
Defining a component inside a render function causes it to be re-created on every parent render, destroying and re-creating the component (losing state) whenever the parent re-renders.

### 105. No `Content-Security-Policy` header on any backend response
The Express server sends no CSP headers, leaving the app open to XSS attacks via injected scripts.

### 106. `auth-onboarding.jsx` — Password field has no minimum length validation on the frontend
Only `if (!email || !password) alert(...)` is checked. A 1-character password is accepted and sent to the backend (which does have a min 8-char check, but the UI gives no guidance).

### 107. `App.jsx` — TweaksPanel (dark mode, density) is only available in `DEV` mode
```jsx
{import.meta.env.DEV && <TweaksPanel>...</TweaksPanel>}
```
Production users have no way to toggle dark mode even though the toggle is implemented. The feature is gated behind an env flag with no user-facing equivalent.

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical (app-breaking) | 8 |
| 🟠 Serious (feature-level breakage) | 21 |
| 🟡 Moderate (broken UX / logic) | 28 |
| 🔵 Minor (polish / quality) | 22 |
| ⚪ Spec compliance gaps | 11 |
| 🔧 Technical debt | 17 |
| **Total** | **107** |

---

## Priority Fix Order (for hackathon/demo day)

1. **Fix `Overview` never rendering** — core product premise is invisible
2. **Connect sidebar navigation to page rendering** — basic navigation broken
3. **Fix `handleDemo` destructuring crash** — demo entry point fails with TypeError
4. **Render 6 MetricTile components in Overview** — "What is happening" section empty
5. **Fix period filter for demo businesses** — time filter buttons do nothing
6. **Show forecast/ML prediction in UI** — ML spec requirement, currently invisible
7. **Fix demo mode automations** — remove `isDemo` early-return guard so demo data shows
8. **Fix chart Y-axis math bug** — all line charts render wrong data positions
9. **Fix `takeAction` (`res.ok` check on JSON response)** — Take Action silently fails
10. **Fix `chat.jsx` API payload format** — chat panel broken for all queries