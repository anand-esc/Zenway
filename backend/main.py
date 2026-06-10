"""
Zenway Backend – Main FastAPI Application
==========================================
Entry point that registers all Feature 2 routers.
Run with:  uvicorn backend.main:app --reload
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from feature2 import crew_router, fois_router, concierge_router

app = FastAPI(
    title="Zenway Railway Platform API",
    description="Ops & Crew Intelligence – Feature 2",
    version="0.1.0",
)

# CORS – allow all origins in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(crew_router)
app.include_router(fois_router)
app.include_router(concierge_router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint returning API metadata."""
    return {
        "app": "Zenway Railway Platform",
        "version": "0.1.0",
        "features": {
            "crew_intelligence": "/api/v1/crew",
            "fois_intelligence": "/api/v1/fois",
            "layover_concierge": "/api/v1/concierge",
        },
        "docs": "/docs",
    }
