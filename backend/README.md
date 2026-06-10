# Zenway Railway Platform – Feature 2: Ops & Crew Intelligence

Backend API for crew fatigue management, freight ETA prediction, and layover concierge services built for the Indian Railways context.

---

## 📦 Installation

### 1. Clone & navigate to the project

```bash
cd d:\Projects\Zenway
```

### 2. Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

This installs:
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for building the API |
| `uvicorn` | ASGI server to run FastAPI |
| `pydantic` | Request/response validation schemas |
| `scikit-learn` | ML model training (GradientBoostingRegressor fallback) |
| `lightgbm` | Primary ML model for fatigue prediction |
| `joblib` | Model serialization |
| `numpy` | Numerical computations |
| `pandas` | DataFrame operations for training data |

---

## 🚀 Running the Application

### Start the development server

From the project root (`d:\Projects\Zenway`):

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### Open the interactive docs

Once the server is running, open your browser and visit:

| URL | Description |
|-----|-------------|
| [http://localhost:8000](http://localhost:8000) | Root endpoint – API metadata |
| [http://localhost:8000/docs](http://localhost:8000/docs) | **Swagger UI** – interactive API docs (try endpoints here!) |
| [http://localhost:8000/redoc](http://localhost:8000/redoc) | ReDoc – alternative API docs |

---

## 🧪 Testing the Endpoints

### Quick health checks (curl or browser)

```bash
# Crew Intelligence health
curl http://localhost:8000/api/v1/crew/health

# FOIS Intelligence health
curl http://localhost:8000/api/v1/fois/health

# Concierge health
curl http://localhost:8000/api/v1/concierge/health
```

### Crew Intelligence (`/api/v1/crew`)

```bash
# Get fatigue score for a pilot
curl http://localhost:8000/api/v1/crew/fatigue/LP-1001-A

# Predict fatigue from shift features
curl -X POST http://localhost:8000/api/v1/crew/fatigue/predict \
  -H "Content-Type: application/json" \
  -d '{
    "shift_start_hour": 2,
    "shift_duration_hours": 10.5,
    "consecutive_days_on_duty": 5,
    "hours_since_last_rest": 6,
    "ambient_temp_c": 38,
    "route_complexity_score": 4
  }'

# Get high-fatigue roster alerts
curl http://localhost:8000/api/v1/crew/roster/alerts

# Trigger a swap proposal
curl -X POST http://localhost:8000/api/v1/crew/roster/swap \
  -H "Content-Type: application/json" \
  -d '{"fatigued_pilot_id": "LP-1001-A"}'
```

### FOIS Intelligence (`/api/v1/fois`)

```bash
# Get ETA for a rake
curl "http://localhost:8000/api/v1/fois/eta/RAKE-40291?origin=Mundra&destination=New%20Delhi"

# Batch ETA prediction
curl -X POST http://localhost:8000/api/v1/fois/eta/batch \
  -H "Content-Type: application/json" \
  -d '{"rake_ids": ["RAKE-40291", "RAKE-50182"], "origin": "Mundra", "destination": "New Delhi"}'

# Get congestion for a terminal
curl http://localhost:8000/api/v1/fois/congestion/Mundra

# Get congestion for ALL terminals
curl http://localhost:8000/api/v1/fois/congestion
```

### Layover Concierge (`/api/v1/concierge`)

```bash
# Generate a layover itinerary
curl -X POST http://localhost:8000/api/v1/concierge/itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "pnr": "PNR1234567",
    "station": "New Delhi",
    "layover_minutes": 120,
    "language": "hi"
  }'

# List supported stations
curl http://localhost:8000/api/v1/concierge/stations

# List supported languages
curl http://localhost:8000/api/v1/concierge/languages
```

---

## 🤖 Training the Fatigue ML Model (Optional)

The fatigue prediction endpoint uses a heuristic fallback by default. To train the actual ML model:

```bash
python -m backend.feature2.ml_fatigue_model
```

This will:
1. Generate 5,000 synthetic shift records
2. Train a LightGBM (or sklearn fallback) regressor
3. Save the model to `backend/feature2/fatigue_model.joblib`
4. Print validation metrics (MAE, RMSE, R²)

After training, the `/api/v1/crew/fatigue/predict` endpoint will automatically use the trained model.

---

## 📁 Project Structure

```
backend/
├── __init__.py                  # Backend package init
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Python dependencies
└── feature2/
    ├── __init__.py              # Exports crew_router, fois_router, concierge_router
    ├── ml_fatigue_model.py      # ML model training & prediction
    ├── rules_engine.py          # Indian Railway duty-hour validation
    ├── agent_rescheduler.py     # LangGraph-compatible crew swap agent
    ├── router_crew.py           # /api/v1/crew endpoints
    ├── fois_eta_brain.py        # ETA prediction & terminal congestion
    ├── router_fois.py           # /api/v1/fois endpoints
    ├── concierge_service.py     # Layover itinerary & translation
    └── router_concierge.py      # /api/v1/concierge endpoints
```

---

## 🔗 API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/crew/fatigue/{pilot_id}` | Fatigue score for a pilot |
| `POST` | `/api/v1/crew/fatigue/predict` | ML-predicted fatigue from shift features |
| `GET` | `/api/v1/crew/roster/alerts` | High-fatigue roster alerts |
| `POST` | `/api/v1/crew/roster/swap` | Trigger crew swap proposal |
| `GET` | `/api/v1/crew/health` | Crew service health check |
| `GET` | `/api/v1/fois/eta/{rake_id}` | ETA with confidence bands |
| `POST` | `/api/v1/fois/eta/batch` | Batch ETA predictions |
| `GET` | `/api/v1/fois/congestion/{terminal}` | Terminal congestion data |
| `GET` | `/api/v1/fois/congestion` | All terminals congestion |
| `GET` | `/api/v1/fois/health` | FOIS service health check |
| `POST` | `/api/v1/concierge/itinerary` | Generate layover itinerary |
| `GET` | `/api/v1/concierge/stations` | List supported stations |
| `GET` | `/api/v1/concierge/languages` | List supported languages |
| `GET` | `/api/v1/concierge/health` | Concierge service health check |
