from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentStatus,
)


class IncidentService:

    @staticmethod
    def create_incident(
        db: Session,
        data: IncidentCreate,
    ) -> IncidentResponse:

        incident = Incident(
            id=f"INC-{uuid4().hex[:8].upper()}",
            service=data.service,
            severity=data.severity.value,
            title=data.title,
            description=data.description,
            source=data.source,
            status=IncidentStatus.OPEN.value,
            created_at=datetime.now(timezone.utc),
        )

        db.add(incident)
        db.commit()
        db.refresh(incident)

        return IncidentResponse(
            id=incident.id,
            service=incident.service,
            severity=incident.severity,
            title=incident.title,
            description=incident.description,
            source=incident.source,
            status=incident.status,
            created_at=incident.created_at,
        )

    @staticmethod
    def get_incidents(
        db: Session,
    ) -> list[IncidentResponse]:

        result = db.execute(
            select(Incident).order_by(Incident.created_at.desc())
        )

        incidents = result.scalars().all()

        return [
            IncidentResponse(
                id=incident.id,
                service=incident.service,
                severity=incident.severity,
                title=incident.title,
                description=incident.description,
                source=incident.source,
                status=incident.status,
                created_at=incident.created_at,
            )
            for incident in incidents
        ]

    @staticmethod
    def get_incident(
        db: Session,
        incident_id: str,
    ) -> IncidentResponse | None:

        incident = db.get(Incident, incident_id)

        if incident is None:
            return None

        return IncidentResponse(
            id=incident.id,
            service=incident.service,
            severity=incident.severity,
            title=incident.title,
            description=incident.description,
            source=incident.source,
            status=incident.status,
            created_at=incident.created_at,
        )