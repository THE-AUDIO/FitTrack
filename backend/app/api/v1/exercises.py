from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.services.exercise import ExerciseService

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseResponse])
def list_exercises(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ExerciseService(db).list_exercises(user.id)


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return ExerciseService(db).get_by_id(exercise_id)


@router.post("", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return ExerciseService(db).create_custom(data, user.id)


@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update_exercise(
    exercise_id: str,
    data: ExerciseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return ExerciseService(db).update_custom(exercise_id, data, user.id)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ExerciseService(db).delete_custom(exercise_id, user.id)
