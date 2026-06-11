import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class SuggestionContextEnum(str, enum.Enum):
    recovery = "recovery"
    meal_plan = "meal_plan"
    both = "both"


class NutritionSuggestion(Base):
    __tablename__ = "nutrition_suggestions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("workout_sessions.id"), nullable=False, unique=True)
    calories_burned = Column(Float, nullable=False)
    context = Column(Enum(SuggestionContextEnum), nullable=False)
    country = Column(String, nullable=False)
    city = Column(String, nullable=True)
    suggestion_json = Column(JSONB, nullable=False)
    generated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = relationship("WorkoutSession", back_populates="nutrition_suggestion")
