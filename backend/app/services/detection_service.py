from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.incident import Incident
from backend.app.models.telemetry import Metric
from backend.app.schemas.incident import IncidentCreate
from backend.app.services.incident_service import IncidentService


class DetectionService:

    CPU_THRESHOLD = 90.0
    LATENCY_THRESHOLD = 500.0
    ERROR_RATE_THRESHOLD = 20.0

    @staticmethod
    def detect(db: Session) -> list[Incident]:
        created_incidents: list[Incident] = []

        metrics = (
            db.execute(
                select(Metric).order_by(Metric.timestamp.desc())
            )
            .scalars()
            .all()
        )

        for metric in metrics:

            severity = None
            title = None
            description = None

            # CPU anomaly
            if (
                metric.metric_name == "cpu_usage"
                and metric.value >= DetectionService.CPU_THRESHOLD
            ):
                severity = "high"

                title = "High CPU Utilization Detected"

                description = (
                    f"CPU utilization reached {metric.value}%, "
                    f"exceeding the "
                    f"{DetectionService.CPU_THRESHOLD}% threshold."
                )

            # Latency anomaly
            elif (
                metric.metric_name == "latency_ms"
                and metric.value >= DetectionService.LATENCY_THRESHOLD
            ):
                severity = "high"

                title = "High Service Latency Detected"

                description = (
                    f"Service latency reached {metric.value} ms, "
                    f"exceeding the "
                    f"{DetectionService.LATENCY_THRESHOLD} ms threshold."
                )

            # Error rate anomaly
            elif (
                metric.metric_name == "error_rate"
                and metric.value >= DetectionService.ERROR_RATE_THRESHOLD
            ):
                severity = "critical"

                title = "High Error Rate Detected"

                description = (
                    f"Error rate reached {metric.value}%, "
                    f"exceeding the "
                    f"{DetectionService.ERROR_RATE_THRESHOLD}% threshold."
                )

            if severity is None:
                continue

            # Prevent duplicate active incidents.
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

    @staticmethod
    def detect_metric(
        db: Session,
        metric: Metric,
    ) -> Incident | None:
        """
        Detect an anomaly immediately for a newly created metric.

        This avoids scanning the entire metrics table every time
        telemetry is received.
        """

        severity = None
        title = None
        description = None

        if (
            metric.metric_name == "cpu_usage"
            and metric.value >= DetectionService.CPU_THRESHOLD
        ):
            severity = "high"

            title = "High CPU Utilization Detected"

            description = (
                f"CPU utilization reached {metric.value}%, "
                f"exceeding the "
                f"{DetectionService.CPU_THRESHOLD}% threshold."
            )

        elif (
            metric.metric_name == "latency_ms"
            and metric.value >= DetectionService.LATENCY_THRESHOLD
        ):
            severity = "high"

            title = "High Service Latency Detected"

            description = (
                f"Service latency reached {metric.value} ms, "
                f"exceeding the "
                f"{DetectionService.LATENCY_THRESHOLD} ms threshold."
            )

        elif (
            metric.metric_name == "error_rate"
            and metric.value >= DetectionService.ERROR_RATE_THRESHOLD
        ):
            severity = "critical"

            title = "High Error Rate Detected"

            description = (
                f"Error rate reached {metric.value}%, "
                f"exceeding the "
                f"{DetectionService.ERROR_RATE_THRESHOLD}% threshold."
            )

        if severity is None:
            return None

        # Don't create another active incident for
        # the same service and anomaly.
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
            return existing

        incident_data = IncidentCreate(
            service=metric.service_id,
            severity=severity,
            title=title,
            description=description,
            source="automatic_detection",
        )

        return IncidentService.create_incident(
            db,
            incident_data,
        )