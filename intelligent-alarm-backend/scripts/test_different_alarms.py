import sys
import os
import uuid

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.challenge_generator import get_next_challenge

def verify_different_alarms():
    user_id = "user_abc123"
    
    # Generate two random alarm IDs
    alarm_id_1 = str(uuid.uuid4())
    alarm_id_2 = str(uuid.uuid4())
    
    print("=" * 70)
    print("TESTING UNIQUE CHALLENGES ACROSS DIFFERENT ALARM CREATIONS")
    print("=" * 70)
    print(f"User ID: {user_id}")
    print(f"Alarm ID 1: {alarm_id_1}")
    print(f"Alarm ID 2: {alarm_id_2}")
    print("-" * 70)
    
    # Simulating the endpoint behavior where user_seed_key is a combination of user_id and alarm_id
    user_seed_key_1 = f"{user_id}_{alarm_id_1}"
    user_seed_key_2 = f"{user_id}_{alarm_id_2}"
    
    # Get challenge for Alarm 1 (Attempt 0, Difficulty 2)
    c1 = get_next_challenge(
        difficulty=2,
        challenge_type="math",
        user_id=user_seed_key_1,
        total_attempts=0
    )
    
    # Get challenge for Alarm 2 (Attempt 0, Difficulty 2)
    c2 = get_next_challenge(
        difficulty=2,
        challenge_type="math",
        user_id=user_seed_key_2,
        total_attempts=0
    )
    
    problem_1 = c1['client_payload']['content']['prompt']
    answer_1 = c1['server_answer']
    
    problem_2 = c2['client_payload']['content']['prompt']
    answer_2 = c2['server_answer']
    
    print("\nGenerated Math Challenges for Different Alarms (Same User, Same Attempt):")
    print(f"  Alarm 1 Challenge: '{problem_1}' = '{answer_1}'")
    print(f"  Alarm 2 Challenge: '{problem_2}' = '{answer_2}'")
    
    are_different = (problem_1 != problem_2)
    print(f"\nAre the challenges different? {are_different}")
    print("=" * 70)
    
    if are_different:
        print(" SUCCESS: Different alarm creations generate different math problems!")
    else:
        print(" FAILURE: Both alarms generated the exact same math problem.")
    print("=" * 70)

if __name__ == "__main__":
    verify_different_alarms()
