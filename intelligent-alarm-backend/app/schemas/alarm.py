from pydantic import BaseModel, ConfigDict
from datetime import time, datetime
from typing import Optional
from uuid import UUID
from app.models.alarm import AlarmType

class AlarmBase(BaseModel):
    label: str
    time: time
    alarm_type: AlarmType
    is_active: bool = True
    recurrence_days: Optional[str] = None
    snooze_enabled: bool = True
    snooze_limit: int = 3
    preferred_challenges: Optional[str] = None # NEW

class AlarmCreate(AlarmBase):
    """Payload expected from the frontend when creating an alarm."""
    pass

class AlarmResponse(AlarmBase):
    """Payload returned to the frontend."""
    id: UUID
    user_id: UUID
    active_snooze_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)