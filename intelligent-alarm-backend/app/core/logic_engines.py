import random
import string
from app.core.static_engines import get_local_random

def generate_memory_sequence(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """Generates a timed alphanumeric memory sequence."""
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    
    difficulty_matrix = {
        1: (3, 4000),
        2: (4, 3500),
        3: (5, 3000),
        4: (6, 2500),
        5: (7, 2000)
    }
    
    seq_length, display_time = difficulty_matrix[difficulty]
    pool = string.digits if difficulty <= 2 else string.digits + string.ascii_uppercase
    sequence = [r.choice(pool) for _ in range(seq_length)]
    
    return {
        "client_payload": {
            "challenge_type": "memory",
            "difficulty": difficulty,
            "content": {
                "prompt": "Memorize the following sequence:",
                "sequence": sequence,
                "display_time_ms": display_time
            }
        },
        "server_answer": "".join(sequence)
    }

def generate_pattern_recognition(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """Generates a mathematical or logical sequence with a missing element."""
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    length = 5
    seq = []
    
    if difficulty == 1:
        step = r.randint(2, 5)
        start = r.randint(1, 10)
        seq = [start + i * step for i in range(length)]
    elif difficulty == 2:
        step = r.randint(2, 3)
        start = r.randint(2, 5)
        seq = [start * (step ** i) for i in range(length)]
    elif difficulty == 3:
        start = r.randint(1, 5)
        seq = [start]
        for i in range(1, length):
            seq.append(seq[-1] + i)
    elif difficulty == 4:
        seq = [r.randint(1, 5), r.randint(1, 5)]
        for _ in range(length - 2):
            seq.append(seq[-1] + seq[-2])
    else: 
        offset = r.randint(1, 3)
        start = r.randint(2, 5)
        seq = [(start + i)**2 + offset for i in range(length)]
        
    missing_idx = r.randint(1, length - 2) 
    answer = str(seq[missing_idx])
    seq[missing_idx] = "?"
    
    seq_str = ", ".join(map(str, seq))
    
    return {
        "client_payload": {
            "challenge_type": "pattern",
            "difficulty": difficulty,
            "content": {
                "prompt": f"Find the missing number in the pattern: {seq_str}"
            }
        },
        "server_answer": answer
    }

def generate_logic_puzzle(difficulty: int) -> dict:
    """Generates a deductive reasoning puzzle with randomized entities."""
    difficulty = max(1, min(5, difficulty))
    
    names = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey"]
    comparisons = [
        ("taller than", "shorter than", "tallest", "shortest"),
        ("older than", "younger than", "oldest", "youngest"),
        ("faster than", "slower than", "fastest", "slowest")
    ]
    
    comp_greater, comp_lesser, superlative_max, superlative_min = random.choice(comparisons)
    num_entities = 3 if difficulty <= 2 else (4 if difficulty <= 4 else 5)
    entities = random.sample(names, num_entities)
    
    statements = []
    for i in range(num_entities - 1):
        if random.choice([True, False]):
            statements.append(f"{entities[i+1]} is {comp_greater} {entities[i]}.")
        else:
            statements.append(f"{entities[i]} is {comp_lesser} {entities[i+1]}.")
            
    if difficulty >= 3:
        if random.choice([True, False]):
             statements.append(f"{entities[2]} is {comp_greater} {entities[0]}.")
        else:
             statements.append(f"{entities[0]} is {comp_lesser} {entities[2]}.")
             
    random.shuffle(statements)
    
    find_max = random.choice([True, False])
    if find_max:
        question = f"Who is the {superlative_max}?"
        answer = entities[-1]
    else:
        question = f"Who is the {superlative_min}?"
        answer = entities[0]
        
    prompt = " ".join(statements) + f" {question}"
    options = entities.copy()
    random.shuffle(options)
    
    return {
        "client_payload": {
            "challenge_type": "logic",
            "difficulty": difficulty,
            "content": {
                "prompt": prompt,
                "options": options
            }
        },
        "server_answer": answer
    }