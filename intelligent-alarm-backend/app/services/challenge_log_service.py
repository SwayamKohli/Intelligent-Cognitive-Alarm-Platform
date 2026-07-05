from app.database import challenge_logs_collection
from app.schemas.challenge_log import ChallengeLog

async def log_challenge_attempt(log: ChallengeLog) -> str:
    result = await challenge_logs_collection.insert_one(log.model_dump())
    return str(result.inserted_id)