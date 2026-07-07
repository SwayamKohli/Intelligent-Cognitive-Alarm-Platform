# DB connection setup
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://mongo_user:mongo_password@localhost:27018"
)

client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=2000)
mongo_db = client["cognitive_alarm_logs"]
challenge_logs_collection = mongo_db["challenge_logs"]

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://alarm_user:alarm_password@127.0.0.1:5433/alarm_db"
)

# SQLite needs check_same_thread=False; Postgres does not
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()