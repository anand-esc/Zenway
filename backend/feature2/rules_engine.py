"""
rules_engine.py
================
Crew Rules Engine that validates proposed roster swaps against standard
Indian Railway duty-hour limits (Hours of Employment Regulations, 2005).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


# ---------------------------------------------------------------------------
# Constants – Indian Railway duty-hour limits
# ---------------------------------------------------------------------------
MAX_CONTINUOUS_DUTY_HOURS: int = 12
MIN_REST_BETWEEN_SHIFTS_HOURS: int = 8
MAX_WEEKLY_HOURS: int = 60
MAX_CONSECUTIVE_DAYS: int = 6


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class CrewRulesEngine:
    """Validates crew roster swaps against Indian Railway duty regulations.

    Each *pilot* dict is expected to carry the following keys (all numeric):

    - ``current_duty_hours``      – hours in the current continuous shift
    - ``hours_since_last_rest``   – hours elapsed since last off-duty rest
    - ``weekly_hours``            – total duty hours logged this week
    - ``consecutive_days_on_duty``– days worked without a full rest day
    - ``remaining_shift_hours``   – hours left in the proposed shift (optional, default 0)
    - ``fatigue_score``           – 0-100 fatigue prediction (optional)
    """

    # ---- public API -------------------------------------------------------

    def validate_swap(
        self,
        current_pilot: Dict[str, Any],
        replacement_pilot: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Validate whether *replacement_pilot* can legally take over.

        Parameters
        ----------
        current_pilot : dict
            Attributes of the fatigued / out-going pilot.
        replacement_pilot : dict
            Attributes of the proposed replacement.

        Returns
        -------
        dict
            ``{"approved": bool, "violations": list[str], "warnings": list[str]}``
        """
        violations: List[str] = []
        warnings: List[str] = []

        # --- replacement-side checks ---
        if not self.check_duty_hours(replacement_pilot):
            violations.append(
                f"Replacement would exceed {MAX_CONTINUOUS_DUTY_HOURS}h "
                f"continuous duty limit "
                f"(current: {replacement_pilot.get('current_duty_hours', 0)}h "
                f"+ remaining: {replacement_pilot.get('remaining_shift_hours', 0)}h)."
            )

        if not self.check_rest_period(replacement_pilot):
            violations.append(
                f"Replacement has only rested "
                f"{replacement_pilot.get('hours_since_last_rest', 0)}h; "
                f"minimum {MIN_REST_BETWEEN_SHIFTS_HOURS}h required."
            )

        if not self.check_weekly_limit(replacement_pilot):
            violations.append(
                f"Replacement has logged "
                f"{replacement_pilot.get('weekly_hours', 0)}h this week; "
                f"weekly cap is {MAX_WEEKLY_HOURS}h."
            )

        if not self._check_consecutive_days(replacement_pilot):
            violations.append(
                f"Replacement has worked "
                f"{replacement_pilot.get('consecutive_days_on_duty', 0)} "
                f"consecutive days; max is {MAX_CONSECUTIVE_DAYS}."
            )

        # --- warnings (soft limits) ---
        repl_fatigue = replacement_pilot.get("fatigue_score", 0)
        if 50 <= repl_fatigue < 70:
            warnings.append(
                f"Replacement fatigue score is moderate ({repl_fatigue}/100)."
            )
        elif repl_fatigue >= 70:
            violations.append(
                f"Replacement fatigue score too high ({repl_fatigue}/100); "
                "cannot assign a fatigued replacement."
            )

        repl_weekly = replacement_pilot.get("weekly_hours", 0)
        remaining = replacement_pilot.get("remaining_shift_hours", 0)
        if repl_weekly + remaining > MAX_WEEKLY_HOURS * 0.85:
            warnings.append(
                f"Replacement is approaching weekly hour cap "
                f"({repl_weekly}h logged + {remaining}h remaining vs "
                f"{MAX_WEEKLY_HOURS}h cap)."
            )

        curr_fatigue = current_pilot.get("fatigue_score", 0)
        if curr_fatigue >= 85:
            warnings.append(
                f"Current pilot fatigue critically high ({curr_fatigue}/100); "
                "immediate relief recommended."
            )

        approved = len(violations) == 0
        return {
            "approved": approved,
            "violations": violations,
            "warnings": warnings,
        }

    # ---- individual checks ------------------------------------------------

    def check_duty_hours(self, pilot: Dict[str, Any]) -> bool:
        """Return True if the pilot will stay within continuous duty limits.

        Considers ``current_duty_hours`` + ``remaining_shift_hours``.
        """
        current = pilot.get("current_duty_hours", 0)
        remaining = pilot.get("remaining_shift_hours", 0)
        return (current + remaining) <= MAX_CONTINUOUS_DUTY_HOURS

    def check_rest_period(self, pilot: Dict[str, Any]) -> bool:
        """Return True if the pilot has had sufficient rest before this shift."""
        return pilot.get("hours_since_last_rest", 0) >= MIN_REST_BETWEEN_SHIFTS_HOURS

    def check_weekly_limit(self, pilot: Dict[str, Any]) -> bool:
        """Return True if the pilot is within the weekly hours cap."""
        weekly = pilot.get("weekly_hours", 0)
        remaining = pilot.get("remaining_shift_hours", 0)
        return (weekly + remaining) <= MAX_WEEKLY_HOURS

    # ---- private helpers --------------------------------------------------

    def _check_consecutive_days(self, pilot: Dict[str, Any]) -> bool:
        """Return True if the pilot hasn't exceeded max consecutive work days."""
        return pilot.get("consecutive_days_on_duty", 0) <= MAX_CONSECUTIVE_DAYS
