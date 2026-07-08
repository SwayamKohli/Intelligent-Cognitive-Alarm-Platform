from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import time

from app.database import get_db
from app.models.alarm import Alarm
from app.models.user import User
from app.api.auth import get_current_user
from app.schemas.alarm import AlarmCreate, AlarmResponse
from app.schemas.challenge import SnoozeRequest, SnoozeResponse
from app.services.alarm_service import register_snooze
from uuid import UUID

router = APIRouter(prefix="/alarms", tags=["Alarms"])

# ── POST /alarms/ ───────────────────────────────────────────────────
@router.post("/", response_model=AlarmResponse, status_code=status.HTTP_201_CREATED)
def create_alarm(
    alarm: AlarmCreate,
    current_user: User = Depends(get_current_user), # Lock down the route
    db: Session = Depends(get_db)                   # Connect to Postgres
):
    """Schedule a new alarm securely linked to the authenticated user."""
    # Convert Pydantic schema to dict and inject the secure user ID
    db_alarm = Alarm(**alarm.model_dump(), user_id=current_user.id)
    
    db.add(db_alarm)
    db.commit()
    db.refresh(db_alarm)
    
    return db_alarm


# ── GET /alarms/ ────────────────────────────────────────────────────
@router.get("/", response_model=List[AlarmResponse])
def get_user_alarms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all alarms belonging only to the logged-in user."""
    return db.query(Alarm).filter(Alarm.user_id == current_user.id).all()


# ── POST /alarms/snooze ─────────────────────────────────────────────
@router.post("/snooze", response_model=SnoozeResponse)
def snooze_alarm(
    body: SnoozeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Increments the user's active_snooze_count in Postgres by 1.
    Enforces the per-alarm snooze limit and daily reset logic.
    """
    # 1. Look up the alarm and verify ownership
    alarm = db.query(Alarm).filter(
        Alarm.id == body.alarm_id,
        Alarm.user_id == current_user.id,
    ).first()

    if alarm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found or does not belong to this user.",
        )

    # 2. Check that snoozing is enabled for this alarm
    if not alarm.snooze_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Snoozing is disabled for this alarm.",
        )

    # 3. Enforce snooze limit
    if alarm.active_snooze_count >= alarm.snooze_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Snooze limit reached ({alarm.snooze_limit}). Solve the challenge to dismiss.",
        )

    # 4. Delegate to the service layer (handles daily reset + increment)
    updated_alarm = register_snooze(db, alarm)

    return SnoozeResponse(
        active_snooze_count=updated_alarm.active_snooze_count,
        snooze_limit=updated_alarm.snooze_limit,
    )

# ── DELETE /alarms/{alarm_id} ────────────────────────────────────────
@router.delete("/{alarm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alarm(
    alarm_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a specific alarm. Ensures the alarm belongs to the requesting user.
    """
    alarm = db.query(Alarm).filter(
        Alarm.id == alarm_id,
        Alarm.user_id == current_user.id
    ).first()

    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found or you do not have permission to delete it."
        )

    db.delete(alarm)
    db.commit()
    
    # 204 No Content responses should not return a body
    return None