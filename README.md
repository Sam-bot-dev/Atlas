<div align="center">

```
    ___   __  __      ___   _____
   /   | / /_/ /___ /   | / ___/
  / /| |/ __/ / __ / /| | \__ \
 / ___ / /_/ / /_/ / ___ |___/ /
/_/  |_\__/_/\__,_/_/  |_/____/
```

### **AI Business Decision Assistant**

*Upload your data. Understand your business. Know what to do next.*

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](./LICENSE)

<br/>

> **Atlas answers three questions every business owner asks every morning:**
> 
> `What is happening?` &nbsp;·&nbsp; `Why is it happening?` &nbsp;·&nbsp; `What do I do next?`

<br/>

---

</div>

## ✦ What is Atlas

Atlas is an AI-powered decision engine for small and medium businesses. You upload your raw data — receipts, invoices, CSVs, screenshots, PDFs — and Atlas transforms it into a unified intelligence layer that tells you exactly what's going on in your business, why it's happening, and what to do about it.

No spreadsheets. No dashboards you have to interpret yourself. Just answers.

Built for **Indian SMBs** — pharmacies, home bakers, retail shops, cafes, import/export houses, service businesses — with INR-native metrics, India-specific seasonality, and context-aware reasoning.

<br/>

---

## ✦ Live Demo

Six demo businesses are pre-loaded. **No login required.**

| Business | Type | What you'll see |
|----------|------|-----------------|
| 🎂 **Ananya's Bakehouse** | Home Baker | Weekend demand spikes, ingredient cost trends |
| 👗 **Trendy Threads** | Retail Shop | Footfall patterns, SKU velocity, inventory gaps |
| 💊 **MedPlus Corner** | Pharmacy | Refill lapse risk, front-of-store revenue drivers |
| ☕ **The Daily Grind** | Cafe | Cold brew growth, oat milk margins, loyalty cohorts |
| 📦 **SwiftTrade Exports** | Import/Export | FX impact, on-time delivery trends, churn risk |
| 🔧 **ProFix Services** | Service Business | Job margin analysis, crew utilisation, revenue jumps |

Click any business on the landing page → instant dashboard, no friction.

<br/>

---

## ✦ Feature Architecture

Atlas is built around three **Decision Pillars**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         ATLAS DASHBOARD                          │
├─────────────────┬─────────────────────┬─────────────────────────┤
│  01 · WHAT      │  02 · WHY           │  03 · WHAT NEXT         │
│  IS HAPPENING   │  IS IT HAPPENING    │  DO I DO                │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ • Revenue trend │ • AI reasoning      │ • Prioritised actions   │
│ • Order volume  │ • Time patterns     │ • Impact/Effort scores  │
│ • Conversion %  │ • Seasonal context  │ • One-click automation  │
│ • Inventory     │ • Review sentiment  │ • Task creation         │
│ • Retention     │ • Anomaly detection │ • Automation triggers   │
│ • Review score  │ • Correlations      │ • Follow-up scheduling  │
└─────────────────┴─────────────────────┴─────────────────────────┘
```

### Data Ingestion Pipeline

```
Your Files
    │
    ▼
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│  DETECT  │───▶│ EXTRACT  │───▶│ LLM EXTRACT  │───▶│NORMALISE │
│          │    │          │    │              │    │          │
│ PDF      │    │ pdf-parse│    │  Groq/LLaMA  │    │ Orders   │
│ CSV      │    │ csv-parse│    │  Structured  │    │ Products │
│ Image    │    │ Vision   │    │  JSON output │    │Customers │
│ JSON     │    │ API OCR  │    │              │    │ Reviews  │
│ XLSX     │    │ Raw read │    │  Fallback:   │    │Inventory │
└──────────┘    └──────────┘    │  Rule engine │    │ Traffic  │
                                └──────────────┘    └──────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │ METRIC ENGINE   │
                                               │ INSIGHT ENGINE  │
                                               │ ACTION ENGINE   │
                                               │ ML FORECASTING  │
                                               └─────────────────┘
