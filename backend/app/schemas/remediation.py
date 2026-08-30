from pydantic import BaseModel, Field


class RemediationPlan(BaseModel):
    incident_id: str
    action: str
    reason: str
    risk: str
    requires_approval: bool = True
    steps: list[str] = Field(default_factory=list)
