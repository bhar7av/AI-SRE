from datetime import datetime

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    owner: str | None = None
    environment: str = "production"
    repository: str | None = None
    health_endpoint: str | None = None


class ServiceResponse(ServiceCreate):
    id: str
    created_at: datetime


class DependencyCreate(BaseModel):
    dependency_id: str
    dependency_type: str = "runtime"


class DependencyResponse(BaseModel):
    id: int
    service_id: str
    dependency_id: str
    dependency_type: str