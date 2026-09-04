import os
import pickle
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from app.services.llm_client import llm_client

logger = logging.getLogger("businessmind.rag")

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("faiss package not installed; falling back to numpy cosine similarity.")

INDEX_FILE = "data/business.index"
CHUNKS_FILE = "data/chunks.pkl"

class RAGService:
    def __init__(self, vector_dim: int = 384):
        self.vector_dim = vector_dim
        self.chunks: List[Dict[str, Any]] = []
        self.embeddings_matrix: Optional[np.ndarray] = None
        self.index = None
        self._ensure_storage_dir()
        self._load_or_initialize()

    def _ensure_storage_dir(self):
        os.makedirs("data", exist_ok=True)

    def _load_or_initialize(self):
        """Load index from disk or initialize empty vector store with comprehensive seed data."""
        if os.path.exists(CHUNKS_FILE) and os.path.exists(INDEX_FILE) and FAISS_AVAILABLE:
            try:
                with open(CHUNKS_FILE, "rb") as f:
                    self.chunks = pickle.load(f)
                self.index = faiss.read_index(INDEX_FILE)
                logger.info(f"Loaded existing FAISS index with {len(self.chunks)} document chunks.")
                return
            except Exception as e:
                logger.error(f"Error loading FAISS index from disk: {e}")

        # Seed initial enterprise business knowledge if empty
        self.seed_sample_documents()

    def seed_sample_documents(self):
        """Seed core business knowledge documents into RAG vector store."""
        sample_docs = [
            {
                "title": "Seasonal Sales Trends & Historical Variance Analysis",
                "category": "Sales Analysis",
                "content": """Historical Seasonal Analysis & Mid-Year Fluctuations:
1. Mid-Year Summer Deceleration: Enterprise B2B sales typically experience a 10% to 15% seasonal volume dip during July and August due to annual corporate procurement budgeting cycles and summer holiday schedules.
2. Root Causes of July Variance:
   - Extended client decision cycles and delayed signing of enterprise contracts.
   - Supply chain transit delays in hardware and electronics replenishment.
   - Reduced responsiveness in retail vendor restocking.
3. Management Action Plan for Sales Recovery:
   - Launch mid-summer strategic incentive packages (e.g. 5% prepaid discount on multi-year renewals).
   - Accelerate high-margin software & digital add-ons which have instant fulfillment cycles.
   - Reallocate paid marketing campaigns toward high-converting inbound B2B channels."""
            },
            {
                "title": "Profitability & Margin Optimization Playbook",
                "category": "Strategic Finance",
                "content": """Enterprise Margin Enhancement Strategy:
1. Category Margin Prioritization: Shift sales incentive compensation toward high-gross-margin categories (Software & Services: 68% margin, Electronics: 42% margin) while curtailing low-margin discount heavy items.
2. Operating Cost Reductions:
   - Renegotiate cloud infrastructure and reserved server capacity (projected ₹350k quarterly savings).
   - Eliminate redundant software tooling across regional sales hubs.
3. Pricing & Discount Discipline: Enforce a strict maximum 8% ad-hoc discount threshold for sales representatives. Any discount exceeding 10% requires VP Finance approval.
4. Customer Retention & Upselling: Increase expansion revenue from existing accounts, where customer acquisition cost (CAC) is near zero and profit realization exceeds 85%."""
            },
            {
                "title": "Q3 Enterprise Sales & Revenue Report",
                "category": "Sales Report",
                "content": """Q3 Enterprise Revenue Summary:
Total revenue for Q3 reached ₹14.2M, representing a 12.4% year-over-year increase.
Key Drivers of Growth:
1. Expansion into mid-market retail accounts generated ₹3.5M in net new ARR.
2. Enterprise product adoption grew by 18%, driven by cloud integration features.
3. Marketing ROI stood at 24.6%, returning ₹4.20 per dollar spent on digital performance channels.
Revenue Breakdown by Sector:
- Retail & Commerce: ₹5.8M (40.8%)
- Financial Services: ₹4.2M (29.5%)
- Logistics & Supply Chain: ₹2.6M (18.3%)
- Professional Services: ₹1.6M (11.4%)"""
            },
            {
                "title": "Enterprise Refund & Cancellation Policy 2025",
                "category": "Policy",
                "content": """Corporate Refund & Subscription Policy:
1. Standard Subscription Cancellations: Clients may cancel annual enterprise subscriptions within 30 calendar days of renewal for a full 100% refund.
2. Partial Period Adjustments: SLA violations resulting in uptime below 99.5% trigger an automatic 15% service credit on the subsequent monthly billing cycle.
3. Custom Development Add-ons: Non-refundable once project milestone delivery sign-off is recorded.
4. Support Escalations: Refund requests above ₹100,000 require approval from the Chief Operating Officer."""
            },
            {
                "title": "Marketing Campaign & Customer Acquisition Strategy",
                "category": "Marketing",
                "content": """2025 Growth & Marketing Strategy:
Target Customer Acquisition Cost (CAC): ₹12,500 per enterprise account.
Customer Lifetime Value (LTV): ₹185,000, yielding an LTV:CAC ratio of 14.8x.
Primary Growth Channels:
- Inbound SEO & Thought Leadership Reports: Accounted for 42% of qualified leads.
- B2B Partner Ecosystem: Responsible for 31% of total enterprise pipeline.
- Paid LinkedIn Advertising: High CAC but highest average deal size (₹450k ACV).
Customer Churn Strategy: Dedicated onboarding reduces 90-day churn from 8.2% to 2.1%."""
            }
        ]

        self.chunks = []
        self.embeddings_matrix = None
        for doc in sample_docs:
            self.add_document(doc["title"], doc["content"], metadata={"category": doc["category"]})

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """Split document text into overlapping chunks."""
        chunks = []
        start = 0
        text_len = len(text)
        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += chunk_size - overlap
        return chunks

    def add_document(self, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        """Process document into chunks, generate deterministic/fast embeddings, and index into FAISS."""
        text_chunks = self.chunk_text(content)
        new_count = 0

        for idx, chunk_text in enumerate(text_chunks):
            vec = llm_client._fallback_text_to_vector(chunk_text, self.vector_dim)

            chunk_meta = {
                "id": len(self.chunks),
                "title": title,
                "chunk_index": idx,
                "text": chunk_text,
                "metadata": metadata or {}
            }
            self.chunks.append(chunk_meta)
            
            vec_np = np.array([vec], dtype=np.float32)
            if self.embeddings_matrix is None:
                self.embeddings_matrix = vec_np
            else:
                self.embeddings_matrix = np.vstack([self.embeddings_matrix, vec_np])

            new_count += 1

        self._rebuild_index()
        return new_count

    def _rebuild_index(self):
        """Rebuild FAISS vector index and persist to disk."""
        if self.embeddings_matrix is None or len(self.embeddings_matrix) == 0:
            return

        dim = self.embeddings_matrix.shape[1]
        if FAISS_AVAILABLE:
            try:
                self.index = faiss.IndexFlatL2(dim)
                self.index.add(self.embeddings_matrix.astype(np.float32))
                faiss.write_index(self.index, INDEX_FILE)
                with open(CHUNKS_FILE, "wb") as f:
                    pickle.dump(self.chunks, f)
            except Exception as e:
                logger.warning(f"Could not persist FAISS index: {e}")

    async def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Semantic similarity search against vector store with keyword relevance scoring."""
        if not self.chunks:
            return []

        # Vector search
        query_vec = llm_client._fallback_text_to_vector(query, self.vector_dim)
        query_np = np.array([query_vec], dtype=np.float32)

        scored_results = []
        query_terms = set(query.lower().split())

        for idx, chunk in enumerate(self.chunks):
            chunk_text = chunk.get("text", "").lower()
            title = chunk.get("title", "").lower()
            
            # Match keyword overlap bonus
            keyword_score = sum(3.0 for term in query_terms if term in title and len(term) > 3)
            keyword_score += sum(1.0 for term in query_terms if term in chunk_text and len(term) > 3)

            # Vector distance
            if self.embeddings_matrix is not None and idx < len(self.embeddings_matrix):
                chunk_vec = self.embeddings_matrix[idx]
                dist = float(np.linalg.norm(chunk_vec - query_np[0]))
                final_score = max(0.1, 10.0 - dist) + keyword_score
            else:
                final_score = keyword_score

            chunk_copy = chunk.copy()
            chunk_copy["score"] = round(final_score, 4)
            scored_results.append(chunk_copy)

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:top_k]

    async def sync_and_train_from_database(self) -> Dict[str, Any]:
        """
        Extract fresh tables, uploaded datasets, and business records from MySQL businessmind_db,
        synthesize executive knowledge artifacts, and index/train FAISS RAG vector memory for Ollama.
        """
        from app.db.mysql_client import mysql_client
        
        chunks_added = 0
        timestamp = str(np.datetime64('now'))

        try:
            # 1. Query uploaded datasets ledger
            datasets = await mysql_client.query(
                "SELECT id, file_name, file_type, total_rows, indexed_in_rag, created_at FROM uploaded_datasets ORDER BY created_at DESC"
            )

            # 2. Query aggregate financial performance
            summary = await mysql_client.query_one("""
                SELECT 
                    COUNT(*) as total_records,
                    ROUND(SUM(revenue), 2) as total_revenue,
                    ROUND(SUM(cost), 2) as total_cost,
                    ROUND(SUM(profit), 2) as total_profit,
                    ROUND(AVG(unit_price), 2) as avg_price,
                    SUM(quantity) as total_qty
                FROM sales_records
            """)

            # 3. Query category breakdown
            categories = await mysql_client.query("""
                SELECT category, ROUND(SUM(revenue), 2) as cat_revenue, ROUND(SUM(profit), 2) as cat_profit, 
                       SUM(quantity) as cat_qty, COUNT(*) as deal_count
                FROM sales_records
                GROUP BY category
                ORDER BY cat_revenue DESC
            """)

            # 4. Query top products
            top_products = await mysql_client.query("""
                SELECT product_name, category, ROUND(SUM(revenue), 2) as prod_revenue, 
                       ROUND(SUM(profit), 2) as prod_profit, SUM(quantity) as prod_qty
                FROM sales_records
                GROUP BY product_name, category
                ORDER BY prod_revenue DESC
                LIMIT 15
            """)

            # 5. Query regional distribution
            regions = await mysql_client.query("""
                SELECT customer_region, ROUND(SUM(revenue), 2) as region_revenue, 
                       ROUND(SUM(profit), 2) as region_profit, COUNT(*) as deals
                FROM sales_records
                GROUP BY customer_region
                ORDER BY region_revenue DESC
            """)

            # 6. Query recent transactions / uploaded rows
            recent_rows = await mysql_client.query("""
                SELECT transaction_date, product_name, category, quantity, unit_price, revenue, profit, customer_region
                FROM sales_records
                ORDER BY created_at DESC, transaction_date DESC
                LIMIT 25
            """)

            # Synthesize Document 1: Datasets Ledger & Inventory Knowledge
            dataset_lines = []
            if datasets:
                for d in datasets:
                    dataset_lines.append(f"- File '{d['file_name']}' ({d['file_type']}): {d['total_rows']} rows, uploaded on {str(d.get('created_at', ''))[:16]}")
            else:
                dataset_lines.append("- Baseline enterprise database tables active.")

            doc1_content = f"""Enterprise Business Database & Uploaded Datasets Ledger:
Database: businessmind_db | Synchronized: {timestamp}
Active Ingested Datasets in System:
{chr(10).join(dataset_lines)}

Total Sales & Business Records Active: {summary.get('total_records', 0) if summary else 0}
Total System Revenue: ₹{float(summary.get('total_revenue') or 0):,.2f}
Total System Operating Profit: ₹{float(summary.get('total_profit') or 0):,.2f}
Overall Profit Margin: {(float(summary.get('total_profit') or 0) / float(summary.get('total_revenue') or 1) * 100):.1f}%
Total Units Transacted: {int(summary.get('total_qty') or 0):,} deals / items
Average Unit Price: ₹{float(summary.get('avg_price') or 0):,.2f}"""

            chunks_added += self.add_document(
                title="Business Database Datasets & Financial Summary Ledger",
                content=doc1_content,
                metadata={"category": "Database Ingestion", "source": "businessmind_db"}
            )

            # Synthesize Document 2: Product & Category Performance Knowledge
            cat_lines = []
            for c in (categories or []):
                cat_lines.append(f"- Category '{c['category']}': Revenue ₹{float(c['cat_revenue']):,.2f}, Profit ₹{float(c['cat_profit']):,.2f}, Qty {int(c['cat_qty'] or 0)}, Deals {c['deal_count']}")
            
            prod_lines = []
            for p in (top_products or []):
                prod_lines.append(f"- Product '{p['product_name']}' ({p['category']}): Revenue ₹{float(p['prod_revenue']):,.2f}, Profit ₹{float(p['prod_profit']):,.2f}, Qty {int(p['prod_qty'] or 0)}")

            doc2_content = f"""Enterprise Product Catalog & Category Revenue Analysis:
Category Margin and Revenue Performance Breakdown:
{chr(10).join(cat_lines) if cat_lines else "No categories recorded."}

Top Individual Products by Sales & Margin:
{chr(10).join(prod_lines) if prod_lines else "No products recorded."}

Use this document to answer queries regarding best-selling products, category profitability, and merchandise unit volumes."""

            chunks_added += self.add_document(
                title="Product Catalog & Category Performance Analysis",
                content=doc2_content,
                metadata={"category": "Product Analytics", "source": "businessmind_db"}
            )

            # Synthesize Document 3: Recent Uploaded Records & Regional Sales Knowledge
            reg_lines = []
            for r in (regions or []):
                reg_lines.append(f"- Region '{r['customer_region']}': Revenue ₹{float(r['region_revenue']):,.2f}, Profit ₹{float(r['region_profit']):,.2f}, Total Deals {r['deals']}")

            tx_lines = []
            for tx in (recent_rows or []):
                tx_lines.append(f"- [{tx['transaction_date']}] {tx['product_name']} ({tx['category']}): Qty {tx['quantity']} @ ₹{float(tx['unit_price']):,.2f} = Rev ₹{float(tx['revenue']):,.2f} (Profit: ₹{float(tx['profit'] or 0):,.2f}) [{tx.get('customer_region', 'Domestic')}]")

            doc3_content = f"""Recent Uploaded Transaction Records & Geographic Market Demand:
Regional Market Revenue Breakdown:
{chr(10).join(reg_lines) if reg_lines else "General domestic distribution."}

Granular Uploaded Sales Records & Transactions Sample:
{chr(10).join(tx_lines) if tx_lines else "No granular transactions recorded."}

This data reflects the latest datasets ingested directly into businessmind_db."""

            chunks_added += self.add_document(
                title="Recent Uploaded Transaction Records & Geographic Markets",
                content=doc3_content,
                metadata={"category": "Uploaded Dataset", "source": "businessmind_db"}
            )

            # Mark all unindexed datasets as indexed
            await mysql_client.execute("UPDATE uploaded_datasets SET indexed_in_rag = TRUE")

            return {
                "success": True,
                "message": f"Successfully synchronized and trained Ollama RAG from businessmind_db. Added {chunks_added} chunks.",
                "total_chunks_indexed": len(self.chunks),
                "chunks_added_this_session": chunks_added,
                "database_records_processed": summary.get("total_records", 0) if summary else 0,
                "datasets_synced": len(datasets) if datasets else 0,
                "synced_at": timestamp
            }

        except Exception as err:
            logger.error(f"Error syncing and training RAG from database: {err}")
            return {
                "success": False,
                "message": f"Sync & training failed: {str(err)}",
                "total_chunks_indexed": len(self.chunks)
            }

rag_service = RAGService()

