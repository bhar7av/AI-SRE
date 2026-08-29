from fastapi import FastAPI

from backend.app.api.services import router as service_router
from backend.app.api.incidents import router as incident_router
from backend.app.core.database import Base, engine
from backend.app.models.telemetry import LogEvent, Metric
from backend.app.models.incident import Incident
from backend.app.api.telemetry import router as telemetry_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI-SRE",
    description="AI-powered Site Reliability Engineering platform",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "AI-SRE API is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-sre",
        "version": "0.1.0",
    }


app.include_router(incident_router)
app.include_router(service_router)
app.include_router(telemetry_router)