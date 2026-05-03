<div align="center">

```
    ___   __  __      ___   _____
   /   | / /_/ /___ /   | / ___/
  / /| |/ __/ / __ / /| | \__ \
 / ___ / /_/ / /_/ / ___ |___/ /
/_/  |_\__/_/\__,_/_/  |_/____/
```

### **AI Business Decision Assistant**

*Turning fragmented data into unified intelligence for small business owners.*

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?style=flat-square)](https://groq.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)

<br/>

> **Atlas answers the three critical questions for every business owner:**
> 
> `What is happening?` &nbsp;·&nbsp; `Why is it happening?` &nbsp;·&nbsp; `What do I do next?`

<br/>

---

</div>

## 🚀 The Vision

Atlas is more than just a dashboard; it's a **Decision Engine**. Small business owners often struggle with fragmented data across spreadsheets, paper invoices, and scattered digital tools. Atlas unifies this data into a single intelligence layer that provides actionable reasoning, predictive forecasts, and automated workflows.

Built specifically for the **Indian SMB ecosystem**, Atlas understands regional seasonality, INR-native metrics, and the unique operational patterns of pharmacies, home bakers, and retail shops.

<br/>

---

## ✨ Core Features

### 1. Unified Performance Dashboard (What is happening)
- **Goal-Driven Metrics**: Metrics are automatically prioritized based on your business goals (e.g., Revenue vs. Retention).
- **Interactive Tooltips**: Every metric comes with a detailed explanation of its calculation and data source.
- **Real-Time KPIs**: Track Revenue, Order Volume, Conversion Rate, Inventory Health, and Customer Retention.

### 2. AI Reasoning Engine (Why it is happening)
- **Context-Aware Insights**: LLM-powered analysis that correlates your metrics with external factors like time patterns, seasonality, and environmental conditions.
- **Innovation Showcase**: A contextual module that suggests high-impact actions, such as "Extreme Heat Optimization" for regions like Ahmedabad or Delhi.
- **Data Attribution**: Every insight is traced back to its specific evidence source (e.g., Z-Score Analysis, Sentiment Engine).

### 3. Action & Automation Hub (What next)
- **Prioritized Recommendations**: AI-ranked actions with clear **Impact**, **Effort**, and **Confidence** scores.
- **One-Click Execution**: Apply suggestions instantly to create tasks or trigger automated workflows.
- **Predictive Forecasts**: A 30-day revenue prediction engine driven by linear regression and anomaly detection.

### 4. Intelligent Data Ingestion
- **Multi-Format Support**: Upload PDFs, CSVs, or even screenshots. Atlas uses OCR and LLM-based extraction to structure raw text into a unified schema.
- **Real-Time Status**: Animated processing status for document ingestion, from detection to normalization.

<br/>

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 (Vite-powered)
- **State Management**: React Hooks + Session persistence
- **Authentication**: Firebase Auth (Google & Email/Password)
- **Styling**: Bespoke Design System (Semantic CSS Tokens, Zero-dependency)

### Backend
- **Server**: Node.js + Express
- **ORM**: Prisma (SQLite for development, Postgres-ready)
- **Data Ingestion**: Multer, pdf-parse, csv-parse, Zod validation
- **PDF Engine**: PDFKit for dynamic report generation

### AI & Predictive Layer
- **LLM**: Groq (LLaMA 3.3 Versatile) for structured extraction and reasoning
- **OCR**: Google Vision API for image-to-text processing
- **ML**: Custom linear regression for forecasting and Z-Score for anomaly detection

<br/>

---

## 🏗 Project Structure

```
atlas/
├── src/                          # React Frontend
│   ├── App.jsx                   # Root logic & View management
│   ├── overview.jsx              # The Signature Dashboard (What/Why/Next)
│   ├── api.jsx                   # Production-ready API client
│   ├── charts.jsx                # SVG-native custom charting engine
│   └── ui.jsx                    # Atomic UI components & primitives
│
├── backend/                      # Node.js Backend
│   ├── controllers/              # Request handlers (Metrics, Insights, Actions)
│   ├── services/                 # AI & ML logic (Reasoning, Forecasting)
│   ├── lib/ingestion/            # Document processing pipeline (OCR, LLM)
│   └── prisma/                   # Schema & Database migrations
```

<br/>

---

## 👥 The Team

Atlas was architected and built by a dedicated two-member team from India:

| Member | Role | GitHub |
|--------|------|--------|
| **Ubaid Khan** | Team Leader | [@notUbaid](https://github.com/notUbaid/) |
| **Bhavesh Kumar** | Team Engineer | [@sam-bot-dev](https://github.com/sam-bot-dev) |

<br/>

---

## 🚦 Getting Started

### Prerequisites
- Node.js ≥ 18.0
- A **Groq API Key** (for AI reasoning)
- A **Google Vision API Key** (for image OCR)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/notUbaid/atlas.git
   cd atlas
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_32_char_secret_here"
   GROQ_API_KEY="your_groq_key"
   GOOGLE_VISION_API_KEY="your_vision_key"
   ```

4. **Initialize Database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Run the Application**
   ```bash
   # In root (Frontend)
   npm run dev
   
   # In /backend (Backend)
   npm run dev
   ```

---

<div align="center">
  Built with ❤️ for Indian SMBs
</div>
