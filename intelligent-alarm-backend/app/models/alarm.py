import uuid
import enum
from datetime import datetime, time, date

from sqlalchemy import String, Boolean, Enum, Time, DateTime, ForeignKey, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, GUID


class AlarmType(str, enum.Enum):
    DAILY = "daily"
    WEEKDAY = "weekday"
    WEEKEND = "weekend"
    ONE_TIME = "one_time"
    SMART_ADAPTIVE = "smart_adaptive"


class Alarm(Base):
    __tablename__ = "alarms"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    label: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "Gym Alarm"
    time: Mapped[time] = mapped_column(Time, nullable=False)
    alarm_type: Mapped[AlarmType] = mapped_column(Enum(AlarmType), nullable=False)

    # For recurring alarms — store active weekdays, e.g. "MON,TUE,WED"
    recurrence_days: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # NEW: Alarm-specific challenge override (comma-separated, e.g., "math,logic")
    preferred_challenges: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    snooze_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    snooze_limit: Mapped[int] = mapped_column(default=3, nullable=False)
    active_snooze_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_snooze_reset_date: Mapped[date] = mapped_column(Date, nullable=True)
    multi_step_requirement: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="alarms")

    def __repr__(self) -> str:
        return f"<Alarm id={self.id} label={self.label} time={self.time}>"