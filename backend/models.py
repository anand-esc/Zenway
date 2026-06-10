from sqlalchemy import Column, Integer, String, Float

from database import Base

class Pilot(Base):
    __tablename__ = "pilots"

    id = Column(Integer, primary_key=True, index=True)
    pilot_id = Column(String, unique=True, index=True)
    name = Column(String)
    home_station = Column(String)
    consecutive_days_on_duty = Column(Integer)
    fatigue_score = Column(Float)
    status = Column(String, default="active")

class Terminal(Base):
    __tablename__ = "terminals"

    id = Column(Integer, primary_key=True, index=True)
    terminal_id = Column(String, unique=True, index=True)
    name = Column(String)
    current_rakes = Column(Integer)
    capacity = Column(Integer)
    alert_level = Column(String)

class Rake(Base):
    __tablename__ = "rakes"

    id = Column(Integer, primary_key=True, index=True)
    rake_id = Column(String, unique=True, index=True)
    origin = Column(String)
    destination = Column(String)
    expected_arrival = Column(String)
    status = Column(String)
