from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserProfileUpdate
from app.api.auth import get_current_user

router = APIRouter(tags=["Users & Coach"])

def require_wellness_coach(current_user: User = Depends(get_current_user)):
    """Strictly requires the WELLNESS_COACH role."""
    role_str = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role).lower()
    if current_user.role != UserRole.WELLNESS_COACH and role_str != "wellness_coach":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Wellness Coach privileges required."
        )
    return current_user

@router.get("/users/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """View the currently logged-in user's profile."""
    current_user.bedtime = current_user.target_bedtime.strftime("%H:%M") if current_user.target_bedtime else None
    current_user.wake_time = current_user.target_wake_time.strftime("%H:%M") if current_user.target_wake_time else None
    return current_user

@router.put("/users/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile settings including bedtime and wake_time."""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.timezone is not None:
        current_user.timezone = profile_data.timezone
    if profile_data.difficulty_preference is not None:
        current_user.difficulty_preference = profile_data.difficulty_preference
    if profile_data.productivity_goal is not None:
        current_user.productivity_goal = profile_data.productivity_goal
    if profile_data.preferred_challenges is not None:
        current_user.preferred_challenges = profile_data.preferred_challenges

    bedtime_str = profile_data.bedtime or profile_data.target_bedtime
    if bedtime_str is not None:
        parts = bedtime_str.split(":")
        fmt = "%H:%M" if len(parts) == 2 else "%H:%M:%S"
        current_user.target_bedtime = datetime.strptime(bedtime_str, fmt).time()

    wake_time_str = profile_data.wake_time or profile_data.target_wake_time
    if wake_time_str is not None:
        parts = wake_time_str.split(":")
        fmt = "%H:%M" if len(parts) == 2 else "%H:%M:%S"
        current_user.target_wake_time = datetime.strptime(wake_time_str, fmt).time()

    db.commit()
    db.refresh(current_user)

    current_user.bedtime = current_user.target_bedtime.strftime("%H:%M") if current_user.target_bedtime else None
    current_user.wake_time = current_user.target_wake_time.strftime("%H:%M") if current_user.target_wake_time else None
    return current_user

@router.get("/coach/users", response_model=list[UserResponse])
def get_assigned_users(
    coach: User = Depends(require_wellness_coach),
    db: Session = Depends(get_db)
):
    """Returns a list of users assigned to the wellness coach."""
    users = db.query(User).filter(User.role == UserRole.USER).all()
    for user in users:
        user.bedtime = user.target_bedtime.strftime("%H:%M") if user.target_bedtime else None
        user.wake_time = user.target_wake_time.strftime("%H:%M") if user.target_wake_time else None
    return users