# Atlas — Master Implementation Plan
*The A-to-Z Roadmap to transition Atlas from a UI Prototype to a Production-Ready AI Product.*

---

## Executive Summary
This document outlines the systematic plan to build out the backend, AI infrastructure, and production architecture required to realize the full vision detailed in `project.txt`. 

Our core goal is a system that unifies scattered business data (PDFs, screenshots, CSVs, integrations), processes it via an AI extraction & reasoning pipeline (OCR + LLM), and surfaces the three core product pillars:
1. **What is happening** (Unified metrics)
2. **Why it is happening** (Context-aware reasoning)
3. **What to do next** (Prioritized automated actions)

---

## Phase 1: Foundation & Modernization (✅ Completed)
The project has successfully been transitioned from a standalone UI prototype to a modern frontend application.
- **Task 1:** Migrate to Vite + React 18 + ES Modules. (Done)
- **Task 2:** Component modularization and removal of global window scope pollution. (Done)
- **Task 3:** UI/UX aesthetic refinements and dark-mode implementations. (Done)
- **Task 4:** Data structure localization (India INR, cities, context). (Done)

---

## Phase 2: Core Infrastructure & Authentication (Upcoming)
*Objective: Set up the production database, cloud environments, and secure user management.*

- **Step 1: Backend Setup**
  - Initialize a Node.js (Express or Fastify) or Serverless (Next.js API routes/Firebase Functions) backend repository.
  - Set up environment variables, CORS, error handling middlewares, and logging.
- **Step 2: Database Design & Provisioning (Firebase/PostgreSQL)**
  - Schema definition for `Users`, `Businesses`, `DataSources`, `Metrics`, `Insights`, and `Actions`.
  - Establish a multi-tenant structure so each business owns its dataset exclusively.
- **Step 3: Authentication & Authorization**
  - Implement authentication via Firebase Auth, Auth0, or Supabase.
  - Create the `POST /api/v1/auth/login` and `POST /api/v1/auth/signup` routes.
  - Implement JWT verification middleware on all protected API routes.
- **Step 4: Real-World Onboarding Integration**
  - Implement Google Places API search in the onboarding flow to fetch actual business locations, ratings, and categories.
  - Create the `POST /api/v1/businesses` endpoint to register the business profile in the database.

---

## Phase 3: The AI Data Ingestion Pipeline (✅ Completed)
*Objective: Build the core capability to ingest unstructured files and convert them into a unified schema.*

- **Step 1: Storage & Upload API** ✅
  - Local durable upload storage under `backend/storage/uploads` (ignored by git; Firebase-ready boundary).
  - `POST /api/v1/businesses/:bizId/uploads` handles multipart files.
  - `GET /api/v1/businesses/:bizId/uploads` lists jobs.
  - `GET /api/v1/businesses/:bizId/uploads/:uploadId` returns live status.
  - `DELETE /api/v1/businesses/:bizId/uploads/:uploadId` removes the upload source.
- **Step 2: OCR & Text Extraction** ✅
  - CSV, JSON, text, and PDF extraction implemented.
  - Image OCR implemented via optional `GOOGLE_VISION_API_KEY`.
  - Async in-process worker queue prevents upload requests from blocking.
- **Step 3: LLM Structured Extraction (Groq Integration)** ✅
  - Optional Groq extraction via `GROQ_API_KEY`.
  - Deterministic fallback extractor handles CSV/text when no LLM key is present.
  - Zod schema validation enforces normalized `orders`, `products`, `customers`, `reviews`, `inventory`, and `traffic` collections.
- **Step 4: Normalization & Storage Engine** ✅
  - Prisma models added for `UploadJob`, `Order`, `Product`, `Customer`, `Review`, `InventoryItem`, and `TrafficPoint`.
  - Normalizer stores extracted data per business and per source.
  - Upload completion refreshes relevant metrics and creates evidence-backed insight/action records.
  - Frontend Data Sources page now uploads files and polls `AtlasAPI.uploads.status`; unauthenticated demo mode falls back to the visual demo flow.

