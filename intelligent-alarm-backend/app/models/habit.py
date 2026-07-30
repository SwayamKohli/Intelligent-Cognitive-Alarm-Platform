import uuid
import enum
from datetime import datetime, date

from sqlalchemy import String, Integer, Float, Enum, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, GUID


class HabitFrequency(str, enum.Enum):
    DAILY = "daily"
    WEEKDAYS = "weekdays"
    CUSTOM = "custom"


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    frequency: Mapped[HabitFrequency] = mapped_column(
        Enum(HabitFrequency), default=HabitFrequency.DAILY, nullable=False
    )
    target_streak_days: Mapped[int | None] = mapped_column(Integer, nullable=True)

    current_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Cached weighted score for THIS habit (0-100); overall user habit_score
    # is computed by aggregating across all habits
    habit_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="habits")
    logs: Mapped[list["HabitLog"]] = relationship(
        back_populates="habit", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Habit id={self.id} name={self.name} streak={self.current_streak}>"


class HabitLog(Base):
    """One daily check-in entry for a habit — powers streaks and scoring history."""
    __tablename__ = "habit_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    habit_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    completed: Mapped[bool] = mapped_column(default=False, nullable=False)
    snooze_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    habit: Mapped["Habit"] = relationship(back_populates="logs")

    def __repr__(self) -> str:
        return f"<HabitLog habit_id={self.habit_id} date={self.log_date} completed={self.completed}>"