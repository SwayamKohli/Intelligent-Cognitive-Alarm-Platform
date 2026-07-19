def calculate_habit_score(consistency: float, challenge_rate: float, snooze_reduction: float, sleep_adherence: float) -> float:
    """
    Calculates the user's overall habit score.
    All inputs should be normalized percentages (0.0 to 100.0).
    
    PDF Weighted Formula:
    Score = (0.35 * Consistency) + (0.25 * ChallengeRate) + (0.20 * SnoozeReduction) + (0.20 * SleepAdherence)
    """
    score = (0.35 * consistency) + (0.25 * challenge_rate) + (0.20 * snooze_reduction) + (0.20 * sleep_adherence)
    
    return round(max(0.0, min(100.0, score)), 2)