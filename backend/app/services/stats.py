from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.workout import WorkoutSession, WorkoutExercise, ExerciseSet
from app.models.exercise import Exercise


class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def overview(self, user_id: str) -> dict:
        total_workouts = (
            self.db.query(func.count(WorkoutSession.id))
            .filter(WorkoutSession.user_id == user_id)
            .scalar()
            or 0
        )
        total_minutes = (
            self.db.query(func.coalesce(func.sum(WorkoutSession.duration_minutes), 0))
            .filter(WorkoutSession.user_id == user_id)
            .scalar()
        )
        total_calories = (
            self.db.query(func.coalesce(func.sum(WorkoutSession.total_calories), 0))
            .filter(WorkoutSession.user_id == user_id)
            .scalar()
        )
        current_streak = self._calculate_streak(user_id)

        return {
            "total_workouts": total_workouts,
            "total_hours": round(total_minutes / 60, 1),
            "total_calories": round(total_calories, 1),
            "current_streak": current_streak,
        }

    def _calculate_streak(self, user_id: str) -> int:
        workout_dates = (
            self.db.query(WorkoutSession.date)
            .filter(WorkoutSession.user_id == user_id)
            .order_by(WorkoutSession.date.desc())
            .distinct()
            .all()
        )
        if not workout_dates:
            return 0

        dates = sorted(set(d[0] for d in workout_dates), reverse=True)
        streak = 0
        check_date = date.today()

        for d in dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif d == check_date - timedelta(days=1):
                streak += 1
                check_date = d
            else:
                break
        return streak

    def workouts_per_week(self, user_id: str, weeks: int = 8) -> list[dict]:
        cutoff = date.today() - timedelta(weeks=weeks)
        results = (
            self.db.query(
                func.date_trunc("week", WorkoutSession.date).label("week"),
                func.count(WorkoutSession.id).label("count"),
            )
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutSession.date >= cutoff,
            )
            .group_by("week")
            .order_by("week")
            .all()
        )
        return [{"week": str(r.week), "count": r.count} for r in results]

    def volume_by_muscle(self, user_id: str) -> list[dict]:
        results = (
            self.db.query(
                func.unnest(Exercise.muscle_groups).label("muscle_group"),
                func.coalesce(func.sum(ExerciseSet.reps), 0).label("total_reps"),
                func.count(ExerciseSet.id).label("total_sets"),
            )
            .select_from(WorkoutSession)
            .join(WorkoutExercise, WorkoutExercise.session_id == WorkoutSession.id)
            .join(Exercise, Exercise.id == WorkoutExercise.exercise_id)
            .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id)
            .filter(WorkoutSession.user_id == user_id)
            .group_by("muscle_group")
            .order_by(func.sum(ExerciseSet.reps).desc())
            .all()
        )
        return [
            {"muscle_group": r.muscle_group, "total_reps": r.total_reps, "total_sets": r.total_sets}
            for r in results
        ]

    def progress(self, user_id: str, exercise_id: str) -> list[dict]:
        results = (
            self.db.query(
                WorkoutSession.date,
                func.sum(ExerciseSet.weight_kg * ExerciseSet.reps).label("volume"),
            )
            .join(WorkoutExercise, WorkoutExercise.session_id == WorkoutSession.id)
            .join(ExerciseSet, ExerciseSet.workout_exercise_id == WorkoutExercise.id)
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutExercise.exercise_id == exercise_id,
                ExerciseSet.completed == True,
            )
            .group_by(WorkoutSession.date)
            .order_by(WorkoutSession.date)
            .all()
        )
        return [{"date": str(r.date), "volume": float(r.volume or 0)} for r in results]

    def calories_history(self, user_id: str) -> list[dict]:
        results = (
            self.db.query(
                WorkoutSession.date,
                WorkoutSession.total_calories,
            )
            .filter(
                WorkoutSession.user_id == user_id,
                WorkoutSession.total_calories.isnot(None),
            )
            .order_by(WorkoutSession.date)
            .all()
        )
        return [{"date": str(r.date), "calories": r.total_calories} for r in results]