---

## Phase 4: AI Reasoning Engine (✅ Completed)
*Objective: Generate the intelligent insights and prioritized actions.*

- **Step 1: Metric Aggregation Service** ✅
  - Write chron-jobs or database views that constantly calculate the "What is happening" metrics (Revenue trend, Peak hours, Retention) from the raw normalised data.
  - Hook these up to `GET /api/v1/metrics/summary`.
- **Step 2: Context-Aware Reasoning Logic** ✅
  - Create an LLM agent that evaluates the aggregated metrics alongside external factors (time patterns, geolocation context).
  - Prompt Engineering: *Given sales drops on Tuesday and high temperatures, deduce the correlation.*
  - Populate the `insights` table.
- **Step 3: Action Prioritization Matrix** ✅
  - Create the recommender engine that turns insights into standard actions (e.g., Restock) and advanced actions (e.g., Bundle products).
  - Calculate Impact, Effort, and Confidence scores based on historical success and data density.
  - Serve via `GET /api/v1/actions/list`.

---

## Phase 5: Workflow Automation System (✅ Completed)
*Objective: Allow users to click "Take Action" and have the system actually execute it.*

- **Step 1: Task Management Layer** ✅
  - Build a simple CRUD system for internal tasks (Auto-generated daily action lists, scheduled follow-ups).
- **Step 2: Notification & Alerting Engine** ✅
  - Implement Email (SendGrid) and WhatsApp (Twilio/Meta API) integrations for auto-reorder alerts and low stock triggers.
- **Step 3: Webhook Integrations** ✅
  - Build standard REST outgoing webhooks so the "Take Action" button can communicate with external tools (e.g., Shopify, POS systems) if authorized.

---

## Phase 6: Mini ML Predictive Model (✅ Completed)
*Objective: Move from descriptive/diagnostic analytics to predictive analytics.*

- **Step 1: Time-Series Forecasting** ✅
  - Implement simple regression models or Prophet (via Python microservice) to forecast sales trends based on the 7-month historical data.
- **Step 2: Anomaly Detection** ✅
  - Create statistical baseline models to detect anomalous spending or sudden drop-offs in customer retention, generating urgent "Insights".
- **Step 3: UI Surfacing** ✅
  - Present the model's output in the UI as "Model learns patterns over time" to build trust.

---

## Phase 7: Frontend Finalization (✅ Completed)
*Objective: Remove all mock data from the UI and replace with live backend endpoints.*

- **Step 1: API Client Rewiring** ✅
  - In `src/api.jsx`, remove the mock `setTimeout` implementations and map them to standard `fetch` or `axios` calls pointing to the newly deployed backend.
- **Step 2: State Management & Error Handling** ✅
  - Implement React Query (or SWR) for caching, background fetching, and loading state management.
  - Build robust Error Boundaries and empty states for when businesses have no data.
- **Step 3: Responsive Design & Polish**
  - Implement mobile-friendly breakpoints (collapsing the sidebar into a hamburger menu).
  - Complete Dark Mode audit.
  - Implement actual settings/form saving functionalities.

---

## Phase 8: Deployment & Launch (✅ Completed)
*Objective: Get Atlas into the hands of real users.*

- **Step 1: CI/CD Pipelines** ✅
  - Set up GitHub Actions for frontend building, testing, and deployment.
  - Set up Docker containerization for the backend.
- **Step 2: Hosting Infrastructure** ✅
  - Deploy Frontend to Vercel, Netlify, or AWS S3/Cloudfront.
  - Deploy Backend to AWS ECS, Render, or Google Cloud Run.
  - Configure production domain, SSL certificates, and DNS routing.
- **Step 3: Monitoring & Telemetry** ✅
  - Integrate Sentry for error tracking.
  - Set up PostHog or Mixpanel to track the user journey through the onboarding flow.
