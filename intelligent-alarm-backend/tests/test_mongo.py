import asyncio
from app.database import client, challenge_logs_collection
import pytest

@pytest.mark.asyncio
async def test_connection():
    try:
        # Verify the connection is alive
        await client.admin.command("ping")
        print("✅ MongoDB connection successful")

        # Insert a throwaway test document
        result = await challenge_logs_collection.insert_one({"test": "hello"})
        print("Inserted test doc with id:", result.inserted_id)

        # Read it back to confirm reads work too
        doc = await challenge_logs_collection.find_one({"_id": result.inserted_id})
        print("Read back:", doc)

        # Clean up — remove the test doc so it doesn't clutter your real collection
        await challenge_logs_collection.delete_one({"_id": result.inserted_id})
        print("🧹 Test document cleaned up")

    except Exception as e:
        print("❌ Connection failed:", e)


if __name__ == "__main__":
    asyncio.run(test_connection())


# import asyncio
# import sys
# import os

# sys.path.append(os.getcwd())

# from database import SessionLocal
# from models.user import User
# from models.alarm import Alarm
# from models.habit import Habit, HabitLog
# from database import challenge_logs_collection


# def check_postgres():
#     db = SessionLocal()
#     try:
#         admin = db.query(User).filter(User.role == "ADMIN").first()
#         print("Postgres OK — admin found:", admin.email if admin else "NOT FOUND")
#     finally:
#         db.close()


# async def check_mongo():
#     count = await challenge_logs_collection.count_documents({})
#     print("Mongo OK — challenge_logs count:", count)


# if __name__ == "__main__":
#     check_postgres()
#     asyncio.run(check_mongo())
