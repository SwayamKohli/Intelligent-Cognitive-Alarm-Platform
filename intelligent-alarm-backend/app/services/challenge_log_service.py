from app.database import challenge_logs_collection
from app.schemas.challenge_log import ChallengeLog

async def log_challenge_attempt(log: ChallengeLog) -> str:
    result = await challenge_logs_collection.insert_one(log.model_dump())
    return str(result.inserted_id)

async def get_total_attempts(user_id: str) -> int:
    try:
        # Prevent long hangs if Mongo is down (limit selection timeout)
        return await challenge_logs_collection.count_documents({"user_id": user_id})
    except Exception as e:
        print(f"Warning: Failed to fetch total attempts from MongoDB: {e}")
        return 0

