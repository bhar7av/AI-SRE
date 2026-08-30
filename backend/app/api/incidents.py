from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db

from backend.app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
)

from backend.app.services.audit_service import AuditService
from backend.app.services.approval_service import ApprovalService
from backend.app.services.context_service import ContextService
from backend.app.services.detection_service import DetectionService
from backend.app.services.incident_service import IncidentService
from backend.app.services.rca_service import RCAService
from backend.app.services.remediation_service import RemediationService


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


@router.post(
    "/detect",
    response_model=list[IncidentResponse],
)
def detect_incidents(
    db: Session = Depends(get_db),
):
    return DetectionService.detect(db)


@router.get(
    "/{incident_id}/analysis",
)
def analyze_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    analysis = RCAService.analyze(
        db,
        incident_id,
    )

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return analysis


@router.get(
    "/{incident_id}/context",
)
def get_incident_context(
    incident_id: str,
    db: Session = Depends(get_db),
):
    context = ContextService.collect(
        db,
        incident_id,
    )

    if context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return context


@router.get(
    "/{incident_id}/remediation",
)
def get_remediation_plan(
    incident_id: str,
    db: Session = Depends(get_db),
):
    plan = RemediationService.plan(
        db,
        incident_id,
    )

    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return plan


@router.post(
    "/{incident_id}/approve",
)
def approve_remediation(
    incident_id: str,
    db: Session = Depends(get_db),
):
    result = ApprovalService.approve(
        db,
        incident_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return result


@router.post(
    "/{incident_id}/execute",
)
def execute_remediation(
    incident_id: str,
    db: Session = Depends(get_db),
):
    result = ApprovalService.execute(
        db,
        incident_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return result


@router.post(
    "/{incident_id}/rollback",
)
def rollback_remediation(
    incident_id: str,
    db: Session = Depends(get_db),
):
    result = ApprovalService.rollback(
        db,
        incident_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return result


@router.get(
    "/{incident_id}/audit",
)
def get_incident_audit(
    incident_id: str,
    db: Session = Depends(get_db),
):
    logs = AuditService.get_incident_logs(
        db,
        incident_id,
    )

    return [
        {
            "id": log.id,
            "incident_id": log.incident_id,
            "action": log.action,
            "status": log.status,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = IncidentService.get_incident(
        db,
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )

    return incident