from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.app.models.audit_log import AuditLog


class AuditService:

    @staticmethod
    def record(
        db: Session,
        incident_id: str,
        action: str,
        status: str,
        details: str | None = None,
    ) -> AuditLog:

        entry = AuditLog(
            incident_id=incident_id,
            action=action,
            status=status,
            details=details,
            created_at=datetime.now(timezone.utc),
        )

        db.add(entry)
        db.commit()
        db.refresh(entry)

        return entry

    @staticmethod
    def get_incident_logs(
        db: Session,
        incident_id: str,
    ) -> list[AuditLog]:

        return (
            db.query(AuditLog)
            .filter(AuditLog.incident_id == incident_id)
            .order_by(AuditLog.created_at.desc())
            .all()
        )
