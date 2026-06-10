"""
fois_eta_brain.py
==================
Freight Operations Information System (FOIS) intelligence layer.

Provides:
- **ETAConfidenceModel** – predicts ETA with confidence bands for freight rakes.
- **TerminalCongestionPredictor** – monitors congestion at major Indian
  freight terminals.

All data is synthetic / mock so the module runs standalone without any
external service dependency.
"""
from __future__ import annotations

import hashlib
import math
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Route metadata (origin → destination → base_hours, complexity)
# ---------------------------------------------------------------------------

_ROUTE_TABLE: Dict[str, Dict[str, Tuple[float, float]]] = {
    "Mundra": {
        "New Delhi":         (22.0, 3.8),
        "Ahmedabad":         (6.0,  2.0),
        "Jodhpur":           (10.0, 2.5),
        "Mumbai":            (14.0, 3.2),
    },
    "JNPT": {
        "New Delhi":         (24.0, 4.0),
        "Nagpur":            (14.0, 3.0),
        "Pune":              (3.5,  1.5),
        "Bengaluru":         (20.0, 3.5),
    },
    "Visakhapatnam": {
        "Howrah":            (14.0, 3.2),
        "Secunderabad":      (12.0, 2.8),
        "Chennai":           (12.0, 3.0),
        "Nagpur":            (18.0, 3.6),
    },
    "Haldia": {
        "Howrah":            (3.0,  1.5),
        "New Delhi":         (26.0, 4.2),
        "Patna":             (10.0, 2.6),
        "Mughal Sarai":      (12.0, 3.0),
    },
    "Chennai": {
        "Bengaluru":         (6.0,  2.0),
        "Coimbatore":        (8.0,  2.4),
        "Visakhapatnam":     (12.0, 3.0),
        "Hyderabad":         (10.0, 2.8),
    },
}

# ---------------------------------------------------------------------------
# Terminal congestion mock data
# ---------------------------------------------------------------------------

_TERMINAL_DATA: Dict[str, Dict[str, Any]] = {
    "Mundra": {
        "full_name": "Adani Mundra Port Terminal",
        "state": "Gujarat",
        "lat": 22.7396,
        "lon": 69.7186,
        "capacity": 40,
        "avg_clearance_hours": 6.0,
    },
    "JNPT": {
        "full_name": "Jawaharlal Nehru Port Trust, Navi Mumbai",
        "state": "Maharashtra",
        "lat": 18.9500,
        "lon": 72.9500,
        "capacity": 50,
        "avg_clearance_hours": 8.0,
    },
    "Visakhapatnam": {
        "full_name": "Visakhapatnam Port",
        "state": "Andhra Pradesh",
        "lat": 17.6868,
        "lon": 83.2185,
        "capacity": 35,
        "avg_clearance_hours": 5.5,
    },
    "Haldia": {
        "full_name": "Haldia Dock Complex",
        "state": "West Bengal",
        "lat": 22.0667,
        "lon": 88.0698,
        "capacity": 30,
        "avg_clearance_hours": 7.0,
    },
    "Chennai": {
        "full_name": "Chennai Port (Ennore)",
        "state": "Tamil Nadu",
        "lat": 13.0827,
        "lon": 80.2707,
        "capacity": 38,
        "avg_clearance_hours": 6.5,
    },
}


# ---------------------------------------------------------------------------
# ETA Confidence Model
# ---------------------------------------------------------------------------

