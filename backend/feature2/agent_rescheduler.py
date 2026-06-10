"""
agent_rescheduler.py
=====================
LangGraph-compatible Rescheduling Agent that finds, ranks, and proposes
crew swaps for fatigued loco-pilots.  Implemented as a plain-Python
state-graph (nodes + edges) so there is **no hard dependency** on
``langgraph`` at import time.
"""
from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .rules_engine import CrewRulesEngine

# ---------------------------------------------------------------------------
# Mock pilot pool – 20 replacement loco-pilots across Indian Railway zones
# ---------------------------------------------------------------------------

_STATIONS: List[str] = [
    "New Delhi", "Mumbai CST", "Howrah", "Chennai Central",
    "Bengaluru City", "Secunderabad", "Lucknow NR", "Jaipur",
    "Bhopal", "Patna",
]

_FIRST_NAMES: List[str] = [
    "Rajesh", "Sunil", "Amit", "Pradeep", "Vikram",
    "Anil", "Manoj", "Ravi", "Sanjay", "Deepak",
    "Gopal", "Ashok", "Ramesh", "Nitin", "Kiran",
    "Suresh", "Prakash", "Ajay", "Rohit", "Mohan",
]

_LAST_NAMES: List[str] = [
    "Sharma", "Verma", "Yadav", "Singh", "Patel",
    "Reddy", "Gupta", "Kumar", "Das", "Nair",
    "Joshi", "Mishra", "Pandey", "Iyer", "Rao",
    "Tiwari", "Dubey", "Chauhan", "Bhat", "Pillai",
]


def _build_pilot_pool(seed: int = 7) -> List[Dict[str, Any]]:
    """Create a deterministic pool of 20 replacement loco-pilots."""
    rng = random.Random(seed)
    pool: List[Dict[str, Any]] = []
    for i in range(20):
        pilot_id = f"LP-{5000 + i:04d}-R"
        pool.append(
            {
                "pilot_id": pilot_id,
                "name": f"{_FIRST_NAMES[i]} {_LAST_NAMES[i]}",
                "certification_level": rng.choice(["A1", "A2", "B1", "B2"]),
                "home_station": _STATIONS[i % len(_STATIONS)],
                "available_from_minutes": rng.randint(0, 90),
                "fatigue_score": round(rng.uniform(10, 75), 1),
                # regulatory fields needed by rules engine
                "current_duty_hours": round(rng.uniform(0, 6), 1),
                "hours_since_last_rest": round(rng.uniform(6, 20), 1),
                "weekly_hours": round(rng.uniform(10, 50), 1),
                "consecutive_days_on_duty": rng.randint(0, 5),
                "remaining_shift_hours": round(rng.uniform(2, 8), 1),
            }
        )
    return pool


# ---------------------------------------------------------------------------
# State-graph primitives (LangGraph-compatible pattern)
# ---------------------------------------------------------------------------

class _State:
    """Minimal mutable state bag passed through the graph nodes."""

    def __init__(self) -> None:
        self.fatigued_pilot: Dict[str, Any] = {}
        self.replacements: List[Dict[str, Any]] = []
        self.validated_proposal: Dict[str, Any] = {}
        self.final_output: Dict[str, Any] = {}
        self.errors: List[str] = []


# ---------------------------------------------------------------------------
# Rescheduling Agent
# ---------------------------------------------------------------------------

