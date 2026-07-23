import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None

async def generate_ai_recommendations(user_name: str, telemetry_data: dict, habit_score: float) -> dict:
    """
    Feeds 7-day MongoDB telemetry and Habit Score to Llama 3 to generate 
    the 4 strict recommendation categories required by the PDF requirements.
    """
    
    # Extract raw data from PK's MongoDB pipeline
    snoozes = telemetry_data.get("total_snoozes", 0)
    failure_rate = telemetry_data.get("failure_rate_percent", 0.0)
    
    system_prompt = (
        "You are an expert Wellness and Productivity Coach AI. "
        "Your job is to analyze a user's 7-day smart-alarm data and provide highly personalized, one-sentence advice. "
        "You MUST return your response as a raw, valid JSON object with exactly these four keys: "
        "'sleep', 'wake_up', 'habit', 'productivity'. Do not include markdown formatting or backticks."
    )
    
    user_prompt = (
        f"User: {user_name}\n"
        f"Habit Score: {habit_score}/100\n"
        f"Total Snoozes this week: {snoozes}\n"
        f"Challenge Failure Rate: {failure_rate}%\n\n"
        "Generate 1 sentence of actionable advice for each of the 4 categories based strictly on these metrics."
    )

    if not client:
        print("[WARNING] GROQ_API_KEY not configured. Returning fallback static recommendations.")
        return {
            "sleep": "Try going to bed 30 minutes earlier to improve your energy.",
            "wake_up": "Place your phone across the room to reduce snoozing.",
            "habit": "Consistency is key; try waking up at the same time on weekends.",
            "productivity": "Complete your most difficult task immediately after waking up."
        }

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON string returned by Llama 3 into a Python dictionary
        response_text = chat_completion.choices[0].message.content
        return json.loads(response_text)

    except Exception as e:
        print(f"[ERROR] Groq API failed: {e}")
        # Fallback static recommendations if the API goes down
        return {
            "sleep": "Try going to bed 30 minutes earlier to improve your energy.",
            "wake_up": "Place your phone across the room to reduce snoozing.",
            "habit": "Consistency is key; try waking up at the same time on weekends.",
            "productivity": "Complete your most difficult task immediately after waking up."
        }