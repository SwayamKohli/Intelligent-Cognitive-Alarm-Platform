import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None
MODEL = "llama-3.1-8b-instant"

def generate_ai_challenge(challenge_type: str, difficulty: int, avoid_topics: list[str] = []) -> dict:
    """
    Token-optimized Groq API router with Indian cultural localization.
    """
    
    avoid_str = f"Avoid: {', '.join(avoid_topics)}." if avoid_topics else ""
    
    # Force localized context for realistic difficulty balancing
    localization = (
        "Context: Use everyday Indian life, Indian geography, Indian history, or general science. " 
        "Make it relatable to a young adult in India."
    )

    if challenge_type == "riddle":
        system_prompt = (
            f"Write a completely original, obscure riddle. Difficulty: {difficulty}/5. {localization} "
            f"DO NOT use common tropes (coins, shadows, time, echoes). {avoid_str} "
            'JSON format: {"prompt": "riddle text", "answer": "single word"}'
        )
    elif challenge_type == "word_scramble":
        system_prompt = (
            f"Pick an English word common in Indian vocabulary (Difficulty {difficulty}/5). Scramble it. {avoid_str} "
            'JSON format: {"scrambled_word": "scrambled", "answer": "original"}'
        )
    elif challenge_type == "logic":
        system_prompt = (
            f"Write a short deductive logic puzzle. Difficulty: {difficulty}/5. {localization} {avoid_str} "
            'JSON format: {"prompt": "scenario", "options": ["A", "B", "C", "D"], "answer": "exact correct option string"}'
        )
    elif challenge_type == "quiz":
        system_prompt = (
            f"Write a trivia question. Difficulty: {difficulty}/5. {localization} {avoid_str} "
            'JSON format: {"prompt": "question", "options": ["A", "B", "C", "D"], "answer": "exact correct option string"}'
        )
    else:
        raise ValueError(f"Unsupported AI challenge: {challenge_type}")

    response = client.chat.completions.create(
        messages=[{"role": "system", "content": system_prompt}],
        model=MODEL,
        temperature=0.8, 
        max_tokens=150,  
        response_format={"type": "json_object"}, 
    )

    raw_json = json.loads(response.choices[0].message.content)

    payload = {
        "client_payload": {
            "challenge_type": challenge_type,
            "difficulty": difficulty,
            "content": {}
        },
        "server_answer": raw_json["answer"].lower().strip()
    }

    if challenge_type == "riddle":
        payload["client_payload"]["content"]["prompt"] = raw_json["prompt"]
    elif challenge_type == "word_scramble":
        payload["client_payload"]["content"]["prompt"] = "Unscramble this word:"
        payload["client_payload"]["content"]["scrambled_word"] = raw_json["scrambled_word"].upper()
    elif challenge_type in ["logic", "quiz"]:
        payload["client_payload"]["content"]["prompt"] = raw_json["prompt"]
        payload["client_payload"]["content"]["options"] = raw_json["options"]

    return payload