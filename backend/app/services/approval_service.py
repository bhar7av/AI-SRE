from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.services.audit_service import AuditService
from backend.app.services.executor_service import ExecutorService
from backend.app.services.remediation_service import RemediationService


class ApprovalService:

    @staticmethod
    def approve(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        if incident.status == "resolved":

            AuditService.record(
                db,
                incident_id,
                "REMEDIATION_APPROVAL",
                "REJECTED",
                "Incident is already resolved.",
            )

            return {
                "incident_id": incident_id,
                "status": "already_resolved",
                "message": "Incident is already resolved.",
            }

        plan = RemediationService.plan(
            db,
            incident_id,
        )

        if plan is None:
            return None

        action = plan.get("action")

        if not action:

            AuditService.record(
                db,
                incident_id,
                "REMEDIATION_APPROVAL",
                "REJECTED",
                "Remediation plan did not contain an action.",
            )

            return {
                "incident_id": incident_id,
                "status": "rejected",
                "message": (
                    "Remediation approval rejected because "
                    "no action was provided."
                ),
            }

        # Store the exact action approved by the human.
        incident.approved_action = action
        incident.status = "investigating"

        db.commit()
        db.refresh(incident)

        AuditService.record(
            db,
            incident_id,
            "REMEDIATION_APPROVAL",
            "APPROVED",
            (
                "Human approval granted for remediation. "
                f"Approved action: {action}"
            ),
        )

        return {
            "incident_id": incident_id,
            "status": "approved",
            "approval": {
                "approved": True,
                "requires_approval": True,
            },
            "remediation_plan": plan,
            "approved_action": action,
            "message": "Remediation approved. Execution can proceed.",
        }

    @staticmethod
    def execute(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        # Approval is mandatory.
        if incident.status != "investigating":

            AuditService.record(
                db,
                incident_id,
                "REMEDIATION_EXECUTION",
                "BLOCKED",
                "Execution attempted without human approval.",
            )

            return {
                "incident_id": incident_id,
                "status": "blocked",
                "executed": False,
                "message": (
                    "Execution blocked. "
                    "Human approval is required before execution."
                ),
            }

        # NEVER regenerate the LLM plan here.
        action = incident.approved_action

        if not action:

            AuditService.record(
                db,
                incident_id,
                "REMEDIATION_EXECUTION",
                "REJECTED",
                "No approved remediation action was stored.",
            )

            return {
                "incident_id": incident_id,
                "status": "rejected",
                "executed": False,
                "message": (
                    "Execution rejected because no approved "
                    "remediation action was found."
                ),
            }

        return ExecutorService.execute(
            db,
            incident_id,
            action,
        )

    @staticmethod
    def rollback(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        return ExecutorService.rollback(
            db,
            incident_id,
        )