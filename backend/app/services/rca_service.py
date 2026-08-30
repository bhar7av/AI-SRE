from sqlalchemy.orm import Session

from backend.app.services.context_service import ContextService
from backend.app.services.llm_service import LLMService


class RCAService:

    @staticmethod
    def analyze(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        # Collect incident + telemetry + logs
        context = ContextService.collect(
            db,
            incident_id,
        )

        if context is None:
            return None

        # Send the complete context to the LLM
        ai_analysis = LLMService.analyze(
            context
        )

        # Return a consistent API response
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
                "Impact assessment unavailable."
            ),
            "requires_human_approval": ai_analysis.get(
                "requires_human_approval",
                True
            ),
        }
