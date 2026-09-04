from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.services.ai_assistant import ai_assistant_service
from app.services.router_service import router_service
from app.services.ollama_client import ollama_client
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/v1/ai", tags=["AI & Business Intelligence"])

class QuestionRequest(BaseModel):
    question: str = Field(..., example="Why did revenue decrease in July and what actions should management take?")

class ClassifyRequest(BaseModel):
    question: str = Field(..., example="What was our total revenue in 2025?")

@router.post("/chat")
async def chat_with_ai(request: QuestionRequest):
    """
    Execute full Business Intelligence pipeline:
    1. Route question (SQL / RAG / BOTH)
    2. Retrieve database aggregates & ML predictions
    3. Retrieve FAISS vector document chunks
    4. Execute Qwen3 8B via Ollama
    5. Return 5-section executive response
    """
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question prompt cannot be empty.")

    try:
        response = await ai_assistant_service.process_question(request.question.strip())
        return {
            "success": True,
            "data": response
        }
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[AI ROUTER ERROR]: {tb}")
        raise HTTPException(status_code=500, detail=f"Error executing AI query pipeline: {str(e)} | Trace: {tb}")


@router.post("/classify")
async def classify_question(request: ClassifyRequest):
    """Classify user question into SQL, RAG, or BOTH using router prompt."""
    try:
        category = await router_service.classify_question(request.question.strip())
        return {
            "success": True,
            "question": request.question,
            "category": category
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error classifying question: {str(e)}")

@router.get("/models")
async def get_ollama_status():
    """Check local Ollama server status and available models."""
    status = await ollama_client.check_health()
    return {
        "success": True,
        "ollama_status": status
    }

@router.get("/forecast")
async def get_analytics_forecast():
    """Retrieve ML time-series forecast and business metrics."""
    forecast = analytics_service.predict_sales_forecast()
    return {
        "success": True,
        "forecast": forecast,
        "metrics_snapshot": analytics_service.metrics_db
    }

@router.post("/train")
async def train_ai_from_database():
    """
    Synchronize database tables and uploaded datasets from MySQL businessmind_db,
    train FAISS RAG vector store embeddings, and refresh Ollama business intelligence context.
    """
    from app.services.rag_service import rag_service
    result = await rag_service.sync_and_train_from_database()
    ollama_info = await ollama_client.check_health()
    result["ollama_model"] = ollama_info.get("target_model", "qwen3.5:4b")
    result["ollama_online"] = ollama_info.get("online", False)
    return result

@router.get("/monitoring")
async def get_ai_and_resource_monitoring():
    """
    Retrieve real-time monitoring metrics for MySQL database, Ollama LLM engine,
    and FAISS vector memory.
    """
    from app.services.rag_service import rag_service
    from app.db.mysql_client import mysql_client

    ollama_status = await ollama_client.check_health()
    db_connected = await mysql_client.check_connection()

    db_stats = {}
    if db_connected:
        try:
            summary = await mysql_client.query_one("""
                SELECT 
                    COUNT(*) as total_sales_records,
                    ROUND(SUM(revenue), 2) as total_revenue,
                    ROUND(SUM(profit), 2) as total_profit,
                    COUNT(DISTINCT category) as total_categories,
                    COUNT(DISTINCT product_name) as total_products
                FROM sales_records
            """)
            datasets = await mysql_client.query("""
                SELECT id, file_name, file_type, total_rows, indexed_in_rag, created_at
                FROM uploaded_datasets
                ORDER BY created_at DESC
                LIMIT 15
            """)
            db_stats = {
                "summary": summary or {},
                "uploaded_datasets": datasets or [],
                "total_datasets": len(datasets or [])
            }
        except Exception as e:
            db_stats = {"error": str(e)}

    return {
        "success": True,
        "database": {
            "name": "businessmind_db",
            "connected": db_connected,
            "stats": db_stats
        },
        "ollama": {
            "online": ollama_status.get("online", False),
            "target_model": ollama_status.get("target_model", "qwen3.5:4b"),
            "models_available": ollama_status.get("models", [])
        },
        "rag_vector_store": {
            "total_chunks": len(rag_service.chunks),
            "storage_path": "data/business.index",
            "engine": "FAISS IndexFlatL2 (cosine / L2 normalized)"
        }
    }

