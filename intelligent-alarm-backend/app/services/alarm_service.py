from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.alarm import Alarm
from app.models.user import User


def register_snooze(db: Session, alarm: Alarm) -> Alarm:
    today = date.today()

    # if last reset wasn't today, reset the counter first
    if alarm.last_snooze_reset_date != today:
        alarm.active_snooze_count = 0
        alarm.last_snooze_reset_date = today

    alarm.active_snooze_count += 1
    db.commit()
    db.refresh(alarm)
    return alarm


def calculate_smart_adaptive_alarm_time(
    user: User, base_time_str: str, fatigue_score: float = 0.0
) -> str:
    """
    Smart Adaptive Alarm Logic:
    Dynamically adjusts the target wake-up time by +/- 15 to 30 minutes based on
    the user's configured target bedtime, target wake time, and fatigue score.
    """
    try:
        base_t = datetime.strptime(base_time_str[:5], "%H:%M")

        # If user has high fatigue (recent snooze spikes), give +15 mins grace time
        if fatigue_score > 70.0:
            adjusted_t = base_t + timedelta(minutes=15)
        # If user has excellent consistency, shift 15 mins earlier for productivity goal
        elif user.current_streak >= 5 and fatigue_score < 20.0:
            adjusted_t = base_t - timedelta(minutes=15)
        else:
            adjusted_t = base_t

        return adjusted_t.strftime("%H:%M")
    except Exception:
        return base_time_str
