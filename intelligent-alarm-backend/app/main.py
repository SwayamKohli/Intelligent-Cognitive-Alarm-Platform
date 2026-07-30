import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import engine, init_redis, close_redis
from app.models.base import Base

# Import all models so SQLAlchemy knows they exist before creating tables
from app.models import user, alarm, habit, notification
from app.api import (
    alarms,
    auth,
    challenges,
    admin,
    users,
    analytics,
    reports,
    notifications,
)
from scripts.retrain_engine import run_retraining_loop

# Configure basic logger for startup notifications
logger = logging.getLogger("api")

# Create all tables in the PostgreSQL database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent Cognitive Alarm API",
    description="Backend for the AI-powered smart alarm platform.",
    version="1.0.0",
)

# Initialize the asynchronous background scheduler
scheduler = AsyncIOScheduler()

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Intelligent Cognitive Alarm API is running."}


app.include_router(alarms.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(challenges.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(notifications.router)


@app.on_event("startup")
async def startup():
    await init_redis()

    # Schedule the V2 ML retraining script to execute automatically every midnight (00:00 UTC)
    scheduler.add_job(
        run_retraining_loop,
        "cron",
        hour=0,
        minute=0,
        id="nightly_ml_retraining",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Nightly V2 ML Retraining Scheduler successfully started (Cron: 00:00 UTC).")


@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
    await close_redis()
