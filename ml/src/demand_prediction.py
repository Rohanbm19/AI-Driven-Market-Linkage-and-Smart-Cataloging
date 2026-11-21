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
    build_column_transformer,
    clean_dataframe,
    make_train_test_split,
    read_csv_file,
    save_processed_split,
    split_features_and_target,
)
from evaluation import regression_metrics

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
    frame = clean_dataframe(read_csv_file(csv_path))
    if "is_festival_period" not in frame.columns:
        frame["is_festival_period"] = (
            frame.get("festival_name", pd.Series(["None"] * len(frame))).fillna("None") != "None"
        ).astype(int)
    return frame


def train_demand_model(csv_path: Path, model_path: Path = DEMAND_MODEL_PATH) -> dict:
    frame = load_demand_table(csv_path)
    features, target = split_features_and_target(frame, FEATURE_COLUMNS, TARGET_COLUMN)
    x_train, x_test, y_train, y_test = make_train_test_split(features, target)
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

    bundle = {
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "low_cut": float(low_cut),
        "high_cut": float(high_cut),
        "data_note": "Trained on sample/synthetic artisan demand rows unless you pass another CSV.",
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)

    return {
        "model_path": str(model_path),
        "train_metrics": regression_metrics(y_train, train_pred),
        "test_metrics": regression_metrics(y_test, test_pred),
        "demand_cuts": {"low_max": float(low_cut), "medium_max": float(high_cut)},
        "y_test": y_test,
        "y_pred_test": test_pred,
    }


def load_demand_bundle(model_path: Path = DEMAND_MODEL_PATH) -> dict:
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Demand model not found. Train first: {model_path}")
    return joblib.load(model_path)


def predict_demand(input_row: dict, model_path: Path = DEMAND_MODEL_PATH) -> dict:
    bundle = load_demand_bundle(model_path)
    row = pd.DataFrame([input_row])
    missing = [column for column in bundle["feature_columns"] if column not in row.columns]
    if missing:
        raise ValueError(f"Missing demand features: {missing}")
    predicted = float(bundle["pipeline"].predict(row[bundle["feature_columns"]])[0])
    predicted = max(0.0, predicted)
    label = classify_demand(predicted, bundle["low_cut"], bundle["high_cut"])
    return {
        "predicted_sales_quantity": round(predicted, 2),
        "demand_class": label,
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
