import uuid
import enum

from sqlalchemy import Column, String, Float, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from app.core.database import Base


class CategoryEnum(str, enum.Enum):
    musculation = "Musculation"
    cardio = "Cardio"
    stretching = "Stretching"
    hiit = "HIIT"


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    category = Column(SAEnum(CategoryEnum), nullable=False)
    muscle_groups = Column(ARRAY(String), nullable=False, default=list)
    met_value = Column(Float, nullable=False, default=3.5)
    is_default = Column(Boolean, default=False, nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", back_populates="custom_exercises", foreign_keys=[created_by])
    workout_exercises = relationship("WorkoutExercise", back_populates="exercise")
