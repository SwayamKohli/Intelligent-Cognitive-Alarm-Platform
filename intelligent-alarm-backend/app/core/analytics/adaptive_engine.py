from app.models.user import DifficultyLevel

def calculate_new_difficulty(current_difficulty: DifficultyLevel, last_5_attempts: list[bool]) -> DifficultyLevel:
    """
    Evaluates the last 5 challenge attempts (True for success, False for timeout/failure).
    Rule: +1 level if 5 consecutive successes. -1 level if 3 consecutive failures.
    """
    levels = [
        DifficultyLevel.BEGINNER, 
        DifficultyLevel.EASY, 
        DifficultyLevel.MEDIUM, 
        DifficultyLevel.HARD, 
        DifficultyLevel.EXPERT
    ]
    
    if current_difficulty not in levels:
        return current_difficulty

    current_index = levels.index(current_difficulty)

    if len(last_5_attempts) == 5 and all(last_5_attempts):
        new_index = min(current_index + 1, len(levels) - 1)
        return levels[new_index]

    if len(last_5_attempts) >= 3 and not any(last_5_attempts[-3:]):
        new_index = max(current_index - 1, 0)
        return levels[new_index]

    return current_difficulty