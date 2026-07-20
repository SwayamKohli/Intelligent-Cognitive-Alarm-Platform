from datetime import datetime, timezone, timedelta
from app.database import challenge_logs_collection


async def get_user_telemetry_last_7_days(user_id: str) -> dict:

    now        = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    pipeline = [

        # ── Stage 1: $match ───────────────────────────────────
        {
            "$match": {
                "user_id": user_id,
                "timestamp": {
                    "$gte": seven_days_ago,
                    "$lte": now
                }
            }
        },

        # ── Stage 2: $group ───────────────────────────────────
        # Collapse all matched documents into one summary row.
        # _id: null means "group everything together" (one bucket).
        {
            "$group": {
                "_id": None,
                "total_snoozes": { "$sum": { "$cond": [ {"$eq": ["$event_type", "snooze"]},1,0] } },
                "total_challenges": { "$sum": { "$cond": [ {"$eq": ["$event_type", "challenge_attempt"]},1,0] } },
                "total_failures": { "$sum": { "$cond": [ { "$and": [ {"$eq": ["$event_type", "challenge_attempt"]}, {"$in":  ["$outcome", ["failure", "skipped"]]} ] }, 1, 0 ] } },
                "active_days": { "$addToSet": { "$dateToString": { "format": "%Y-%m-%d", "date": "$timestamp" } } }
            }
        },

        # ── Stage 3: $project ─────────────────────────────────
        # Shape the final output — calculate failure_rate here
        {
            "$project": {
                "_id":             0,
                "total_snoozes":   1,
                "total_challenges": 1,
                "total_failures":  1,
                "days_active": {"$size": "$active_days"},

                "failure_rate_percent": {
                    "$round": [
                        {
                            "$cond": {
                                "if":   {"$eq": ["$total_challenges", 0]},
                                "then": 0.0,
                                "else": {
                                    "$multiply": [
                                        {
                                            "$divide": [
                                                "$total_failures",
                                                "$total_challenges"
                                            ]
                                        },
                                        100
                                    ]
                                }
                            }
                        }, 2   
                    ]
                }
            }
        }
    ]

    # ── Execute pipeline ──────────────────────────────────────
    cursor  = challenge_logs_collection.aggregate(pipeline)
    results = await cursor.to_list(length=1)

    # ── Return result or safe zero-state ──────────────────────
    # If user has NO logs yet (new user), return all zeros
    if not results:
        return {
            "user_id":              user_id,
            "period_days":          7,
            "total_snoozes":        0,
            "total_challenges":     0,
            "total_failures":       0,
            "failure_rate_percent": 0.0,
            "days_active":          0,
            "generated_at":         now.isoformat()
        }

    result = results[0]
    result["user_id"]      = user_id
    result["period_days"]  = 7
    result["generated_at"] = now.isoformat()

    return result