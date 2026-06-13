# Zenway Railway Platform

Intelligent railway operations platform built for Indian Railways — featuring crew fatigue management, freight ETA prediction, and layover concierge services.

---

## 📦 Installation & Setup

### Backend (FastAPI)
```bash
cd d:\Projects\Zenway\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend (Next.js)
```bash
cd d:\Projects\Zenway\frontend
npm install
```

### 🔑 Bhashini API Configuration
> [!NOTE]
> **Prototype Status:** For the current prototype phase, the Bhashini API for voice synthesis and translation is **mocked**. You do not need to configure these keys immediately to test the prototype.

To enable real-time local language translations for the Layover Concierge via the real Bhashini ULCA API in the future:

1. Register at the [Bhashini Udyat Dashboard](https://dashboard.bhashini.co.in/).
2. Copy `backend/.env.example` to `backend/.env`.
3. Add your unique keys (`ulcaApiKey`, `userID`, `Authorization` token, and `serviceId` for NMT).

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

---

## 🚀 Running the Application

You will need to run both the frontend and backend simultaneously in separate terminal windows.

### Start the Backend
```bash
cd d:\Projects\Zenway\backend
venv\Scripts\activate
uvicorn routers.main:app --reload --port 8000
```
Open **http://localhost:8000/docs** for the interactive Swagger UI.

### Start the Frontend
```bash
cd d:\Projects\Zenway\frontend
npm run dev
```
Open **http://localhost:3000** to view the application prototype!

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
│       ├── fois_eta_brain.py        # ETA prediction & terminal congestion
│       └── concierge_service.py     # Layover itinerary & translation
└── frontend/
    ├── src/app/
    │   ├── page.tsx                 # Main layout with Navigation Tabs
    │   └── globals.css              # Global styles
    └── src/components/feature2/
        ├── CrewPulseDashboard.tsx   # Fatigue management UI
        ├── InteractiveFoisMap.tsx   # Live Leaflet Map
        └── LayoverConcierge.tsx     # Smart itinerary generator
```
