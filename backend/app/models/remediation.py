from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Remediation(Base):
    __tablename__ = "remediations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    incident_id: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    proposed_action: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    approved_action: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    risk: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    approval_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    execution_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NOT_EXECUTED",
    )

    rollback_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="NOT_ROLLED_BACK",
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    confidence: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    rolled_back_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
