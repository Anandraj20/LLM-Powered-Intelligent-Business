import logging
import re

logger = logging.getLogger("businessmind.router")

class RouterService:
    async def classify_question(self, question: str) -> str:
        """
        Fast & accurate classification into:
        - GENERAL: Greetings, casual introductions, capabilities inquiries
        - SQL    : Live database metrics (revenue, sales totals, profit margins, monthly data, counts)
        - RAG    : Corporate documents (policies, refunds, marketing plans, strategic guidelines)
        - BOTH   : Complex business questions needing financial aggregates + textual reasoning
        """
        classification = self._heuristic_routing(question)
        logger.info(f"Router classified question '{question}' as [{classification}]")
        return classification

    def _heuristic_routing(self, question: str) -> str:
        """Rule-based semantic heuristic classifier."""
        q = question.lower().strip()
        
        # 1. Check for conversational / greeting queries
        greeting_patterns = [
            r"^(hi|hii+|hey|hello|holla|greetings|good morning|good afternoon|good evening)\b",
            r"^(who are you|what can you do|how can you help|help me|what are you)\b",
            r"^(thanks|thank you|bye|goodbye)\b"
        ]
        if any(re.search(pat, q) for pat in greeting_patterns) and len(q.split()) <= 6:
            return "GENERAL"

        sql_keywords = [
            "revenue", "profit", "sales", "total", "count", "margin", "forecast",
            "number", "growth", "churn", "roi", "cost", "q1", "q2", "q3", "q4", 
            "2025", "2024", "transaction", "unit", "price", "amount", "sold", 
            "average", "highest", "lowest", "july", "august", "june", "monthly"
        ]
        rag_keywords = [
            "policy", "refund", "strategy", "report", "why", "cause", "explain",
            "document", "terms", "condition", "plan", "guide", "procedure", "how",
            "compliance", "sla", "cancellation", "guideline", "onboarding", "action",
            "increase", "decrease", "improve", "optimize", "reduce"
        ]

        has_sql = any(kw in q for kw in sql_keywords)
        has_rag = any(kw in q for kw in rag_keywords)

        if has_sql and has_rag:
            return "BOTH"
        elif has_sql:
            return "SQL"
        elif has_rag:
            return "RAG"
        else:
            return "BOTH"

router_service = RouterService()
