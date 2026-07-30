from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db, challenge_logs_collection
from app.models.user import User
from app.models.alarm import Alarm
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

# ── Security Dependency ──────────────────────────────────────────────
def require_admin(current_user: User = Depends(get_current_user)):
    """Blocks anyone who does not have the ADMIN role in the database."""
    # Assuming UserRole enum is accessible as a string or enum property
    if current_user.role.name != "ADMIN" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Administrator privileges required."
        )
    return current_user


# ── GET /admin/metrics ───────────────────────────────────────────────
@router.get("/metrics")
async def get_dashboard_metrics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Aggregates global platform KPIs from Postgres (Users/Alarms) 
    and MongoDB (Cognitive Engine Telemetry).
    """
    # 1. PostgreSQL Metrics (User & Alarm Stats)
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar()
    
    total_alarms = db.query(func.count(Alarm.id)).scalar()
    
    # Calculate average snoozes globally
    avg_snoozes_query = db.query(func.avg(Alarm.active_snooze_count)).scalar()
    avg_snoozes = round(float(avg_snoozes_query), 2) if avg_snoozes_query else 0.0

    # 2. MongoDB Metrics (Engine Failure Rates)
    # Aggregation pipeline to group logs by challenge type and count failures
    pipeline = [
        {
            "$group": {
                "_id": "$challenge_type",
                "total_attempts": {"$sum": 1},
                "total_failures": {"$sum": "$failed_attempts"}
            }
        },
        {"$sort": {"total_failures": -1}} # Sort highest failures first
    ]
    
    engine_stats = []
    async for doc in challenge_logs_collection.aggregate(pipeline):
        attempts = doc.get("total_attempts", 0)
        failures = doc.get("total_failures", 0)
        failure_rate = round((failures / attempts) * 100, 2) if attempts > 0 else 0
        
        engine_stats.append({
            "engine": doc["_id"],
            "attempts": attempts,
            "failures": failures,
            "failure_rate_percentage": failure_rate
        })

    return {
        "user_growth": {
            "total_registered": total_users,
            "active_daily": active_users
        },
        "global_snooze": {
            "average_active_snoozes": avg_snoozes,
            "total_active_alarms": total_alarms
        },
        "engine_failure_rates": engine_stats
    }