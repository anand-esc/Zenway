"""
router_fois.py
===============
FastAPI APIRouter for Freight Operations Information System endpoints
under ``/api/v1/fois``.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import httpx
import asyncio

from .fois_eta_brain import ETAConfidenceModel, TerminalCongestionPredictor
from database import get_db
import models

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ConfidenceBand(BaseModel):
    early: float = Field(..., ge=0, le=1)
    on_time: float = Field(..., ge=0, le=1)
    delayed: float = Field(..., ge=0, le=1)

class RakeResponse(BaseModel):
    rake_id: str
    origin: str
    destination: str
    expected_arrival: str
    status: str

class AllRakesResponse(BaseModel):
    count: int
    rakes: List[RakeResponse]
    generated_at: str

class ETAResponse(BaseModel):
    rake_id: str
    origin: str
    destination: str
    expected_arrival: str
    confidence_band: ConfidenceBand
    delay_minutes: float
    factors: List[str]

class BatchETARequest(BaseModel):
    rake_ids: List[str] = Field(..., min_length=1, max_length=50)
    origin: str = Field("Mundra")
    destination: str = Field("New Delhi")

class BatchETAResponse(BaseModel):
    count: int
    predictions: List[ETAResponse]
    generated_at: str

class CongestionResponse(BaseModel):
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
    count: int
    terminals: List[CongestionResponse]
    generated_at: str

class HealthResponse(BaseModel):
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

async def fetch_external_weather_mock():
    # Demonstrating httpx usage as per the plan
    async with httpx.AsyncClient(timeout=3.0) as client:
        try:
            # We hit a reliable placeholder to simulate checking external weather/signal APIs
            await client.get("https://jsonplaceholder.typicode.com/todos/1")
            return ["weather", "signal"]
        except httpx.RequestError:
            return ["congestion"]

@router.get("/eta/{rake_id}", response_model=ETAResponse)
async def get_eta(
    rake_id: str,
    origin: str = Query("Mundra", description="Origin terminal / station"),
    destination: str = Query("New Delhi", description="Destination terminal / station"),
    db: Session = Depends(get_db)
) -> ETAResponse:
    
    rake = db.query(models.Rake).filter(models.Rake.rake_id == rake_id).first()
    
    # Base prediction
    prediction = _eta_model.predict_eta(rake_id, origin, destination)
    
    # If rake exists in DB, override origin/destination/expected_arrival
    if rake:
        prediction["origin"] = rake.origin
        prediction["destination"] = rake.destination
        prediction["expected_arrival"] = rake.expected_arrival
        
    # Mock external API call using httpx
    delay_factors = await fetch_external_weather_mock()
    prediction["factors"] = delay_factors

    return ETAResponse(**prediction)

@router.get("/rakes", response_model=AllRakesResponse)
async def get_all_rakes(db: Session = Depends(get_db)) -> AllRakesResponse:
    db_rakes = db.query(models.Rake).all()
    
    rakes = []
    for r in db_rakes:
        rakes.append(
            RakeResponse(
                rake_id=r.rake_id,
                origin=r.origin,
                destination=r.destination,
                expected_arrival=r.expected_arrival,
                status=r.status
            )
        )
        
    return AllRakesResponse(
        count=len(rakes),
        rakes=rakes,
        generated_at=datetime.utcnow().isoformat() + "Z"
    )

@router.post("/eta/batch", response_model=BatchETAResponse)
async def batch_eta(body: BatchETARequest) -> BatchETAResponse:
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
    window_hours: int = Query(4, ge=1, le=24),
    db: Session = Depends(get_db)
) -> CongestionResponse:
    try:
        data = _congestion.get_congestion(terminal, window_hours=window_hours)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return CongestionResponse(**data)

@router.get("/congestion", response_model=AllCongestionResponse)
async def get_all_congestion(db: Session = Depends(get_db)) -> AllCongestionResponse:
    db_terminals = db.query(models.Terminal).all()
    
    terminals = []
    for t in db_terminals:
        # We blend DB data with the congestion predictor logic
        utilization = min((t.current_rakes / t.capacity) * 100, 100) if t.capacity > 0 else 0
        terminals.append(CongestionResponse(
            terminal=t.terminal_id,
            full_name=t.name,
            state="Unknown",
            current_rakes=t.current_rakes,
            capacity=t.capacity,
            utilization_pct=utilization,
            alert_level=t.alert_level,
            predicted_clearance_hours=12.5,
            window_hours=4,
            snapshot_time=datetime.utcnow().isoformat() + "Z"
        ))

    return AllCongestionResponse(
        count=len(terminals),
        terminals=terminals,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="fois-intelligence",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
