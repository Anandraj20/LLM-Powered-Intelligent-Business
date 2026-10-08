# BusinessMind AI — LLM-Powered Intelligent Business Platform

[![System Status](https://img.shields.io/badge/System_Status-Operational-brightgreen)](#-system-status--services)
[![Database](https://img.shields.io/badge/MySQL-businessmind__db-blue)](#-database--data-layer)
[![LLM](https://img.shields.io/badge/Ollama-qwen3.5:4b-purple)](#-ai--rag-architecture)
[![RAG](https://img.shields.io/badge/Vector_Store-FAISS_IndexFlatL2-orange)](#-ai--rag-architecture)
[![Frontend](https://img.shields.io/badge/Next.js-14_App_Router-black)](#-frontend)
[![Backend](https://img.shields.io/badge/Express-TypeScript_REST_API-lightgrey)](#-backend)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, end-to-end AI-powered Business Intelligence (BI) platform combining **Local Large Language Models (LLMs)**, **FAISS Vector RAG**, **Machine Learning analytics**, and relational **MySQL** persistence.

BusinessMind AI empowers organizations to ingest multi-format enterprise datasets (CSV, Excel, JSON), automatically vectorize and ground business knowledge, monitor real-time company KPIs, and execute executive-grade natural language business queries with cited facts, key drivers, and strategic recommendations.

---

## 📑 Table of Contents

- [🚦 System Status & Services](#-system-status--services)
- [🏗️ System Architecture](#️-system-architecture)
- [✨ Key Features](#-key-features)
- [👥 Pre-Seeded Demo Accounts (RBAC)](#-pre-seeded-demo-accounts-rbac)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🔌 API Endpoints Reference](#-api-endpoints-reference)
- [🏃 Quickstart & Installation](#-quickstart--installation)
  - [Prerequisites](#1-prerequisites)
  - [1. Database Setup](#2-database-setup-mysql)
  - [2. Local LLM Setup (Ollama)](#3-local-llm-setup-ollama)
  - [3. Environment Configuration](#4-configure-environment-variables)
  - [4. AI Microservice Setup (Port 8000)](#5-start-the-ai-microservice-port-8000)
  - [5. Backend API Setup (Port 5000)](#6-start-the-backend-api-port-5000)
  - [6. Frontend Web App Setup (Port 3000)](#7-start-the-frontend-web-app-port-3000)
- [🧪 Verification & Testing](#-verification--testing)
- [❓ Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## 🚦 System Status & Services

| Service | Host / Port | Status | Description |
|---|---|---|---|
| **Frontend Web App** | `http://localhost:3000` | 🟢 Active | Next.js 14 App Router, Tailwind CSS, Lucide Icons, Chart.js |
| **Backend REST API** | `http://localhost:5000` | 🟢 Active | Node.js Express & TypeScript, MySQL connection pool, RBAC & CSRF |
| **AI Microservice** | `http://localhost:8000` | 🟢 Active | Python FastAPI, FAISS RAG, Ollama / OpenAI / Gemini client |
| **AI Swagger Docs** | `http://localhost:8000/docs` | 🟢 Active | Interactive OpenAPI documentation for AI & RAG routes |
| **Ollama Daemon** | `http://localhost:11434` | 🟢 Active | Local LLM runtime hosting `qwen3.5:4b` / `qwen3:8b` |
| **MySQL Database** | `localhost:3306` | 🟢 Connected | `businessmind_db` relational database |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Business User / Analyst])

    subgraph Client ["Frontend Layer (Port 3000)"]
        NextApp["Next.js 14 App Router"]
        UI_Dash["Executive Dashboard & Charts"]
        UI_Onboard["Data Onboarding & Live Telemetry"]
        UI_Chat["Conversational AI Interface"]
    end

    subgraph Backend ["Backend API Layer (Port 5000)"]
        Express["Express.js (TypeScript)"]
        AuthModule["Auth & RBAC (JWT + Bcrypt)"]
        DataPipeline["Batch ETL Pipeline (CSV/XLSX Parser)"]
        Security["Helmet + RateLimiter + Double-Submit CSRF"]
    end

    subgraph Storage ["Relational Data Layer (Port 3306)"]
        MySQL[("MySQL 8.0: businessmind_db")]
        T_Users["users (RBAC)"]
        T_Sales["sales_records (Transactions)"]
        T_Datasets["uploaded_datasets (Metadata)"]
        T_Org["organizations"]
        T_Chat["ai_chat_history"]
    end

    subgraph AIService ["AI & RAG Microservice (Port 8000)"]
        FastAPI["Python FastAPI Server"]
        Router["Query Router (SQL vs RAG vs BOTH)"]
        FAISS_Engine["FAISS Vector Engine (IndexFlatL2)"]
        Analytics_Engine["Pandas & Scikit-learn Aggregates"]
    end

    subgraph LLMRuntime ["Inference Engine (Port 11434)"]
        Ollama["Ollama Daemon (qwen3.5:4b / qwen3:8b)"]
        CloudLLM["Cloud Fallback: OpenAI / Gemini"]
    end

    User --> NextApp
    NextApp --> UI_Dash & UI_Onboard & UI_Chat
    UI_Dash & UI_Onboard & UI_Chat -->|REST / JSON| Express

    Express --> AuthModule & DataPipeline & Security
    DataPipeline -->|Batch Insert (100 rows/chunk)| MySQL
    Express -->|Read / Write SQL| MySQL

    Express -->|Forward Query & Trigger Sync| FastAPI
    FastAPI --> Router
    Router -->|Live SQL Metrics| MySQL
    Router -->|Vector Context Retrieval| FAISS_Engine
    Router -->|Data Aggregates & Trends| Analytics_Engine

    FAISS_Engine & Analytics_Engine -->|Grounded Context Prompt| Ollama
    Ollama -.->|Optional Cloud Fallback| CloudLLM
    Ollama -->|Executive 4-Part Response| FastAPI
    FastAPI --> Express --> NextApp
```

---

## ✨ Key Features

### 1. Direct Data Onboarding & Batch Processing
- **Multi-Format Ingestion**: Upload CSV, Excel (`.xlsx`, `.xls`), and JSON datasets directly via drag-and-drop or file selector.
- **High-Performance Batch Commits**: Ingests thousands of records into MySQL `sales_records` using optimized 100-row batch inserts with automatic column normalization and date parsing.
- **Automated RAG Sync**: Ingested files trigger semantic document summarization and automatic indexing into FAISS vector space.
- **Ingested Datasets Catalog**: Displays active datasets in MySQL with total rows, file format, ingestion timestamps, and quick-action actions (Ask AI, Delete, Re-index).

### 2. Conversational Business AI & Intelligent Query Routing
- **Tri-Modal Query Routing**: Questions are dynamically routed into:
  - `SQL`: Structured numerical analytics (e.g., total revenue, profit margins, top products).
  - `RAG`: Unstructured documents and policy questions.
  - `BOTH`: Holistic executive queries requiring both concrete numbers and contextual reasons.
- **Real-Time Context Grounding**: FAISS vector search retrieves top matching business context chunks to eliminate hallucinations.
- **Executive-Grade 4-Section Output**:
  1. **Direct Answer**: Precise monetary & unit metrics.
  2. **Key Drivers**: Growth patterns, margin shifts, regional factors.
  3. **Supporting Evidence**: Record-level proof, dates, and transactions.
  4. **Actionable Recommendations**: Next strategic business steps.

### 3. Executive Telemetry & Interactive BI Dashboards
- **Live Metrics**: Real-time sales telemetry, profit margins, product category breakdowns, and performance trends.
- **Interactive Visualizations**: Powered by Chart.js (bar charts, line graphs, and donut distributions).
- **One-Click Synchronization**: Re-sync all MySQL tables to FAISS and Ollama with a single click.

### 4. Enterprise RBAC & Production Security
- **Role-Based Access Control**: 6 pre-configured roles with granular permissions (Owner, Admin, Manager, Sales Person, Accountant, Employee).
- **Hardened Security**:
  - Double-Submit Cookie CSRF protection.
  - Strict Content Security Policy (CSP) & HSTS via Helmet.
  - IP-based rate limiting on sensitive authentication endpoints.
  - Bcrypt password hashing (`cost factor 10`).
  - Dual-token authentication (short-lived JWT access tokens + rolling refresh tokens).

---

## 👥 Pre-Seeded Demo Accounts (RBAC)

The database schema (`database/schema.sql`) and backend startup routine pre-seed 6 ready-to-use role accounts for instant testing:

> **Universal Demo Password:** `Password123!`

| Role | Name | Username | Email | Key Permissions |
|---|---|---|---|---|
| **Owner** | Elena Rostova | `owner_elena` | `owner@businessmind.ai` | Full administrative control, organization management, data deletion |
| **Admin** | Marcus Vance | `admin_marcus` | `admin@businessmind.ai` | User management, dataset uploads, AI retraining, system settings |
| **Manager** | Sarah Jenkins | `manager_sarah` | `manager@businessmind.ai` | BI dashboards, team sales metrics, executive AI reporting |
| **Sales Person** | David Miller | `sales_david` | `sales@businessmind.ai` | Sales data viewing, deal logging, sales analytics |
| **Accountant** | Priya Sharma | `accountant_priya` | `accountant@businessmind.ai` | Financial reporting, revenue breakdowns, profit/cost auditing |
| **Employee** | Alex Rivera | `employee_alex` | `employee@businessmind.ai` | Read-only organizational data, general AI assistant queries |

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS + Curated Dark Mode UI
- **Icons**: Lucide React
- **Data Visualization**: Chart.js + `react-chartjs-2`
- **Data Fetching & State**: SWR, Axios, React Context, React Hook Form, Zod

### Backend API
- **Runtime & Framework**: Node.js v20+ / Express.js 4 (TypeScript)
- **Database Driver**: `mysql2/promise` with Connection Pooling
- **File Processing**: Multer + `xlsx` + `csv-parse`
- **Security**: Helmet, CORS, Express Rate Limit, BcryptJS, JSONWebToken, Zod

### AI Microservice & RAG
- **Framework**: Python 3.10+ / FastAPI / Uvicorn
- **LLM Runtime**: Ollama (local `qwen3.5:4b` or `qwen3:8b`) with optional OpenAI / Gemini provider
- **Vector Database**: FAISS (`IndexFlatL2` with L2-normalized embeddings)
- **Embeddings**: Sentence-Transformers / Ollama Embeddings (`qwen3-embedding:0.6b`)
- **Data Analysis**: Pandas, NumPy, Scikit-learn, PyMySQL / `aiomysql`

### Relational Database
- **Engine**: MySQL 8.0+
- **Database**: `businessmind_db`
- **Tables**: `users`, `organizations`, `sales_records`, `uploaded_datasets`, `ai_chat_history`

---

## 📁 Repository Structure

```text
LLM-Powered-Intelligent-Business/
├── frontend/                     # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing & Overview Experience
│   │   │   ├── onboarding/       # Data Ingestion, Catalog & Live Telemetry
│   │   │   ├── dashboard/        # Executive BI Dashboards & KPIs
│   │   │   ├── analytics/        # In-depth Analytics & Financial Insights
│   │   │   ├── organization/     # Team, Tenant & Role Management
│   │   │   ├── login/            # RBAC Authentication & Demo Quick-Login
│   │   │   ├── register/         # User Registration
│   │   │   └── reset-password/   # Password Recovery
│   │   ├── components/           # Reusable UI widgets & Navbars
│   │   └── context/              # Authentication & API Client Context
│   ├── .env.local                # Frontend API target configuration
│   └── package.json
│
├── backend/                      # Express.js REST API (TypeScript)
│   ├── src/
│   │   ├── config/               # Database pool (database.ts) & security configs
│   │   ├── middleware/           # RBAC, JWT verification, CSRF middleware
│   │   ├── models/               # Data types & validation schemas
│   │   ├── routes/               # REST route handlers
│   │   │   ├── auth.routes.ts    # Login, registration, token refresh, logout
│   │   │   ├── onboarding.routes.ts # File ingestion, batch commits, catalog
│   │   │   ├── ai.routes.ts      # LLM chat proxy, question classification
│   │   │   ├── analytics.routes.ts # Aggregated sales & KPI metrics
│   │   │   ├── organization.routes.ts # Organization profile & team
│   │   │   └── admin.routes.ts   # System health & administrative actions
│   │   ├── services/             # Pipeline, DB & Auth business logic
│   │   ├── app.ts                # Express app setup & middleware pipeline
│   │   ├── index.ts              # Server bootstrap (Port 5000)
│   │   ├── test_api.ts           # Verification test suite for auth & pipeline
│   │   ├── test_db.ts            # MySQL connection test script
│   │   └── test_llm.ts           # LLM microservice connection test script
│   ├── .env                      # Backend environment variables
│   └── package.json
│
├── ai-service/                   # Python FastAPI AI & RAG Microservice
│   ├── app/
│   │   ├── routers/
│   │   │   ├── ai_router.py      # /api/v1/ai (chat, classify, models)
│   │   │   └── rag_router.py     # /api/v1/rag (upload, search, documents)
│   │   ├── services/
│   │   │   ├── ai_assistant.py   # Multi-step business insight pipeline
│   │   │   ├── router_service.py # Prompt classifier (SQL / RAG / BOTH)
│   │   │   ├── rag_service.py    # FAISS vector indexing & retrieval
│   │   │   ├── ollama_client.py  # Local Ollama HTTP bridge
│   │   │   └── analytics_service.py # Pandas SQL aggregations & metrics
│   │   ├── db/
│   │   │   └── mysql_client.py   # Async MySQL connection pool
│   │   └── main.py               # FastAPI entry point & lifespan (Port 8000)
│   ├── data/                     # FAISS indices & vectorized chunks
│   ├── seed_business_data.py     # Seed script for rich business records
│   ├── seed_sales.py             # Seed script for sales dataset
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # AI service environment configuration
│
├── database/
│   └── schema.sql                # Complete MySQL DDL & initial demo seed data
├── docker-compose.yml            # Multi-container orchestration (optional)
├── LICENSE                       # MIT License
└── README.md                     # Platform documentation
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user and assign organization |
| `POST` | `/login` | Authenticate user and receive JWT access/refresh tokens |
| `POST` | `/refresh` | Silent token renewal using refresh token |
| `POST` | `/logout` | Revoke active refresh token |
| `GET` | `/me` | Get profile and permissions of authenticated user |

### 📥 Onboarding & Datasets (`/api/v1/onboarding`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/direct-upload` | Upload CSV/XLSX/JSON directly to MySQL and auto-retrain RAG |
| `GET` | `/datasets` | Fetch list of all ingested datasets from `uploaded_datasets` |
| `GET` | `/monitoring` | Fetch live telemetry (MySQL row counts, revenue, RAG chunks, Ollama status) |
| `POST` | `/sync-database` | Trigger complete synchronization of MySQL data into FAISS RAG |
| `DELETE` | `/dataset/:id` | Purge uploaded dataset records and re-index vector store |

### 🤖 AI & RAG Query (`/api/v1/ai` & `/api/v1/rag`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ai/chat` | Conversational query with FAISS RAG context & multi-driver insights |
| `POST` | `/api/v1/ai/classify` | Classify question category (`SQL`, `RAG`, or `BOTH`) |
| `GET` | `/api/v1/ai/models` | Check Ollama server status and available LLM models |
| `POST` | `/api/v1/rag/upload` | Ingest raw text or document content into FAISS vector index |
| `POST` | `/api/v1/rag/search` | Execute semantic vector similarity search against FAISS |
| `GET` | `/api/v1/rag/documents` | List indexed document chunks in the vector store |

### 📊 Business Analytics (`/api/v1/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/summary` | High-level metrics (total revenue, profit, units, margin %) |
| `GET` | `/monthly-trends` | Monthly sales and revenue growth progression |
| `GET` | `/category-performance` | Product category breakdown and contribution |
| `GET` | `/top-products` | Top performing products ranked by revenue and profit |

### 🏢 Organization & Admin (`/api/v1/organization` & `/api/v1/admin`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organization/current` | Retrieve details of current user's organization |
| `GET` | `/api/v1/organization/members` | List members and roles in current organization |
| `GET` | `/api/v1/admin/health` | Comprehensive system health audit |
| `GET` | `/api/health` | Backend service liveness check |
| `GET` | `/api/health/db` | MySQL connection status probe |

---

## 🏃 Quickstart & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0+ or v20.0.0+
- **Python**: v3.10+
- **MySQL**: 8.0+ running locally on port `3306`
- **Ollama**: Installed from [ollama.com](https://ollama.com/)

---

### 2. Database Setup (MySQL)

1. Make sure your MySQL server is running.
2. Initialize the database and pre-seed the demo users and initial sales data:
```bash
mysql -u root -p < database/schema.sql
```
*(Enter your MySQL root password when prompted)*

This automatically creates `businessmind_db` along with all required tables and 6 pre-configured RBAC accounts.

---

### 3. Local LLM Setup (Ollama)

1. Start the Ollama background daemon:
```bash
ollama serve
```
2. In a separate terminal, pull the recommended Qwen model:
```bash
ollama pull qwen3.5:4b
```
*(Optional: for higher accuracy if you have 8GB+ VRAM, you can also pull `ollama pull qwen3:8b`)*

---

### 4. Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YourMySQLPassword
MYSQL_DATABASE=businessmind_db

# Optional Cloud API Key for fallback
OPENAI_API_KEY=
```

#### AI Microservice (`ai-service/.env`):
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.5:4b
OLLAMA_EMBED_MODEL=qwen3-embedding:0.6b

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YourMySQLPassword
MYSQL_DATABASE=businessmind_db

# Optional Cloud Keys
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
```

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

### 5. Start the AI Microservice (Port 8000)

```powershell
cd ai-service

# Create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\activate      # On Windows PowerShell
# source .venv/bin/activate # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 6. Start the Backend API (Port 5000)

Open a new terminal window:
```powershell
cd backend
npm install
npm run dev
```

The REST API will start on: [http://localhost:5000](http://localhost:5000)  
Health status endpoint: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### 7. Start the Frontend Web App (Port 3000)

Open a third terminal window:
```powershell
cd frontend
npm install
npm run dev
```

Visit the application in your browser:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Data Onboarding & Monitoring**: [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
- **Executive BI Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Analytics View**: [http://localhost:3000/analytics](http://localhost:3000/analytics)
- **Login / Demo Switcher**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🧪 Verification & Testing

The repository includes verification suites to test each core layer:

### 1. Test Database Connectivity
```powershell
cd backend
npm run test:db
```

### 2. Test LLM & AI Service Communication
```powershell
cd backend
npm run test:llm
```

### 3. Test Full Auth & Data Ingestion Pipeline
```powershell
cd backend
npx ts-node src/test_api.ts
```

### 4. Seed Rich Demo Datasets (Optional)
If you want to pre-populate additional historical business records into MySQL:
```powershell
cd ai-service
.venv\Scripts\activate
python seed_business_data.py
```

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `[MySQL Error]: Access denied for user` | Incorrect credentials in `.env` | Verify `MYSQL_USER` and `MYSQL_PASSWORD` match your local MySQL configuration in both `backend/.env` and `ai-service/.env`. |
| `ECONNREFUSED 127.0.0.1:11434` | Ollama daemon is not running | Run `ollama serve` in a terminal window or launch the Ollama desktop app. |
| `Model 'qwen3.5:4b' not found` | Model has not been pulled yet | Run `ollama pull qwen3.5:4b` in your terminal. |
| `CSRF token mismatch or missing` | Calling protected mutation endpoints externally | Authentication and ingestion routes are CSRF-exempted. For custom scripts, include the `X-CSRF-Token` header. |
| `Port 5000 / 3000 / 8000 in use` | Previous process still bound to port | Terminate the process using the port (`Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process` on Windows PowerShell). |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
