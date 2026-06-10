# Zenway Railway Platform

Intelligent railway operations platform built for Indian Railways — featuring crew fatigue management, freight ETA prediction, and layover concierge services.

---

## 📦 Installation

```bash
cd d:\Projects\Zenway
pip install -r backend/requirements.txt
```

## 🚀 Running the Application

```bash
uvicorn backend.main:app --reload --port 8000
```

Then open **http://localhost:8000/docs** for the interactive Swagger UI.

## 🧪 Quick Health Checks

```bash
curl http://localhost:8000/api/v1/crew/health
curl http://localhost:8000/api/v1/fois/health
curl http://localhost:8000/api/v1/concierge/health
```

---

## 📁 Project Structure

```
Zenway/
├── backend/
│   ├── main.py                      # FastAPI app entry point
│   ├── requirements.txt             # Python dependencies
│   └── feature2/                    # Ops & Crew Intelligence
│       ├── ml_fatigue_model.py      # ML fatigue prediction (LightGBM/sklearn)
│       ├── rules_engine.py          # Indian Railway duty-hour validation
│       ├── agent_rescheduler.py     # LangGraph-compatible crew swap agent
│       ├── router_crew.py           # /api/v1/crew endpoints
│       ├── fois_eta_brain.py        # ETA prediction & terminal congestion
│       ├── router_fois.py           # /api/v1/fois endpoints
│       ├── concierge_service.py     # Layover itinerary & translation
│       └── router_concierge.py      # /api/v1/concierge endpoints
└── frontend/
    └── components/
        └── feature2/
            ├── CrewPulseDashboard.tsx
            ├── FoisEtaTracker.tsx
            ├── RosterSwapModal.tsx
            ├── LayoverConciergePWA.tsx
            ├── ItineraryTimelineItem.tsx
            └── index.ts
```

---

## 🔗 API Endpoints

### Crew Intelligence (`/api/v1/crew`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/fatigue/{pilot_id}` | Fatigue score for a pilot |
| `POST` | `/fatigue/predict` | ML-predicted fatigue from shift features |
| `GET` | `/roster/alerts` | High-fatigue roster alerts |
| `POST` | `/roster/swap` | Trigger crew swap proposal |
| `GET` | `/health` | Health check |

### FOIS Intelligence (`/api/v1/fois`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/eta/{rake_id}` | ETA with confidence bands |
| `POST` | `/eta/batch` | Batch ETA predictions |
| `GET` | `/congestion/{terminal}` | Terminal congestion data |
| `GET` | `/congestion` | All terminals congestion |
| `GET` | `/health` | Health check |

### Layover Concierge (`/api/v1/concierge`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/itinerary` | Generate layover itinerary |
| `GET` | `/stations` | List supported stations |
| `GET` | `/languages` | List supported languages |
| `GET` | `/health` | Health check |

---

## 🤖 Training the ML Model (Optional)

```bash
python -m backend.feature2.ml_fatigue_model
```

Generates 5,000 synthetic records, trains a LightGBM regressor, and saves to `fatigue_model.joblib`.

---

## 📄 License

See [LICENSE](LICENSE) for details.
