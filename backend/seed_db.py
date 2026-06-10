import os
from database import engine, Base, SessionLocal
import models

_MOCK_ROSTER = [
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

_MOCK_TERMINALS = [
    {"terminal_id": "T1", "name": "Mundra Port", "current_rakes": 18, "capacity": 25, "alert_level": "yellow"},
    {"terminal_id": "T2", "name": "JNPT Mumbai", "current_rakes": 22, "capacity": 24, "alert_level": "red"},
    {"terminal_id": "T3", "name": "Visakhapatnam Port", "current_rakes": 10, "capacity": 20, "alert_level": "green"},
    {"terminal_id": "T4", "name": "Haldia Dock Complex", "current_rakes": 14, "capacity": 18, "alert_level": "yellow"},
    {"terminal_id": "T5", "name": "Chennai Port", "current_rakes": 8, "capacity": 22, "alert_level": "green"},
]

_MOCK_RAKES = [
    {"rake_id": "BCNA-41025", "origin": "Mundra Port", "destination": "ICD Tughlakabad", "expected_arrival": "14:30 IST", "status": "On Track"},
    {"rake_id": "BOXN-73418", "origin": "Talcher Coalfields", "destination": "NTPC Farakka", "expected_arrival": "18:15 IST", "status": "Delayed"},
    {"rake_id": "BTPN-55210", "origin": "IOCL Mathura Refinery", "destination": "Kanpur POL Terminal", "expected_arrival": "11:45 IST", "status": "On Track"},
    {"rake_id": "BCNA-62034", "origin": "JNPT Mumbai", "destination": "ICD Nagpur", "expected_arrival": "22:00 IST", "status": "Critical"},
    {"rake_id": "BOXN-88712", "origin": "Visakhapatnam Port", "destination": "Rourkela Steel Plant", "expected_arrival": "16:00 IST", "status": "On Track"},
]

def seed():
    print("Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Seeding Pilots...")
        for p in _MOCK_ROSTER:
            db.add(models.Pilot(**p))
        
        print("Seeding Terminals...")
        for t in _MOCK_TERMINALS:
            db.add(models.Terminal(**t))

        print("Seeding Rakes...")
        for r in _MOCK_RAKES:
            db.add(models.Rake(**r))

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding db: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
