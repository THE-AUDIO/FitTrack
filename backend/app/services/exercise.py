from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate

SEED_EXERCISES = [
    {"name": "Pompes", "category": "Musculation", "muscle_groups": ["Pectoraux", "Triceps", "Épaules"], "met_value": 3.8},
    {"name": "Squats", "category": "Musculation", "muscle_groups": ["Quadriceps", "Fessiers", "Ischio-jambiers"], "met_value": 5.0},
    {"name": "Fentes", "category": "Musculation", "muscle_groups": ["Quadriceps", "Fessiers", "Ischio-jambiers"], "met_value": 4.0},
    {"name": "Dips", "category": "Musculation", "muscle_groups": ["Triceps", "Pectoraux", "Épaules"], "met_value": 3.8},
    {"name": "Gainage (planche)", "category": "Musculation", "muscle_groups": ["Abdominaux", "Dos", "Épaules"], "met_value": 3.5},
    {"name": "Tractions", "category": "Musculation", "muscle_groups": ["Dos", "Biceps", "Avant-bras"], "met_value": 8.0},
    {"name": "Burpees", "category": "HIIT", "muscle_groups": ["Corps complet"], "met_value": 8.0},
    {"name": "Jumping Jacks", "category": "Cardio", "muscle_groups": ["Corps complet"], "met_value": 7.7},
    {"name": "Course sur place", "category": "Cardio", "muscle_groups": ["Jambes", "Cardio"], "met_value": 8.0},
    {"name": "Étirement ischio-jambiers", "category": "Stretching", "muscle_groups": ["Ischio-jambiers", "Bas du dos"], "met_value": 2.3},
]


class ExerciseService:
    def __init__(self, db: Session):
        self.db = db

    def seed_defaults(self):
        existing = self.db.query(Exercise).filter(Exercise.is_default).count()
        if existing > 0:
            return
        for ex in SEED_EXERCISES:
            self.db.add(Exercise(**ex, is_default=True))
        self.db.commit()

    def list_exercises(self, user_id: str) -> list[Exercise]:
        return (
            self.db.query(Exercise)
            .filter((Exercise.is_default) | (Exercise.created_by == user_id))
            .all()
        )

    def get_by_id(self, exercise_id: str) -> Exercise:
        ex = self.db.query(Exercise).filter(Exercise.id == exercise_id).first()
        if not ex:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exercise not found",
            )
        return ex

    def create_custom(self, data: ExerciseCreate, user_id: str) -> Exercise:
        ex = Exercise(**data.model_dump(), created_by=user_id)
        self.db.add(ex)
        self.db.commit()
        self.db.refresh(ex)
        return ex

    def update_custom(self, exercise_id: str, data: ExerciseUpdate, user_id: str) -> Exercise:
        ex = self.get_by_id(exercise_id)
        if ex.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your exercise")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(ex, field, value)
        self.db.commit()
        self.db.refresh(ex)
        return ex

    def delete_custom(self, exercise_id: str, user_id: str):
        ex = self.get_by_id(exercise_id)
        if ex.created_by != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your exercise")
        self.db.delete(ex)
        self.db.commit()
