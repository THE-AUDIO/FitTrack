from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutUpdate,
    WorkoutResponse,
    WorkoutListResponse,
)
from app.services.workout import WorkoutService

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.get("", response_model=list[WorkoutListResponse])
def list_workouts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = WorkoutService(db).list_workouts(user.id, skip, limit)
    return [
        WorkoutListResponse(
            id=s.id,
            title=s.title,
            date=s.date,
            duration_minutes=s.duration_minutes,
            total_calories=s.total_calories,
            exercise_count=len(s.exercises) if s.exercises else 0,
        )
        for s in sessions
    ]


@router.get("/{workout_id}", response_model=WorkoutResponse)
def get_workout(
    workout_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = WorkoutService(db).get_workout(workout_id, user.id)
    exercises = []
    for we in session.exercises or []:
        exercises.append({
            "id": we.id,
            "exercise_id": we.exercise_id,
            "exercise_name": we.exercise.name if we.exercise else "",
            "exercise_category": we.exercise.category.value if we.exercise else "",
            "order_index": we.order_index,
            "rest_seconds": we.rest_seconds,
            "calories_burned": we.calories_burned,
            "sets": [
                {
                    "id": s.id,
                    "set_number": s.set_number,
                    "reps": s.reps,
                    "weight_kg": s.weight_kg,
                    "duration_seconds": s.duration_seconds,
                    "completed": s.completed,
                }
                for s in (we.sets or [])
            ],
        })
    return WorkoutResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        date=session.date,
        duration_minutes=session.duration_minutes,
        total_calories=session.total_calories,
        notes=session.notes,
        exercises=exercises,
    )


@router.post("", response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    data: WorkoutCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return WorkoutService(db).create_workout(data, user.id)


@router.put("/{workout_id}", response_model=WorkoutResponse)
def update_workout(
    workout_id: str,
    data: WorkoutUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return WorkoutService(db).update_workout(workout_id, data, user.id)


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    WorkoutService(db).delete_workout(workout_id, user.id)


@router.get("/{workout_id}/calories")
def get_workout_calories(
    workout_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = WorkoutService(db).get_workout(workout_id, user.id)
    details = []
    for we in session.exercises or []:
        details.append({
            "exercise_name": we.exercise.name if we.exercise else "",
            "calories_burned": we.calories_burned or 0,
            "sets_count": len(we.sets or []),
        })
    return {
        "total_calories": session.total_calories or 0,
        "duration_minutes": session.duration_minutes,
        "details": details,
    }
