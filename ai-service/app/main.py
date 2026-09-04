from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from app.routers import ai_router, rag_router
from app.db.mysql_client import mysql_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize MySQL async pool. Shutdown: close it cleanly."""
    await mysql_client.init_pool()
    yield
    await mysql_client.close()


app = FastAPI(
    title="BusinessMind AI Service",
    description="Python FastAPI service for LLM processing (Ollama Qwen3 8B), FAISS RAG, and Business Intelligence analytics.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router.router)
app.include_router(rag_router.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to BusinessMind AI Microservice",
        "llm_architecture": "Local LLM (Qwen3 8B) + FAISS RAG + MySQL Live Analytics + Query Router",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "mysql_connected": mysql_client.is_connected,
        "timestamp": datetime.utcnow().isoformat()
    }
