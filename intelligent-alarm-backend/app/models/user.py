import uuid
import enum
from datetime import datetime, time

from sqlalchemy import String, Boolean, Enum, DateTime, Time, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, GUID


class UserRole(str, enum.Enum):
    USER = "user"
    WELLNESS_COACH = "wellness_coach"
    ADMIN = "admin"


class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    difficulty_preference: Mapped[DifficultyLevel | None] = mapped_column(
        Enum(DifficultyLevel), nullable=True
    )
    productivity_goal: Mapped[str | None] = mapped_column(String(255), nullable=True)

    target_bedtime:   Mapped[time | None] = mapped_column(Time(timezone=True), nullable=True)
    target_wake_time: Mapped[time | None] = mapped_column(Time(timezone=True), nullable=True)
    habit_score:      Mapped[float]           = mapped_column(Float,   default=0.0, nullable=False)
    current_streak:   Mapped[int]             = mapped_column(Integer, default=0,   nullable=False)
    
    # NEW: Global preference for challenge types (comma-separated, e.g., "math,riddle")
    preferred_challenges: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships — one user, MANY alarms and MANY habits
    alarms: Mapped[list["Alarm"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    habits: Mapped[list["Habit"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"