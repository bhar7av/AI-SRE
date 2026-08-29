from datetime import datetime

from pydantic import BaseModel, Field


class MetricCreate(BaseModel):
    service_id: str
    metric_name: str = Field(min_length=1)
    value: float
    timestamp: datetime | None = None


class MetricResponse(MetricCreate):
    id: int
    timestamp: datetime


class LogCreate(BaseModel):
    service_id: str
    level: str = Field(min_length=1)
    message: str = Field(min_length=1)
    timestamp: datetime | None = None


class LogResponse(LogCreate):
    id: int
    timestamp: datetime