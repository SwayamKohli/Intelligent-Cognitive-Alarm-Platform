# scripts/create_tables_rds.py
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine

sys.path.append(os.getcwd())
load_dotenv()

from app.models.base import Base
from app.models.user import User
from app.models.alarm import Alarm
from app.models.habit import Habit, HabitLog

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

Base.metadata.create_all(bind=engine)
print("✅ All tables created on RDS")
