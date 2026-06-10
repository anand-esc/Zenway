"""
router_concierge.py
====================
FastAPI APIRouter for the Layover Concierge service
under ``/api/v1/concierge``.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .concierge_service import (
    LayoverConcierge,
    SUPPORTED_LANGUAGES,
    GEOFENCE_RADIUS_KM,
)

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class ItineraryRequest(BaseModel):
    """Payload for layover itinerary generation."""
    pnr: str = Field(
        ..., min_length=6, max_length=15,
        description="Passenger Name Record number",
    )
    station: str = Field(
        ...,
        description="Station name (e.g. 'New Delhi', 'Mumbai CST')",
    )
    layover_minutes: int = Field(
        ..., ge=30, le=480,
        description="Layover duration in minutes (30-480)",
    )
    language: str = Field(
        "en",
        description="Target language code",
    )


class ActivityItem(BaseModel):
    """A single activity block in the itinerary."""
    order: int
    type: str
    name: str
    description: Optional[str] = None
    start_minute: int
    duration_minutes: int
    distance_km: float
    within_geofence: bool
    price_range: Optional[str] = None


class MedicalFacility(BaseModel):
    """Nearby medical facility entry."""
    name: str
    distance_km: float
    type: str
    emergency: bool


class ItineraryResponse(BaseModel):
    """Complete layover itinerary response."""
    pnr: str
    station: str
    station_code: str
    zone: str
    layover_minutes: int
    language: str
    geofence_radius_km: float
    activities: List[ActivityItem]
    medical_facilities: List[MedicalFacility]
    total_planned_minutes: int
    safety_notes: str
    generated_at: str


class StationInfo(BaseModel):
    """Summary of a supported station."""
    name: str
    code: str
    zone: str
    lat: float
    lon: float
    attraction_count: int
    food_option_count: int


class StationsResponse(BaseModel):
    """List of supported stations."""
    count: int
    stations: List[StationInfo]


class LanguageEntry(BaseModel):
    """Supported language descriptor."""
    code: str
    name: str


class LanguagesResponse(BaseModel):
    """List of supported languages."""
    count: int
    languages: List[LanguageEntry]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    timestamp: str


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_concierge = LayoverConcierge()

# Language code → display name mapping
_LANG_NAMES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "kn": "Kannada",
}

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api/v1/concierge", tags=["Layover Concierge"])


@router.post("/itinerary", response_model=ItineraryResponse)
async def create_itinerary(body: ItineraryRequest) -> ItineraryResponse:
    """Generate a guardrailed, geofenced layover itinerary.

    Validates PNR, station, layover window, and language before building
    a time-boxed activity plan within the station geofence.
    """
    try:
        result = await _concierge.generate_itinerary(
            pnr=body.pnr,
            station=body.station,
            layover_minutes=body.layover_minutes,
            language=body.language,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ItineraryResponse(**result)


@router.get("/stations", response_model=StationsResponse)
async def list_stations() -> StationsResponse:
    """Return summary info for all supported layover stations."""
    stations = _concierge.get_supported_stations()
    return StationsResponse(
        count=len(stations),
        stations=[StationInfo(**s) for s in stations],
    )


@router.get("/languages", response_model=LanguagesResponse)
async def list_languages() -> LanguagesResponse:
    """Return list of supported languages for itinerary translation."""
    entries = [
        LanguageEntry(code=code, name=_LANG_NAMES.get(code, code))
        for code in SUPPORTED_LANGUAGES
    ]
    return LanguagesResponse(count=len(entries), languages=entries)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Liveness probe for the concierge service."""
    return HealthResponse(
        status="healthy",
        service="layover-concierge",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
