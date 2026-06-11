from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.stats import StatsService

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview")
def overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).overview(user.id)


@router.get("/workouts-per-week")
def workouts_per_week(
    weeks: int = Query(8, ge=4, le=52),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).workouts_per_week(user.id, weeks)


@router.get("/volume-by-muscle")
def volume_by_muscle(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).volume_by_muscle(user.id)


@router.get("/progress/{exercise_id}")
def progress(
    exercise_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).progress(user.id, exercise_id)


@router.get("/calories-history")
def calories_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).calories_history(user.id)
