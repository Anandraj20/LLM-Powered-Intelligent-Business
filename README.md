# BusinessMind AI — LLM-Powered Intelligent Business Platform

[![Status](https://img.shields.io/badge/System_Status-Operational-brightgreen)](#system-status)
[![Database](https://img.shields.io/badge/MySQL-businessmind__db-blue)](#data-layer)
[![LLM](https://img.shields.io/badge/Ollama-qwen3.5:4b-purple)](#ai--ml-architecture)
[![RAG](https://img.shields.io/badge/Vector_Store-FAISS_IndexFlatL2-orange)](#ai--ml-architecture)
[![Frontend](https://img.shields.io/badge/Next.js-14_App_Router-black)](#frontend)
[![Backend](https://img.shields.io/badge/Express-TypeScript_REST_API-lightgrey)](#backend)

An enterprise-grade AI-powered Business Intelligence platform combining Local Large Language Models (LLMs), FAISS Vector RAG, Machine Learning, and relational MySQL analytics. It enables organizations to ingest multi-format datasets, automatically train conversational AI on business data, monitor KPIs in real time, and query company metrics using natural language.

---

## 🚦 System Status & Live Architecture

| Service | Host / Port | Status | Description |
|---|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | 🟢 Online | Next.js 14, Tailwind CSS, Lucide Icons, Chart.js |
| **Backend REST API** | `http://localhost:5000` | 🟢 Online | Node.js Express in TypeScript, batch MySQL pipeline |
| **AI Microservice** | `http://localhost:8000` | 🟢 Online | Python FastAPI, FAISS RAG, Ollama bridge |
| **Ollama Daemon** | `http://localhost:11434` | 🟢 Online | Local GPU/CPU LLM (`qwen3.5:4b` / `qwen3:8b`) |
| **MySQL Database** | `localhost:3306` | 🟢 Connected | `businessmind_db` (19,973+ sales rows, 8 datasets) |

---

## 🚀 Key Features

### 1. Direct Data Onboarding & Automated RAG Pipeline
- **Multi-Format Ingestion**: Upload CSV, Excel (`.xlsx`, `.xls`), and JSON datasets directly via drag-and-drop or file selector.
- **High-Performance Batch Commits**: Ingests thousands of records into MySQL `businessmind_db.sales_records` using optimized 100-row batch inserts with automatic column normalization and date parsing.
- **Instant Auto-Retraining**: Automatically extracts high-level semantic summaries, column structures, and performance aggregates, vectorizing them into the local FAISS index (`data/business.index`).
- **Interactive Ingested Datasets Catalog**: Both the **Upload & Train** and **Live Monitoring** tabs display live datasets in MySQL with total rows, format, ingestion timestamp, and quick-action buttons.

### 2. Conversational Business AI & RAG Query Engine
- **Direct Dataset Q&A**: Click **"Ask AI"** on any dataset in the catalog to generate instant AI insights, revenue breakdowns, top-selling categories, and strategic recommendations.
- **Real-Time Context Grounding**: FAISS vector search retrieves relevant organizational records and prompt-engineers structured inputs into Ollama (`qwen3.5:4b`).
- **Standardized Multi-Driver Output**: AI responses structure outputs into:
  1. *Direct Answer* (with precise monetary & unit figures)
  2. *Key Drivers* (growth trends, top categories, margins)
  3. *Supporting Evidence* (exact records, timestamps, dates)
  4. *Actionable Strategic Recommendations*

### 3. Live Telemetry & Monitoring Dashboard
- **Real-Time KPIs**:
  - **Total Records Ingested**: `19,973+` rows in `sales_records`
  - **Total Revenue Aggregated**: `₹414,101,000.00`
  - **Total Margin / Profit**: `₹223,220,258.44`
  - **Active Product Lines**: 14 distinct products across 9 categories
- **One-Click Synchronization**: Sync all MySQL tables to Ollama RAG anytime with a single click.
- **Dataset Deletion & Pruning**: Remove uploaded datasets and auto-reindex the RAG store in one step.

### 4. Enterprise RBAC & Security
- 7 permission-scoped views (Admin, Sales Manager, Financial Analyst, Inventory Specialist, Executive).
- Public CSRF exemptions for programmatic onboarding ingest pipelines.
- Multi-tenant architecture keyed by `organization_id`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS + Custom Dark Theme
- **Icons**: Lucide React
- **Data Visualization**: Chart.js + react-chartjs-2
- **State & Context**: React Hooks + Auth Context

### Backend
- **Framework**: Express.js 4 (TypeScript)
- **Database Driver**: `mysql2/promise` (Connection Pooling & Batch Transactions)
- **File Processing**: Multer + XLSX parser + CSV parser
- **Validation & Security**: Helmet, CORS, CSRF Protection, Zod

### AI / ML & RAG Microservice
- **Framework**: Python 3.10+ / FastAPI / Uvicorn
- **Local LLM Runtime**: Ollama (`qwen3.5:4b`, `qwen3:8b`)
- **Vector Search**: FAISS (`IndexFlatL2` with L2-normalized embeddings)
- **Embeddings**: Sentence-Transformers / Qwen Embeddings
- **Data Science**: Pandas, NumPy, Scikit-learn

### Relational Database
- **Database Engine**: MySQL 8.0+
- **Database Name**: `businessmind_db`
- **Core Tables**:
  - `uploaded_datasets`: Catalog of uploaded files, row counts, file types, timestamps.
  - `sales_records`: Individual transaction records, amounts, units, categories, dates.
  - `organizations`: Enterprise tenants and metadata.
  - `users`: RBAC user credentials and roles.

---

## 📁 Repository Structure

```text
LLM-Powered-Intelligent-Business/
├── frontend/                     # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── onboarding/       # Direct Ingestion, AI Retraining & Live Monitoring
│   │   │   ├── dashboard/        # Executive BI Dashboards & Visualizations
│   │   │   ├── sales/            # Sales Analytics & Performance
│   │   │   ├── finance/          # Profitability, Revenue & Cost Breakdown
│   │   │   └── login/            # Authentication & RBAC role switcher
│   │   ├── components/           # Reusable UI components & navigation
│   │   └── context/              # Authentication & API Client Context
│   └── package.json
│
├── backend/                      # Express.js REST API (TypeScript)
│   ├── src/
│   │   ├── config/               # Database pool (database.ts) & security configs
│   │   ├── routes/               # onboarding.routes.ts, ai.routes.ts, sales.routes.ts
│   │   ├── services/             # mysql.service.ts, dataPipeline.service.ts
│   │   └── index.ts              # Express Server Entry Point (Port 5000)
│   └── package.json
│
├── ai-service/                   # Python FastAPI AI & RAG Microservice
│   ├── app/
│   │   ├── api/                  # Chat, RAG query, sync endpoints
│   │   ├── core/                 # Ollama LLM client & configuration
│   │   ├── db/                   # MySQL client for direct table extraction
│   │   ├── rag/                  # FAISS vector indexing & semantic search
│   │   └── main.py               # FastAPI Entry Point (Port 8000)
│   └── requirements.txt
│
├── database/
│   └── schema.sql                # Complete MySQL DDL schema for businessmind_db
└── README.md
```

---

## 🔌 API Endpoints Reference

### Onboarding & Datasets (`/api/v1/onboarding`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/direct-upload` | Upload CSV/XLSX/JSON directly to MySQL and auto-train Ollama |
| `GET` | `/datasets` | Get list of all committed datasets in `uploaded_datasets` |
| `GET` | `/monitoring` | Get live telemetry (MySQL status, summary KPIs, RAG chunks, Ollama status) |
| `POST` | `/sync-database` | Trigger full synchronization of MySQL records into FAISS RAG |
| `DELETE` | `/dataset/:id` | Purge uploaded dataset from database and re-train Ollama RAG |

### AI Assistant & RAG Query (`/api/v1/ai`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Conversational query with FAISS RAG context retrieved from businessmind_db |
| `POST` | `/query` | Structured business query alias for analytics workflows |

---

## 🏃 Running the Application Locally

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+
- **MySQL Server**: Running on `localhost:3306` with database `businessmind_db`
- **Ollama**: Installed and running with `qwen3.5:4b` (`ollama run qwen3.5:4b`)

### 2. Configure Environment Variables
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourPassword
DB_NAME=businessmind_db
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8000
```

### 3. Start AI Microservice (Port 8000)
```powershell
cd ai-service
# Activate virtual environment
.venv\Scripts\activate
# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start Backend API (Port 5000)
```powershell
cd backend
npm install
npm run build
npm start
# Or for development with hot-reload:
# npm run dev
```

### 5. Start Frontend Web App (Port 3000)
```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000/onboarding](http://localhost:3000/onboarding) in your browser.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
