from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.telemetry import Metric
from backend.app.models.incident import Incident
from backend.app.services.incident_service import IncidentService
from backend.app.schemas.incident import IncidentCreate


class DetectionService:

    CPU_THRESHOLD = 90.0
    LATENCY_THRESHOLD = 500.0
    ERROR_RATE_THRESHOLD = 20.0

    @staticmethod
    def detect(
        db: Session,
        metric: Metric | None = None,
    ) -> list[Incident]:
        """
        Detect anomalies from telemetry.

        If a metric is supplied, only that metric is evaluated.
        If no metric is supplied, all stored metrics are evaluated.
        """

        created_incidents = []

        # ---------------------------------------------------------
        # Determine which metrics should be checked
        # ---------------------------------------------------------

        if metric is not None:
            metrics = [metric]
        else:
            metrics = (
                db.execute(
                    select(Metric).order_by(
                        Metric.timestamp.desc()
                    )
                )
                .scalars()
                .all()
            )

        # ---------------------------------------------------------
        # Evaluate metrics
        # ---------------------------------------------------------

        for metric in metrics:

            severity = None
            title = None
            description = None

            # CPU
            if (
                metric.metric_name == "cpu_usage"
                and metric.value >= DetectionService.CPU_THRESHOLD
            ):
                severity = "high"

                title = "High CPU Utilization Detected"

                description = (
                    f"CPU utilization reached "
                    f"{metric.value}%, exceeding the "
                    f"{DetectionService.CPU_THRESHOLD}% "
                    f"threshold."
                )

            # Latency
            elif (
                metric.metric_name == "latency_ms"
                and metric.value >= DetectionService.LATENCY_THRESHOLD
            ):
                severity = "high"

                title = "High Service Latency Detected"

                description = (
                    f"Service latency reached "
                    f"{metric.value} ms, exceeding the "
                    f"{DetectionService.LATENCY_THRESHOLD} ms "
                    f"threshold."
                )

            # Error rate
            elif (
                metric.metric_name == "error_rate"
                and metric.value >= DetectionService.ERROR_RATE_THRESHOLD
            ):
                severity = "critical"

                title = "High Error Rate Detected"

                description = (
                    f"Error rate reached "
                    f"{metric.value}%, exceeding the "
                    f"{DetectionService.ERROR_RATE_THRESHOLD}% "
                    f"threshold."
                )

            # No anomaly
            if severity is None:
                continue

            # -----------------------------------------------------
            # Prevent duplicate active incidents
            # -----------------------------------------------------

            existing = db.execute(
                select(Incident).where(
                    Incident.service == metric.service_id,
                    Incident.title == title,
                    Incident.status.in_(
                        ["open", "investigating"]
                    ),
                )
            ).scalars().first()

            if existing is not None:
                continue

            # -----------------------------------------------------
            # Create incident
            # -----------------------------------------------------

            incident_data = IncidentCreate(
                service=metric.service_id,
                severity=severity,
                title=title,
                description=description,
                source="automatic_detection",
            )

            incident = IncidentService.create_incident(
                db,
                incident_data,
            )

            created_incidents.append(incident)

        return created_incidents