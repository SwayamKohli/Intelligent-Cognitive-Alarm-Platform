from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class NotificationPreferenceResponse(BaseModel):
    id: UUID
    user_id: UUID
    bedtime_warning_enabled: bool
    bedtime_warning_minutes: int
    morning_streak_alert: bool
    challenge_reminders: bool
    weekly_sleep_report: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    bedtime_warning_enabled: Optional[bool] = None
    bedtime_warning_minutes: Optional[int] = Field(default=None, ge=0, le=120)
    morning_streak_alert: Optional[bool] = None
    challenge_reminders: Optional[bool] = None
    weekly_sleep_report: Optional[bool] = None


class NotificationToggleRequest(BaseModel):
    setting_name: str
    enabled: bool
