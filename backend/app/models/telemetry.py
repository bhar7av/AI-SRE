from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    service_id: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    metric_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class LogEvent(Base):
    __tablename__ = "log_events"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    service_id: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )