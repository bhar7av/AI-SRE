from sqlalchemy.orm import Session

from backend.app.services.context_service import ContextService
from backend.app.services.knowledge_service import KnowledgeService
from backend.app.services.llm_service import LLMService


class RCAService:

    @staticmethod
    def analyze(
        db: Session,
        incident_id: str,
    ) -> dict | None:
        """
        Perform AI-assisted root cause analysis.

        Pipeline:

        Incident
            ↓
        Context Collection
            ↓
        RAG Knowledge Retrieval
            ↓
        LLM Analysis
            ↓
        Grounded RCA Result
        """

        # ---------------------------------------------------------
        # 1. Collect incident evidence
        # ---------------------------------------------------------

        context = ContextService.collect(
            db,
            incident_id,
        )

        if context is None:
            return None

        # ---------------------------------------------------------
        # 2. Retrieve relevant operational knowledge
        # ---------------------------------------------------------

        knowledge = KnowledgeService.retrieve_for_incident(
            context,
            top_k=3,
        )

        # ---------------------------------------------------------
        # 3. Enrich context with retrieved knowledge
        # ---------------------------------------------------------

        enriched_context = {
            **context,
            "knowledge": knowledge,
        }

        # ---------------------------------------------------------
        # 4. Run LLM analysis
        # ---------------------------------------------------------

        ai_analysis = LLMService.analyze(
            enriched_context,
        )

        # ---------------------------------------------------------
        # 5. Build stable API response
        # ---------------------------------------------------------

        return {
            "incident_id": incident_id,

            "service": context["incident"]["service"],

            "incident": {
                "severity": context["incident"]["severity"],
                "title": context["incident"]["title"],
                "description": context["incident"]["description"],
                "source": context["incident"]["source"],
                "status": context["incident"]["status"],
            },

            "root_cause": ai_analysis["root_cause"],

            "confidence": ai_analysis["confidence"],

            "recommendation": ai_analysis["recommendation"],

            "evidence": ai_analysis["evidence"],

            "impact": ai_analysis.get(
                "impact",
                "Impact assessment unavailable.",
            ),

            # Safety invariant.
            # RCA can never authorize remediation.
            "requires_human_approval": True,

            # Sources actually retrieved by the RAG layer.
            "knowledge_sources": [
                item.get(
                    "source",
                    "unknown",
                )
                for item in knowledge
            ],
        }