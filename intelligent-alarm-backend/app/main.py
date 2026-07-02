# BOILERPLATE CODE

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app.models.base import Base
# Import all models so SQLAlchemy knows they exist before creating tables
from app.models import user, alarm, habit

# Create all tables in the PostgreSQL database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent Cognitive Alarm API",
    description="Backend for the AI-powered smart alarm platform.",
    version="1.0.0"
)

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

from app.api import alarms

app.include_router(alarms.router)