from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    goal_type: str = Field(..., pattern="^(frequency|volume|weight|calories)$")
    target_value: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    target_value: Optional[float] = Field(None, gt=0)
    current_value: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(active|completed|archived)$")
    deadline: Optional[date] = None


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    goal_type: str
    target_value: float
    current_value: float
    unit: str
    deadline: Optional[date] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