class ReschedulingAgent:
    """Orchestrates crew swap proposals through a state-graph workflow.

    Workflow nodes:
        1. **assess_fatigue** – compute / fetch the fatigue score.
        2. **find_replacements** – filter & rank available pilots.
        3. **validate_swap** – check the top candidate via ``CrewRulesEngine``.
        4. **emit_proposal** – assemble final proposal dict.

    The nodes are chained as simple method calls, but the structure mirrors
    a ``StateGraph`` from LangGraph so it can be upgraded later with
    minimal refactoring.
    """

    def __init__(self) -> None:
        self.pilot_pool: List[Dict[str, Any]] = _build_pilot_pool()
        self.rules_engine = CrewRulesEngine()

        # Define graph edges (node_name -> next_node_name)
        self._edges: Dict[str, str] = {
            "assess_fatigue": "find_replacements",
            "find_replacements": "validate_swap",
            "validate_swap": "emit_proposal",
        }
        self._nodes: Dict[str, Any] = {
            "assess_fatigue": self._node_assess_fatigue,
            "find_replacements": self._node_find_replacements,
            "validate_swap": self._node_validate_swap,
            "emit_proposal": self._node_emit_proposal,
        }

    # ---- public API -------------------------------------------------------

    def find_replacements(
        self,
        high_fatigue_pilot: Dict[str, Any],
        time_window_minutes: int = 45,
    ) -> List[Dict[str, Any]]:
        """Filter and rank available pilots within a time window.

        Ranking criteria (ascending composite score):
            0.50 × normalised fatigue  +
            0.30 × normalised availability  +
            0.20 × station-distance proxy

        Parameters
        ----------
        high_fatigue_pilot : dict
            Must contain at least ``pilot_id`` and ``home_station``.
        time_window_minutes : int
            Maximum minutes until the replacement must be available.

        Returns
        -------
        list[dict]
            Sorted list of eligible replacements (best first).
        """
        origin = high_fatigue_pilot.get("home_station", "New Delhi")

        eligible = [
            p for p in self.pilot_pool
            if p["available_from_minutes"] <= time_window_minutes
            and p["fatigue_score"] < 70
            and p["pilot_id"] != high_fatigue_pilot.get("pilot_id")
        ]

        max_fatigue = max((p["fatigue_score"] for p in eligible), default=1)
        max_avail = max(
            (p["available_from_minutes"] for p in eligible), default=1
        ) or 1

        def _score(p: Dict[str, Any]) -> float:
            f_norm = p["fatigue_score"] / max_fatigue
            a_norm = p["available_from_minutes"] / max_avail
            station_dist = 0.0 if p["home_station"] == origin else 1.0
            return 0.50 * f_norm + 0.30 * a_norm + 0.20 * station_dist

        eligible.sort(key=_score)
        return eligible

    def propose_swap(self, fatigued_pilot_id: str) -> Dict[str, Any]:
        """Run the full state-graph workflow and return a swap proposal.

        Parameters
        ----------
        fatigued_pilot_id : str
            ID of the pilot to be relieved.

        Returns
        -------
        dict
            Proposal containing replacement info, rule-check result,
            and metadata.
        """
        state = _State()
        state.fatigued_pilot = self._mock_fatigued_pilot(fatigued_pilot_id)

        # Walk the graph
        current_node = "assess_fatigue"
        while current_node in self._nodes:
            self._nodes[current_node](state)
            current_node = self._edges.get(current_node, "__end__")

        return state.final_output

    # ---- graph nodes (private) -------------------------------------------

    def _node_assess_fatigue(self, state: _State) -> None:
        """Node 1: Ensure fatigue score is present on the fatigued pilot."""
        if "fatigue_score" not in state.fatigued_pilot:
            # derive a deterministic mock score from the pilot id
            h = int(
                hashlib.md5(
                    state.fatigued_pilot["pilot_id"].encode()
                ).hexdigest(),
                16,
            )
            state.fatigued_pilot["fatigue_score"] = round(70 + (h % 30), 1)

    def _node_find_replacements(self, state: _State) -> None:
        """Node 2: Find and rank eligible replacements."""
        state.replacements = self.find_replacements(
            state.fatigued_pilot, time_window_minutes=45
        )
        if not state.replacements:
            state.errors.append("No eligible replacements found within 45 min window.")

    def _node_validate_swap(self, state: _State) -> None:
        """Node 3: Validate top candidate against the rules engine."""
        if state.errors or not state.replacements:
            state.validated_proposal = {
                "approved": False,
                "violations": state.errors or ["No candidates available."],
                "warnings": [],
            }
            return

        best = state.replacements[0]
        result = self.rules_engine.validate_swap(
            current_pilot=state.fatigued_pilot,
            replacement_pilot=best,
        )

        # If the top candidate fails, try the next ones
        if not result["approved"]:
            for candidate in state.replacements[1:]:
                result = self.rules_engine.validate_swap(
                    current_pilot=state.fatigued_pilot,
                    replacement_pilot=candidate,
                )
                if result["approved"]:
                    state.replacements.insert(0, state.replacements.pop(
                        state.replacements.index(candidate)
                    ))
                    break

        state.validated_proposal = result

    def _node_emit_proposal(self, state: _State) -> None:
        """Node 4: Assemble the final output payload."""
        chosen = state.replacements[0] if state.replacements else None
        state.final_output = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "fatigued_pilot": {
                "pilot_id": state.fatigued_pilot.get("pilot_id"),
                "fatigue_score": state.fatigued_pilot.get("fatigue_score"),
                "home_station": state.fatigued_pilot.get("home_station"),
            },
            "proposed_replacement": (
                {
                    "pilot_id": chosen["pilot_id"],
                    "name": chosen["name"],
                    "fatigue_score": chosen["fatigue_score"],
                    "available_in_minutes": chosen["available_from_minutes"],
                    "home_station": chosen["home_station"],
                    "certification_level": chosen["certification_level"],
                }
                if chosen
                else None
            ),
            "rule_check": state.validated_proposal,
            "candidates_evaluated": len(state.replacements),
        }

    # ---- helpers ----------------------------------------------------------

    @staticmethod
    def _mock_fatigued_pilot(pilot_id: str) -> Dict[str, Any]:
        """Build a mock fatigued-pilot dict from an ID string."""
        h = int(hashlib.md5(pilot_id.encode()).hexdigest(), 16)
        rng = random.Random(h)
        return {
            "pilot_id": pilot_id,
            "name": f"Pilot {pilot_id[-4:]}",
            "home_station": _STATIONS[h % len(_STATIONS)],
            "current_duty_hours": round(rng.uniform(8, 14), 1),
            "hours_since_last_rest": round(rng.uniform(2, 8), 1),
            "weekly_hours": round(rng.uniform(40, 62), 1),
            "consecutive_days_on_duty": rng.randint(3, 7),
            "remaining_shift_hours": round(rng.uniform(1, 5), 1),
        }
