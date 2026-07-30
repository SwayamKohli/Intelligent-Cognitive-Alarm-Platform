import pandas as pd
import numpy as np
import random
import os

print(" Booting V2 Synthetic Data Generator...")

NUM_SAMPLES = 10000
CHALLENGE_TYPES = ["math", "memory", "pattern", "logic", "word_scramble", "riddle", "quiz"]

data = []

for _ in range(NUM_SAMPLES):
    persona = random.choice(["autopilot_genius", "groggy_struggler", "panicked_waker", "standard"])
    
    if persona == "autopilot_genius":
        snooze_count = random.randint(3, 6)
        success_rate = round(random.uniform(0.85, 1.0), 2)
        avg_time_ms = random.randint(1500, 4000)
        last_failed = random.choice(["none", "logic", "riddle"])
        
        target_type = random.choice(["logic", "pattern", "riddle"])
        target_diff = random.randint(4, 5)
        target_streak = 3
        
    elif persona == "groggy_struggler":
        snooze_count = random.randint(3, 5)
        success_rate = round(random.uniform(0.3, 0.6), 2)
        avg_time_ms = random.randint(12000, 25000)
        last_failed = random.choice(["math", "logic", "pattern"])
        
        target_type = random.choice(["quiz", "word_scramble", "memory"])
        target_diff = random.randint(1, 2)
        target_streak = 2
        
    elif persona == "panicked_waker":
        snooze_count = random.randint(0, 1)
        success_rate = round(random.uniform(0.4, 0.7), 2)
        avg_time_ms = random.randint(2000, 6000)
        last_failed = random.choice(["math", "word_scramble"])
        
        target_type = "memory" # Forces them to stop and focus
        target_diff = random.randint(2, 3)
        target_streak = 1
        
    else: # Standard User
        snooze_count = random.randint(0, 3)
        success_rate = round(random.uniform(0.6, 0.85), 2)
        avg_time_ms = random.randint(5000, 12000)
        last_failed = random.choice(CHALLENGE_TYPES + ["none"])
        
        # Linear scaling based on snoozes
        target_type = random.choice(CHALLENGE_TYPES)
        target_diff = min(5, max(1, snooze_count + 1))
        target_streak = min(3, max(1, snooze_count))

    data.append({
        "snooze_count": snooze_count,
        "historical_success_rate": success_rate,
        "avg_time_taken_ms": avg_time_ms,
        "last_failed_type": last_failed,
        "target_challenge_type": target_type,
        "target_difficulty": target_diff,
        "target_multi_step": target_streak
    })

# Convert to DataFrame
df = pd.DataFrame(data)

# Ensure the data directory exists
os.makedirs("../data", exist_ok=True)

# Export to CSV
csv_path = "../data/synthetic_v2_logs.csv"
df.to_csv(csv_path, index=False)

print(f" Successfully generated {NUM_SAMPLES} rows of synthetic multi-dimensional data.")
print(f" Saved to: {csv_path}")
print("\nSample Data Preview:")
print(df.head())