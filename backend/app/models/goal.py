import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Date, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class GoalTypeEnum(str, enum.Enum):
    frequency = "frequency"
    volume = "volume"
    weight = "weight"
    calories = "calories"


class GoalStatusEnum(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    goal_type = Column(Enum(GoalTypeEnum), nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    unit = Column(String(20), nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(Enum(GoalStatusEnum), default=GoalStatusEnum.active, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", backref="goals")
