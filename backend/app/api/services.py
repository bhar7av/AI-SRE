from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.service import Service, ServiceDependency
from backend.app.schemas.service import (
    DependencyCreate,
    DependencyResponse,
    ServiceCreate,
    ServiceResponse,
)


router = APIRouter(
    prefix="/api/v1/services",
    tags=["Services"],
)


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
):
    existing = db.execute(
        select(Service).where(Service.name == data.name)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Service already exists",
        )

    service = Service(
        id=f"SVC-{uuid4().hex[:8].upper()}",
        name=data.name,
        description=data.description,
        owner=data.owner,
        environment=data.environment,
        repository=data.repository,
        health_endpoint=data.health_endpoint,
        created_at=datetime.now(timezone.utc),
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.get(
    "",
    response_model=list[ServiceResponse],
)
def get_services(
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(Service).order_by(Service.created_at.desc())
    )

    return result.scalars().all()


@router.get(
    "/{service_id}",
    response_model=ServiceResponse,
)
def get_service(
    service_id: str,
    db: Session = Depends(get_db),
):
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    return service


@router.post(
    "/{service_id}/dependencies",
    response_model=DependencyResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_dependency(
    service_id: str,
    data: DependencyCreate,
    db: Session = Depends(get_db),
):
    service = db.get(Service, service_id)
    dependency = db.get(Service, data.dependency_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    if dependency is None:
        raise HTTPException(
            status_code=404,
            detail="Dependency service not found",
        )

    relationship = ServiceDependency(
        service_id=service_id,
        dependency_id=data.dependency_id,
        dependency_type=data.dependency_type,
    )

    db.add(relationship)
    db.commit()
    db.refresh(relationship)

    return relationship