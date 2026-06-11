import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    total_calories = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="workouts")
    exercises = relationship(
        "WorkoutExercise",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="WorkoutExercise.order_index",
    )
    nutrition_suggestion = relationship(
        "NutritionSuggestion",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(String, ForeignKey("exercises.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    rest_seconds = Column(Integer, nullable=True)
    calories_burned = Column(Float, nullable=True)

    session = relationship("WorkoutSession", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="workout_exercises")
    sets = relationship(
        "ExerciseSet",
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        order_by="ExerciseSet.set_number",
    )


class ExerciseSet(Base):
    __tablename__ = "exercise_sets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workout_exercise_id = Column(String, ForeignKey("workout_exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    completed = Column(Boolean, default=True, nullable=False)

    workout_exercise = relationship("WorkoutExercise", back_populates="sets")
