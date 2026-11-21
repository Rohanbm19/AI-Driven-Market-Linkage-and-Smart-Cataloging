"""
Product demand prediction with a Random Forest regressor.

Features use lagged (historical) units, not the same-period sales target,
so current demand is not leaked into the model.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import DEMAND_CLASS_LABELS, DEMAND_MODEL_PATH, N_ESTIMATORS, RANDOM_STATE

from data_preprocessing import (
    aggregate_completed_sales_to_demand,
    build_column_transformer,
    clean_dataframe,
    chronological_split,
    read_csv_file,
    save_processed_split,
    split_features_and_target,
)
from evaluation import regression_metrics
from model_metadata import model_metadata, validate_model_metadata, write_model_metadata

NUMERIC_FEATURES = [
    "historical_units_sold",
    "product_views",
    "buyer_enquiries",
    "month",
    "is_festival_period",
]
CATEGORICAL_FEATURES = ["product_category", "location", "season", "festival_name"]
TARGET_COLUMN = "units_sold"
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def classify_demand(predicted_quantity: float, low_cut: float, high_cut: float) -> str:
    if predicted_quantity < low_cut:
        return DEMAND_CLASS_LABELS[0]
    if predicted_quantity < high_cut:
        return DEMAND_CLASS_LABELS[1]
    return DEMAND_CLASS_LABELS[2]


def load_demand_table(csv_path: Path) -> pd.DataFrame:
    if Path(csv_path).name == "sales_history.csv":
        frame, _ = aggregate_completed_sales_to_demand(Path(csv_path))
    else:
        frame = clean_dataframe(read_csv_file(csv_path))
    if "observation_date" not in frame.columns:
        # Synthetic CSV rows receive clearly-labelled development dates only.
        if "month" not in frame.columns:
            frame["month"] = 1
        row_number = np.arange(len(frame))
        synthetic_month = row_number // 20
        frame["observation_date"] = pd.Timestamp("2022-01-01") + pd.to_timedelta(
            synthetic_month * 30, unit="D"
        )
    else:
        frame["observation_date"] = pd.to_datetime(frame["observation_date"], errors="coerce")
    if "is_festival_period" not in frame.columns:
        frame["is_festival_period"] = (
            frame.get("festival_name", pd.Series(["None"] * len(frame))).fillna("None") != "None"
        ).astype(int)
    if "data_source" not in frame.columns:
        frame["data_source"] = "synthetic_sample"
    return frame


def train_demand_model(csv_path: Path, model_path: Path = DEMAND_MODEL_PATH) -> dict:
    frame = load_demand_table(csv_path)
    frame = frame.sort_values("observation_date").reset_index(drop=True)
    train_frame, test_frame = chronological_split(frame, "observation_date")

    dataset_type = (
        "real"
        if str(frame["data_source"].dropna().iloc[0]) == "real_completed_sales"
        else "synthetic"
    )
    features, target = split_features_and_target(frame, FEATURE_COLUMNS, TARGET_COLUMN)
    train_features = train_frame.loc[:, FEATURE_COLUMNS]
    test_features = test_frame.loc[:, FEATURE_COLUMNS]
    y_train = train_frame[TARGET_COLUMN]
    y_test = test_frame[TARGET_COLUMN]
    x_train, x_test = train_features, test_features
    save_processed_split("demand", x_train, x_test, y_train, y_test)

    preprocessor = build_column_transformer(NUMERIC_FEATURES, CATEGORICAL_FEATURES)
    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        min_samples_leaf=2,
        n_jobs=-1,
    )
    pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", model)])
    pipeline.fit(x_train, y_train)

    train_pred = pipeline.predict(x_train)
    test_pred = pipeline.predict(x_test)
    # Classification cuts come from training predictions only.
    low_cut, high_cut = np.quantile(train_pred, [0.33, 0.66])

    train_start = train_frame["observation_date"].min().date().isoformat()
    train_end = train_frame["observation_date"].max().date().isoformat()
    test_start = test_frame["observation_date"].min().date().isoformat()
    test_end = test_frame["observation_date"].max().date().isoformat()
    train_metrics = regression_metrics(y_train, train_pred)
    test_metrics = regression_metrics(y_test, test_pred)

    category_counts = (
        train_frame["product_category"].value_counts().to_dict()
        if "product_category" in train_frame
        else {}
    )
    reliable = dataset_type == "real" and len(train_frame) >= 20 and len(test_frame) >= 5
    metadata = model_metadata(
        model_version="demand-v2",
        dataset_type=dataset_type,
        training_date_range={
            "training_start": train_start,
            "training_end": train_end,
            "testing_start": test_start,
            "testing_end": test_end,
        },
        feature_names=FEATURE_COLUMNS,
        evaluation_metrics={"train": train_metrics, "test": test_metrics},
        preprocessing_logic="median/nmost-frequent imputation; one-hot categorical encoding; chronological split",
    )

    bundle = {
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "low_cut": float(low_cut),
        "high_cut": float(high_cut),
        "dataset_type": dataset_type,
        "category_counts": {str(k): int(v) for k, v in category_counts.items()},
        "minimum_category_observations": 5,
        "reliable_for_live_use": reliable,
        "training_date_range": metadata["training_date_range"],
        "metadata": metadata,
        "data_note": (
            "Synthetic development model; exploratory only."
            if dataset_type == "synthetic"
            else "Trained on completed sales from sales_history.csv."
        ),
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)
    write_model_metadata(model_path, metadata)

    return {
        "model_path": str(model_path),
        "dataset_type": dataset_type,
        "train_metrics": train_metrics,
        "test_metrics": test_metrics,
        "demand_cuts": {"low_max": float(low_cut), "medium_max": float(high_cut)},
        "training_date_range": metadata["training_date_range"],
        "reliable_for_live_use": reliable,
        "metadata_path": str(model_path.with_suffix(model_path.suffix + ".metadata.json")),
        "y_test": y_test,
        "y_pred_test": test_pred,
    }


def load_demand_bundle(model_path: Path = DEMAND_MODEL_PATH) -> dict:
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Demand model not found. Train first: {model_path}")
    bundle = joblib.load(model_path)
    metadata_path = Path(model_path).with_suffix(Path(model_path).suffix + ".metadata.json")
    if not metadata_path.exists():
        raise ValueError(
            "Saved demand model has no metadata. Retrain it with the current ML module."
        )
    import json
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    validate_model_metadata(Path(model_path), metadata)
    if bundle.get("feature_columns") != metadata["feature_names"]:
        raise ValueError("Saved demand model preprocessing/features are incompatible. Retrain it.")
    bundle["metadata"] = metadata
    return bundle


def predict_demand(input_row: dict, model_path: Path = DEMAND_MODEL_PATH) -> dict:
    bundle = load_demand_bundle(model_path)
    row = pd.DataFrame([input_row])
    missing = [column for column in bundle["feature_columns"] if column not in row.columns]
    if missing:
        raise ValueError(f"Missing demand features: {missing}")

    historical_value = row["historical_units_sold"].iloc[0]
    historical_missing = (
        pd.isna(historical_value)
        or str(historical_value).strip().lower() in {"", "none", "nan", "null"}
        or float(historical_value) <= 0
    )
    if historical_missing:
        return {
            "prediction_status": "insufficient_data",
            "warning": (
                "Historical completed-sales units are unavailable. "
                "Live views and enquiries were observed, but no demand estimate is returned."
            ),
            "observed_inputs": {
                "product_views": input_row.get("product_views"),
                "buyer_enquiries": input_row.get("buyer_enquiries"),
                "historical_units_sold": None,
            },
            "dataset_type": bundle["dataset_type"],
            "synthetic_model": bundle["dataset_type"] == "synthetic",
            "disclaimer": (
                "No estimate is shown because completed-sales history is unavailable."
            ),
        }

    category = str(input_row.get("product_category", "")).strip()
    category_count = int(bundle["category_counts"].get(category, 0))
    if category_count < bundle["minimum_category_observations"]:
        return {
            "prediction_status": "insufficient_category_data",
            "warning": (
                f"Category '{category}' has insufficient training observations "
                f"({category_count} found; {bundle['minimum_category_observations']} required)."
            ),
            "observed_inputs": {
                "product_category": category,
                "product_views": input_row.get("product_views"),
                "buyer_enquiries": input_row.get("buyer_enquiries"),
                "historical_units_sold": float(historical_value),
            },
            "dataset_type": bundle["dataset_type"],
            "synthetic_model": bundle["dataset_type"] == "synthetic",
            "disclaimer": "No estimate is shown for this category because the evidence is insufficient.",
        }

    if bundle["dataset_type"] == "synthetic" or not bundle["reliable_for_live_use"]:
        status = "exploratory"
        warning = (
            "This estimate is exploratory because the model is not trained on sufficient "
            "real completed-sales history."
        )
    else:
        status = "estimate"
        warning = None

    predicted = float(bundle["pipeline"].predict(row[bundle["feature_columns"]])[0])
    predicted = max(0.0, predicted)
    label = classify_demand(predicted, bundle["low_cut"], bundle["high_cut"])
    return {
        "prediction_status": status,
        "warning": warning,
        "predicted_sales_quantity": round(predicted, 2),
        "demand_class": label,
        "dataset_type": bundle["dataset_type"],
        "synthetic_model": bundle["dataset_type"] == "synthetic",
        "training_date_range": bundle["training_date_range"],
        "observed_inputs": {
            "historical_units_sold": float(historical_value),
            "product_views": input_row.get("product_views"),
            "buyer_enquiries": input_row.get("buyer_enquiries"),
        },
        "demand_class_rule": {
            "low_below": round(bundle["low_cut"], 2),
            "high_at_or_above": round(bundle["high_cut"], 2),
            "source": "terciles of training-set predictions",
        },
        "disclaimer": (
            "This is a model estimate from the trained sample, not a live "
            "marketplace forecast."
        ),
    }
