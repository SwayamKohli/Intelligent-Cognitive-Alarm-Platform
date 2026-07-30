import uuid
from datetime import datetime

from sqlalchemy import Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.models.base import Base, GUID


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    bedtime_warning_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    bedtime_warning_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    morning_streak_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    challenge_reminders: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    weekly_sleep_report: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="notification_preference")

    def __repr__(self) -> str:
        return f"<NotificationPreference id={self.id} user_id={self.user_id}>"