```

<br/>

---

## ✦ Tech Stack

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3 | UI framework |
| `vite` | 5.4 | Build tool + dev server |
| Custom CSS | — | Zero-dependency design system |

No Tailwind. No component library. Atlas ships a bespoke design system with CSS variables, semantic tokens, and a typographic scale that's entirely its own.

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | 5.2 | HTTP server |
| `@prisma/client` | 7 | ORM + type-safe DB access |
| `better-sqlite3` | 12.9 | SQLite adapter (dev) |
| `jsonwebtoken` | 9 | JWT authentication |
| `bcryptjs` | 3 | Password hashing |
| `multer` | 2.1 | File upload handling |
| `pdf-parse` | 2.4 | PDF text extraction |
| `csv-parse` | 6.2 | CSV parsing |
| `zod` | 4.4 | Runtime schema validation |

### AI / External APIs
| Service | Used for |
|---------|----------|
| **Groq** (LLaMA 3.1) | Structured data extraction from raw text, insight generation |
| **Google Vision API** | OCR on uploaded images and screenshots |

<br/>

---

## ✦ Project Structure

```
atlas/
├── src/                          # React frontend
│   ├── App.jsx                   # Root — routing, state, view management
│   ├── main.jsx                  # Entry point + ErrorBoundary
│   ├── api.jsx                   # Typed API client (all endpoints)
│   ├── data.jsx                  # Static demo business datasets
│   ├── styles.css                # Global design system + CSS variables
│   │
│   ├── landing.jsx               # Landing page + demo business selector
│   ├── auth-onboarding.jsx       # Login + multi-step onboarding
│   ├── shell.jsx                 # Sidebar, TopBar, BusinessSwitcher
│   ├── overview.jsx              # Main dashboard (What/Why/What Next)
│   ├── pages.jsx                 # Analytics, DataSources, Automations, Reports, Settings
│   ├── charts.jsx                # LineChart, DonutChart, HeatmapChart
│   ├── ui.jsx                    # Shared UI primitives
│   ├── tweaks-panel.jsx          # Dev tweaks panel (density, theme, navigation)
│   ├── pricing.jsx               # Pricing page
│   ├── docs.jsx                  # Documentation page
│   └── telemetry.js              # Client-side telemetry stub
│
├── backend/
│   ├── server.js                 # Express app entry point
│   │
│   ├── routes/                   # Route definitions
│   │   ├── authRoutes.js
│   │   ├── businessRoutes.js
│   │   ├── metricsRoutes.js
│   │   ├── insightsRoutes.js
│   │   ├── actionsRoutes.js
│   │   ├── automationsRoutes.js
│   │   └── uploadsRoutes.js
│   │
│   ├── controllers/              # Request handlers
│   │   ├── authController.js
│   │   ├── businessController.js
│   │   ├── metricsController.js
│   │   ├── insightsController.js
│   │   ├── actionsController.js
│   │   ├── automationsController.js
│   │   └── uploadsController.js
│   │
│   ├── services/                 # Business logic
│   │   ├── metricService.js      # KPI aggregation (revenue, orders, conversion…)
│   │   ├── insightService.js     # LLM-powered "Why" reasoning
│   │   ├── actionService.js      # Rule + pattern-based "What next" recommendations
│   │   ├── mlService.js          # Linear regression forecast + Z-score anomaly detection
│   │   ├── automationService.js  # Trigger evaluation engine
│   │   ├── taskService.js        # Task CRUD
│   │   ├── notificationService.js# Email / WhatsApp alert stubs
│   │   └── webhookService.js     # Outbound webhook dispatcher
│   │
│   ├── lib/
│   │   ├── prisma.js             # Prisma singleton
│   │   └── ingestion/
│   │       ├── detect.js         # File type detection
│   │       ├── extractors.js     # PDF / CSV / JSON / Image readers
│   │       ├── llmExtractor.js   # Groq structured extraction
│   │       ├── fallbackExtractor.js # Deterministic CSV rule engine
│   │       ├── normalize.js      # Write to DB + trigger metric/insight/action pipeline
│   │       ├── schema.js         # Zod validation schemas
│   │       └── worker.js         # Async job queue
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protect middleware
│   │   └── errorMiddleware.js    # Global error handler
│   │
│   └── prisma/
│       ├── schema.prisma         # Full data model
│       ├── seed.js               # Demo data seeder
│       └── migrations/           # Migration history
│
├── vercel.json                   # Vercel deployment config
├── vite.config.js                # Vite config + dev proxy
├── package.json                  # Frontend deps
└── index.html                    # Vite HTML entry
```

<br/>

---

## ✦ Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- A **Groq API key** — free at [console.groq.com](https://console.groq.com) (optional — falls back to deterministic mode)
- A **Google Vision API key** — optional, for image/screenshot OCR

---

### 1 · Clone & install

```bash
git clone https://github.com/your-org/atlas.git
cd atlas

# Install frontend deps
npm install

# Install backend deps
cd backend && npm install && cd ..
```

---

### 2 · Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# ── Required ──────────────────────────────────────────────
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="change-this-to-a-long-random-string-in-production"

# ── AI Services (optional — fallback mode works without these) ──
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-8b-instant"          # or llama-3.3-70b-versatile
GOOGLE_VISION_API_KEY="AIza..."

# ── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

> **Without `GROQ_API_KEY`:** The insight engine falls back to a deterministic rule-based generator. All other features work normally.
> 
> **Without `GOOGLE_VISION_API_KEY`:** Image and screenshot uploads are accepted but not OCR'd. The file will be marked with a warning.

---

### 3 · Set up the database

```bash
cd backend

