import os
import joblib
import pandas as pd

# Load the model artifact (which now contains the model + encoders)
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../models/adaptive_model_v2.pkl')

try:
    model_artifact = joblib.load(MODEL_PATH)
    model = model_artifact["model"]
    feature_encoder = model_artifact["feature_encoder"]
    target_encoder = model_artifact["target_encoder"]
except Exception as e:
    model = None
    feature_encoder = None
    target_encoder = None
    print(f"Warning: V2 ML model artifact not found or invalid. Using fallback logic. ({e})")

def predict_next_challenge(
    snooze_count: int, 
    historical_success_rate: float = 0.75, 
    avg_time_taken_ms: int = 5000, 
    last_failed_type: str = "none"
) -> dict:
    """
    Ingests multi-dimensional user telemetry and uses the V2 Multi-Output Scikit-learn model
    to predict the optimal challenge type, difficulty, and multi-step streak.
    """
    if model is None:
        # Intelligent fallback if the model file is missing during deployment
        return {
            "challenge_type": "math",
            "difficulty": min(5, 1 + snooze_count),
            "target_streak": min(3, max(1, snooze_count))
        }

    # Safely encode the categorical feature (handle unseen labels gracefully)
    try:
        encoded_last_failed = feature_encoder.transform([last_failed_type])[0]
    except ValueError:
        # If a completely new string somehow gets passed, default to 'none'
        encoded_last_failed = feature_encoder.transform(["none"])[0]

    # Format the input exactly as the V2 model was trained
    input_features = pd.DataFrame(
        [[snooze_count, historical_success_rate, avg_time_taken_ms, encoded_last_failed]], 
        columns=['snooze_count', 'historical_success_rate', 'avg_time_taken_ms', 'last_failed_type']
    )
    
    # Predict returns a 2D array [[type_encoded, difficulty, streak]], so grab the first row
    predictions = model.predict(input_features)[0]
    
    # Decode the predicted challenge type back into a readable string
    predicted_type_str = target_encoder.inverse_transform([int(predictions[0])])[0]
    
    return {
        "challenge_type": predicted_type_str,
        "difficulty": int(predictions[1]),
        "target_streak": int(predictions[2])
    }