from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.notification import NotificationPreference
from app.api.auth import get_current_user
from app.schemas.notification import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationToggleRequest,
)

router = APIRouter(prefix="/notifications", tags=["Notification Preferences"])

VALID_TOGGLE_SETTINGS = {
    "bedtime_warning_enabled",
    "morning_streak_alert",
    "challenge_reminders",
    "weekly_sleep_report",
}


class FCMTokenRequest(BaseModel):
    fcm_token: str
    device_type: Optional[str] = "android"


def _get_or_create_user_preferences(user_id: str, db: Session) -> NotificationPreference:
    """Helper function to fetch user notification preferences or instantiate default row."""
    pref = (
        db.query(NotificationPreference).filter(NotificationPreference.user_id == user_id).first()
    )
    if not pref:
        pref = NotificationPreference(
            user_id=user_id,
            bedtime_warning_enabled=True,
            bedtime_warning_minutes=30,
            morning_streak_alert=True,
            challenge_reminders=True,
            weekly_sleep_report=True,
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.get("/preferences", response_model=NotificationPreferenceResponse)
def get_notification_preferences(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Returns the authenticated user's notification settings.
    Automatically initializes default preferences if none exist.
    """
    pref = _get_or_create_user_preferences(current_user.id, db)
    return pref


@router.put("/preferences", response_model=NotificationPreferenceResponse)
def update_notification_preferences(
    pref_in: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's notification settings.
    """
    pref = _get_or_create_user_preferences(current_user.id, db)

    update_data = pref_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None and hasattr(pref, field):
            setattr(pref, field, value)

    db.commit()
    db.refresh(pref)
    return pref


@router.post("/toggle", response_model=NotificationPreferenceResponse)
def toggle_notification_setting(
    toggle_in: NotificationToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Enables or disables a specific notification setting for the authenticated user.
    """
    if toggle_in.setting_name not in VALID_TOGGLE_SETTINGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid notification setting '{toggle_in.setting_name}'. "
                f"Valid options are: {sorted(list(VALID_TOGGLE_SETTINGS))}"
            ),
        )

    pref = _get_or_create_user_preferences(current_user.id, db)
    setattr(pref, toggle_in.setting_name, toggle_in.enabled)

    db.commit()
    db.refresh(pref)
    return pref


@router.post("/fcm-token")
def register_fcm_token(
    payload: FCMTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registers an FCM device token for push notifications (Android / iOS / Web).
    """
    pref = _get_or_create_user_preferences(current_user.id, db)
    if hasattr(pref, "fcm_token"):
        pref.fcm_token = payload.fcm_token
        db.commit()

    return {
        "status": "success",
        "message": f"FCM token registered for {payload.device_type}",
        "user_id": str(current_user.id),
    }