# Run migrations
npx prisma migrate dev --name init

# Seed with all 6 demo businesses + realistic data
node prisma/seed.js
```

---

### 4 · Run

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Atlas backend running on port 5000
```

**Terminal 2 — Frontend:**
```bash
# from project root
npm run dev
# Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) — you should see the Atlas landing page with 6 demo businesses ready to explore.

<br/>

---

## ✦ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | SQLite connection string, e.g. `file:./prisma/dev.db` |
| `JWT_SECRET` | ✅ | — | Secret for signing JWTs. Use a 32+ char random string |
| `PORT` | — | `5000` | Port the Express server listens on |
| `NODE_ENV` | — | `development` | Set to `production` to suppress stack traces in errors |
| `GROQ_API_KEY` | — | — | Groq API key for LLM-powered extraction and insights |
| `GROQ_MODEL` | — | `llama-3.1-8b-instant` | Groq model to use. Recommended: `llama-3.3-70b-versatile` for higher quality |
| `GOOGLE_VISION_API_KEY` | — | — | Google Cloud Vision API key for image OCR |
| `FRONTEND_URL` | — | `http://localhost:5173` | Allowed CORS origin in production |

<br/>

---

## ✦ API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth

```
POST   /auth/signup           Create account { name, email, password }
POST   /auth/login            Login          { email, password }
GET    /auth/me               Get current user                    [protected]
POST   /auth/logout           Invalidate session                  [protected]
```

### Businesses

```
GET    /businesses                 List user's businesses          [protected]
POST   /businesses                 Create business                 [protected]
GET    /businesses/:id             Get business with all data      [protected]
PATCH  /businesses/:id             Update business                 [protected]
DELETE /businesses/:id             Delete business                 [protected]
```

### Data Ingestion

```
GET    /businesses/:bizId/uploads             List uploads         [protected]
POST   /businesses/:bizId/uploads             Upload file          [protected]
GET    /businesses/:bizId/uploads/:uploadId   Get upload status    [protected]
DELETE /businesses/:bizId/uploads/:uploadId   Delete upload        [protected]
```

**Accepted file types:** PDF, CSV, JSON, TXT, PNG, JPG, WEBP, XLSX, XLS  
**Max file size:** 12 MB

### Metrics

```
GET    /businesses/:bizId/metrics             Summary of all KPIs  [protected]
GET    /businesses/:bizId/metrics/forecast    7-day revenue forecast [protected]
PUT    /businesses/:bizId/metrics/:key        Upsert a metric      [protected]
```

### Insights & Actions

```
GET    /businesses/:bizId/insights            List AI insights     [protected]
POST   /businesses/:bizId/insights            Create insight       [protected]

GET    /businesses/:bizId/actions             List actions         [protected]
POST   /businesses/:bizId/actions             Create action        [protected]
PATCH  /businesses/:bizId/actions/:actionId   Update status        [protected]
POST   /businesses/:bizId/actions/:actionId/apply    Apply action  [protected]
POST   /businesses/:bizId/actions/:actionId/task     Create task   [protected]
DELETE /businesses/:bizId/actions/:actionId          Dismiss       [protected]
```

### Automations

```
GET    /businesses/:bizId/automations                List           [protected]
POST   /businesses/:bizId/automations                Create         [protected]
GET    /businesses/:bizId/automations/suggested      Suggestions    [protected]
PATCH  /businesses/:bizId/automations/:autoId/toggle Toggle on/off [protected]
DELETE /businesses/:bizId/automations/:autoId        Delete         [protected]
```

<br/>

---

## ✦ Data Model Overview

```
User ──┬── Business ──┬── DataSource ──┬── Order
       │              │                ├── Product
       │              │                ├── Customer
       │              │                ├── Review
       │              │                ├── InventoryItem
       │              │                └── TrafficPoint
       │              │
       │              ├── UploadJob
       │              ├── Metric        (one per KPI key, upserted)
       │              ├── Insight       (AI-generated, refreshed on upload)
       │              ├── Action        (AI-generated, refreshed on upload)
       │              ├── Task          (user-facing task list)
       │              └── Automation    (trigger → action rules)
       │
       └── (future: Team, Invite)
```

Each file upload triggers the full pipeline:
`UploadJob created` → `raw extraction` → `LLM structured extraction` → `DB normalisation` → `metric recalculation` → `insight regeneration` → `action regeneration` → `anomaly detection`

<br/>

---

## ✦ How the AI Works

### Insight Generation (`insightService.js`)

Atlas sends a rich context payload to Groq:
- Current KPI values with deltas
- Recent orders, reviews, inventory levels
- Time context (day of week, hour, India-specific season)
- Business type and location

