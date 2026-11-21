"""
Customer segmentation with K-Means clustering.

Clusters are behaviour groups on this dataset, not named market personas
from a live CRM.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import N_CLUSTERS, PRODUCT_CATEGORIES, RANDOM_STATE, SEGMENT_MODEL_PATH

from data_preprocessing import (
    clean_dataframe,
    make_train_test_split,
    read_csv_file,
)
from evaluation import clustering_metrics
from model_metadata import model_metadata, validate_model_metadata, write_model_metadata

BASE_FEATURES = [
    "total_purchases",
    "average_order_value",
    "purchase_frequency",
    "unique_categories_count",
]


def expand_category_flags(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    purchased = result.get("categories_purchased", pd.Series([""] * len(result))).fillna("")
    for category in PRODUCT_CATEGORIES:
        column = f"bought_{category.lower().replace(' ', '_')}"
        result[column] = purchased.str.contains(category, regex=False).astype(int)
    if "unique_categories_count" not in result.columns:
        flag_columns = [column for column in result.columns if column.startswith("bought_")]
        result["unique_categories_count"] = result[flag_columns].sum(axis=1)
    return result


def feature_columns(frame: pd.DataFrame) -> list[str]:
    flags = [column for column in frame.columns if column.startswith("bought_")]
    return BASE_FEATURES + flags


def describe_cluster(cluster_rows: pd.DataFrame) -> dict:
    purchases = cluster_rows["total_purchases"].mean()
    aov = cluster_rows["average_order_value"].mean()
    frequency = cluster_rows["purchase_frequency"].mean()
    if frequency >= 10 and aov < 1500:
        insight = "Shops often and prefers lower-priced handmade pieces."
    elif aov >= 3000:
        insight = "Buys less often but spends more per order (premium / gift buyer)."
    elif purchases >= 15:
        insight = "Repeat buyer with a mixed basket of crafts."
    else:
        insight = "Infrequent buyer; may need reminders around festivals."
    top_flags = [
        column.replace("bought_", "").replace("_", " ").title()
        for column in cluster_rows.columns
        if column.startswith("bought_") and cluster_rows[column].mean() >= 0.45
    ]
    return {
        "n_customers": int(len(cluster_rows)),
        "avg_total_purchases": round(float(purchases), 2),
        "avg_order_value": round(float(aov), 2),
        "avg_purchase_frequency": round(float(frequency), 2),
        "common_categories": top_flags or ["mixed"],
        "behaviour_insight": insight,
    }


def load_customer_table(csv_path: Path) -> pd.DataFrame:
    return expand_category_flags(clean_dataframe(read_csv_file(csv_path)))


def train_segmentation_model(csv_path: Path, model_path: Path = SEGMENT_MODEL_PATH) -> dict:
    frame = load_customer_table(csv_path)
    columns = feature_columns(frame)
    features = frame[columns].apply(pd.to_numeric, errors="coerce").fillna(0)
    dummy_target = pd.Series(np.zeros(len(features)), index=features.index)
    x_train, x_test, _, _ = make_train_test_split(features, dummy_target)

    pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            (
                "kmeans",
                KMeans(n_clusters=N_CLUSTERS, random_state=RANDOM_STATE, n_init=10),
            ),
        ]
    )
    pipeline.fit(x_train)
    train_labels = pipeline.predict(x_train)
    test_labels = pipeline.predict(x_test)
    all_labels = pipeline.predict(features)

    labelled = frame.copy()
    labelled["cluster"] = all_labels
    cluster_profiles = {}
    for cluster_id in sorted(labelled["cluster"].unique()):
        cluster_profiles[str(int(cluster_id))] = describe_cluster(
            labelled[labelled["cluster"] == cluster_id]
        )

    scaled_train = pipeline.named_steps["scaler"].transform(x_train)
    scaled_test = pipeline.named_steps["scaler"].transform(x_test)

    bundle = {
        "pipeline": pipeline,
        "feature_columns": columns,
        "cluster_profiles": cluster_profiles,
        "n_clusters": N_CLUSTERS,
        "dataset_type": "synthetic",
        "data_note": "K-Means groups on sample customer behaviour only.",
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)
    train_metrics = clustering_metrics(scaled_train, train_labels)
    test_metrics = clustering_metrics(scaled_test, test_labels)
    metadata = model_metadata(
        model_version="segmentation-v2",
        dataset_type="synthetic",
        training_date_range=None,
        feature_names=columns,
        evaluation_metrics={"train": train_metrics, "test": test_metrics},
        preprocessing_logic="standard scaling; K-Means; synthetic customer behaviour only",
    )
    write_model_metadata(model_path, metadata)

    processed_dir = ML_ROOT / "datasets" / "processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    labelled.to_csv(processed_dir / "customers_with_clusters.csv", index=False)

    return {
        "model_path": str(model_path),
        "train_metrics": clustering_metrics(scaled_train, train_labels),
        "test_metrics": clustering_metrics(scaled_test, test_labels),
        "cluster_profiles": cluster_profiles,
        "features": features,
        "labels": all_labels,
    }


def load_segment_bundle(model_path: Path = SEGMENT_MODEL_PATH) -> dict:
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Segmentation model not found. Train first: {model_path}")
    bundle = joblib.load(model_path)
    metadata_path = Path(model_path).with_suffix(Path(model_path).suffix + ".metadata.json")
    if not metadata_path.exists():
        raise ValueError("Saved segmentation model has no metadata. Retrain it with the current ML module.")
    import json
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    validate_model_metadata(Path(model_path), metadata)
    if bundle.get("feature_columns") != metadata["feature_names"]:
        raise ValueError("Saved segmentation model features are incompatible. Retrain it.")
    bundle["metadata"] = metadata
    return bundle


def predict_customer_segment(input_row: dict, model_path: Path = SEGMENT_MODEL_PATH) -> dict:
    bundle = load_segment_bundle(model_path)
    row = expand_category_flags(pd.DataFrame([input_row]))
    for column in bundle["feature_columns"]:
        if column not in row.columns:
            row[column] = 0
    cluster = int(bundle["pipeline"].predict(row[bundle["feature_columns"]])[0])
    profile = bundle["cluster_profiles"].get(str(cluster), {})
    return {
        "prediction_status": "exploratory",
        "dataset_type": "synthetic",
        "synthetic_model": True,
        "cluster": cluster,
        "segment_profile": profile,
        "disclaimer": (
            "Cluster IDs are labels from K-Means on the training sample. "
            "They are not official customer types from the live KalaSetu app."
        ),
    }
