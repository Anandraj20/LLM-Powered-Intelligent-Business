# BusinessMind AI — LLM-Powered Intelligent Business Platform

[![System Status](https://img.shields.io/badge/System_Status-Operational-brightgreen)](#-system-status--services)
[![Database](https://img.shields.io/badge/MySQL-businessmind__db-blue)](#-database--data-layer)
[![Local LLM](https://img.shields.io/badge/Ollama-qwen3.5:4b-purple)](#-ai--rag-architecture)
[![Cloud LLM](https://img.shields.io/badge/OpenAI-gpt--4o--mini_Fallback-teal)](#-ai--rag-architecture)
[![Voice AI](https://img.shields.io/badge/Voice_AI-Executive_Speech_Copilot-red)](#-interactive-voice-executive-copilot)
[![RAG](https://img.shields.io/badge/Vector_Store-FAISS_IndexFlatL2-orange)](#-ai--rag-architecture)
[![Analytics](https://img.shields.io/badge/Financial_Analytics-P%26L_Engine-emerald)](#-executive-financial-analytics--pl-engine)
[![Frontend](https://img.shields.io/badge/Next.js-14_App_Router-black)](#-frontend)
[![Backend](https://img.shields.io/badge/Express-TypeScript_REST_API-lightgrey)](#-backend)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, end-to-end AI-powered Business Intelligence (BI) platform combining **Local Large Language Models (LLMs)**, **OpenAI Cloud Fallback**, **Interactive Voice AI**, **FAISS Vector RAG**, **Real-Time Financial Analytics**, and relational **MySQL** persistence.

BusinessMind AI empowers organizations to ingest multi-format enterprise datasets (CSV, Excel, JSON), vectorize and ground business knowledge in real time, monitor company KPIs, audit week-over-week profit and loss, conduct voice-driven executive briefings, and execute natural language business queries with cited facts, key drivers, and strategic recommendations.

---

## 📑 Table of Contents

- [🚦 System Status & Services](#-system-status--services)
- [🏗️ System Architecture](#️-system-architecture)
- [✨ Key Features](#-key-features)
  - [1. Conversational Business AI & Dual Inference](#1-conversational-business-ai--dual-inference-local--cloud)
  - [2. Interactive Voice Executive Copilot & Speech Dictation](#2-interactive-voice-executive-copilot--speech-dictation)
  - [3. FAISS RAG Knowledge Hub & Vector Management](#3-faiss-rag-knowledge-hub--vector-management)
  - [4. Executive Financial Analytics & P&L Engine](#4-executive-financial-analytics--pl-engine)
  - [5. Strategic Business Domains & 4-Phase Roadmaps](#5-strategic-business-domains--4-phase-roadmaps)
  - [6. Multi-Format Data Ingestion & Batch Processing](#6-multi-format-data-ingestion--batch-processing)
  - [7. Enterprise RBAC, Captcha & Production Security](#7-enterprise-rbac-captcha--production-security)
- [👥 Pre-Seeded Demo Accounts (RBAC)](#-pre-seeded-demo-accounts-rbac)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🔌 API Endpoints Reference](#-api-endpoints-reference)
  - [Authentication & Security](#-authentication--security-apiv1auth)
  - [Financial Analytics & Datasets](#-financial-analytics--datasets-apiv1analytics)
  - [Conversational AI, Voice & RAG](#-conversational-ai-voice--rag-apiv1ai)
  - [Data Onboarding & Ingestion](#-data-onboarding--ingestion-apiv1onboarding)
  - [Organization & Admin Management](#-organization--admin-management-apiv1organization--admin)
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
| **Frontend Web App** | `http://localhost:3000` | 🟢 Active | Next.js 14 App Router, Tailwind CSS, Lucide Icons, Chart.js, Web Speech API |
| **Backend REST API** | `http://localhost:5000` | 🟢 Active | Node.js Express & TypeScript, MySQL connection pool, RBAC, Captcha & CSRF |
| **AI Microservice** | `http://localhost:8000` | 🟢 Active | Python FastAPI, FAISS RAG, Ollama / OpenAI / Gemini client |
| **AI Swagger Docs** | `http://localhost:8000/docs` | 🟢 Active | Interactive OpenAPI documentation for AI & RAG routes |
| **Ollama Daemon** | `http://localhost:11434` | 🟢 Active | Local LLM runtime hosting `qwen3.5:4b` / `qwen3:8b` |
| **MySQL Database** | `localhost:3306` | 🟢 Connected | `businessmind_db` relational database |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Business Executive / Analyst])

    subgraph Client ["Frontend Layer (Port 3000)"]
        NextApp["Next.js 14 App Router"]
        UI_Dash["Executive Dashboard & Charts"]
        UI_Voice["Voice Copilot & Speech Dictation"]
        UI_RAG["RAG Knowledge Hub Modal"]
        UI_Analytics["Financial P&L & Week-wise Analytics"]
        UI_Domains["Domain Roadmaps & AI Scenario Modeling"]
    end

    subgraph Backend ["Backend API Layer (Port 5000)"]
        Express["Express.js (TypeScript)"]
        AuthModule["Auth & RBAC (JWT + MFA + Captcha)"]
        AnalyticsSvc["Financial Analytics Engine (P&L, Margins)"]
        DataPipeline["Batch ETL Pipeline (CSV/XLSX Parser)"]
        VoiceHandler["Voice Synthesis & Speech Router"]
        Security["Helmet + RateLimiter + Double-Submit CSRF"]
    end

    subgraph Storage ["Relational Data Layer (Port 3306)"]
        MySQL[("MySQL 8.0: businessmind_db")]
        T_Users["users (RBAC, MFA, Lockout)"]
        T_Sales["sales_records (Transactions)"]
        T_Datasets["uploaded_datasets (Catalog)"]
        T_Audit["login_audit_logs"]
        T_Org["organizations"]
        T_Chat["ai_chat_history"]
    end

    subgraph AIService ["AI & RAG Microservice (Port 8000)"]
        FastAPI["Python FastAPI Server"]
        Router["Tri-Modal Query Classifier (SQL vs RAG vs BOTH)"]
        FAISS_Engine["FAISS Vector Store (IndexFlatL2)"]
        Analytics_Engine["Pandas & Scikit-learn Aggregates"]
    end

    subgraph LLMRuntime ["Dual Inference Engine (Local & Cloud)"]
        Ollama["Local Ollama Daemon (qwen3.5:4b / qwen3:8b)"]
        CloudLLM["Cloud Engine (OpenAI gpt-4o-mini / Gemini)"]
        FallbackSynthesizer["Executive Strategic Synthesizer"]
    end

    User --> NextApp
    NextApp --> UI_Dash & UI_Voice & UI_RAG & UI_Analytics & UI_Domains
    NextApp -->|REST / JSON| Express

    Express --> AuthModule & AnalyticsSvc & DataPipeline & VoiceHandler & Security
    DataPipeline -->|Batch Insert (100 rows/chunk)| MySQL
    AnalyticsSvc -->|Live SQL Queries| MySQL
    Express -->|Read / Write| MySQL

    Express -->|Forward Query & Trigger Sync| FastAPI
    FastAPI --> Router
    Router -->|Live SQL Metrics| MySQL
    Router -->|Vector Context Retrieval| FAISS_Engine
    Router -->|Data Aggregates & Trends| Analytics_Engine

    FAISS_Engine & Analytics_Engine -->|Grounded Context Prompt| Ollama
    Ollama -.->|Automatic Fallback / User Toggle| CloudLLM
    CloudLLM -.->|Offline Fallback| FallbackSynthesizer
    Ollama & CloudLLM -->|Executive 4-Part Response| FastAPI
    FastAPI --> Express --> NextApp
```

---

## ✨ Key Features

### 1. Conversational Business AI & Dual Inference (Local + Cloud)
- **Tri-Modal Query Routing**: Automatically determines whether a query requires:
  - `SQL`: Structured numerical analytics (total revenue, profit margins, top products).
  - `RAG`: Unstructured corporate policies, governance documents, and meeting notes.
  - `BOTH`: Holistic executive inquiries combining concrete metrics and strategic reasoning.
- **Dual Inference Providers**: Instant toggle between **Local Ollama** (`qwen3.5:4b` / `qwen3:8b`) for complete data privacy, and **OpenAI Cloud** (`gpt-4o-mini` / `gpt-4o`) for high-speed cloud intelligence.
- **Fail-Safe Executive Synthesizer**: Built-in deterministic intelligence fallback guarantees a comprehensive, professional answer even during local daemon restarts or network latency.
- **Executive-Grade 4-Section Output**:
  1. **Direct Answer**: Precise monetary & unit metrics.
  2. **Key Drivers**: Margin shifts, regional trends, product adoption.
  3. **Supporting Evidence**: Transaction dates, verified volumes, and audited ledger numbers.
  4. **Actionable Recommendations**: Next strategic directives for management.

### 2. Interactive Voice Executive Copilot & Speech Dictation
- **Web Speech API Dictation**: Real-time microphone audio capture and transcript streaming directly in the main chat input bar.
- **Dedicated Voice Assistant Modal (`VoiceAssistantModal`)**: Hands-free conversational copilot with spoken text-to-speech (TTS) responses, sound wave visualizations, and provider toggle.
- **Pre-Configured Voice Assignments**: Instant one-click briefings:
  - *Financial Health Briefing*: Executive summary of total revenue, profit margin, and runway.
  - *Refund & SLA Policy*: Corporate governance, subscription refunds, and uptime credit rules.
  - *July Seasonal Sales Dip*: Deep dive into mid-year sales declines with actionable recovery directives.
  - *Margin Optimization Directive*: Clear roadmap for expanding gross margins by 5% over two quarters.
- **TTS-Optimized Voice Response (`/api/v1/ai/voice/chat`)**: Generates natural, cadence-friendly sentences stripped of complex markdown formatting for crystal-clear auditory playback.

### 3. FAISS RAG Knowledge Hub & Vector Management
- **RAG Knowledge Hub Modal (`RagSystemModal`)**: Visual explorer to inspect indexed document chunks, verify metadata categories, and test vector similarity search with real-time similarity scores.
- **Direct Document Ingestion**: Upload custom text, strategic guidelines, or executive memos directly into FAISS `IndexFlatL2`.
- **One-Click Vector Synchronization**: Instant `/api/v1/ai/rag/sync` endpoint re-scans the MySQL sales ledger and rebuilds semantic vector embeddings with normalized L2 distance.
- **Document Management**: Search, preview, and purge outdated vector chunks with instant index rebuilding.

### 4. Executive Financial Analytics & P&L Engine
- **Live MySQL Financial Ledger**: Real-time analysis of the live `sales_records` database with total revenue, total costs, gross profit, and margin percentages.
- **Week-Over-Week Trend Tracking**: Aggregates transactions into chronological weekly buckets with trajectory trend indicators (`up`, `down`, `flat`).
- **Category & Performer Breakdown**: Comprehensive matrix of revenue contribution, profit margins, deal counts, and average order values across product lines.
- **Sample Dataset Generator**: Download ready-to-test CSV datasets directly from the UI:
  - `Retail Sample Dataset`: Multi-regional hardware, software, and services sales data.
  - `SaaS Sample Dataset`: Subscription tiers, API addons, and enterprise SLAs.
- **Deep AI Executive Diagnosis (`/api/v1/analytics/ai-diagnosis`)**: Evaluates computed financial metrics and outputs a structured CFO diagnosis covering:
  - Overall health grading (`excellent`, `good`, `fair`, `poor`).
  - Executive summary and key operational insights.
  - Pricing discipline and procurement cost reduction directives.
  - Risk factors (margin concentration, seasonality) and growth opportunities.

### 5. Strategic Business Domains & 4-Phase Roadmaps
- **10+ Curated Industry Domains**: Comprehensive strategic models covering AI & Machine Learning, Data Engineering, Cloud DevOps, Cybersecurity, E-Commerce, FinTech, HealthTech, EdTech, SaaS, and Supply Chain.
- **Domain AI Insight (`DomainAIInsight`)**: Live contextual assessment of future market scope, trillion-dollar opportunities, and operational headwinds.
- **Interactive Roadmap Viewer (`RoadmapViewer`)**: 4-phase step-by-step blueprints:
  - *Phase 1*: Foundation & Customer Discovery (Weeks 1–12)
  - *Phase 2*: MVP Product-Market Fit & Feedback Loops (Months 3–6)
  - *Phase 3*: Revenue Velocity & GTM Acceleration (Months 6–18)
  - *Phase 4*: Global Scale & Defensible Moats (Year 2+)
- **AI Scenario Analysis Modal (`AiScenarioAnalysisModal`)**: On-demand scenario generation powered by `/api/v1/ai/roadmap-analysis` to evaluate market shifts, TAM projections, and capital requirements.

### 6. Multi-Format Data Ingestion & Batch Processing
- **Drag-and-Drop Ingestion**: Upload `.csv`, `.xlsx`, `.xls`, and `.json` datasets.
- **High-Throughput Batch Commits**: Inserts thousands of rows in 100-record chunks with automatic column mapping, date normalization, and currency sanitization.
- **Catalog Management**: View uploaded files, row counts, ingestion timestamps, and indexing statuses.

### 7. Enterprise RBAC, Captcha & Production Security
- **Role-Based Access Control**: 6 pre-configured roles (Owner, Admin, Manager, Sales Person, Accountant, Employee) with granular permissions.
- **Hardened Authentication**:
  - SVG Captcha verification on registration and password recovery.
  - TOTP-compatible Multi-Factor Authentication (MFA / 2FA setup and verification).
  - Google OAuth login integration.
  - Audit logging for all user sign-in events with IP and User-Agent capture.
  - Double-Submit Cookie CSRF protection.
  - Helmet CSP headers, HSTS, and express rate-limiting.
  - Bcrypt password hashing (`cost factor 10`).

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
- **Styling**: Tailwind CSS + Curated Dark Mode Design System
- **Icons**: Lucide React
- **Voice & Speech**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`)
- **Data Visualization**: Chart.js + `react-chartjs-2`
- **Data Fetching & State**: SWR, Axios, React Context, React Hook Form, Zod

### Backend API
- **Runtime & Framework**: Node.js v20+ / Express.js 4 (TypeScript)
- **Database Driver**: `mysql2/promise` with Connection Pooling
- **File Processing**: Multer + `xlsx` + `csv-parse`
- **Security & Auth**: Helmet, CORS, Express Rate Limit, SVG-Captcha, BcryptJS, JSONWebToken, Zod

### AI Microservice & RAG
- **Framework**: Python 3.10+ / FastAPI / Uvicorn
- **LLM Runtime**: Ollama (local `qwen3.5:4b` or `qwen3:8b`) with OpenAI (`gpt-4o-mini`) fallback
- **Vector Database**: FAISS (`IndexFlatL2` with L2-normalized embeddings)
- **Embeddings**: Sentence-Transformers / Ollama Embeddings (`qwen3-embedding:0.6b`)
- **Data Analysis**: Pandas, NumPy, Scikit-learn, PyMySQL / `aiomysql`

### Relational Database
- **Engine**: MySQL 8.0+
- **Database**: `businessmind_db`
- **Tables**: `users`, `organizations`, `sales_records`, `uploaded_datasets`, `login_audit_logs`, `ai_chat_history`

---

## 📁 Repository Structure

```text
LLM-Powered-Intelligent-Business/
├── frontend/                               # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing Page with Domain Roadmaps & AI Explorer
│   │   │   ├── onboarding/                 # Data Ingestion, Catalog & Live Telemetry
│   │   │   ├── dashboard/                  # Executive BI Dashboards, Quick-Action Cards & Chat
│   │   │   ├── analytics/                  # Financial P&L Engine, Week Trends & AI Diagnosis
│   │   │   ├── organization/               # Team, Tenant & Role Management
│   │   │   ├── login/                      # RBAC Authentication & Demo Quick-Login
│   │   │   ├── register/                   # User Registration with Captcha
│   │   │   └── reset-password/             # Password Recovery Flow
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── BusinessMindChat.tsx    # Conversational Chat with Speech Dictation
│   │   │   │   ├── VoiceAssistantModal.tsx # Interactive Voice AI Copilot (Speech & Audio)
│   │   │   │   └── RagSystemModal.tsx      # FAISS RAG Knowledge Hub & Vector Explorer
│   │   │   ├── domain/
│   │   │   │   └── DomainAIInsight.tsx     # Domain Scope, Opportunities & Risk Analysis
│   │   │   ├── roadmap/
│   │   │   │   ├── RoadmapViewer.tsx       # 4-Phase Chronological Strategic Roadmap
│   │   │   │   └── AiScenarioAnalysisModal.tsx # AI Scenario Modeling Modal
│   │   │   ├── layout/                     # Navbar, Sidebar, and Common Layouts
│   │   │   └── common/                     # ProtectedRoute & Reusable UI Elements
│   │   ├── context/                        # AuthContext, API Axios Client, Token Refresh
│   │   ├── data/
│   │   │   └── businessDomains.ts          # Comprehensive Data Models for 10+ Business Domains
│   │   └── types/                          # TypeScript Interfaces for Auth, BI, and Analytics
│   ├── .env.local                          # Frontend API Configuration
│   └── package.json
│
├── backend/                                # Express.js REST API (TypeScript)
│   ├── src/
│   │   ├── config/                         # MySQL Database Pool & RBAC Permissions
│   │   ├── middleware/                     # JWT Authentication, RBAC, Captcha, CSRF
│   │   ├── models/                         # User, Organization, and Dataset Models
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              # Login, Register, MFA, Captcha, Logout, Audit
│   │   │   ├── ai.routes.ts                # LLM Proxy, Voice Chat, RAG Sync, Diagnostics
│   │   │   ├── analytics.routes.ts         # Live SQL Analytics, Sample Datasets, AI Diagnosis
│   │   │   ├── onboarding.routes.ts        # Direct File Uploads, Batch Commits, Telemetry
│   │   │   ├── organization.routes.ts      # Multi-Tenant Organizations & Member Roles
│   │   │   └── admin.routes.ts             # Health Audits & Administrative Telemetry
│   │   ├── services/
│   │   │   ├── analytics.service.ts        # P&L Calculations, Trends & Category Metrics
│   │   │   ├── auth.service.ts             # JWT, Password Hashing, MFA & Session Management
│   │   │   └── organization.service.ts     # Multi-Tenant Hierarchy Logic
│   │   ├── app.ts                          # Express Configuration & Middleware Pipeline
│   │   ├── index.ts                        # Server Entry Point (Port 5000)
│   │   ├── test_api.ts                     # Full Pipeline Integration Test
│   │   ├── test_db.ts                      # MySQL Connectivity Verification
│   │   └── test_llm.ts                     # Ollama / AI Microservice Probe
│   ├── .env                                # Backend Environment Configuration
│   └── package.json
│
├── ai-service/                             # Python FastAPI AI & RAG Microservice
│   ├── app/
│   │   ├── routers/
│   │   │   ├── ai_router.py                # /api/v1/ai (chat, classify, models, train)
│   │   │   └── rag_router.py               # /api/v1/rag (upload, search, documents)
│   │   ├── services/
│   │   │   ├── ai_assistant.py             # Multi-Step Business Insight Pipeline
│   │   │   ├── router_service.py           # Tri-Modal Query Classifier (SQL/RAG/BOTH)
│   │   │   ├── rag_service.py              # FAISS Vector Indexing & Semantic Retrieval
│   │   │   ├── ollama_client.py            # Local Ollama HTTP Bridge
│   │   │   └── analytics_service.py        # Pandas SQL Aggregations & Telemetry
│   │   ├── db/
│   │   │   └── mysql_client.py             # Async MySQL Connection Pool
│   │   └── main.py                         # FastAPI Lifespan & App Setup (Port 8000)
│   ├── data/                               # FAISS Indices & Serialized Document Chunks
│   ├── seed_business_data.py               # Seed Script for Rich Historical Datasets
│   ├── seed_sales.py                       # Seed Script for Transaction Ledger
│   ├── requirements.txt                    # Python Dependencies
│   └── .env                                # AI Microservice Environment Configuration
│
├── database/
│   ├── schema.sql                          # Complete DDL & Initial RBAC Demo Accounts
│   └── migrate_v2.sql                      # V2 Schema Additions (Audit, Datasets, MFA)
├── docker-compose.yml                      # Containerized Deployment Configuration
├── LICENSE                                 # MIT License
└── README.md                               # Complete System Documentation
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication & Security (`/api/v1/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/captcha` | Generate a fresh SVG math/visual captcha token |
| `POST` | `/register` | Register user with captcha and assign initial organization |
| `POST` | `/login` | Authenticate user; returns JWT access/refresh tokens or MFA challenge |
| `POST` | `/login/mfa` | Complete login verification with a TOTP 2FA code |
| `POST` | `/google` | Authenticate or register using a verified Google OAuth token |
| `POST` | `/mfa/setup` | Generate a TOTP secret and QR code for two-factor authentication |
| `POST` | `/mfa/enable` | Confirm TOTP code and activate MFA for current user |
| `POST` | `/mfa/disable` | Deactivate MFA for current user |
| `POST` | `/refresh` | Silent renewal of access token via rolling refresh token |
| `POST` | `/logout` | Invalidate active refresh token |
| `POST` | `/logout-all` | Terminate all active sessions across all devices |
| `POST` | `/forgot-password` | Request password reset verification token |
| `POST` | `/reset-password` | Set new password with captcha and reset token |
| `GET` | `/me` | Get profile, organization, and permissions of authenticated user |
| `GET` | `/login-history` | Audit log of recent sign-in events, IP addresses, and User-Agents |

### 📊 Financial Analytics & Datasets (`/api/v1/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/overview` | Live MySQL financial metrics (Revenue, Profit/Loss, Week-wise progression) |
| `GET` | `/sample-dataset` | Download ready-to-test CSV files (`type=retail` or `type=saas`) |
| `POST` | `/upload` | Upload custom CSV/Excel dataset and return instant P&L report |
| `POST` | `/ai-diagnosis` | Run deep AI diagnosis on dataset metrics to generate CFO strategic insights |
| `GET` | `/datasets` | List available datasets in the catalog alongside live database stats |
| `GET` | `/summary` | High-level summary metrics (Revenue, Profit, Margin %, Total Units) |
| `GET` | `/monthly-trends` | Monthly sales progression and growth rates |
| `GET` | `/category-performance` | Product category breakdown and contribution analysis |
| `GET` | `/top-products` | Top-performing products ranked by revenue and gross margin |

### 🤖 Conversational AI, Voice & RAG (`/api/v1/ai`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Tri-modal conversational AI with FAISS RAG context (Local Ollama / OpenAI) |
| `POST` | `/voice/chat` | TTS-optimized conversational speech endpoint for voice assistant |
| `POST` | `/roadmap-analysis` | Executive scenario analysis and strategic roadmap for any business domain |
| `GET` | `/status` | AI service connection status and active provider verification |
| `GET` | `/diagnostics` | Comprehensive latency and health audit (Ollama, MySQL, AI Service, OpenAI) |
| `POST` | `/classify` | Classify user prompt category (`SQL`, `RAG`, or `BOTH`) |
| `GET` | `/models` | List loaded Ollama LLM models and runtime availability |
| `POST` | `/rag/upload` | Ingest and vectorize document text into FAISS vector space |
| `POST` | `/rag/search` | Execute semantic vector similarity search against FAISS |
| `GET` | `/rag/documents` | List indexed document chunks in the vector store |
| `DELETE` | `/rag/documents/:id` | Remove document chunk from vector store and rebuild index |
| `GET` | `/rag/stats` | Return FAISS vector count, dimension, and memory usage |
| `POST` | `/rag/sync` | Re-train and synchronize FAISS vectors from live MySQL records |

### 📥 Data Onboarding & Ingestion (`/api/v1/onboarding`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/direct-upload` | Upload CSV/XLSX/JSON directly to MySQL with automatic RAG synchronization |
| `GET` | `/datasets` | Fetch list of all ingested datasets from `uploaded_datasets` |
| `GET` | `/monitoring` | Fetch live telemetry (MySQL row counts, revenue, RAG chunks, Ollama status) |
| `POST` | `/sync-database` | Trigger complete synchronization of MySQL data into FAISS RAG |
| `DELETE` | `/dataset/:id` | Purge uploaded dataset records and re-index vector store |

### 🏢 Organization & Admin Management (`/api/v1/organization` & `/admin`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/organization/current` | Retrieve details of current user's organization |
| `GET` | `/api/v1/organization/members` | List members and roles in current organization |
| `POST` | `/api/v1/organization/members` | Invite new member to organization with assigned role |
| `PUT` | `/api/v1/organization/members/:id` | Update member role or permissions |
| `DELETE` | `/api/v1/organization/members/:id` | Remove member from organization |
| `GET` | `/api/v1/admin/health` | Comprehensive administrative system health report |
| `GET` | `/api/health` | Backend service liveness probe |
| `GET` | `/api/health/db` | MySQL connection pool status probe |

---

## 🏃 Quickstart & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0+ or v20.0.0+
- **Python**: v3.10+
- **MySQL**: 8.0+ running locally on port `3306`
- **Ollama**: Installed from [ollama.com](https://ollama.com/) (for local inference)
- **OpenAI API Key** *(Optional)*: Set `OPENAI_API_KEY` for cloud inference and voice fallbacks

---

### 2. Database Setup (MySQL)

1. Ensure your MySQL server is running on `localhost:3306`.
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
2. In a separate terminal, pull the recommended Qwen models:
```bash
ollama pull qwen3.5:4b
ollama pull qwen3-embedding:0.6b
```
*(Optional: for higher reasoning accuracy if you have 8GB+ VRAM, you can also pull `ollama pull qwen3:8b`)*

---

### 4. Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
OLLAMA_BASE_URL=http://localhost:11434

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YourMySQLPassword
MYSQL_DATABASE=businessmind_db

# JWT & Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_at_least_32_characters

# Optional Cloud API Key for OpenAI inference fallback & voice assistant
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
- **Landing Page & Domain Roadmaps**: [http://localhost:3000](http://localhost:3000)
- **Executive BI Dashboard & Chat**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Financial Analytics & P&L Engine**: [http://localhost:3000/analytics](http://localhost:3000/analytics)
- **Data Ingestion & Live Telemetry**: [http://localhost:3000/onboarding](http://localhost:3000/onboarding)
- **Role Login & Demo Switcher**: [http://localhost:3000/login](http://localhost:3000/login)

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

### 4. Run System Diagnostics Probe
You can query the backend real-time diagnostic endpoint anytime:
```powershell
curl http://localhost:5000/api/v1/ai/diagnostics
```

### 5. Seed Additional Historical Business Records (Optional)
If you want to pre-populate additional historical business transactions into MySQL:
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
| `ECONNREFUSED 127.0.0.1:11434` | Ollama daemon is not running | Run `ollama serve` in a terminal window or launch the Ollama desktop app. If using OpenAI cloud mode, ensure `OPENAI_API_KEY` is provided. |
| `Model 'qwen3.5:4b' not found` | Model has not been pulled yet | Run `ollama pull qwen3.5:4b` in your terminal. |
| `Microphone not working in Voice Assistant` | Browser permission denied or HTTP origin | Ensure microphone permissions are granted in browser settings (`chrome://settings/content/microphone`). Note that Web Speech API requires `localhost` or HTTPS. |
| `CSRF token mismatch or missing` | Calling protected mutation endpoints externally | Authentication and ingestion routes are CSRF-exempted. For custom scripts, include the `X-CSRF-Token` header. |
| `Port 5000 / 3000 / 8000 in use` | Previous process still bound to port | Terminate the process using the port (`Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process` on Windows PowerShell). |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
