from pydantic import BaseModel, field_validator
from typing import Optional, Any
from uuid import UUID
from datetime import datetime, time

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    timezone: Optional[str] = None
    difficulty_preference: Optional[str] = None
    productivity_goal: Optional[str] = None
    preferred_challenges: Optional[str] = None # NEW
    bedtime: Optional[str] = None
    wake_time: Optional[str] = None
    target_bedtime: Optional[str] = None
    target_wake_time: Optional[str] = None

    @field_validator("bedtime", "wake_time", "target_bedtime", "target_wake_time", mode="before")
    @classmethod
    def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        parts = str(v).split(":")
        if len(parts) in (2, 3):
            try:
                if len(parts) == 2:
                    datetime.strptime(str(v), "%H:%M")
                else:
                    datetime.strptime(str(v), "%H:%M:%S")
                return str(v)
            except ValueError:
                pass
        raise ValueError("Time must be in HH:MM or HH:MM:SS format (e.g., '22:30' or '07:00:00')")

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    timezone: str
    difficulty_preference: Optional[str] = None
    productivity_goal: Optional[str] = None
    preferred_challenges: Optional[str] = None # NEW
    role: str # Added so frontend router can clearly see it
    target_bedtime: Optional[str] = None
    target_wake_time: Optional[str] = None
    bedtime: Optional[str] = None
    wake_time: Optional[str] = None
    habit_score: Optional[float] = 0.0
    current_streak: Optional[int] = 0

    @field_validator("target_bedtime", "target_wake_time", "bedtime", "wake_time", mode="before")
    @classmethod
    def format_time_field(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, (time, datetime)):
            return v.strftime("%H:%M")
        return str(v)

    class Config:
        from_attributes = True