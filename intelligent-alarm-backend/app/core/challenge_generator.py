import random
from app.core.logic_engines import (
    generate_memory_sequence,
    generate_pattern_recognition,
    generate_logic_puzzle
)
from app.core.static_engines import (
    get_local_random,
    generate_word_scramble,
    generate_riddle,
    generate_quiz
)
from app.core.llm_generator import generate_ai_challenge

def generate_math_problem(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """Baseline math engine updated to match the new universal JSON contract with uniqueness."""
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    
    if difficulty == 1:
        a, b = r.randint(1, 9), r.randint(1, 9)
        op = r.choice(["+", "-"])
        if op == "-" and a < b:
            a, b = b, a
        problem = f"{a} {op} {b}"
        answer = str(a + b if op == "+" else a - b)
    else:
        # Simplified scaling for the router example
        a, b = r.randint(10, 50 * difficulty), r.randint(1, 10 * difficulty)
        problem = f"{a} + {b}"
        answer = str(a + b)
        
    return {
        "client_payload": {
            "challenge_type": "math",
            "difficulty": difficulty,
            "content": {
                "prompt": f"Solve this: {problem}"
            }
        },
        "server_answer": answer
    }

def get_next_challenge(difficulty: int, challenge_type: str = "random", user_id: str | None = None, total_attempts: int = 0, allowed_types: str | None = None) -> dict:
    """
    Acts as the master router. Routes the request to the AI engines first, 
    falling back to static algorithms if the LLM fails.
    Filters available engines based on user preferences.
    """
    static_engines = {
        "math": generate_math_problem,
        "memory": generate_memory_sequence,
        "pattern": generate_pattern_recognition,
        "logic": generate_logic_puzzle,
        "word_scramble": generate_word_scramble,
        "riddle": generate_riddle,
        "quiz": generate_quiz
    }
    
    available_engines = list(static_engines.keys())
    
    # Apply user preferences if they exist
    if allowed_types:
        parsed_types = [t.strip().lower() for t in allowed_types.split(",") if t.strip()]
        # Intersect requested types with actually available engines to prevent crashes
        filtered_engines = [t for t in available_engines if t in parsed_types]
        if filtered_engines:
            available_engines = filtered_engines
    
    # If requested challenge is random OR the requested challenge is not allowed by preferences
    if challenge_type == "random" or challenge_type not in available_engines:
        r = get_local_random(user_id, total_attempts)
        challenge_type = r.choice(available_engines)
        
    # ── AI ROUTING LAYER (Groq Llama 3) ──
    semantic_types = ["riddle", "word_scramble", "logic", "quiz"]
    
    challenge_data = None
    
    if challenge_type in semantic_types:
        try:
            # Attempt to generate infinite AI puzzle
            challenge_data = generate_ai_challenge(challenge_type, difficulty, avoid_topics=[])
        except Exception as e:
            print(f"[WARNING] Groq API failed for {challenge_type}. Falling back to static engine. Error: {e}")
            # Silently fall down to the static engine execution block below

    # ── STATIC FALLBACK LAYER ──
    if not challenge_data:
        engine_function = static_engines[challenge_type]
        
        if engine_function == generate_logic_puzzle:
            challenge_data = engine_function(difficulty)
        else:
            challenge_data = engine_function(difficulty, user_id=user_id, total_attempts=total_attempts)
            
    # --- Inject debugging statement to log the secret answer to the terminal ---
    print(f"\n🔒 [DEBUG] Expected Answer for upcoming '{challenge_type}' puzzle: '{challenge_data['server_answer']}'\n")
    
    return challenge_data