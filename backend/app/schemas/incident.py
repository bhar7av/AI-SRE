from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"


class IncidentCreate(BaseModel):
    service: str = Field(min_length=1)
    severity: IncidentSeverity
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    source: str = Field(min_length=1)


class IncidentResponse(IncidentCreate):
    id: str
    status: IncidentStatus
    created_at: datetime