import os
import sys
from dotenv import load_dotenv
from passlib.context import CryptContext

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.alarm import Alarm        
from app.models.habit import Habit, HabitLog

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin():
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    admin_name = os.getenv("ADMIN_NAME", "Tech Lead")

    if not admin_email or not admin_password:
        print(" ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
        sys.exit(1)

    if len(admin_password) < 12:
        print(" ADMIN_PASSWORD must be at least 12 characters")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"Admin user '{admin_email}' already exists — skipping (no changes made).")
            return

        admin_user = User(
            email=admin_email,
            password_hash=pwd_context.hash(admin_password),
            full_name=admin_name,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin user created: {admin_email}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()