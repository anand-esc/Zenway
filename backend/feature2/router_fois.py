"""
router_fois.py
===============
FastAPI APIRouter for Freight Operations Information System endpoints
under ``/api/v1/fois``.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .fois_eta_brain import ETAConfidenceModel, TerminalCongestionPredictor

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ConfidenceBand(BaseModel):
    """Three-band probability distribution for an ETA prediction."""
    early: float = Field(..., ge=0, le=1)
    on_time: float = Field(..., ge=0, le=1)
    delayed: float = Field(..., ge=0, le=1)


class ETAResponse(BaseModel):
    """Single rake ETA prediction."""
    rake_id: str
    origin: str
    destination: str
    expected_arrival: str
    confidence_band: ConfidenceBand
    delay_minutes: float
    factors: List[str]


class BatchETARequest(BaseModel):
    """Batch ETA request payload."""
    rake_ids: List[str] = Field(
        ..., min_length=1, max_length=50, description="List of rake IDs"
    )
    origin: str = Field("Mundra", description="Common origin terminal")
    destination: str = Field("New Delhi", description="Common destination")


class BatchETAResponse(BaseModel):
    """Batch ETA response."""
    count: int
    predictions: List[ETAResponse]
    generated_at: str


class CongestionResponse(BaseModel):
    """Congestion snapshot for a single terminal."""
    terminal: str
    full_name: str
    state: str
    current_rakes: int
    capacity: int
    utilization_pct: float
    alert_level: str
    predicted_clearance_hours: float
    window_hours: int
    snapshot_time: str


class AllCongestionResponse(BaseModel):
    """Congestion snapshots for all terminals."""
    count: int
    terminals: List[CongestionResponse]
    generated_at: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    timestamp: str


# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------

_eta_model = ETAConfidenceModel()
_congestion = TerminalCongestionPredictor()

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/v1/fois", tags=["FOIS Intelligence"])


@router.get("/eta/{rake_id}", response_model=ETAResponse)
async def get_eta(
    rake_id: str,
    origin: str = Query("Mundra", description="Origin terminal / station"),
    destination: str = Query("New Delhi", description="Destination terminal / station"),
) -> ETAResponse:
    """Return ETA prediction with confidence bands for a single rake.

    Parameters
    ----------
    rake_id : str
        Unique rake identifier (path parameter).
    origin : str
        Origin terminal (query parameter, default Mundra).
    destination : str
        Destination terminal (query parameter, default New Delhi).
    """
    prediction = _eta_model.predict_eta(rake_id, origin, destination)
    return ETAResponse(**prediction)


@router.post("/eta/batch", response_model=BatchETAResponse)
async def batch_eta(body: BatchETARequest) -> BatchETAResponse:
    """Return ETA predictions for a batch of rake IDs.

    All rakes share the same origin and destination specified in the payload.
    """
    predictions = [
        ETAResponse(
            **_eta_model.predict_eta(rid, body.origin, body.destination)
        )
        for rid in body.rake_ids
    ]
    return BatchETAResponse(
        count=len(predictions),
        predictions=predictions,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/congestion/{terminal}", response_model=CongestionResponse)
async def get_congestion(
    terminal: str,
    window_hours: int = Query(4, ge=1, le=24, description="Look-ahead window in hours"),
) -> CongestionResponse:
    """Return congestion data for a specific freight terminal.

    Supported terminals: Mundra, JNPT, Visakhapatnam, Haldia, Chennai.
    """
    try:
        data = _congestion.get_congestion(terminal, window_hours=window_hours)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return CongestionResponse(**data)


@router.get("/congestion", response_model=AllCongestionResponse)
async def get_all_congestion() -> AllCongestionResponse:
    """Return congestion snapshots for all supported terminals."""
    terminals = _congestion.get_all_terminals()
    return AllCongestionResponse(
        count=len(terminals),
        terminals=[CongestionResponse(**t) for t in terminals],
        generated_at=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Liveness probe for the FOIS intelligence service."""
    return HealthResponse(
        status="healthy",
        service="fois-intelligence",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
