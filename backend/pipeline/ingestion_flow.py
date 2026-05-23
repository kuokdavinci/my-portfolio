import os
import json
import sqlite3
import pandas as pd
from datetime import datetime, timezone
from prefect import flow, task

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/tracking_events.db"))
PARQUET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/processed"))
PARQUET_PATH = os.path.join(PARQUET_DIR, "user_features.parquet")

@task(name="extract_raw_events")
def extract_raw_events() -> pd.DataFrame:
    """Extracts raw visitor activity logs from SQLite database."""
    if not os.path.exists(DB_PATH):
        print(f"SQLite database not found at {DB_PATH}. Returning empty DataFrame.")
        return pd.DataFrame()
    
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM tracking_events", conn)
        conn.close()
        print(f"Extracted {len(df)} raw events from SQLite.")
        return df
    except Exception as e:
        print(f"Error extracting raw events: {e}")
        return pd.DataFrame()

@task(name="transform_events_to_features")
def transform_events_to_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transforms raw logs into session-based engagement and category interest features."""
    if df.empty:
        empty_df = pd.DataFrame(columns=[
            "session_id", "engagement_score", "last_viewed_category", 
            "chat_count", "timestamp", "created_timestamp"
        ])
        empty_df = empty_df.astype({
            "session_id": str, "engagement_score": "int64", "last_viewed_category": str, 
            "chat_count": "int64"
        })
        return empty_df

    features = []
    grouped = df.groupby("session_id")
    
    for session_id, group in grouped:
        # 1. Chat queries count
        chat_queries = group[group["event_type"] == "chat_query"]
        chat_count = len(chat_queries)
        
        # 2. Compute engagement score based on weights
        score = 0
        for _, row in group.iterrows():
            etype = row["event_type"]
            payload = {}
            try:
                payload = json.loads(row["payload"])
            except:
                pass
            
            if etype == "page_view":
                score += 1
            elif etype == "scroll_depth":
                pct = payload.get("percent", 50)
                score += 5 if pct >= 90 else 2
            elif etype == "project_click":
                score += 10
            elif etype == "chat_query":
                score += 15
        
        # 3. Determine the last viewed/interacted category
        group_sorted = group.sort_values(by="timestamp", ascending=False)
        last_category = "General"
        
        for _, row in group_sorted.iterrows():
            payload = {}
            try:
                payload = json.loads(row["payload"])
            except:
                pass
            
            page = payload.get("page", "")
            proj = payload.get("project_id", "")
            
            if "movie-ticket" in page or "movie-ticket" in proj:
                last_category = "Full-stack & Mobile"
                break
            elif "attendance-app" in page or "attendance-app" in proj:
                last_category = "Mobile"
                break
            elif row["event_type"] == "chat_query":
                last_category = "AI/ML"
                break
        
        # 4. Extract latest event timestamp and set timezone to UTC for Feast
        latest_ts_str = group["timestamp"].max()
        try:
            latest_ts = pd.to_datetime(latest_ts_str, utc=True)
        except Exception:
            latest_ts = datetime.now(timezone.utc)
            
        features.append({
            "session_id": session_id,
            "engagement_score": score,
            "last_viewed_category": last_category,
            "chat_count": chat_count,
            "timestamp": latest_ts,
            "created_timestamp": datetime.now(timezone.utc)
        })
        
    features_df = pd.DataFrame(features)
    features_df = features_df.astype({
        "session_id": str,
        "engagement_score": "int64",
        "last_viewed_category": str,
        "chat_count": "int64"
    })
    
    print(f"Transformed features for {len(features_df)} unique sessions.")
    return features_df

@task(name="load_features_to_parquet")
def load_features_to_parquet(df: pd.DataFrame):
    """Saves features as a Parquet file for Feast ingestion."""
    os.makedirs(PARQUET_DIR, exist_ok=True)
    try:
        df.to_parquet(PARQUET_PATH, index=False)
        print(f"Features saved successfully to: {PARQUET_PATH}")
        print("Feature preview:")
        print(df.head())
    except Exception as e:
        print(f"Error saving to Parquet: {e}")

@flow(name="ingestion_flow", log_prints=True)
def run_ingestion_flow():
    raw_df = extract_raw_events()
    features_df = transform_events_to_features(raw_df)
    load_features_to_parquet(features_df)

if __name__ == "__main__":
    run_ingestion_flow()
