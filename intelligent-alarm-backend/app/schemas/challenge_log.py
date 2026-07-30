import enum
from datetime import datetime
from pydantic import BaseModel, Field


class ChallengeType(str, enum.Enum):
    MATH = "math"
    MEMORY = "memory"
    PATTERN = "pattern"
    LOGIC = "logic"
    WORD_SCRAMBLE = "word_scramble"
    RIDDLE = "riddle"
    QUIZ = "quiz"


class ChallengeLog(BaseModel):
    user_id: str
    challenge_type: ChallengeType
    difficulty_level: str
    time_to_solve_seconds: float
    time_taken_ms: int
    failed_attempts: int = 0
    timeout_failed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)