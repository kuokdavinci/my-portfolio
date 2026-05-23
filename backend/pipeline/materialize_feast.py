import os
from datetime import datetime, timezone
from feast import FeatureStore

def materialize():
    """Materializes historical features from the offline store (Parquet) into the online store (Redis)."""
    repo_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../feature_store")
    )
    print(f"Loading Feast feature store from: {repo_path}")
    
    try:
        store = FeatureStore(repo_path=repo_path)
        
        # Use timezone-aware UTC datetime objects to prevent materialization date parsing errors
        start_date = datetime(2026, 1, 1, tzinfo=timezone.utc)
        end_date = datetime.now(timezone.utc)
        
        print(f"Materializing features from {start_date} to {end_date}...")
        store.materialize(start_date, end_date)
        print("Features materialized successfully to Redis online store.")
    except Exception as e:
        print(f"Feast materialization failed: {e}")

if __name__ == "__main__":
    materialize()
