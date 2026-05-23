import os
from datetime import timedelta
from feast.value_type import ValueType
from feast import (
    Entity,
    FeatureView,
    Field,
    FileSource,
)
from feast.types import Int64, String

# Resolve absolute path to processed Parquet file
parquet_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../data/processed/user_features.parquet")
)

# 1. Define Entity
session_id = Entity(
    name="session_id",
    value_type=ValueType.STRING,
    description="Unique session identifier for the visitor"
)

# 2. Define File Data Source
user_features_source = FileSource(
    name="user_features_source",
    path=parquet_path,
    timestamp_field="timestamp",
    created_timestamp_column="created_timestamp",
)

# 3. Define Feature View
session_features_fv = FeatureView(
    name="session_features",
    entities=[session_id],
    ttl=timedelta(days=7),
    schema=[
        Field(name="engagement_score", dtype=Int64),
        Field(name="last_viewed_category", dtype=String),
        Field(name="chat_count", dtype=Int64),
    ],
    online=True,
    source=user_features_source,
)
