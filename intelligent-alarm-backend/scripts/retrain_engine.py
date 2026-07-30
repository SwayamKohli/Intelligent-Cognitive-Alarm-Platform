import asyncio
import os
import logging
import pandas as pd
import joblib
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.preprocessing import LabelEncoder
from dotenv import load_dotenv

# Configure production-grade logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables, forcing it to override any cached terminal sessions
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'), override=True)

MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("CRITICAL: MONGO_URL environment variable is not set.")

async def run_retraining_loop():
    logger.info("Initiating V2 Nightly ML Retraining Engine...")
    
    try:
        # 1. Database Connection
        client = AsyncIOMotorClient(MONGO_URL)
        db = client["cognitive_alarm_logs"]
        collection = db["challenge_logs"]
        
        # 2. Ingest Recent Telemetry
        cursor = collection.find({})
        logs = await cursor.to_list(length=5000)
        
        if not logs:
            logger.info("No new challenge logs found. Retraining skipped.")
            return

        logger.info(f"Ingested {len(logs)} new interaction logs from MongoDB.")
        
        # 3. Format Data for V2
        df = pd.DataFrame(logs)
        
        # Feature Engineering: Simulating the aggregation of raw logs into user-level stats
        # In a full production system, this would be a complex groupby operation.
        # We ensure the dataframe has the V2 expected columns:
        required_cols = [
            'snooze_count', 'historical_success_rate', 'avg_time_taken_ms', 
            'last_failed_type', 'target_challenge_type', 'target_difficulty', 'target_multi_step'
        ]
        
        # Inject fallback data if columns are missing from fresh Mongo logs
        for col in required_cols:
            if col not in df.columns:
                df[col] = 0 if 'type' not in col else 'unknown'
                
        # 4. Preprocessing Categorical Data
        logger.info("Encoding categorical variables...")
        le_failed_type = LabelEncoder()
        le_target_type = LabelEncoder()
        
        df['last_failed_type_encoded'] = le_failed_type.fit_transform(df['last_failed_type'].astype(str))
        df['target_challenge_type_encoded'] = le_target_type.fit_transform(df['target_challenge_type'].astype(str))
        
        # 5. Execute V2 Retraining (Multi-Output)
        logger.info("Fitting MultiOutput RandomForestClassifier to updated dataset...")
        
        X = df[['snooze_count', 'historical_success_rate', 'avg_time_taken_ms', 'last_failed_type_encoded']]
        y = df[['target_challenge_type_encoded', 'target_difficulty', 'target_multi_step']]
        
        base_rf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
        multi_target_model = MultiOutputClassifier(base_rf, n_jobs=-1)
        
        multi_target_model.fit(X, y)
        
        # 6. Save Updated Model & Encoders
        model_path = os.path.join(os.path.dirname(__file__), '../models/adaptive_ml_model.pkl')
        encoder_path_1 = os.path.join(os.path.dirname(__file__), '../models/le_failed_type.pkl')
        encoder_path_2 = os.path.join(os.path.dirname(__file__), '../models/le_target_type.pkl')
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        joblib.dump(multi_target_model, model_path)
        joblib.dump(le_failed_type, encoder_path_1)
        joblib.dump(le_target_type, encoder_path_2)
        
        logger.info(f"V2 ML Engine successfully updated and persisted to {model_path}.")
        
    except Exception as e:
        logger.error(f"Retraining loop failed: {str(e)}", exc_info=True)
        raise

if __name__ == "__main__":
    asyncio.run(run_retraining_loop())