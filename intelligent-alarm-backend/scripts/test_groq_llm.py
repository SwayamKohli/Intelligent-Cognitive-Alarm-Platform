import sys
import os
import json

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.llm_generator import generate_ai_challenge

def run_llm_test():
    print("=" * 60)
    print("🤖 TESTING GROQ LLAMA 3 INTEGRATION")
    print("=" * 60)

    try:
        print("\n1. Testing Riddle Generator (Difficulty 2)...")
        riddle = generate_ai_challenge(challenge_type="riddle", difficulty=2)
        print(json.dumps(riddle, indent=2))

        print("\n2. Testing Word Scramble Generator (Difficulty 3)...")
        scramble = generate_ai_challenge(challenge_type="word_scramble", difficulty=3, avoid_topics=["apple", "house"])
        print(json.dumps(scramble, indent=2))

        print("\n✅ Groq API integration is working perfectly!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("Check your .env file and ensure GROQ_API_KEY is set correctly.")

if __name__ == "__main__":
    run_llm_test()