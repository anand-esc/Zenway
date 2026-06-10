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

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .agent_rescheduler import ReschedulingAgent

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
    """Shift features submitted for fatigue prediction."""
    shift_start_hour: float = Field(..., ge=0, le=23, description="Hour of shift start (0-23)")
    shift_duration_hours: float = Field(..., ge=1, le=16, description="Duration of shift in hours")
    consecutive_days_on_duty: float = Field(..., ge=0, le=14, description="Consecutive working days")
    hours_since_last_rest: float = Field(..., ge=0, le=48, description="Hours elapsed since last rest")
    ambient_temp_c: float = Field(..., ge=-10, le=55, description="Ambient temperature in °C")
    route_complexity_score: float = Field(..., ge=1, le=5, description="Route complexity (1-5)")


class FatigueResponse(BaseModel):
    """Response with fatigue score."""
    pilot_id: str
    fatigue_score: float
    risk_level: str
    timestamp: str


class PredictionResponse(BaseModel):
    """Response from the ML prediction endpoint."""
    fatigue_score: float
    risk_level: str
    model_used: str
    timestamp: str


class FatigueAlert(BaseModel):
    """A single high-fatigue alert entry."""
    pilot_id: str
    name: str
    fatigue_score: float
    home_station: str
    consecutive_days_on_duty: int
    risk_level: str


class RosterAlertsResponse(BaseModel):
    """Collection of current high-fatigue alerts."""
    alert_count: int
    threshold: int
    alerts: List[FatigueAlert]
    generated_at: str


class SwapRequest(BaseModel):
    """Payload to trigger a crew swap proposal."""
    fatigued_pilot_id: str = Field(..., description="Pilot ID to relieve")
    time_window_minutes: int = Field(45, ge=10, le=120, description="Max time to find a replacement")


class SwapProposalResponse(BaseModel):
    """Result of the rescheduling agent."""
    timestamp: str
    fatigued_pilot: Dict[str, Any]
    proposed_replacement: Optional[Dict[str, Any]]
    rule_check: Dict[str, Any]
    candidates_evaluated: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    timestamp: str


# ---------------------------------------------------------------------------
# Mock pilot roster used for alerts / lookups
# ---------------------------------------------------------------------------

_MOCK_ROSTER: List[Dict[str, Any]] = [
    {"pilot_id": "LP-1001-A", "name": "Rajesh Kumar",     "home_station": "New Delhi",        "consecutive_days_on_duty": 5, "fatigue_score": 78.3},
    {"pilot_id": "LP-1002-B", "name": "Sunil Sharma",     "home_station": "Mumbai CST",       "consecutive_days_on_duty": 3, "fatigue_score": 45.1},
    {"pilot_id": "LP-1003-C", "name": "Amit Yadav",       "home_station": "Howrah",            "consecutive_days_on_duty": 6, "fatigue_score": 82.7},
    {"pilot_id": "LP-1004-D", "name": "Pradeep Singh",    "home_station": "Chennai Central",   "consecutive_days_on_duty": 2, "fatigue_score": 32.0},
    {"pilot_id": "LP-1005-E", "name": "Vikram Patel",     "home_station": "Bengaluru City",    "consecutive_days_on_duty": 4, "fatigue_score": 71.5},
    {"pilot_id": "LP-1006-F", "name": "Anil Reddy",       "home_station": "Secunderabad",      "consecutive_days_on_duty": 1, "fatigue_score": 28.9},
    {"pilot_id": "LP-1007-G", "name": "Manoj Gupta",      "home_station": "Lucknow NR",        "consecutive_days_on_duty": 5, "fatigue_score": 74.2},
    {"pilot_id": "LP-1008-H", "name": "Ravi Das",         "home_station": "Patna",             "consecutive_days_on_duty": 3, "fatigue_score": 55.8},
    {"pilot_id": "LP-1009-I", "name": "Sanjay Nair",      "home_station": "Jaipur",            "consecutive_days_on_duty": 7, "fatigue_score": 91.0},
    {"pilot_id": "LP-1010-J", "name": "Deepak Tiwari",    "home_station": "Bhopal",            "consecutive_days_on_duty": 2, "fatigue_score": 40.6},
]


def _risk_level(score: float) -> str:
    """Classify fatigue score into risk level."""
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
async def get_fatigue(pilot_id: str) -> FatigueResponse:
    """Return the fatigue score for a specific pilot.

    Uses mock roster data; if the pilot isn't found a deterministic score
    is computed from the pilot ID hash.
    """
    match = next((p for p in _MOCK_ROSTER if p["pilot_id"] == pilot_id), None)

    if match:
        score = match["fatigue_score"]
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
    """Accept shift features and return a predicted fatigue score.

    Falls back to a simple weighted formula when the ML model is not
    available on disk.
    """
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
) -> RosterAlertsResponse:
    """Return all pilots whose fatigue score exceeds the threshold."""
    alerts: List[FatigueAlert] = []
    for p in _MOCK_ROSTER:
        if p["fatigue_score"] > threshold:
            alerts.append(
                FatigueAlert(
                    pilot_id=p["pilot_id"],
                    name=p["name"],
                    fatigue_score=p["fatigue_score"],
                    home_station=p["home_station"],
                    consecutive_days_on_duty=p["consecutive_days_on_duty"],
                    risk_level=_risk_level(p["fatigue_score"]),
                )
            )
    alerts.sort(key=lambda a: a.fatigue_score, reverse=True)

    return RosterAlertsResponse(
        alert_count=len(alerts),
        threshold=threshold,
        alerts=alerts,
        generated_at=datetime.utcnow().isoformat() + "Z",
    )


@router.post("/roster/swap", response_model=SwapProposalResponse)
async def propose_swap(body: SwapRequest) -> SwapProposalResponse:
    """Trigger the rescheduling agent and return a swap proposal."""
    result = _agent.propose_swap(body.fatigued_pilot_id)
    return SwapProposalResponse(**result)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Liveness probe for the crew-intelligence service."""
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
