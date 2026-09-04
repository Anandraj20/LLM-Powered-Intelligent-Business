from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/v1/rag", tags=["RAG & Knowledge Documents"])

class DocumentIngestRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "General"

class VectorSearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4

@router.post("/upload")
async def ingest_document(payload: DocumentIngestRequest):
    """Index text/document content into FAISS vector database."""
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Document content cannot be empty.")

    chunks_added = rag_service.add_document(
        title=payload.title,
        content=payload.content,
        metadata={"category": payload.category}
    )

    return {
        "success": True,
        "message": f"Successfully indexed document '{payload.title}' into FAISS vector store.",
        "chunks_indexed": chunks_added,
        "total_chunks_in_store": len(rag_service.chunks)
    }

@router.post("/search")
async def search_vector_store(payload: VectorSearchRequest):
    """Perform semantic vector similarity search against FAISS index."""
    results = await rag_service.search(payload.query, top_k=payload.top_k or 4)
    return {
        "success": True,
        "query": payload.query,
        "count": len(results),
        "results": results
    }

@router.get("/documents")
async def list_indexed_documents():
    """List all indexed document chunks in the RAG vector store."""
    return {
        "success": True,
        "total_chunks": len(rag_service.chunks),
        "documents": [
            {
                "id": c["id"],
                "title": c["title"],
                "category": c.get("metadata", {}).get("category", "General"),
                "snippet": c["text"][:120] + "..."
            } for c in rag_service.chunks
        ]
    }
