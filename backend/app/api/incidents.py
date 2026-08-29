from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.incident import IncidentCreate, IncidentResponse
from backend.app.services.incident_service import IncidentService


router = APIRouter(
    prefix="/api/v1/incidents",
    tags=["Incidents"],
)


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
):
    return IncidentService.create_incident(db, data)


@router.get(
    "",
    response_model=list[IncidentResponse],
)
def get_incidents(
    db: Session = Depends(get_db),
):
    return IncidentService.get_incidents(db)


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = IncidentService.get_incident(db, incident_id)

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return incident