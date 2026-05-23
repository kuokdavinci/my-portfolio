import os
from feast import FeatureStore

def test_retrieve():
    """Queries Feast Online Store (Redis) for session features to verify correct integration."""
    repo_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../feature_store")
    )
    print(f"Loading Feast feature store from: {repo_path}")
    
    try:
        store = FeatureStore(repo_path=repo_path)
        
        # Test session ID extracted from our sqlite verification step
        entity_rows = [
            {"session_id": "session_qfbgajc9aqlfq78qvz9zh"}
        ]
        
        features_to_fetch = [
            "session_features:engagement_score",
            "session_features:last_viewed_category",
            "session_features:chat_count"
        ]
        
        response = store.get_online_features(
            features=features_to_fetch,
            entity_rows=entity_rows
        ).to_dict()
        
        print("\n=== Feast Online Feature Retrieval Test ===")
        print(f"Session ID: {entity_rows[0]['session_id']}")
        print(f"Engagement Score: {response.get('engagement_score')}")
        print(f"Last Viewed Category: {response.get('last_viewed_category')}")
        print(f"Chat Count: {response.get('chat_count')}")
        print("===========================================")
    except Exception as e:
        print(f"Feast retrieval failed: {e}")

if __name__ == "__main__":
    test_retrieve()
