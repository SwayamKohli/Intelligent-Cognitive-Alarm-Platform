from datetime import date
from sqlalchemy.orm import Session
from app.models.alarm import Alarm


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