The LLM returns 3–5 insight cards explaining **why** metrics are at their current levels — grounded in actual data patterns, not generic suggestions.

When `GROQ_API_KEY` is absent, a deterministic fallback engine generates insights from the same data using threshold rules.

### Revenue Forecasting (`mlService.js`)

Simple but interpretable: **ordinary least squares linear regression** over daily revenue history. Returns 7-day predictions with trend classification (increasing / stable / decreasing).

### Anomaly Detection (`mlService.js`)

**Z-score analysis** over daily revenue. Flags days where revenue is more than 2.5 standard deviations from the historical mean — automatically creating insight cards and triggering any matching automations.

### Action Scoring (`actionService.js`)

Each generated action is scored:
```
score = (impact × 0.5) + (effort_inverted × 0.3) + (confidence × 0.2) + urgency_boost
```

Top 8 actions by score are surfaced. Actions are categorised as inventory, customer care, marketing, sales, operations, or business strategy.

<br/>

---

## ✦ Deployment

### Frontend → Vercel

```bash
# From project root
vercel deploy
```

The `vercel.json` is pre-configured:
- Vite framework detection
- SPA catch-all rewrite (`/*` → `/index.html`)
- `/api/*` proxied to your backend domain

Update `vercel.json` with your live backend URL before deploying:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR-BACKEND-DOMAIN.com/api/$1"
    }
  ]
}
```

### Backend → Railway / Render / Fly.io

The backend is a standard Express + SQLite app. It runs on any Node.js host.

**Railway (recommended for zero config):**
```bash
railway login
railway init
railway up
```

Set environment variables in the Railway dashboard (see [Environment Variables](#-environment-variables-reference)).

**For production scale:** Swap SQLite for **PostgreSQL** by updating the Prisma datasource provider to `postgresql` and running `npx prisma migrate deploy`.

<br/>

---

## ✦ Supported Upload Formats

| Format | Extension | Extraction method | Notes |
|--------|-----------|-------------------|-------|
| PDF invoice / bill | `.pdf` | `pdf-parse` text extraction | Works best on digital PDFs |
| Spreadsheet | `.csv`, `.xlsx`, `.xls` | CSV parser / *(xlsx reader — see known issues)* | Auto-detects column names |
| Image / screenshot | `.png`, `.jpg`, `.webp` | Google Vision API OCR | Requires `GOOGLE_VISION_API_KEY` |
| JSON export | `.json` | Direct parse | Accepts arrays or `{ rows: [...] }` |
| Plain text | `.txt` | Raw read → LLM | Works for copy-pasted data |

Atlas extracts these entity types from any format:

```
Orders      → date, customer, product, quantity, price, channel
Products    → SKU, name, category, units sold, revenue
Customers   → name, phone, email, order count, spend, segment
Reviews     → platform, rating, body, sentiment
Inventory   → SKU, item, quantity on hand, reorder point
Traffic     → date, channel, visitors, conversions
```

<br/>

---

## ✦ Known Issues

See [`bugs.md`](./bugs.md) for the full tracked list. Top items to be aware of:

- **Excel (`.xlsx`) uploads** are accepted but not yet extracted — falls back silently. CSV export from Excel works fine.
- **Groq model** in `insightService.js` references a deprecated model. Update to `llama-3.1-8b-instant` manually if you see model-not-found errors.
- **Period selector** (1W / 1M / 3M / 6M) on the Overview dashboard is wired to state but does not yet filter chart data.
- **SQLite WAL files** (`*.db-shm`, `*.db-wal`) may appear in the working directory — add to `.gitignore` if not already excluded.

<br/>

---

## ✦ Roadmap

- [ ] Fix all items in `bugs.md`
- [ ] Excel (`.xlsx`) extraction via `exceljs`
- [ ] Real Google Business profile integration
- [ ] WhatsApp notification dispatch via Twilio
- [ ] Multi-user team access per business
- [ ] PDF report generation and download
- [ ] Mobile-responsive dashboard layout
- [ ] Postgres support for production deployments
- [ ] Persistent background job queue (replacing in-memory chain)
- [ ] Settings and data-preferences API endpoints
- [ ] Period-aware metric filtering (1W / 1M / 3M / 6M)

<br/>

---

## ✦ Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes — backend and frontend are independently runnable
4. Test the ingestion pipeline with a real CSV: drop a file in the Data Sources tab
5. Open a PR against `main`

Please check [`bugs.md`](./bugs.md) before starting — there's a prioritised list of issues ready to be picked up.

<br/>

---

## ✦ License

MIT © 2026 Better Call Coders

---

<div align="center">

*Built for the Hackathon circuit by* ***Better Call Coders***

*"We transform raw business data into intelligent decisions by answering what is happening,*  
*why it is happening, and what to do next — while enabling immediate action through automation."*

</div>