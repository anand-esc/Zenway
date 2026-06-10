"""
ml_fatigue_model.py
====================
Generates synthetic shift data for Indian Railway loco-pilots and trains
a baseline ML model to predict a fatigue_score (0-100).

Supports LightGBM when available; gracefully falls back to scikit-learn's
GradientBoostingRegressor.
"""
from __future__ import annotations

import hashlib
import os
import pathlib
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

try:
    from lightgbm import LGBMRegressor as _Regressor

    _MODEL_BACKEND = "lightgbm"
except ImportError:
    from sklearn.ensemble import GradientBoostingRegressor as _Regressor  # type: ignore[assignment]

    _MODEL_BACKEND = "sklearn"

try:
    import joblib
except ImportError:
    from sklearn.externals import joblib  # type: ignore[attr-defined]

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_MODEL_DIR = pathlib.Path(__file__).resolve().parent
_MODEL_PATH = _MODEL_DIR / "fatigue_model.joblib"

FEATURE_COLS: List[str] = [
    "shift_start_hour",
    "shift_duration_hours",
    "consecutive_days_on_duty",
    "hours_since_last_rest",
    "ambient_temp_c",
    "route_complexity_score",
]
TARGET_COL = "fatigue_score"


# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------

def generate_synthetic_shift_data(n_samples: int = 5000) -> pd.DataFrame:
    """Generate a realistic synthetic DataFrame of loco-pilot shift records.

    The fatigue score is derived from a weighted combination of the input
    features with added Gaussian noise so that the ML model has a learnable
    but imperfect signal.

    Parameters
    ----------
    n_samples : int
        Number of rows to generate.

    Returns
    -------
    pd.DataFrame
        DataFrame with columns: pilot_id, shift_start_hour,
        shift_duration_hours, consecutive_days_on_duty,
        hours_since_last_rest, ambient_temp_c, route_complexity_score,
        fatigue_score.
    """
    rng = np.random.default_rng(seed=42)

    pilot_ids: List[str] = [
        f"LP-{rng.integers(1000, 9999)}-{chr(rng.integers(65, 91))}"
        for _ in range(n_samples)
    ]

    shift_start_hour = rng.integers(0, 24, size=n_samples).astype(float)
    shift_duration_hours = rng.uniform(4.0, 14.0, size=n_samples)
    consecutive_days_on_duty = rng.integers(1, 8, size=n_samples).astype(float)
    hours_since_last_rest = rng.uniform(2.0, 24.0, size=n_samples)
    ambient_temp_c = rng.uniform(10.0, 48.0, size=n_samples)
    route_complexity_score = rng.integers(1, 6, size=n_samples).astype(float)

    # ---- Compute fatigue with a deterministic formula + noise -----------
    # Night shifts (start 22-06) boost fatigue
    night_penalty = np.where(
        (shift_start_hour >= 22) | (shift_start_hour <= 5), 10.0, 0.0
    )
    fatigue_raw: np.ndarray = (
        3.0 * shift_duration_hours
        + 6.0 * consecutive_days_on_duty
        + 2.5 * hours_since_last_rest
        + 0.3 * ambient_temp_c
        + 4.0 * route_complexity_score
        + night_penalty
        - 30.0  # base offset
    )
    noise = rng.normal(0, 4.0, size=n_samples)
    fatigue_score = np.clip(fatigue_raw + noise, 0, 100).round(1)

    df = pd.DataFrame(
        {
            "pilot_id": pilot_ids,
            "shift_start_hour": shift_start_hour,
            "shift_duration_hours": shift_duration_hours.round(2),
            "consecutive_days_on_duty": consecutive_days_on_duty,
            "hours_since_last_rest": hours_since_last_rest.round(2),
            "ambient_temp_c": ambient_temp_c.round(1),
            "route_complexity_score": route_complexity_score,
            "fatigue_score": fatigue_score,
        }
    )
    return df


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_fatigue_model(
    df: pd.DataFrame,
    model_path: Optional[pathlib.Path] = None,
) -> Dict[str, Any]:
    """Train a regression model on shift data and persist to disk.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain all ``FEATURE_COLS`` and ``TARGET_COL``.
    model_path : pathlib.Path, optional
        Where to save the trained model (defaults to module-level constant).

    Returns
    -------
    dict
        Training metrics: mae, rmse, r2, backend, model_path.
    """
    model_path = model_path or _MODEL_PATH

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    if _MODEL_BACKEND == "lightgbm":
        model = _Regressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            num_leaves=31,
            random_state=42,
            verbose=-1,
        )
    else:
        model = _Regressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            random_state=42,
        )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))

    joblib.dump(model, model_path)

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "backend": _MODEL_BACKEND,
        "model_path": str(model_path),
    }


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------

def predict_fatigue(
    features: Dict[str, float],
    model_path: Optional[pathlib.Path] = None,
) -> float:
    """Load the persisted model and return a fatigue score.

    The ML model (LightGBM) predicts the fatigue score based on 6 key variables:
    - Shift Duration: Hours driving (requires constant vigilance).
    - Consecutive Days: Days worked without a 24h break (cumulative exhaustion).
    - Hours Since Rest: Time since last 8h sleep block.
    - Night Shift Penalty: Disruption to circadian rhythm (10 PM - 5 AM).
    - Ambient Temperature: Extreme locomotive cabin heat drains energy.
    - Route Complexity: Difficulty of route (1-5 scale).

    Parameters
    ----------
    features : dict
        Keys must match ``FEATURE_COLS``.
    model_path : pathlib.Path, optional
        Path to the joblib model file.

    Returns
    -------
    float
        Predicted fatigue_score clipped to [0, 100].
    """
    model_path = model_path or _MODEL_PATH

    if not model_path.exists():
        raise FileNotFoundError(
            f"Trained model not found at {model_path}. "
            "Run `python ml_fatigue_model.py` first to train."
        )

    model = joblib.load(model_path)
    arr = np.array([[features[c] for c in FEATURE_COLS]])
    score = float(model.predict(arr)[0])
    return round(min(max(score, 0.0), 100.0), 2)


# ---------------------------------------------------------------------------
# CLI entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"[fatigue-model] Using backend: {_MODEL_BACKEND}")
    print("[fatigue-model] Generating synthetic shift data …")
    data = generate_synthetic_shift_data(n_samples=5000)
    print(f"[fatigue-model] Data shape: {data.shape}")
    print(data.describe().round(2))

    print("\n[fatigue-model] Training model …")
    metrics = train_fatigue_model(data)
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    # Quick validation prediction
    sample_features = {
        "shift_start_hour": 2.0,
        "shift_duration_hours": 10.5,
        "consecutive_days_on_duty": 5.0,
        "hours_since_last_rest": 6.0,
        "ambient_temp_c": 38.0,
        "route_complexity_score": 4.0,
    }
    pred = predict_fatigue(sample_features)
    print(f"\n[fatigue-model] Sample prediction: {pred}")
