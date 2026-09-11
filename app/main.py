"""
FastAPI application entry point — Skill Intelligence & Learning Platform.

Starts the Competency & Gap Analysis API with CORS, global error handling,
auto-seeding of the SQLite database, and semantic index build on startup.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db import Base, engine, SessionLocal
from app.routers.api import (
    router as api_router,
    get_officer_competency_scores,
    get_passport_summary,
)
from app.routers.webhooks import router as webhook_router
from app.routers.quiz import router as quiz_router
from app.schemas.schemas import CompetencyScoreItem, PassportResponse
from app.seed import seed_database
from app.services.semantic_search import build_course_index

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


# ── Lifespan — seed DB + build semantic index on startup ─────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables, seed the database, and build the semantic index."""
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Build ChromaDB course embeddings (idempotent)
    db = SessionLocal()
    try:
        build_course_index(db)
    finally:
        db.close()

    yield


# ── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Skill Intelligence & Learning Platform",
    description=(
        "Competency & Gap Analysis API with semantic search for MoSPI/NSSTA officials. "
        "Prototype built for Smart India Hackathon PS 26101."
    ),
    version="0.3.5",
    lifespan=lifespan,
)


# ── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return all unhandled exceptions as a consistent JSON error shape."""
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )


# ── Mount routers ───────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")  # Phase 4: AI Quiz Generation
app.include_router(webhook_router)  # Webhook receiver — no prefix, mounts at /webhooks/...
app.add_api_route(
    "/competency-scores/{officer_id}",
    get_officer_competency_scores,
    response_model=list[CompetencyScoreItem],
    methods=["GET"],
)
app.add_api_route(
    "/passport/{officer_id}",
    get_passport_summary,
    response_model=PassportResponse,
    methods=["GET"],
)
