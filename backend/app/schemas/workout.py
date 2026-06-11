from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class SetCreate(BaseModel):
    set_number: int = Field(ge=1)
    reps: Optional[int] = Field(None, ge=0)
    weight_kg: Optional[float] = Field(None, ge=0)
    duration_seconds: Optional[int] = Field(None, ge=0)
    completed: bool = True


class WorkoutExerciseCreate(BaseModel):
    exercise_id: str
    order_index: int = Field(ge=0)
    rest_seconds: Optional[int] = Field(None, ge=0)
    sets: list[SetCreate] = Field(default_factory=list)


class WorkoutCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    date: date
    duration_minutes: int = Field(ge=1, le=1440)
    notes: Optional[str] = None
    exercises: list[WorkoutExerciseCreate] = Field(default_factory=list)


class WorkoutUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=1440)
    notes: Optional[str] = None
    exercises: Optional[list[WorkoutExerciseCreate]] = None


class SetResponse(BaseModel):
    id: str
    set_number: int
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    completed: bool

    model_config = {"from_attributes": True}


class WorkoutExerciseResponse(BaseModel):
    id: str
    exercise_id: str
    exercise_name: str = ""
    exercise_category: str = ""
    order_index: int
    rest_seconds: Optional[int] = None
    calories_burned: Optional[float] = None
    sets: list[SetResponse] = []

    model_config = {"from_attributes": True}


class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    title: str
    date: date
    duration_minutes: int
    total_calories: Optional[float] = None
    notes: Optional[str] = None
    exercises: list[WorkoutExerciseResponse] = []

    model_config = {"from_attributes": True}


class WorkoutListResponse(BaseModel):
    id: str
    title: str
    date: date
    duration_minutes: int
    total_calories: Optional[float] = None
    exercise_count: int = 0

    model_config = {"from_attributes": True}
