"""
Challenge endpoints — connects the frontend to the cognitive master router,
enforces multi-step wake-up verification (streaks), and logs telemetry to MongoDB.
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alarm import Alarm
from app.models.user import User
from app.api.auth import get_current_user
from app.core.challenge_generator import get_next_challenge
from app.core.adaptive_ml import predict_next_challenge
from app.schemas.challenge import ChallengeVerifyRequest
from app.schemas.challenge_log import ChallengeLog
from app.services.challenge_log_service import log_challenge_attempt, get_total_attempts

router = APIRouter(prefix="/challenges", tags=["Challenges"])

# ── In-memory store for pending answers ──────────────────────────────
# Keyed by alarm_id (string) -> dict tracking answer and streak state
_pending_answers: dict[str, dict] = {}


# ── GET /challenges/next ─────────────────────────────────────────────
@router.get("/next")
async def get_next_challenge_endpoint(
    alarm_id: UUID = Query(..., description="The alarm that triggered this challenge"),
    challenge_type: str = Query("random", description="Specific engine to trigger, or 'random'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches the next challenge. Initializes or maintains a multi-step verification
    streak depending on the user's recent snooze behavior and ML predictions.
    """
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.user_id == current_user.id,
    ).first()

    if alarm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found or does not belong to this user.",
        )

    # 1. Query the V2 ML Pipeline
    # (Passing default values for historical stats until the telemetry cache is built)
    ml_predictions = predict_next_challenge(
        snooze_count=alarm.active_snooze_count
    )
    
    difficulty = ml_predictions["difficulty"]
    target_streak = ml_predictions["target_streak"]
    
    # 2. Decide the Challenge Type
    # If frontend asks for random, let the ML engine choose the optimal challenge
    final_challenge_type = challenge_type if challenge_type != "random" else ml_predictions["challenge_type"]

    key = str(alarm_id)
    
    # 3. Initialize or fetch the active streak state
    if key not in _pending_answers:
        _pending_answers[key] = {
            "current_streak": 0,
            "target_streak": target_streak
        }
    else:
        # Update target streak in case they snoozed since the last request
        _pending_answers[key]["target_streak"] = max(
            _pending_answers[key]["target_streak"], 
            target_streak
        )

    # Fetch total attempts from MongoDB
    total_attempts = await get_total_attempts(str(current_user.id))

    # 4. Route to the cognitive engines (using both user_id and alarm_id to ensure different alarms get different math/cognitive problems)
    user_seed_key = f"{current_user.id}_{alarm_id}"
    challenge_data = get_next_challenge(
        difficulty=difficulty,
        challenge_type=final_challenge_type,
        user_id=user_seed_key,
        total_attempts=total_attempts
    )

    # Stash the new correct answer and type for the verify endpoint
    _pending_answers[key]["answer"] = challenge_data["server_answer"]
    _pending_answers[key]["challenge_type"] = challenge_data["client_payload"]["challenge_type"]
    _pending_answers[key]["difficulty"] = difficulty

    # Inject streak metadata into the client payload for the UI Progress Bar
    response_payload = challenge_data["client_payload"]
    response_payload["streak_state"] = {
        "current": _pending_answers[key]["current_streak"],
        "target": _pending_answers[key]["target_streak"]
    }

    return response_payload


# ── POST /challenges/verify ─────────────────────────────────────────
@router.post("/verify")
async def verify_challenge(
    body: ChallengeVerifyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Validates the answer. If correct, increments the streak. 
    If the streak hits the target, dismisses the alarm. If incorrect, resets the streak.
    """
    key = str(body.alarm_id)
    
    # --- Debugging Logs ---
    print(f"\n[DEBUG] Verifying Alarm ID: {key}")
    print(f"[DEBUG] Active Dictionary Keys: {list(_pending_answers.keys())}\n")
    # ----------------------
    
    state = _pending_answers.get(key)

    if state is None or "answer" not in state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active challenge found. Request a new one via GET /challenges/next.",
        )

    # Normalize answers for text-based cognitive engines (lowercase, stripped)
    user_ans = str(body.answer).strip().lower()
    correct_ans = str(state["answer"]).strip().lower()

    success = (user_ans == correct_ans)
    dismiss_alarm = False

    if success:
        state["current_streak"] += 1
        
        # Check if the wake-up verification criteria is met
        if state["current_streak"] >= state["target_streak"]:
            dismiss_alarm = True
            _pending_answers.pop(key, None)
    else:
        # Wake-up verification failure: Reset the streak to zero!
        state["current_streak"] = 0

    # Log telemetry for the ML Engine (V2)
    log_entry = ChallengeLog(
        user_id=str(current_user.id),
        challenge_type=state.get("challenge_type", "unknown"),
        difficulty_level=str(state.get("difficulty", 1)),
        time_to_solve_seconds=0.0, # UI will provide this later
        time_taken_ms=0,           
        timeout_failed=False,     
        failed_attempts=1 if not success else 0,
    )
    
    try:
        await log_challenge_attempt(log_entry)
    except Exception as e:
        print(f"Warning: Failed to log challenge attempt to MongoDB: {e}")

    return {
        "success": success,
        "dismiss_alarm": dismiss_alarm,
        "current_streak": state.get("current_streak", 0),
        "target_streak": state.get("target_streak", 1)
    }