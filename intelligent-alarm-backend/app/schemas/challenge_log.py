from datetime import datetime
from pydantic import BaseModel, Field

class ChallengeLog(BaseModel):
    user_id: str
    challenge_type: str
    difficulty_level: str
    time_to_solve_seconds: float
    failed_attempts: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
