import random
import hashlib

def get_local_random(user_id: str | None, total_attempts: int) -> random.Random:
    """
    Returns a deterministic Random generator instance seeded with the hash of the
    user_id and total_attempts. If user_id is None, falls back to the default random module.
    """
    if user_id is None:
        return random
    
    seed_str = f"{user_id}_{total_attempts}"
    seed_hash = hashlib.sha256(seed_str.encode()).hexdigest()
    seed_int = int(seed_hash, 16)
    return random.Random(seed_int)

# --- Word Scramble Data ---
SCRAMBLE_WORDS = {
    1: ["dog", "cat", "sun", "star", "tree", "fish", "ball", "book", "ship", "frog"],
    2: ["house", "clock", "water", "apple", "bread", "train", "plant", "smile", "paper", "glass"],
    3: ["garden", "planet", "pencil", "window", "orange", "flight", "guitar", "puzzle", "forest", "animal"],
    4: ["keyboard", "mountain", "computer", "hospital", "elephant", "dinosaur", "umbrella", "sandwich", "backpack", "triangle"],
    5: ["javascript", "complexity", "restaurant", "astronomy", "scientific", "government", "background", "motivation", "experience", "technology"]
}

def generate_word_scramble(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """
    Selects a word based on difficulty and shuffles its letters to form a word scramble.
    """
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    
    words = SCRAMBLE_WORDS.get(difficulty, SCRAMBLE_WORDS[1])
    original_word = r.choice(words)
    
    # Scramble the word using the seeded random generator
    word_chars = list(original_word)
    for _ in range(10):
        r.shuffle(word_chars)
        scrambled_word = "".join(word_chars)
        if scrambled_word != original_word:
            break
    else:
        scrambled_word = "".join(word_chars)
        
    return {
        "client_payload": {
            "challenge_type": "word_scramble",
            "difficulty": difficulty,
            "content": {
                "prompt": "Unscramble this word:",
                "scrambled_word": scrambled_word
            }
        },
        "server_answer": original_word
    }

# --- Riddle Data ---
RIDDLES = {
    1: [
        {"question": "The more of them you take, the more you leave behind. What are they?", "answer": "footsteps"},
        {"question": "What has hands but cannot clap?", "answer": "clock"},
        {"question": "What has to be broken before you can use it?", "answer": "egg"}
    ],
    2: [
        {"question": "I have keys but no locks. I have space but no room. You can enter but can't go outside. What am I?", "answer": "keyboard"},
        {"question": "What is full of holes but still holds water?", "answer": "sponge"},
        {"question": "What belongs to you, but other people use it more than you do?", "answer": "name"}
    ],
    3: [
        {"question": "I am light as a feather, yet the strongest person cannot hold me for five minutes. What am I?", "answer": "breath"},
        {"question": "If you drop me I'm sure to crack, but give me a smile and I'll smile back. What am I?", "answer": "mirror"},
        {"question": "What has a head and a tail but no body?", "answer": "coin"}
    ],
    4: [
        {"question": "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", "answer": "map"},
        {"question": "What can travel around the world while staying in a corner?", "answer": "stamp"},
        {"question": "The person who makes it has no need of it; the person who buys it has no use for it. What is it?", "answer": "coffin"}
    ],
    5: [
        {"question": "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", "answer": "echo"},
        {"question": "You see a boat filled with people. It has not sunk, but when you look again you don't see a single person on the boat. Why?", "answer": "married"},
        {"question": "What is always in front of you but can't be seen?", "answer": "future"}
    ]
}

def generate_riddle(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """
    Selects a riddle based on difficulty level.
    """
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    
    riddle_list = RIDDLES.get(difficulty, RIDDLES[1])
    riddle = r.choice(riddle_list)
    
    return {
        "client_payload": {
            "challenge_type": "riddle",
            "difficulty": difficulty,
            "content": {
                "prompt": riddle["question"]
            }
        },
        "server_answer": riddle["answer"]
    }

# --- Quiz Data ---
QUIZZES = {
    1: [
        {"question": "Which planet is known as the Red Planet?", "options": ["Mars", "Venus", "Jupiter", "Saturn"], "answer": "Mars"},
        {"question": "How many colors are there in a rainbow?", "options": ["7", "6", "8", "5"], "answer": "7"},
        {"question": "What is the capital of France?", "options": ["Paris", "London", "Berlin", "Rome"], "answer": "Paris"}
    ],
    2: [
        {"question": "Which is the largest ocean on Earth?", "options": ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], "answer": "Pacific Ocean"},
        {"question": "What is the chemical symbol for water?", "options": ["H2O", "CO2", "O2", "NaCl"], "answer": "H2O"},
        {"question": "Who wrote 'Romeo and Juliet'?", "options": ["William Shakespeare", "Charles Dickens", "Mark Twain", "Jane Austen"], "answer": "William Shakespeare"}
    ],
    3: [
        {"question": "What is the hardest natural substance on Earth?", "options": ["Diamond", "Gold", "Iron", "Granite"], "answer": "Diamond"},
        {"question": "Which country is home to the kangaroo?", "options": ["Australia", "South Africa", "New Zealand", "Kenya"], "answer": "Australia"},
        {"question": "How many bones are there in an adult human body?", "options": ["206", "205", "210", "300"], "answer": "206"}
    ],
    4: [
        {"question": "What is the speed of light in a vacuum (approximate)?", "options": ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], "answer": "300,000 km/s"},
        {"question": "Which element has the atomic number 1?", "options": ["Hydrogen", "Helium", "Lithium", "Oxygen"], "answer": "Hydrogen"},
        {"question": "What is the capital city of Australia?", "options": ["Canberra", "Sydney", "Melbourne", "Brisbane"], "answer": "Canberra"}
    ],
    5: [
        {"question": "Who is credited with proposing the theory of General Relativity?", "options": ["Albert Einstein", "Isaac Newton", "Niels Bohr", "Stephen Hawking"], "answer": "Albert Einstein"},
        {"question": "What is the chemical formula for table salt?", "options": ["NaCl", "KCl", "HCl", "NaOH"], "answer": "NaCl"},
        {"question": "Which gas is most abundant in the Earth's atmosphere?", "options": ["Nitrogen", "Oxygen", "Carbon Dioxide", "Argon"], "answer": "Nitrogen"}
    ]
}

def generate_quiz(difficulty: int, user_id: str | None = None, total_attempts: int = 0) -> dict:
    """
    Selects a quiz question based on difficulty, and shuffles the options.
    """
    difficulty = max(1, min(5, difficulty))
    r = get_local_random(user_id, total_attempts)
    
    quiz_list = QUIZZES.get(difficulty, QUIZZES[1])
    quiz = r.choice(quiz_list)
    
    options = list(quiz["options"])
    r.shuffle(options)
    
    return {
        "client_payload": {
            "challenge_type": "quiz",
            "difficulty": difficulty,
            "content": {
                "prompt": quiz["question"],
                "options": options
            }
        },
        "server_answer": quiz["answer"]
    }
