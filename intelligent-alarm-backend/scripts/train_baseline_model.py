import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

def train_model():
    print("Loading synthetic data...")
    data_path = 'data/synthetic_cognitive_data.csv'
    
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Run generate_synthetic_data.py first.")
        return

    df = pd.read_csv(data_path)

    # Define Features (X) and Target (y)
    X = df[['habit_score', 'snooze_count', 'avg_time_to_solve', 'failed_attempts']]
    y = df['target_difficulty']

    # Split into 80% training and 20% testing
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate the model
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

    # Save the model
    os.makedirs('models', exist_ok=True)
    model_path = 'models/adaptive_model_v1.pkl'
    joblib.dump(model, model_path)
    print(f"\n✅ Model successfully saved to {model_path}")

if __name__ == "__main__":
    train_model()