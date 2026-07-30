from uuid import UUID
from pydantic import BaseModel


class ChallengeNextResponse(BaseModel):
    """Returned by GET /challenges/next — never includes the answer."""
    problem: str
    difficulty: int


class ChallengeVerifyRequest(BaseModel):
    """Body for POST /challenges/verify."""
    alarm_id: UUID
    answer: str


class ChallengeVerifyResponse(BaseModel):
    """Returned by POST /challenges/verify."""
    success: bool


class SnoozeRequest(BaseModel):
    """Body for POST /alarms/snooze."""
    alarm_id: UUID


class SnoozeResponse(BaseModel):
    """Returned by POST /alarms/snooze."""
    active_snooze_count: int
    snooze_limit: int