class ETAConfidenceModel:
    """Predict freight rake ETA with three-band confidence distribution.

    The model uses a deterministic hash of the ``rake_id`` combined with
    route-complexity factors to produce repeatable but varied predictions.
    """

    def predict_eta(
        self,
        rake_id: str,
        origin: str,
        destination: str,
    ) -> Dict[str, Any]:
        """Return an ETA prediction with confidence bands.

        Parameters
        ----------
        rake_id : str
            Unique rake identifier (e.g. ``"RAKE-40291"``).
        origin : str
            Origin terminal / station name.
        destination : str
            Destination terminal / station name.

        Returns
        -------
        dict
            Keys: rake_id, origin, destination, expected_arrival,
            confidence_band, delay_minutes, factors.
        """
        # Look up route; fall back to generic if unknown
        route = _ROUTE_TABLE.get(origin, {}).get(destination)
        if route:
            base_hours, complexity = route
        else:
            # deterministic fallback based on names
            seed = int(hashlib.md5(f"{origin}-{destination}".encode()).hexdigest(), 16)
            base_hours = 8.0 + (seed % 20)
            complexity = 1.0 + (seed % 40) / 10.0

        # Rake-specific perturbation
        rake_hash = int(hashlib.md5(rake_id.encode()).hexdigest(), 16)
        rng = random.Random(rake_hash)

        # delay influenced by complexity
        delay_minutes = round(rng.gauss(complexity * 12, complexity * 8), 1)
        delay_minutes = max(delay_minutes, -base_hours * 10)  # can be early

        total_hours = base_hours + delay_minutes / 60.0
        expected_arrival = datetime.utcnow() + timedelta(hours=total_hours)

        # Confidence bands
        p_on_time = max(0.0, min(1.0, 0.75 - complexity * 0.08 + rng.uniform(-0.1, 0.1)))
        p_early = max(0.0, min(1.0 - p_on_time, 0.10 + rng.uniform(0, 0.1)))
        p_delayed = round(1.0 - p_on_time - p_early, 3)

        # Influencing factors
        factors: List[str] = []
        if complexity >= 3.5:
            factors.append("High route complexity (ghats / single-line sections)")
        if delay_minutes > 30:
            factors.append("Congestion-induced path delay")
        if 22 <= datetime.utcnow().hour or datetime.utcnow().hour <= 5:
            factors.append("Night-time speed restriction zone")
        if rng.random() > 0.6:
            factors.append("Seasonal fog advisory active")
        if rng.random() > 0.7:
            factors.append("Caution order on intermediate section")
        if not factors:
            factors.append("Normal operating conditions")

        return {
            "rake_id": rake_id,
            "origin": origin,
            "destination": destination,
            "expected_arrival": expected_arrival.isoformat() + "Z",
            "confidence_band": {
                "early": round(p_early, 3),
                "on_time": round(p_on_time, 3),
                "delayed": round(p_delayed, 3),
            },
            "delay_minutes": round(delay_minutes, 1),
            "factors": factors,
        }


# ---------------------------------------------------------------------------
# Terminal Congestion Predictor
# ---------------------------------------------------------------------------

class TerminalCongestionPredictor:
    """Monitor and predict congestion at major Indian freight terminals."""

    def __init__(self) -> None:
        self._terminals = _TERMINAL_DATA

    def get_congestion(
        self,
        terminal: str,
        window_hours: int = 4,
    ) -> Dict[str, Any]:
        """Return congestion snapshot for *terminal*.

        Parameters
        ----------
        terminal : str
            Terminal name (must be one of the five supported keys).
        window_hours : int
            Look-ahead window for clearance prediction.

        Returns
        -------
        dict
            Keys: terminal, full_name, current_rakes, capacity,
            utilization_pct, alert_level, predicted_clearance_hours.

        Raises
        ------
        ValueError
            If the terminal is unknown.
        """
        info = self._terminals.get(terminal)
        if info is None:
            raise ValueError(
                f"Unknown terminal '{terminal}'. "
                f"Supported: {list(self._terminals.keys())}"
            )

        # Deterministic-ish "current" rakes (varies by hour of day)
        hour_seed = int(hashlib.md5(
            f"{terminal}-{datetime.utcnow().strftime('%Y-%m-%d-%H')}".encode()
        ).hexdigest(), 16)
        rng = random.Random(hour_seed)

        capacity: int = info["capacity"]
        current_rakes = rng.randint(int(capacity * 0.3), capacity)
        utilization = round(current_rakes / capacity * 100, 1)

        if utilization >= 85:
            alert_level = "red"
        elif utilization >= 60:
            alert_level = "yellow"
        else:
            alert_level = "green"

        base_clearance: float = info["avg_clearance_hours"]
        load_factor = 1.0 + (utilization - 50) / 100.0
        predicted_clearance = round(
            max(1.0, base_clearance * load_factor + rng.uniform(-0.5, 1.5)),
            1,
        )

        return {
            "terminal": terminal,
            "full_name": info["full_name"],
            "state": info["state"],
            "current_rakes": current_rakes,
            "capacity": capacity,
            "utilization_pct": utilization,
            "alert_level": alert_level,
            "predicted_clearance_hours": predicted_clearance,
            "window_hours": window_hours,
            "snapshot_time": datetime.utcnow().isoformat() + "Z",
        }

    def get_all_terminals(self) -> List[Dict[str, Any]]:
        """Return congestion snapshots for every supported terminal.

        Returns
        -------
        list[dict]
            One entry per terminal, sorted by utilization descending.
        """
        results = [self.get_congestion(t) for t in self._terminals]
        results.sort(key=lambda r: r["utilization_pct"], reverse=True)
        return results
