"""
concierge_service.py
=====================
Layover Concierge with guardrailed content generation and mock
Bhashini-style translation pipeline.

Generates time-boxed, geofenced itineraries for passengers with
layovers at major Indian railway stations.
"""
from __future__ import annotations

import hashlib
import math
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUPPORTED_LANGUAGES: List[str] = ["en", "hi", "bn", "ta", "te", "mr", "kn"]

GEOFENCE_RADIUS_KM: float = 5.0

_MIN_LAYOVER_MINUTES: int = 30
_MAX_LAYOVER_MINUTES: int = 480

# ---------------------------------------------------------------------------
# Station data – 5 major Indian stations with realistic coordinates
# ---------------------------------------------------------------------------

_STATION_DATA: Dict[str, Dict[str, Any]] = {
    "New Delhi": {
        "code": "NDLS",
        "lat": 28.6425,
        "lon": 77.2196,
        "zone": "Northern Railway",
        "nearby_attractions": [
            {"name": "Connaught Place", "distance_km": 1.2, "visit_minutes": 45,
             "description": "Iconic colonial-era shopping district with eateries and bookstores."},
            {"name": "Jantar Mantar", "distance_km": 1.5, "visit_minutes": 30,
             "description": "18th-century astronomical observation site with giant instruments."},
            {"name": "Gurudwara Bangla Sahib", "distance_km": 2.0, "visit_minutes": 40,
             "description": "Stunning Sikh temple known for its golden dome and community kitchen."},
            {"name": "National Museum", "distance_km": 3.5, "visit_minutes": 60,
             "description": "Vast collection of Indian art, archaeology and decorative arts."},
        ],
        "food_options": [
            {"name": "Rajdhani Thali (Station Food Court)", "type": "veg", "price_range": "₹150-300",
             "distance_km": 0.1},
            {"name": "Andhra Bhawan Canteen", "type": "non-veg", "price_range": "₹100-250",
             "distance_km": 2.5},
            {"name": "Haldiram's, CP", "type": "veg", "price_range": "₹200-500",
             "distance_km": 1.3},
        ],
        "medical_facilities": [
            {"name": "Railway Hospital, New Delhi", "distance_km": 0.5, "type": "hospital",
             "emergency": True},
            {"name": "Apollo Pharmacy (Platform 1)", "distance_km": 0.05, "type": "pharmacy",
             "emergency": False},
        ],
    },
    "Mumbai CST": {
        "code": "CSTM",
        "lat": 18.9398,
        "lon": 72.8355,
        "zone": "Central Railway",
        "nearby_attractions": [
            {"name": "Gateway of India", "distance_km": 1.8, "visit_minutes": 30,
             "description": "Colonial-era triumphal arch overlooking the Arabian Sea."},
            {"name": "Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", "distance_km": 1.5,
             "visit_minutes": 60, "description": "Premier art and history museum in a grand Indo-Saracenic building."},
            {"name": "Crawford Market", "distance_km": 0.8, "visit_minutes": 40,
             "description": "Heritage market with fresh produce, spices and pet shops."},
        ],
        "food_options": [
            {"name": "Swati Snacks (Nariman Point)", "type": "veg", "price_range": "₹200-400",
             "distance_km": 3.0},
            {"name": "Britannia & Co.", "type": "non-veg (Parsi)", "price_range": "₹250-600",
             "distance_km": 0.6},
            {"name": "Station Canteen", "type": "veg/non-veg", "price_range": "₹80-200",
             "distance_km": 0.1},
        ],
        "medical_facilities": [
            {"name": "St. George Hospital", "distance_km": 1.2, "type": "hospital",
             "emergency": True},
            {"name": "Medical Aid Room (Platform 8)", "distance_km": 0.05, "type": "first_aid",
             "emergency": True},
        ],
    },
    "Howrah": {
        "code": "HWH",
        "lat": 22.5839,
        "lon": 88.3428,
        "zone": "Eastern Railway",
        "nearby_attractions": [
            {"name": "Howrah Bridge", "distance_km": 0.5, "visit_minutes": 20,
             "description": "Cantilever bridge over the Hooghly – an engineering marvel."},
            {"name": "Belur Math", "distance_km": 4.5, "visit_minutes": 60,
             "description": "Headquarters of the Ramakrishna Mission with serene gardens."},
            {"name": "Botanical Garden", "distance_km": 3.0, "visit_minutes": 50,
             "description": "Home to the 250-year-old Great Banyan Tree."},
        ],
        "food_options": [
            {"name": "Station Platform Stalls", "type": "veg/non-veg", "price_range": "₹50-150",
             "distance_km": 0.05},
            {"name": "Bhojohori Manna (near Shibpur)", "type": "non-veg (Bengali)",
             "price_range": "₹200-500", "distance_km": 2.5},
        ],
        "medical_facilities": [
            {"name": "Howrah General Hospital", "distance_km": 1.5, "type": "hospital",
             "emergency": True},
            {"name": "Railway Dispensary, Howrah", "distance_km": 0.3, "type": "clinic",
             "emergency": False},
        ],
    },
    "Chennai Central": {
        "code": "MAS",
        "lat": 13.0827,
        "lon": 80.2750,
        "zone": "Southern Railway",
        "nearby_attractions": [
            {"name": "Fort St. George", "distance_km": 2.0, "visit_minutes": 45,
             "description": "First English fortress in India, now houses a museum."},
            {"name": "Government Museum, Egmore", "distance_km": 2.5, "visit_minutes": 50,
             "description": "One of the oldest museums in India with Bronze Gallery."},
            {"name": "San Thome Cathedral", "distance_km": 4.5, "visit_minutes": 30,
             "description": "Neo-Gothic basilica built over the tomb of St. Thomas."},
        ],
        "food_options": [
            {"name": "Ratna Café (Triplicane)", "type": "veg (South Indian)",
             "price_range": "₹80-200", "distance_km": 3.0},
            {"name": "A2B (Adyar Ananda Bhavan)", "type": "veg", "price_range": "₹100-300",
             "distance_km": 1.5},
            {"name": "Station IRCTC Food Court", "type": "veg/non-veg", "price_range": "₹100-250",
             "distance_km": 0.1},
        ],
        "medical_facilities": [
            {"name": "Rajiv Gandhi Government General Hospital", "distance_km": 1.8,
             "type": "hospital", "emergency": True},
            {"name": "Apollo Pharmacy (Station Entrance)", "distance_km": 0.1,
             "type": "pharmacy", "emergency": False},
        ],
    },
    "Bengaluru City": {
        "code": "SBC",
        "lat": 12.9784,
        "lon": 77.5710,
        "zone": "South Western Railway",
        "nearby_attractions": [
            {"name": "Tipu Sultan's Summer Palace", "distance_km": 1.0, "visit_minutes": 30,
             "description": "Ornate Indo-Islamic palace built in teak with fluted pillars."},
            {"name": "Bangalore Fort", "distance_km": 1.2, "visit_minutes": 25,
             "description": "16th-century mud-brick fort built by Kempe Gowda."},
            {"name": "KR Market", "distance_km": 0.8, "visit_minutes": 40,
             "description": "Bustling flower and fruit market near the station."},
        ],
        "food_options": [
            {"name": "Vidyarthi Bhavan (Basavanagudi)", "type": "veg (South Indian)",
             "price_range": "₹80-200", "distance_km": 3.5},
            {"name": "CTR (Central Tiffin Room)", "type": "veg", "price_range": "₹70-180",
             "distance_km": 4.0},
            {"name": "Station Food Court", "type": "veg/non-veg", "price_range": "₹100-250",
             "distance_km": 0.1},
        ],
        "medical_facilities": [
            {"name": "Victoria Hospital", "distance_km": 1.5, "type": "hospital",
             "emergency": True},
            {"name": "Railway Health Unit", "distance_km": 0.2, "type": "clinic",
             "emergency": False},
        ],
    },
}


