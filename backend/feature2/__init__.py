"""
Feature 2: Ops & Crew Intelligence
===================================
Exports the three FastAPI routers for crew management, FOIS tracking,
and layover concierge services.
"""
from __future__ import annotations

from .router_crew import router as crew_router
from .router_fois import router as fois_router
from .router_concierge import router as concierge_router

__all__ = ["crew_router", "fois_router", "concierge_router"]
