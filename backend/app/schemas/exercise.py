from typing import Optional

from pydantic import BaseModel, Field


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(..., pattern="^(Musculation|Cardio|Stretching|HIIT)$")
    muscle_groups: list[str] = Field(default_factory=list)
    met_value: float = Field(default=3.5, ge=1.0, le=20.0)


class ExerciseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, pattern="^(Musculation|Cardio|Stretching|HIIT)$")
    muscle_groups: Optional[list[str]] = None
    met_value: Optional[float] = Field(None, ge=1.0, le=20.0)


class ExerciseResponse(BaseModel):
    id: str
    name: str
    category: str
    muscle_groups: list[str]
    met_value: float
    is_default: bool
    created_by: Optional[str] = None

    model_config = {"from_attributes": True}
