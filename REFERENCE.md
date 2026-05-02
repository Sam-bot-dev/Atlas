# Atlas — Master AI Reference

> Living document. Every AI session: read this first, append to Work Log at end, update Pending section.
> Last updated: 2026-05-02

---

## What is Atlas

AI Business Decision Assistant for Indian SMBs. Ingests raw data (POS exports, PDFs, Google Business, Instagram, etc.), runs OCR + LLM extraction pipeline, then surfaces three answers on a dashboard:

1. **What is happening** — 6 KPI tiles + revenue chart + spending mix donut + peak-hours heatmap
2. **Why it is happening** — AI-generated insight cards with evidence tags
3. **What to do next** — prioritised action cards with impact / effort / confidence

Six demo businesses ship with the prototype. All content is India-localised (₹ INR, Indian names, cities, seasonal references).

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | React 18 + Vite |
| Entry point | `index.html` → `src/main.jsx` |
| Styling | Pure inline styles + CSS custom properties (`src/styles.css`) |
| Charts | Hand-rolled SVG (no library) — `src/charts.jsx` |
| State | React `useState` only; session persistence via `sessionStorage` |
| API | All stubs — `src/api.jsx` exports `AtlasAPI` with Promise-returning functions |
| Cross-file sharing | Standard ES Modules (`import`/`export`) |
| Dev server | `npm run dev` |
| Build tool | `npm run build` |

---

## File Map

```
src/
  main.jsx            — Entry. Mounts App component.
  App.jsx             — Main application router and state manager. Defines TWEAK_DEFAULTS.
  styles.css          — CSS vars (light + dark), base resets, utility classes.
  api.jsx             — AtlasAPI stub. All backend endpoints as Promises. Swap API_BASE + getToken() for real backend.
  data.jsx            — 6 Indian demo businesses. ATLAS_BUSINESSES + ATLAS_BUSINESS_LIST exports.
  ui.jsx              — Icon, AtlasLogo, Delta, BizAvatar, fmtINR, fmtCurrency, fmtNumber, SectionHeader, severityStyle.
  charts.jsx          — LineChart, BarChart, DonutChart, HeatmapChart. All SVG, ResizeObserver for responsive width.
  landing.jsx         — Landing page: hero, social proof strip, 3 pillars, demo grid, How It Works, footer.
  auth-onboarding.jsx — Login + 4-step Onboarding (Business → Detection → Data → Goals).
  shell.jsx           — Sidebar, TopBar, AskAtlas modal, BusinessSwitcher modal.
  overview.jsx        — Overview page: MetricTile, InsightCard, ActionCard, Overview (the main dashboard).
  pages.jsx           — Analytics, DataSources, Automations, Reports, Settings pages.
  pricing.jsx         — PricingPage (Starter / Pro / Scale tiers, FAQ accordion).
  docs.jsx            — DocsPage (API reference, quickstart).
  tweaks-panel.jsx    — TweaksPanel floating UI + all Tweak* controls + useTweaks hook.
```

---

## App State (App.jsx App component)

```js
view    // 'landing' | 'login' | 'onboarding' | 'dashboard' | 'pricing' | 'docs'
bizId   // 'baker' | 'textiles' | 'pharmacy' | 'cafe' | 'exports' | 'interior'
page    // 'overview' | 'analytics' | 'sources' | 'automations' | 'reports' | 'settings'
tweaks  // { density, sharpEdges, showAtlasGreeting, theme }
```

State persisted to `sessionStorage` key `'atlas-state'` on every change.

---

## Data Model (`src/data.jsx`)

Each business in `ATLAS_BUSINESSES`:

```js
{
  id, name, type, location, initials, color,   // identity
  owner,                                         // used in greeting: "Good morning, {owner}"
  peakHours: number[7][12],                      // 7 days × 12 hours (8am–7pm), values 0–100
  metrics: {
    revenue:    { value, delta, label, unit:'₹', period },
    orders:     { value, delta, label, period },
    conversion: { value, delta, label, unit:'%', period },
    inventory:  { value, delta, label, unit:'%' },
    retention:  { value, delta, label, unit:'%' },
    sentiment:  { value, delta, label, unit:'/5' },
  },
  revenueSeries:  [{ m, v }],      // 7 months
  ordersSeries:   [{ d, v }],      // 7 days
  customerGrowth: [{ m, v }],      // 7 months
  topMovers:      [[name, units, delta], ...],  // 5 items for analytics table
  spendingMix:    [{ label, value, color }],    // donut chart
  insights:       [{ title, body, evidence[], severity }],
  actions:        [{ title, body, impact, effort, confidence, urgent? }],
  automations:    [{ id, trigger, action, status, last }],
  suggestedAutomations: [{ trigger, action }],
}
```

