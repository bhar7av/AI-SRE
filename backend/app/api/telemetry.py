from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.telemetry import LogEvent, Metric
from backend.app.schemas.telemetry import (
    LogCreate,
    LogResponse,
    MetricCreate,
    MetricResponse,
)
from backend.app.services.detection_service import DetectionService


router = APIRouter(
    prefix="/api/v1/telemetry",
    tags=["Telemetry"],
)


@router.post(
    "/metrics",
    response_model=MetricResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_metric(
    data: MetricCreate,
    db: Session = Depends(get_db),
):
    """
    Store a telemetry metric and immediately run
    anomaly detection against the latest telemetry.
    """

    metric = Metric(
        service_id=data.service_id,
        metric_name=data.metric_name,
        value=data.value,
        timestamp=data.timestamp or datetime.now(timezone.utc),
    )

    db.add(metric)
    db.commit()
    db.refresh(metric)

    # Automatically run anomaly detection
    DetectionService.detect(db)

    return metric


@router.get(
    "/metrics",
    response_model=list[MetricResponse],
)
def get_metrics(
    service_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Metric).order_by(Metric.timestamp.desc())

    if service_id:
        query = query.where(
            Metric.service_id == service_id
        )

    result = db.execute(query)

    return result.scalars().all()


@router.post(
    "/logs",
    response_model=LogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_log(
    data: LogCreate,
    db: Session = Depends(get_db),
):
    """
    Store an application log.
    """

    log = LogEvent(
        service_id=data.service_id,
        level=data.level,
        message=data.message,
        timestamp=data.timestamp or datetime.now(timezone.utc),
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.get(
    "/logs",
    response_model=list[LogResponse],
)
def get_logs(
    service_id: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(LogEvent).order_by(
        LogEvent.timestamp.desc()
    )

    if service_id:
        query = query.where(
            LogEvent.service_id == service_id
        )

    result = db.execute(query)

    return result.scalars().all()