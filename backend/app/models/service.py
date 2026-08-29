from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    environment: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="production",
    )

    repository: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    health_endpoint: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class ServiceDependency(Base):
    __tablename__ = "service_dependencies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    service_id: Mapped[str] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
    )

    dependency_id: Mapped[str] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
    )

    dependency_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="runtime",
    )