from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.services import router as service_router
from backend.app.api.incidents import router as incident_router
from backend.app.api.telemetry import router as telemetry_router

from backend.app.core.database import Base, engine

# Import models so SQLAlchemy registers all tables
from backend.app.models.remediation_plan import RemediationPlan
from backend.app.models.telemetry import LogEvent, Metric
from backend.app.models.incident import Incident
from backend.app.models.audit_log import AuditLog


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI-SRE",
    description="AI-powered Site Reliability Engineering platform",
    version="0.1.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:5176",
        "http://localhost:5176",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI-SRE API is running",
        "docs": "/docs",
        "health": "/health",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-sre",
        "version": "0.1.0",
    }


# ============================================================
# API ROUTERS
# ============================================================

app.include_router(incident_router)
app.include_router(service_router)
app.include_router(telemetry_router)