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
    "mongodb://mongo_user:mongo_password@localhost:27017"
)

client = AsyncIOMotorClient(MONGO_URL)
mongo_db = client["cognitive_alarm_logs"]
challenge_logs_collection = mongo_db["challenge_logs"]

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://alarm_user:alarm_password@127.0.0.1:5433/alarm_db"
)

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()