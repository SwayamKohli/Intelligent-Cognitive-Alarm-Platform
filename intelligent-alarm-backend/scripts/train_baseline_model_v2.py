import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

print("Initializing V2 Baseline Model Training Pipeline...")

csv_path = "data/synthetic_v2_logs.csv"
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Missing source dataset at {csv_path}")

df = pd.read_csv(csv_path)

# Encoders for categorical string columns
feature_encoder = LabelEncoder()
target_encoder = LabelEncoder()

df['last_failed_type'] = feature_encoder.fit_transform(df['last_failed_type'].astype(str))
df['target_challenge_type'] = target_encoder.fit_transform(df['target_challenge_type'].astype(str))

# Define Features (X) and Multi-Outputs (y)
X = df[['snooze_count', 'historical_success_rate', 'avg_time_taken_ms', 'last_failed_type']]
y = df[['target_challenge_type', 'target_difficulty', 'target_multi_step']]

# FIX: Corrected parameter name to test_size
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Multi-output Random Forest architecture
forest = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
model = MultiOutputClassifier(forest, n_jobs=-1)

print("Fitting Multi-Output Random Forest on training matrix...")
model.fit(X_train, y_train)

# Evaluate performance across each independent target vector
y_pred = model.predict(X_test)
y_test_np = y_test.values

print("\nModel Evaluation Metrics:")
targets = ['Challenge Type', 'Difficulty Level', 'Multi-Step Streak']
for i, name in enumerate(targets):
    acc = accuracy_score(y_test_np[:, i], y_pred[:, i])
    print(f"  - {name} Prediction Accuracy: {acc * 100:.2f}%")

# Package model and encoders into a unified artifact dictionary for production deployment
model_artifact = {
    "model": model,
    "feature_encoder": feature_encoder,
    "target_encoder": target_encoder
}

os.makedirs("models", exist_ok=True)
artifact_path = "models/adaptive_model_v2.pkl"
joblib.dump(model_artifact, artifact_path)

print(f"\nV2 ML Pipeline complete. Exported binary artifact cleanly.")
print(f"Target Destination: {artifact_path}")