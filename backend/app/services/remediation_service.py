from sqlalchemy.orm import Session

from backend.app.services.context_service import ContextService
from backend.app.services.llm_service import LLMService


class RemediationService:

    # These are the ONLY actions that can reach ExecutorService.
    ALLOWED_ACTIONS = {
        "scale_service",
        "restart_service",
        "rollback_deployment",
        "increase_resources",
        "reduce_load",
        "clear_cache",
    }

    @staticmethod
    def _select_action(
        incident: dict,
        recommendation: str,
    ) -> str:
        """
        Convert the LLM's free-form recommendation
        into one predefined safe remediation action.
        """

        recommendation_lower = (
            recommendation or ""
        ).lower()

        # Scale service.
        if (
            "scale" in recommendation_lower
            or "scaling" in recommendation_lower
            or "scale up" in recommendation_lower
        ):
            return "scale_service"

        # Restart service.
        if (
            "restart" in recommendation_lower
            or "reboot" in recommendation_lower
        ):
            return "restart_service"

        # Rollback.
        if (
            "rollback" in recommendation_lower
            or "roll back" in recommendation_lower
        ):
            return "rollback_deployment"

        # Increase resources.
        if (
            "increase resource" in recommendation_lower
            or "increase cpu" in recommendation_lower
            or "increase memory" in recommendation_lower
            or "add resource" in recommendation_lower
        ):
            return "increase_resources"

        # Reduce load.
        if (
            "reduce load" in recommendation_lower
            or "reduce traffic" in recommendation_lower
            or "reduce request" in recommendation_lower
        ):
            return "reduce_load"

        # Clear cache.
        if (
            "clear cache" in recommendation_lower
            or "flush cache" in recommendation_lower
            or "cache" in recommendation_lower
        ):
            return "clear_cache"

        # Safe fallback.
        return "scale_service"

    @staticmethod
    def _fallback_analysis(
        context: dict,
    ) -> dict:
        """
        Deterministic fallback used when the LLM is unavailable.

        This is particularly useful when Hugging Face returns
        a temporary 429 / engine_overloaded response.
        """

        incident = context["incident"]

        severity = incident["severity"]
        title = incident["title"]
        description = incident["description"]

        metrics = context.get(
            "metrics",
            [],
        )

        evidence = []

        for metric in metrics:
            evidence.append(
                f'{metric["name"]}={metric["value"]}'
            )

        # Determine a sensible action from observed telemetry.
        action = "scale_service"

        title_lower = title.lower()
        description_lower = description.lower()

        combined = (
            title_lower
            + " "
            + description_lower
        )

        if "latency" in combined:
            action = "scale_service"

        elif "error" in combined:
            action = "restart_service"

        elif "cpu" in combined:
            action = "scale_service"

        elif "memory" in combined:
            action = "increase_resources"

        return {
            "root_cause": (
                "The incident is associated with "
                f"the observed condition: {description}"
            ),
            "confidence": 60,
            "evidence": evidence,
            "impact": (
                f"Incident severity is {severity}."
            ),
            "recommendation": (
                f"Use the predefined remediation action "
                f"{action}."
            ),
            "requires_human_approval": True,
        }

    @staticmethod
    def plan(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        context = ContextService.collect(
            db,
            incident_id,
        )

        if context is None:
            return None

        llm_error = None

        try:
            # Ask the LLM for analysis.
            ai_result = LLMService.analyze(
                {
                    "task": "remediation_planning",
                    "incident": context["incident"],
                    "metrics": context["metrics"],
                    "logs": context["logs"],
                }
            )

        except Exception as exc:
            # Hugging Face can temporarily return 429
            # when the model is overloaded.
            llm_error = str(exc)

            ai_result = RemediationService._fallback_analysis(
                context
            )

        recommendation = ai_result.get(
            "recommendation",
            "Investigate the incident and collect "
            "additional evidence.",
        )

        root_cause = ai_result.get(
            "root_cause",
            "Root cause could not be determined.",
        )

        action = RemediationService._select_action(
            context["incident"],
            recommendation,
        )

        # Final safety validation.
        if action not in RemediationService.ALLOWED_ACTIONS:
            action = "scale_service"

        risk = (
            "critical"
            if context["incident"]["severity"] == "critical"
            else "high"
            if context["incident"]["severity"] == "high"
            else "medium"
        )

        result = {
            "incident_id": incident_id,
            "action": action,
            "recommendation": recommendation,
            "reason": root_cause,
            "risk": risk,
            "requires_approval": True,
            "steps": [
                "Review the proposed remediation.",
                "Verify the affected service and current telemetry.",
                "Obtain human approval before execution.",
                f"Execute the approved action: {action}.",
                "Verify service health after execution.",
            ],
        }

        # Tell the API consumer that fallback was used,
        # without exposing the raw exception.
        if llm_error is not None:
            result["analysis_source"] = "deterministic_fallback"
            result["llm_available"] = False
        else:
            result["analysis_source"] = "llm"
            result["llm_available"] = True

        return result