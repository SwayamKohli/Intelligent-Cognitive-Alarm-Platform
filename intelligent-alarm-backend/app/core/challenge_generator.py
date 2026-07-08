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

def get_next_challenge(difficulty: int, challenge_type: str = "random", user_id: str | None = None, total_attempts: int = 0) -> dict:
    """
    Acts as the master router. Routes the request to the correct engine
    based on the requested challenge type.
    """
    engines = {
        "math": generate_math_problem,
        "memory": generate_memory_sequence,
        "pattern": generate_pattern_recognition,
        "logic": generate_logic_puzzle,
        "word_scramble": generate_word_scramble,
        "riddle": generate_riddle,
        "quiz": generate_quiz
    }
    
    if challenge_type == "random" or challenge_type not in engines:
        r = get_local_random(user_id, total_attempts)
        challenge_type = r.choice(list(engines.keys()))
        
    engine_function = engines[challenge_type]
    
    if engine_function == generate_logic_puzzle:
        return engine_function(difficulty)
    else:
        return engine_function(difficulty, user_id=user_id, total_attempts=total_attempts)