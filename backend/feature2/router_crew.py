"""
router_crew.py
===============
FastAPI APIRouter exposing crew fatigue prediction, roster alerts,
and swap-proposal endpoints under ``/api/v1/crew``.
"""
from __future__ import annotations

import hashlib
import random
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .agent_rescheduler import ReschedulingAgent
from database import get_db
import models
import time
import asyncio

# ---------------------------------------------------------------------------
# Try to import the ML predictor; fall back to inline mock if model absent
# ---------------------------------------------------------------------------
_USE_ML_MODEL = True
try:
    from .ml_fatigue_model import predict_fatigue, FEATURE_COLS
except Exception:
    _USE_ML_MODEL = False

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ShiftFeaturesRequest(BaseModel):
    shift_start_hour: float = Field(..., ge=0, le=23, description="Hour of shift start (0-23)")
    shift_duration_hours: float = Field(..., ge=1, le=16, description="Duration of shift in hours")
    consecutive_days_on_duty: float = Field(..., ge=0, le=14, description="Consecutive working days")
    hours_since_last_rest: float = Field(..., ge=0, le=48, description="Hours elapsed since last rest")
    ambient_temp_c: float = Field(..., ge=-10, le=55, description="Ambient temperature in °C")
    route_complexity_score: float = Field(..., ge=1, le=5, description="Route complexity (1-5)")

class FatigueResponse(BaseModel):
    pilot_id: str
    fatigue_score: float
    risk_level: str
    timestamp: str

class PredictionResponse(BaseModel):
    fatigue_score: float
    risk_level: str
    model_used: str
    timestamp: str

class FatigueAlert(BaseModel):
    pilot_id: str
    name: str
    fatigue_score: float
    home_station: str
    consecutive_days_on_duty: int
    risk_level: str

class RosterAlertsResponse(BaseModel):
    alert_count: int
    threshold: int
    alerts: List[FatigueAlert]
    generated_at: str

class SwapRequest(BaseModel):
    fatigued_pilot_id: str = Field(..., description="Pilot ID to relieve")
    time_window_minutes: int = Field(45, ge=10, le=120, description="Max time to find a replacement")

class SwapProposalResponse(BaseModel):
    status: str
    message: str
    job_id: str

class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: str

def _risk_level(score: float) -> str:
    if score >= 80:
        return "critical"
    elif score >= 70:
        return "high"
    elif score >= 50:
        return "moderate"
    return "low"

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/v1/crew", tags=["Crew Intelligence"])
_agent = ReschedulingAgent()

@router.get("/fatigue/{pilot_id}", response_model=FatigueResponse)
async def get_fatigue(pilot_id: str, db: Session = Depends(get_db)) -> FatigueResponse:
    pilot = db.query(models.Pilot).filter(models.Pilot.pilot_id == pilot_id).first()
    
    if pilot:
        score = pilot.fatigue_score
    else:
        h = int(hashlib.md5(pilot_id.encode()).hexdigest(), 16)
        score = round(30 + (h % 60) + random.Random(h).uniform(-5, 5), 1)

    return FatigueResponse(
        pilot_id=pilot_id,
        fatigue_score=score,
        risk_level=_risk_level(score),
        timestamp=datetime.utcnow().isoformat() + "Z",
    )

@router.post("/fatigue/predict", response_model=PredictionResponse)
async def predict_fatigue_endpoint(body: ShiftFeaturesRequest) -> PredictionResponse:
    features = body.model_dump()

    if _USE_ML_MODEL:
        try:
            score = predict_fatigue(features)
            model_used = "ml_model"
        except FileNotFoundError:
            score = _fallback_predict(features)
            model_used = "heuristic_fallback"
    else:
        score = _fallback_predict(features)
        model_used = "heuristic_fallback"

    return PredictionResponse(
        fatigue_score=score,
        risk_level=_risk_level(score),
        model_used=model_used,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )

@router.get("/roster/alerts", response_model=RosterAlertsResponse)
async def get_roster_alerts(
    threshold: int = Query(70, ge=0, le=100, description="Fatigue threshold"),
    db: Session = Depends(get_db)
) -> RosterAlertsResponse:
    pilots = db.query(models.Pilot).filter(models.Pilot.fatigue_score > threshold).all()
    
    alerts: List[FatigueAlert] = []
    for p in pilots:
        alerts.append(
            FatigueAlert(
                pilot_id=p.pilot_id,
                name=p.name,
                fatigue_score=p.fatigue_score,
                home_station=p.home_station,
                consecutive_days_on_duty=p.consecutive_days_on_duty,
                risk_level=_risk_level(p.fatigue_score),
            )
        )
    alerts.sort(key=lambda a: a.fatigue_score, reverse=True)

    return RosterAlertsResponse(
        alert_count=len(alerts),
        threshold=threshold,
        alerts=alerts,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )

def _process_swap_background(pilot_id: str):
    # Simulate a heavy agent analysis
    time.sleep(3)
    result = _agent.propose_swap(pilot_id)
    print(f"Background Swap Processing Complete for {pilot_id}: {result}")

@router.post("/roster/swap", response_model=SwapProposalResponse)
async def propose_swap(body: SwapRequest, bg_tasks: BackgroundTasks) -> SwapProposalResponse:
    bg_tasks.add_task(_process_swap_background, body.fatigued_pilot_id)
    return SwapProposalResponse(
        status="processing",
        message="Agent is evaluating candidates in the background...",
        job_id=f"job_{int(time.time())}"
    )

@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)) -> HealthResponse:
    # Test DB connection
    db.execute("SELECT 1")
    return HealthResponse(
        status="healthy",
        service="crew-intelligence",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


# ---------------------------------------------------------------------------
# Fallback heuristic predictor
# ---------------------------------------------------------------------------

def _fallback_predict(features: Dict[str, float]) -> float:
    """Simple weighted heuristic when the trained ML model is unavailable."""
    night = 10.0 if features.get("shift_start_hour", 12) >= 22 or features.get("shift_start_hour", 12) <= 5 else 0.0
    raw = (
        3.0 * features.get("shift_duration_hours", 8)
        + 6.0 * features.get("consecutive_days_on_duty", 1)
        + 2.5 * features.get("hours_since_last_rest", 8)
        + 0.3 * features.get("ambient_temp_c", 30)
        + 4.0 * features.get("route_complexity_score", 3)
        + night
        - 30.0
    )
    return round(min(max(raw, 0), 100), 2)
