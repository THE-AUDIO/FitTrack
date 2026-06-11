from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.workout import WorkoutSession, WorkoutExercise, ExerciseSet
from app.models.exercise import Exercise
from app.schemas.workout import WorkoutCreate, WorkoutUpdate
from app.services.calorie import calculate_session_calories


class WorkoutService:
    def __init__(self, db: Session):
        self.db = db

    def _load_session(self, session_id: str, user_id: str) -> WorkoutSession:
        session = (
            self.db.query(WorkoutSession)
            .options(
                joinedload(WorkoutSession.exercises)
                .joinedload(WorkoutExercise.sets),
                joinedload(WorkoutSession.exercises)
                .joinedload(WorkoutExercise.exercise),
            )
            .filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
        return session

    def list_workouts(self, user_id: str, skip: int = 0, limit: int = 20) -> list[WorkoutSession]:
        return (
            self.db.query(WorkoutSession)
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_workout(self, session_id: str, user_id: str) -> WorkoutSession:
        return self._load_session(session_id, user_id)

    def create_workout(self, data: WorkoutCreate, user_id: str) -> WorkoutSession:
        session = WorkoutSession(
            user_id=user_id,
            title=data.title,
            date=data.date,
            duration_minutes=data.duration_minutes,
            notes=data.notes,
        )
        self.db.add(session)
        self.db.flush()

        for i, ex_data in enumerate(data.exercises):
            exercise = self.db.query(Exercise).filter(Exercise.id == ex_data.exercise_id).first()
            if not exercise:
                raise HTTPException(status_code=404, detail=f"Exercise {ex_data.exercise_id} not found")

            we = WorkoutExercise(
                session_id=session.id,
                exercise_id=ex_data.exercise_id,
                order_index=ex_data.order_index,
                rest_seconds=ex_data.rest_seconds,
            )
            self.db.add(we)
            self.db.flush()

            for set_data in ex_data.sets:
                es = ExerciseSet(
                    workout_exercise_id=we.id,
                    set_number=set_data.set_number,
                    reps=set_data.reps,
                    weight_kg=set_data.weight_kg,
                    duration_seconds=set_data.duration_seconds,
                    completed=set_data.completed,
                )
                self.db.add(es)

        self.db.flush()
        session.exercises = (
            self.db.query(WorkoutExercise)
            .filter(WorkoutExercise.session_id == session.id)
            .options(joinedload(WorkoutExercise.sets), joinedload(WorkoutExercise.exercise))
            .all()
        )

        calculate_session_calories(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def update_workout(self, session_id: str, data: WorkoutUpdate, user_id: str) -> WorkoutSession:
        session = self._load_session(session_id, user_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"exercises"})
        for field, value in update_data.items():
            setattr(session, field, value)

        if data.exercises is not None:
            for we in session.exercises:
                self.db.delete(we)
            self.db.flush()

            for i, ex_data in enumerate(data.exercises):
                we = WorkoutExercise(
                    session_id=session.id,
                    exercise_id=ex_data.exercise_id,
                    order_index=ex_data.order_index,
                    rest_seconds=ex_data.rest_seconds,
                )
                self.db.add(we)
                self.db.flush()
                for set_data in ex_data.sets:
                    es = ExerciseSet(
                        workout_exercise_id=we.id,
                        set_number=set_data.set_number,
                        reps=set_data.reps,
                        weight_kg=set_data.weight_kg,
                        duration_seconds=set_data.duration_seconds,
                        completed=set_data.completed,
                    )
                    self.db.add(es)

            session.exercises = (
                self.db.query(WorkoutExercise)
                .filter(WorkoutExercise.session_id == session.id)
                .options(joinedload(WorkoutExercise.sets), joinedload(WorkoutExercise.exercise))
                .all()
            )
            calculate_session_calories(session)

        self.db.commit()
        self.db.refresh(session)
        return session

    def delete_workout(self, session_id: str, user_id: str):
        session = self._load_session(session_id, user_id)
        self.db.delete(session)
        self.db.commit()
