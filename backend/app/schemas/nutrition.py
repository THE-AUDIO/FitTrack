from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NutritionSuggestRequest(BaseModel):
    session_id: str
    context: str = Field(default="both", pattern="^(recovery|meal_plan|both)$")


class NutritionSuggestionResponse(BaseModel):
    id: str
    session_id: str
    calories_burned: float
    context: str
    country: str
    city: Optional[str] = None
    suggestion_json: dict
    generated_at: datetime

    model_config = {"from_attributes": True}
