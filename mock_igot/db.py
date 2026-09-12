"""
Database configuration for the Mock-iGOT service.

Uses a SEPARATE SQLite database (./data/mock_igot.db) from the LMS backend.
This simulates the fact that iGOT is an external system with its own data store.
"""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Resolve DB path relative to project root (one level above mock_igot/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("DATA_DIR", _PROJECT_ROOT / "data"))
DB_PATH = DATA_DIR / "mock_igot.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

SQLALCHEMY_DATABASE_URL = os.environ.get("MOCK_IGOT_DATABASE_URL", f"sqlite:///{DB_PATH}")
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Yield a DB session and close it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
