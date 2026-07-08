import sys
import os
import hashlib
import random

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.challenge_generator import generate_math_problem
from app.core.static_engines import get_local_random

def run_demonstration():
    user_id = "user_987654321"
    
    print("=" * 60)
    print("DEMONSTRATING DETERMINISTIC MATH CHALLENGE GENERATION")
    print("=" * 60)
    print(f"Target User ID: {user_id}")
    print("-" * 60)
    
    # 1. Show that the generator is deterministic for the same user_id and total_attempts
    print("\n1. Verifying Determinism (Same inputs produce identical problems):")
    for attempt in [0, 1, 2]:
        p1 = generate_math_problem(difficulty=2, user_id=user_id, total_attempts=attempt)
        p2 = generate_math_problem(difficulty=2, user_id=user_id, total_attempts=attempt)
        
        problem_str1 = p1['client_payload']['content']['prompt']
        answer_str1 = p1['server_answer']
        problem_str2 = p2['client_payload']['content']['prompt']
        answer_str2 = p2['server_answer']
        
        is_identical = (problem_str1 == problem_str2) and (answer_str1 == answer_str2)
        print(f"  Attempt {attempt}:")
        print(f"    Run A: {problem_str1} = {answer_str1}")
        print(f"    Run B: {problem_str2} = {answer_str2}")
        print(f"    Identical? {is_identical}")

    # 2. Show that changing the attempt count changes the generated challenge
    print("\n2. Verifying Uniqueness across attempts:")
    problems = []
    for attempt in range(5):
        p = generate_math_problem(difficulty=3, user_id=user_id, total_attempts=attempt)
        prompt = p['client_payload']['content']['prompt']
        ans = p['server_answer']
        problems.append((prompt, ans))
        print(f"  Attempt {attempt}: {prompt} = {ans}")
        
    unique_prompts = len(set([x[0] for x in problems]))
    print(f"  Number of unique problems generated over 5 attempts: {unique_prompts}/5")

    # 3. Show scaling across difficulties
    print("\n3. Testing math problems across all difficulty levels (1-5):")
    for diff in range(1, 6):
        p = generate_math_problem(difficulty=diff, user_id=user_id, total_attempts=0)
        print(f"  Level {diff}: {p['client_payload']['content']['prompt']} = {p['server_answer']}")
    print("=" * 60)

if __name__ == "__main__":
    run_demonstration()
