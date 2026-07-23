from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from fastapi_cache.decorator import cache

from app.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.telemetry_service import get_user_telemetry_last_7_days
from app.core.analytics.scoring import calculate_habit_score
from app.core.analytics.groq_recommendations import generate_ai_recommendations

router = APIRouter(prefix="/analytics", tags=["Analytics & AI"])

def analytics_key_builder(
    func,
    namespace: str = "",
    request: Request = None,
    response: Response = None,
    args: tuple = (),
    kwargs: dict = {},
):
    """
    Custom key builder ensuring cache key is unique per user ID.
    """
    user = kwargs.get("current_user")
    user_id = str(user.id) if user and hasattr(user, "id") else "anonymous"
    return f"{namespace}:{func.__module__}:{func.__name__}:{user_id}"


@router.get("/habit-score")
@cache(expire=43200, key_builder=analytics_key_builder)
async def get_habit_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates 7-day Habit Score using SK's scoring formula and MongoDB telemetry.
    Cached for 12 hours (43200 seconds).
    """
    telemetry = await get_user_telemetry_last_7_days(str(current_user.id))

    days_active = telemetry.get("days_active", 0)
    consistency = round((days_active / 7.0) * 100.0, 2)

    failure_rate = telemetry.get("failure_rate_percent", 0.0)
    challenge_rate = round(max(0.0, 100.0 - failure_rate), 2)

    total_snoozes = telemetry.get("total_snoozes", 0)
    snooze_reduction = round(max(0.0, 100.0 - (total_snoozes * 10.0)), 2)

    sleep_adherence = 100.0 if (current_user.target_bedtime and current_user.target_wake_time) else 80.0

    score = calculate_habit_score(
        consistency=consistency,
        challenge_rate=challenge_rate,
        snooze_reduction=snooze_reduction,
        sleep_adherence=sleep_adherence
    )

    current_user.habit_score = score
    db.commit()

    return {
        "habit_score": score,
        "consistency": consistency,
        "challenge_rate": challenge_rate,
        "snooze_reduction": snooze_reduction,
        "sleep_adherence": sleep_adherence
    }


@router.get("/recommendations")
@cache(expire=43200, key_builder=analytics_key_builder)
async def get_ai_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates AI recommendations using Llama 3 via Groq based on 7-day telemetry.
    Cached for 12 hours (43200 seconds).
    """
    telemetry = await get_user_telemetry_last_7_days(str(current_user.id))

    score = current_user.habit_score if current_user.habit_score and current_user.habit_score > 0 else 75.0

    recommendations = await generate_ai_recommendations(
        user_name=current_user.full_name or "User",
        telemetry_data=telemetry,
        habit_score=score
    )

    return recommendations
