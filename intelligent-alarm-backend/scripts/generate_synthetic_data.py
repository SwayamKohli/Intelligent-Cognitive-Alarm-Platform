import pandas as pd
import numpy as np
import os

def generate_dataset(num_samples=10000):
    """
    Generates synthetic training data for the Cognitive Challenge ML Engine.
    """
    # Set a seed for reproducibility
    np.random.seed(42)

    print(f"Generating {num_samples} synthetic user interactions...")

    # 1. Generate Input Features (X)
    # Habit score heavily skewed toward average (40-70)
    habit_score = np.random.normal(loc=55, scale=20, size=num_samples)
    habit_score = np.clip(habit_score, 0, 100)
    
    # Most people don't snooze or snooze 1-2 times. Very few snooze 5 times.
    snooze_count = np.random.choice([0, 1, 2, 3, 4, 5], num_samples, p=[0.45, 0.25, 0.15, 0.08, 0.05, 0.02])
    
    # Average time to solve (seconds)
    avg_time_to_solve = np.random.uniform(5.0, 120.0, num_samples)
    
    # Failed attempts yesterday
    failed_attempts = np.random.choice([0, 1, 2, 3], num_samples, p=[0.70, 0.20, 0.08, 0.02])

    # 2. Define the Target Logic (The "Teacher" Rules)
    # Base difficulty relies on their overall habit score
    base_diff = np.where(habit_score > 80, 4,
                np.where(habit_score > 50, 3,
                np.where(habit_score > 30, 2, 1)))

    # Snoozing forces the difficulty up (Anti-snooze protocol)
    # Struggling (high time or fails) pulls it down slightly to prevent app abandonment
    time_penalty = np.where(avg_time_to_solve > 90, -1, 0)
    fail_penalty = np.where(failed_attempts > 1, -1, 0)

    target_difficulty = base_diff + snooze_count + time_penalty + fail_penalty

    # Add a tiny bit of random noise (10% chance to shift by 1) 
    # This forces the ML model to generalize rather than perfectly memorizing our formula
    noise = np.random.choice([-1, 0, 1], num_samples, p=[0.05, 0.90, 0.05])
    target_difficulty += noise

    # Clamp the final target strictly between Level 1 and Level 5
    target_difficulty = np.clip(np.round(target_difficulty), 1, 5).astype(int)

    # 3. Compile the DataFrame
    df = pd.DataFrame({
        'habit_score': np.round(habit_score, 2),
        'snooze_count': snooze_count,
        'avg_time_to_solve': np.round(avg_time_to_solve, 2),
        'failed_attempts': failed_attempts,
        'target_difficulty': target_difficulty
    })

    # 4. Save to CSV
    os.makedirs('data', exist_ok=True)
    file_path = 'data/synthetic_cognitive_data.csv'
    df.to_csv(file_path, index=False)
    
    print(f"✅ Success! Data saved to {file_path}")
    print("\nSample Data:")
    print(df.head())

if __name__ == "__main__":
    generate_dataset()