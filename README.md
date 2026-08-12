# BusinessMind AI

BusinessMind AI is an intelligent, LLM-powered business intelligence platform designed to aggregate enterprise data from relational and document databases, deliver predictive analytics and time-series forecasting, automate reporting pipelines, and provide an interactive conversational AI assistant — empowering data-driven decision-making across every business domain through a modern, full-stack architecture.

## Tech Stack

### 3.1 Frontend
| Technology | Role |
|---|---|
| React.js | UI component library |
| Next.js 14 | App Router SSR/SSG framework |
| Tailwind CSS | Utility-first styling |
| Chart.js + react-chartjs-2 | Data visualisation & dashboards |

### 3.2 Backend
| Technology | Role |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| Zod | Schema validation |
| express-validator | Request validation middleware |
| express-rate-limit | Rate limiting |

### 3.3 Database
| Technology | Role |
|---|---|
| PostgreSQL 16 | Structured / relational business data |
| MongoDB 7 | Unstructured / document data (logs, chat history) |
| Redis 7 | Caching, session store, real-time queues |

### 3.4 AI / ML Layer
| Technology | Role |
|---|---|
| Python | Primary AI service language |
| FastAPI | AI microservice REST framework |
| Scikit-learn | Classical ML models |
| TensorFlow | Deep learning (structured tasks) |
| PyTorch | Deep learning (research / NLP) |
| Prophet | Time-series forecasting |
| XGBoost | Structured/tabular prediction |
| LangChain | LLM orchestration & chains |
| LlamaIndex | Retrieval-Augmented Generation (RAG) |
| ChromaDB | Vector store for embeddings |
| sentence-transformers | Embedding generation |

### 3.5 LLM Providers
| Provider | Model |
|---|---|
| OpenAI | GPT-4o / GPT-4 Turbo |
| Meta | Llama 3 |
| Mistral AI | Mistral / Mixtral |
| Google | Gemma |

### 3.6 Cloud & DevOps
| Technology | Role |
|---|---|
| AWS / Azure | Cloud hosting & managed services |
| Docker | Containerisation |
| Kubernetes | Container orchestration |
| Docker Compose | Local development environment |

### 3.7 Authentication
| Technology | Role |
|---|---|
| JWT | Stateless token-based authentication |
| OAuth 2.0 (Google Login) | Social sign-in via NextAuth / Passport |
| RBAC | Role-based access control (custom middleware) |

## Project Structure

```
businessmind-ai/
├── frontend/          # Next.js + React + TypeScript + Tailwind + Chart.js
│   └── src/app/       # App Router (layouts, pages, components)
├── backend/           # Express.js REST API in TypeScript
│   └── src/           # app.ts, index.ts, routes/, middleware/, controllers/
├── ai-service/        # Python FastAPI microservice
│   └── app/           # main.py, routers/, models/, services/
├── docker-compose.yml # Postgres 16 + MongoDB 7 + Redis 7
├── .gitignore
└── README.md
```

## Getting Started

```bash
# 1. Start all infrastructure services
docker compose up -d

# 2. Frontend  →  http://localhost:3000
cd frontend && npm install && npm run dev

# 3. Backend API  →  http://localhost:5000
cd backend && npm install && npm run dev

# 4. AI Service  →  http://localhost:8000
cd ai-service
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

Copy `.env.example` (when created) to `.env` in each service directory and fill in:

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `MONGO_URI` | backend | MongoDB connection string |
| `REDIS_URL` | backend | Redis connection string |
| `JWT_SECRET` | backend | JWT signing secret |
| `GOOGLE_CLIENT_ID` | backend | OAuth 2.0 Google client ID |
| `GOOGLE_CLIENT_SECRET` | backend | OAuth 2.0 Google client secret |
| `OPENAI_API_KEY` | ai-service | OpenAI API key |
| `NEXTAUTH_SECRET` | frontend | NextAuth signing secret |
| `NEXTAUTH_URL` | frontend | Canonical frontend URL |
