# DB connection setup
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

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

# REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# # Global pool — created once on startup, reused across all requests
# redis_pool: aioredis.Redis | None = None

# async def get_redis() -> aioredis.Redis:
#     """FastAPI dependency — inject redis into any route."""
#     return redis_pool

# async def init_redis():
#     """Call once in app startup event."""
#     global redis_pool
#     redis_pool = aioredis.from_url(
#         REDIS_URL,
#         encoding="utf-8",
#         decode_responses=True,
#     )
#     # Test connection immediately so startup fails fast if Redis is down
#     await redis_pool.ping()
#     FastAPICache.init(RedisBackend(redis_pool), prefix="cogalarm-cache")
#     print("✅ Redis connected")

# async def close_redis():
#     """Call once in app shutdown event."""
#     global redis_pool
#     if redis_pool:
#         await redis_pool.aclose()
#         print("Redis disconnected")
        