from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, exercises, workouts, calories, nutrition, stats, goals

limiter = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        from app.core.database import SessionLocal
        from app.services.exercise import ExerciseService
        db = SessionLocal()
        try:
            ExerciseService(db).seed_defaults()
        finally:
            db.close()
    except Exception:
        pass
    yield


app = FastAPI(
    title="FitTrack API",
    description="API de suivi d'entraînement physique avec calcul MET calories et module IA nutrition",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(calories.router)
app.include_router(nutrition.router)
app.include_router(stats.router)
app.include_router(goals.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "environment": settings.environment}
