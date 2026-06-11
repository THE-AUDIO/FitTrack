from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_workouts: int = 0
    total_hours: float = 0
    total_calories: float = 0
    current_streak: int = 0


class WorkoutsPerWeek(BaseModel):
    week: str
    count: int


class VolumeByMuscle(BaseModel):
    muscle_group: str
    total_reps: int
    total_sets: int
