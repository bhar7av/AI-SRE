from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.models.telemetry import Metric, LogEvent


class ContextService:

    @staticmethod
    def collect(db: Session, incident_id: str) -> dict | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        metrics = (
            db.execute(
                select(Metric)
                .where(Metric.service_id == incident.service)
                .order_by(Metric.timestamp.desc())
                .limit(20)
            )
            .scalars()
            .all()
        )

        logs = (
            db.execute(
                select(LogEvent)
                .where(LogEvent.service_id == incident.service)
                .order_by(LogEvent.timestamp.desc())
                .limit(20)
            )
            .scalars()
            .all()
        )

        return {
            "incident": {
                "id": incident.id,
                "service": incident.service,
                "severity": incident.severity,
                "title": incident.title,
                "description": incident.description,
                "source": incident.source,
                "status": incident.status,
                "created_at": incident.created_at.isoformat(),
            },
            "metrics": [
                {
                    "name": metric.metric_name,
                    "value": metric.value,
                    "timestamp": metric.timestamp.isoformat(),
                }
                for metric in metrics
            ],
            "logs": [
                {
                    "level": log.level,
                    "message": log.message,
                    "timestamp": log.timestamp.isoformat(),
                }
                for log in logs
            ],
        }