Six businesses: `baker` (Priya's Bakes, Pune), `textiles` (Vrindavan Textiles, Surat), `pharmacy` (Swasthya Medicals, Ahmedabad), `cafe` (Chai Trunk, Bengaluru), `exports` (Bharat Global Exports, Mumbai), `interior` (Skyline Interiors, Gurugram).

`ATLAS_BUSINESS_LIST` = `[{ id, name, desc }]` — used in landing demo grid + business switcher.

---

## Design System

### CSS Variables (styles.css)

```
--bg, --bg-elevated, --bg-subtle, --bg-hover, --bg-tinted
--border, --border-strong, --border-subtle
--ink-1 (primary) … --ink-5 (faintest)
--accent (#1c1917 light / #f0eeeb dark), --accent-ink
--brand (#4f46e5 indigo), --brand-deep, --brand-soft, --brand-tint, --brand-ink
--aurora (#0d9488 teal), --aurora-soft
--ember (#ea580c orange), --ember-soft
--rose, --rose-soft, --gold, --gold-soft
--positive/negative/warning/info + -soft variants
--shadow-xs/sm/md/lg, --radius-xs/sm/md/lg/xl
--font-sans (Geist), --font-mono (Geist Mono), --font-serif (Instrument Serif)
--topbar-bg  ← use this for sticky nav backgrounds (dark-mode aware)
```

Dark mode: apply `.dark` class to root div. All vars override via `.dark { ... }` in styles.css.

### Utility classes
`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-brand`, `.btn-sm`, `.btn-lg`
`.card` — elevated surface with border + shadow
`.input` — text input
`.badge`, `.badge-positive/negative/warning/info/brand/aurora/ember/rose/gold`
`.dot`, `.dot-positive/negative/warning/neutral`
`.eyebrow` — mono uppercase label
`.mono`, `.serif`
`.text-gradient` — beautiful text gradient for hero typography
`.brand-glow` — subtle radial gradient for backgrounds
`.brand-grid` — grid background for sections
`.fade-in` — 240ms fade+slide entrance animation
`.pulse-live`, `.processing-pulse`
`.dark` — dark mode root class

### Format helpers (ui.jsx)
```js
fmtINR(v)      // ₹94,800 / ₹1.28L / ₹3.24 Cr
fmtCurrency(v) // alias for fmtINR
fmtNumber(v)   // en-IN locale number
```

### Charts
- `LineChart({ data, height, accent, xKey='m', yKey='v', showAxis, fill })`
- `BarChart({ data, height, accent, xKey='d', yKey='v', showAxis })`
- `DonutChart({ data, size, thickness })` — data items need `{ label, value, color }`
- `HeatmapChart({ data, accent, accentHex })` — data is `number[7][12]`
- All charts use `useMeasure` (ResizeObserver) for responsive SVG width
- Y-axis labels use Indian notation: `k / L / Cr`

---

## Key Patterns & Conventions

**ES Modules**: Standard React + Vite setup. Use `import` and `export`.

**Inline styles only**: No CSS classes for layout/component-specific styles. CSS custom property variables are always used via `var(--name)`.

**Component naming**: PascalCase React components. File-local helpers are camelCase.

**Key prop on page switches**: `<PageComponent key={bizId + page}/>` — forces remount on business or page change.

**Tweaks system**: `useTweaks(TWEAK_DEFAULTS)` in App. `TWEAK_DEFAULTS` is the `/*EDITMODE-BEGIN*/.../*EDITMODE-END*/` block — the tweaks-panel host can rewrite it live. Current tweaks: `density`, `sharpEdges`, `showAtlasGreeting`, `theme`.

**Dark mode**: `tweaks.theme === 'dark'` adds `dark` class to root div. All components auto-adapt via CSS vars.

**API stubs**: `AtlasAPI.someMethod(...)` returns a Promise. Currently all are fetch() calls to `/api/v1/...` that will 404. To wire real backend: set `API_BASE` and implement the server. Components currently use `setTimeout` mocks inline.

**Simulation pattern** (used in DataSources + AskAtlas):
```js
setTimeout(() => setProcessing('Step 1'), 0);
setTimeout(() => setProcessing('Step 2'), 1200);
setTimeout(() => setProcessing(null), 3600);
```

---

## Backend Integration Guide

`api.jsx` is the complete API surface. To connect real backend:
1. Set `API_BASE = 'https://your-api.com/api/v1'`
2. Replace `getToken()` session storage key with your auth flow
3. Each component that uses `setTimeout` mock: swap for `AtlasAPI.method(...).then(...).catch(...)`
4. Key endpoints needed first: `auth.login`, `businesses.list`, `metrics.summary`, `insights.list`, `actions.list`

The `upload` pipeline: `AtlasAPI.uploads.upload(bizId, file)` → poll `AtlasAPI.uploads.status(bizId, uploadId)` until `status === 'complete'`.

---

## Pending / To-Do

### Must-do before backend integration
- [ ] Wire AtlasAPI calls in components — replace all `setTimeout` mocks
- [ ] Auth flow: real JWT + refresh token handling in api.jsx
- [ ] Error states: components need loading/error/empty UI (currently only happy path)

### Feature gaps
- [ ] Dark mode polish — some inline `rgba(255,255,255,...)` hardcodes won't adapt; audit needed
- [ ] Analytics category filter: currently single "All categories" option; needs `business.categories` array in data.jsx and dynamic options
- [ ] Mobile/responsive: not yet implemented; sidebar collapses needed at ~768px
- [ ] AskAtlas: wire to real `AtlasAPI.ask(bizId, query)` — currently `setTimeout` mock
- [ ] Reports: "Generate report" and "Download PDF" buttons are stub UI only
- [ ] Automations: toggle works locally but not persisted; "New automation" is stub
- [ ] Settings: form inputs are uncontrolled / not wired to save

### Nice-to-have
- [ ] Pricing page: INR prices (currently USD $49/$99) — needs `₹999/₹2,499` + GST note
- [ ] Docs page: content is generic; needs India-specific integration examples (Razorpay, Shiprocket, Zoho Books)
- [ ] Onboarding step 1 detection card: "initials" avatar hardcoded to 'FH' — should derive from bizName

### Known issues
- `TweakSection` in tweaks-panel.jsx uses `label` prop but App.jsx calls it with `title` prop — works because it just renders the value, but inconsistent naming.

---

## Work Log

### Session 1 (2026-05-02) — claude-sonnet-4-6

**Completed:**
- Full India localisation of `data.jsx` — 6 Indian businesses with ₹ metrics, Indian names/locations, India-specific insights (Diwali, monsoon, WhatsApp orders, Swiggy/Zomato, JNPT congestion, USD/INR hedging)
- `styles.css` — added `--topbar-bg` CSS var, full `.dark` class with all variable overrides, `@keyframes spin`, `processingPulse`, `.heatmap-cell:hover`
- `charts.jsx` — added `HeatmapChart` (7×12 SVG grid, hex→rgba per intensity, hover tooltip); updated Y-axis labels to Indian notation (L/Cr); DonutChart total/legend values use `fmtINR`
- `overview.jsx` — dynamic time-aware greeting using `business.owner`; stateful period picker; peak hours heatmap card; revenue + spending values use `fmtINR`; MetricTile checks `unit === '₹'`
- `landing.jsx` — social proof strip (4 metrics); How It Works 4-step section with connector line; innovation callout strip; fixed conflicting `marginTop`/`margin` footer bug; nav + footer use `var(--topbar-bg)`; footer updated to Indian entity
- `pages.jsx` — DataSources: drag-over visual state, 3-phase processing simulation, file type badges; Analytics: top movers table uses `business.topMovers` dynamically, revenue uses `fmtINR`, counts use `en-IN`
- `auth-onboarding.jsx` — AI detection loading state (2.2s spinner + pulsing badges); default business name/address/revenue updated to Indian values; login email updated
- `shell.jsx` — AskAtlas has business-type-specific sample questions (6 sets); TopBar uses `var(--topbar-bg)`
- `api.jsx` — created from scratch: complete API client with all endpoints stubbed as Promises; `window.AtlasAPI`
- `ui.jsx` — added `fmtINR` helper (L/Cr notation), updated `fmtCurrency` as alias, both exported to `window`; `fmtNumber` uses `en-IN`
- `Atlas.html` — added `api.jsx` script tag; added `theme` tweak; `darkClass` applied to root div; Theme radio in TweaksPanel

### Session 2 (2026-05-02) — Antigravity
**Completed:**
- **Architecture Migration**: Transitioned the entire prototype from a legacy standalone Babel script stack (via `frontend/Atlas.html`) to a modern React + Vite + ES Modules environment.
- **Dependency & Build Config**: Created `package.json`, configured `vite.config.js`, installed standard React dependencies (`npm install`), and restructured the codebase to live in `src/`.
- **ES Module Implementation**: Removed all `Object.assign(window, {...})` anti-patterns across `api.jsx`, `ui.jsx`, `charts.jsx`, `data.jsx`, `landing.jsx`, `overview.jsx`, `shell.jsx`, `pages.jsx`, `pricing.jsx`, `docs.jsx`, and `tweaks-panel.jsx`, replacing them with proper `export` and `import` statements.
- **Entry Points**: Authored `src/main.jsx` and the root `index.html` to instantiate the React DOM correctly.
- **Legacy Cleanup**: Deleted the entire legacy `frontend/` directory to prevent duplicate file issues.
- **Aesthetic Refinement**: Enhanced `styles.css` with `.text-gradient`, `.brand-glow`, and `.brand-grid`. Applied these to `landing.jsx` alongside updated hero typography, glassmorphism (`backdrop-filter: blur(12px)`) for the navbar, and enhanced card hover states with larger shadows and translations.
- **Bug Fixes**: Addressed build errors caused by unescaped single quotes within object literals in `data.jsx`.
