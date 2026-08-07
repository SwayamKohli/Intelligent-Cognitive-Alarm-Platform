from datetime import datetime, timezone, timedelta
from app.database import challenge_logs_collection


async def get_user_telemetry_last_7_days(user_id: str) -> dict:

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    pipeline = [
        # ── Stage 1: $match ───────────────────────────────────
        {
            "$match": {
                "user_id": user_id,
                # FIXED: Swapped 'timestamp' to 'created_at' to match actual DB schema
                "created_at": {"$gte": seven_days_ago, "$lte": now},
            }
        },
        # ── Stage 2: $group ───────────────────────────────────
        {
            "$group": {
                "_id": None,
                # Defaulting snoozes to 0 here if it's managed in a different collection
                "total_snoozes": {"$sum": 0},
                # Every document in this collection is a challenge attempt
                "total_challenges": {"$sum": 1},
                # FIXED: Check if failed_attempts is greater than 0 instead of looking for 'outcome' string
                "total_failures": {
                    "$sum": {
                        "$cond": [
                            {"$gt": ["$failed_attempts", 0]},
                            1,
                            0,
                        ]
                    }
                },
                "active_days": {
                    # FIXED: Swapped 'timestamp' to 'created_at'
                    "$addToSet": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
                },
            }
        },
        # ── Stage 3: $project ─────────────────────────────────
        {
            "$project": {
                "_id": 0,
                "total_snoozes": 1,
                "total_challenges": 1,
                "total_failures": 1,
                "days_active": {"$size": "$active_days"},
                "failure_rate_percent": {
                    "$round": [
                        {
                            "$cond": {
                                "if": {"$eq": ["$total_challenges", 0]},
                                "then": 0.0,
                                "else": {
                                    "$multiply": [
                                        {
                                            "$divide": [
                                                "$total_failures",
                                                "$total_challenges",
                                            ]
                                        },
                                        100,
                                    ]
                                },
                            }
                        },
                        2,
                    ]
                },
            }
        },
    ]

    # ── Execute pipeline with exception fallback ─────────────
    try:
        cursor = challenge_logs_collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)
    except Exception as e:
        print(f"[WARNING] Telemetry service MongoDB call fallback: {e}")
        results = []

    # ── Return result or safe zero-state ──────────────────────
    if not results:
        return {
            "user_id": user_id,
            "period_days": 7,
            "total_snoozes": 0,
            "total_challenges": 0,
            "total_failures": 0,
            "failure_rate_percent": 0.0,
            "days_active": 0,
            "generated_at": now.isoformat(),
        }

    result = results[0]
    result["user_id"] = user_id
    result["period_days"] = 7
    result["generated_at"] = now.isoformat()

    return result
