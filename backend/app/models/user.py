import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, Date, Enum, DateTime
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class SexEnum(str, enum.Enum):
    male = "male"
    female = "female"


class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String(100), nullable=False)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    sex = Column(Enum(SexEnum), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.user, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    workouts = relationship("WorkoutSession", back_populates="user", cascade="all, delete-orphan")
    custom_exercises = relationship(
        "Exercise",
        back_populates="creator",
        foreign_keys="Exercise.created_by",
        cascade="all, delete-orphan",
    )
