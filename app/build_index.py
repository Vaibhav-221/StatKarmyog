"""
Standalone script to build/rebuild the ChromaDB semantic index.

Usage:
    python -m app.build_index

This can be run independently of the server. The server also builds the index
automatically on startup if it hasn't been built yet.
"""

from app.db import Base, engine, SessionLocal
from app.seed import seed_database
from app.services.semantic_search import build_course_index

import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


def main():
    # Ensure DB is ready
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Build semantic index
    db = SessionLocal()
    try:
        count = build_course_index(db)
        if count == 0:
            print("Index already up to date.")
        else:
            print(f"Indexed {count} courses.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