# ---------------------------------------------------------------------------
# Content guardrails
# ---------------------------------------------------------------------------

_BLOCKED_PATTERNS: List[str] = [
    r"\b(alcohol|liquor|bar|brewery|pub)\b",
    r"\b(casino|gambling|betting)\b",
    r"\b(adult|xxx|nsfw)\b",
]


def _is_content_safe(text: str) -> bool:
    """Return False if text matches any blocked pattern."""
    lower = text.lower()
    return not any(re.search(pat, lower) for pat in _BLOCKED_PATTERNS)


# ---------------------------------------------------------------------------
# Haversine helper
# ---------------------------------------------------------------------------

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Layover Concierge
# ---------------------------------------------------------------------------

class LayoverConcierge:
    """Generate guardrailed, geofenced layover itineraries for train passengers.

    Mimics a Bhashini API translation pipeline for multi-language support.
    """

    SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES
    GEOFENCE_RADIUS_KM = GEOFENCE_RADIUS_KM

    def __init__(self) -> None:
        self._stations = _STATION_DATA

    # ---- public API -------------------------------------------------------

    async def generate_itinerary(
        self,
        pnr: str,
        station: str,
        layover_minutes: int,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Create a structured layover itinerary with time-boxed activities.

        Parameters
        ----------
        pnr : str
            Passenger Name Record number.
        station : str
            Station name (must be one of the five supported stations).
        layover_minutes : int
            Total layover duration in minutes.
        language : str
            Target language code for text fields.

        Returns
        -------
        dict
            Complete itinerary including activities, food, medical info.

        Raises
        ------
        ValueError
            On invalid station, unsupported language, or layover outside
            the 30–480 minute window.
        """
        # --- Validation (guardrails) ---
        if station not in self._stations:
            raise ValueError(
                f"Unsupported station '{station}'. "
                f"Choose from: {list(self._stations.keys())}"
            )
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language '{language}'. "
                f"Choose from: {SUPPORTED_LANGUAGES}"
            )
        if layover_minutes < _MIN_LAYOVER_MINUTES:
            raise ValueError(
                f"Layover too short ({layover_minutes} min). "
                f"Minimum is {_MIN_LAYOVER_MINUTES} minutes."
            )
        if layover_minutes > _MAX_LAYOVER_MINUTES:
            raise ValueError(
                f"Layover too long ({layover_minutes} min). "
                f"Maximum is {_MAX_LAYOVER_MINUTES} minutes."
            )

        info = self._stations[station]

        # --- Filter attractions within geofence & time budget ---
        # Reserve 15 min buffer for return to station
        usable_minutes = layover_minutes - 15
        activities: List[Dict[str, Any]] = []
        time_cursor = 0

        # Food first (always include at least one option)
        nearest_food = sorted(info["food_options"], key=lambda f: f["distance_km"])[0]
        food_time = 20  # min for a quick meal
        activities.append({
            "order": len(activities) + 1,
            "type": "food",
            "name": await self.translate_text(nearest_food["name"], language),
            "start_minute": time_cursor,
            "duration_minutes": food_time,
            "distance_km": nearest_food["distance_km"],
            "price_range": nearest_food["price_range"],
            "within_geofence": nearest_food["distance_km"] <= GEOFENCE_RADIUS_KM,
        })
        time_cursor += food_time

        # Sightseeing – fill remaining time
        for attraction in info["nearby_attractions"]:
            if attraction["distance_km"] > GEOFENCE_RADIUS_KM:
                continue  # outside geofence
            visit = attraction["visit_minutes"]
            travel_both_ways = int(attraction["distance_km"] * 6)  # ~10 min/km walk round-trip
            needed = visit + travel_both_ways
            if time_cursor + needed > usable_minutes:
                continue
            desc = attraction["description"]
            if not _is_content_safe(desc):
                continue  # guardrail

            activities.append({
                "order": len(activities) + 1,
                "type": "sightseeing",
                "name": await self.translate_text(attraction["name"], language),
                "description": await self.translate_text(desc, language),
                "start_minute": time_cursor,
                "duration_minutes": needed,
                "distance_km": attraction["distance_km"],
                "within_geofence": True,
            })
            time_cursor += needed

        # Return-to-station buffer
        activities.append({
            "order": len(activities) + 1,
            "type": "buffer",
            "name": await self.translate_text("Return to station & boarding", language),
            "start_minute": time_cursor,
            "duration_minutes": 15,
            "distance_km": 0.0,
            "within_geofence": True,
        })

        # Medical info
        medical = [
            {
                "name": m["name"],
                "distance_km": m["distance_km"],
                "type": m["type"],
                "emergency": m["emergency"],
            }
            for m in info["medical_facilities"]
            if m["distance_km"] <= GEOFENCE_RADIUS_KM
        ]

        itinerary = {
            "pnr": pnr,
            "station": station,
            "station_code": info["code"],
            "zone": info["zone"],
            "layover_minutes": layover_minutes,
            "language": language,
            "geofence_radius_km": GEOFENCE_RADIUS_KM,
            "activities": activities,
            "medical_facilities": medical,
            "total_planned_minutes": time_cursor + 15,
            "safety_notes": await self.translate_text(
                "Keep your ticket and ID handy. Do not leave luggage unattended. "
                "Return to the platform at least 15 minutes before departure.",
                language,
            ),
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
        return itinerary

    async def translate_text(self, text: str, target_lang: str) -> str:
        """Mock Bhashini translation via simulated network call."""
        if target_lang == "en":
            return text

        lang_names = {
            "hi": "Hindi",
            "bn": "Bengali",
            "ta": "Tamil",
            "te": "Telugu",
            "mr": "Marathi",
            "kn": "Kannada",
        }
        label = lang_names.get(target_lang, target_lang.upper())

        import httpx
        import asyncio
        # We simulate hitting Bhashini translation API by adding a delay and returning a placeholder
        async with httpx.AsyncClient() as client:
            try:
                # Mock a network request to simulate API latency
                await client.get("https://jsonplaceholder.typicode.com/todos/1")
            except httpx.RequestError:
                await asyncio.sleep(0.5)  # fallback delay if network is down
                
        return f"[{label}] {text}"

    # ---- helper -----------------------------------------------------------

    def get_supported_stations(self) -> List[Dict[str, Any]]:
        """Return summary info for all supported stations.

        Returns
        -------
        list[dict]
            Minimal station records (name, code, zone, lat, lon).
        """
        return [
            {
                "name": name,
                "code": info["code"],
                "zone": info["zone"],
                "lat": info["lat"],
                "lon": info["lon"],
                "attraction_count": len(info["nearby_attractions"]),
                "food_option_count": len(info["food_options"]),
            }
            for name, info in self._stations.items()
        ]
