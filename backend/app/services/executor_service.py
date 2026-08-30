from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.services.audit_service import AuditService


class ExecutorService:

    ALLOWED_ACTIONS = {
        "scale_service",
        "restart_service",
        "clear_cache",
    }

    @staticmethod
    def execute(
        db: Session,
        incident_id: str,
        action: str,
    ) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        # Validate action.
        if action not in ExecutorService.ALLOWED_ACTIONS:

            AuditService.record(
                db=db,
                incident_id=incident_id,
                action="REMEDIATION_EXECUTION",
                status="REJECTED",
                details=(
                    f"Action '{action}' is not allowlisted."
                ),
            )

            return {
                "incident_id": incident_id,
                "action": action,
                "status": "rejected",
                "executed": False,
                "message": (
                    f"Action '{action}' is not allowed."
                ),
            }

        # Simulation only.
        simulation_messages = {
            "scale_service": (
                "Service scaling action simulated successfully."
            ),
            "restart_service": (
                "Service restart action simulated successfully."
            ),
            "clear_cache": (
                "Cache clearing action simulated successfully."
            ),
        }

        message = simulation_messages[action]

        # Record execution.
        AuditService.record(
            db=db,
            incident_id=incident_id,
            action="REMEDIATION_EXECUTION",
            status="EXECUTED",
            details=(
                f"Action '{action}' executed in simulation mode. "
                f"{message}"
            ),
        )

        # Resolve only after successful execution.
        incident.status = "resolved"

        db.commit()
        db.refresh(incident)

        return {
            "incident_id": incident_id,
            "action": action,
            "status": "executed",
            "executed": True,
            "execution_mode": "simulation",
            "message": message,
            "rollback_available": True,
        }

    @staticmethod
    def rollback(
        db: Session,
        incident_id: str,
    ) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        # Rollback is only possible for a resolved incident.
        if incident.status != "resolved":

            AuditService.record(
                db=db,
                incident_id=incident_id,
                action="REMEDIATION_ROLLBACK",
                status="BLOCKED",
                details=(
                    "Rollback attempted on a non-resolved incident."
                ),
            )

            return {
                "incident_id": incident_id,
                "status": "blocked",
                "rolled_back": False,
                "message": (
                    "Rollback is only available after "
                    "successful remediation execution."
                ),
            }

        # An approved action must exist.
        action = incident.approved_action

        if not action:

            AuditService.record(
                db=db,
                incident_id=incident_id,
                action="REMEDIATION_ROLLBACK",
                status="REJECTED",
                details=(
                    "No approved remediation action "
                    "is available for rollback."
                ),
            )

            return {
                "incident_id": incident_id,
                "status": "rejected",
                "rolled_back": False,
                "message": (
                    "No approved remediation action "
                    "is available for rollback."
                ),
            }

        # Simulation rollback messages.
        rollback_messages = {
            "scale_service": (
                "Service scaling rollback simulated successfully."
            ),
            "restart_service": (
                "Service restart rollback simulated successfully."
            ),
            "clear_cache": (
                "Cache clearing rollback simulated successfully."
            ),
        }

        message = rollback_messages.get(
            action,
            "Remediation rollback simulated successfully.",
        )

        # Record rollback.
        AuditService.record(
            db=db,
            incident_id=incident_id,
            action="REMEDIATION_ROLLBACK",
            status="ROLLED_BACK",
            details=(
                f"Action '{action}' rolled back in simulation mode. "
                f"{message}"
            ),
        )

        # Reopen the incident.
        incident.status = "open"

        db.commit()
        db.refresh(incident)

        return {
            "incident_id": incident_id,
            "action": action,
            "status": "rolled_back",
            "rolled_back": True,
            "execution_mode": "simulation",
            "message": message,
        }