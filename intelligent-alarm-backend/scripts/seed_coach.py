import sys
import os

sys.path.append(".")

from app.database import SessionLocal
from app.models.user import User
from app.models.alarm import Alarm
from app.models.habit import Habit
from app.models.notification import NotificationPreference
from app.core.security import get_password_hash
from sqlalchemy import text  # Need this for raw SQL cleanup


def seed_coach():
    db = SessionLocal()

    # --- FIX: Nuke the corrupt database row from our previous attempts ---
    db.execute(text("DELETE FROM users WHERE email = 'coach@gmail.com'"))
    db.commit()
    print("🧹 Cleaned up corrupt coach records...")

    # 1. Create the Coach account cleanly
    coach_email = "coach@gmail.com"

    coach = User(
        email=coach_email,
        password_hash=get_password_hash("CoachPassword123!"),
        full_name="Master Coach",
        role="WELLNESS_COACH",  # Perfect Enum match
        is_active=True,
        is_verified=True,
    )
    db.add(coach)
    db.commit()
    db.refresh(coach)
    print(f"✅ Created Coach: {coach_email} / CoachPassword123!")

    # 2. Assign the TechLead user to this coach so the dashboard isn't empty
    student = db.query(User).filter(User.email == "techlead@gmail.com").first()
    if student:
        # Check if your User model uses 'coach_id'
        if hasattr(student, "coach_id"):
            student.coach_id = coach.id
            db.commit()
            print(f"✅ Assigned student {student.email} to Coach!")
        else:
            print("⚠️ User model does not use 'coach_id'.")

    db.close()


if __name__ == "__main__":
    seed_coach()
