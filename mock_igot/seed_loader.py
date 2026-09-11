"""
Seed loader for the Mock-iGOT service.

Loads enrollment_status.csv and course_catalogue.csv from seed_data/ into the
mock service's own SQLite database and in-memory course list.
"""

import csv
from pathlib import Path

from mock_igot.db import SessionLocal, engine, Base
from mock_igot.models import MockEnrollment

SEED_DIR = Path(__file__).resolve().parent.parent / "seed_data"


def seed_mock_db() -> None:
    """
    Create the mock_enrollments table and populate it from
    seed_data/enrollment_status.csv. Idempotent — skips if data already exists.
    """
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        # Skip if already seeded
        if session.query(MockEnrollment).first() is not None:
            print("[mock-iGOT] Database already seeded — skipping.")
            return

        csv_path = SEED_DIR / "enrollment_status.csv"
        with csv_path.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                progress = row.get("progress_percent", "0")
                progress_val = float(progress) if progress else 0.0
                completion = row.get("completion_date", "") or None

                session.add(
                    MockEnrollment(
                        enrollment_id=row["enrollment_id"],
                        officer_id=row["officer_id"],
                        course_id=row["course_id"],
                        course_title=row["course_title"],
                        status=row["status"],
                        enrolled_date=row.get("enrolled_date", None),
                        progress_percent=progress_val,
                        completion_date=completion,
                    )
                )

        session.commit()
        print(f"[mock-iGOT] Seeded {session.query(MockEnrollment).count()} enrollments.")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def load_course_catalogue() -> list[dict]:
    """
    Load the course catalogue from seed_data/course_catalogue.csv and return
    as a list of dicts. Called once at startup — cached in memory.
    """
    csv_path = SEED_DIR / "course_catalogue.csv"
    courses = []
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            courses.append({
                "course_id": row["course_id"],
                "course_title": row["course_title"],
                "category": row["category"],
                "skill_tags": row.get("skill_tags", ""),
                "duration_hours": int(row["duration_hours"]),
                "level": row["level"],
                "source": row["source"],
            })
    return courses
