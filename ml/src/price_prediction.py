"""
Smart price recommendation with a Random Forest regressor.

The model estimate is kept separate from the cost-based minimum price.
A predicted rupee amount is not treated as a fair-trade market price.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import (
    MINIMUM_MARGIN_ON_COST,
    N_ESTIMATORS,
    PRICE_MODEL_PATH,
    RANDOM_STATE,
    TARGET_MARGIN_ON_COST,
)

from data_preprocessing import (
    build_column_transformer,
    clean_dataframe,
    make_train_test_split,
    read_csv_file,
    save_processed_split,
    split_features_and_target,
)
from evaluation import regression_metrics
from model_metadata import model_metadata, validate_model_metadata, write_model_metadata

NUMERIC_FEATURES = [
    "raw_material_cost",
    "labour_cost",
    "product_size_cm",
    "production_time_hours",
    "market_price",
]
CATEGORICAL_FEATURES = ["product_category", "product_size"]
TARGET_COLUMN = "selling_price"
FEATURE_COLUMNS = NUMERIC_FEATURES + CATEGORICAL_FEATURES

SIZE_TO_CM = {"Small": 12, "Medium": 28, "Large": 48}


def production_cost(raw_material_cost: float, labour_cost: float) -> float:
    return float(raw_material_cost) + float(labour_cost)


def cost_based_prices(raw_material_cost: float, labour_cost: float) -> dict:
    cost = production_cost(raw_material_cost, labour_cost)
    minimum_price = cost * (1 + MINIMUM_MARGIN_ON_COST)
    target_price = cost * (1 + TARGET_MARGIN_ON_COST)
    return {
        "estimated_production_cost": round(cost, 2),
        "cost_based_minimum_price": round(minimum_price, 2),
        "cost_based_target_price": round(target_price, 2),
        "minimum_margin_rule": f"{int(MINIMUM_MARGIN_ON_COST * 100)}% over production cost",
        "target_margin_rule": f"{int(TARGET_MARGIN_ON_COST * 100)}% over production cost",
    }


def _normalise_size(row: pd.Series) -> pd.Series:
    result = row.copy()
    size_label = str(result.get("product_size", "Medium")).title()
    if size_label not in SIZE_TO_CM:
        size_label = "Medium"
    result["product_size"] = size_label
    if pd.isna(result.get("product_size_cm")) or result.get("product_size_cm") in ("", None):
        result["product_size_cm"] = SIZE_TO_CM[size_label]
    return result


def load_price_table(csv_path: Path) -> pd.DataFrame:
    frame = clean_dataframe(read_csv_file(csv_path))
    frame = frame.apply(_normalise_size, axis=1)
    return frame


def train_price_model(csv_path: Path, model_path: Path = PRICE_MODEL_PATH) -> dict:
    frame = load_price_table(csv_path)
    features, target = split_features_and_target(frame, FEATURE_COLUMNS, TARGET_COLUMN)
    x_train, x_test, y_train, y_test = make_train_test_split(features, target)
    save_processed_split("price", x_train, x_test, y_train, y_test)

    preprocessor = build_column_transformer(NUMERIC_FEATURES, CATEGORICAL_FEATURES)
    model = RandomForestRegressor(
        n_estimators=N_ESTIMATORS,
        random_state=RANDOM_STATE,
        min_samples_leaf=2,
        n_jobs=-1,
    )
    pipeline = Pipeline(steps=[("preprocess", preprocessor), ("model", model)])
    pipeline.fit(x_train, y_train)
    train_metrics = regression_metrics(y_train, pipeline.predict(x_train))
    test_metrics = regression_metrics(y_test, pipeline.predict(x_test))
    metadata = model_metadata(
        model_version="price-v2",
        dataset_type="synthetic",
        training_date_range=None,
        feature_names=FEATURE_COLUMNS,
        evaluation_metrics={"train": train_metrics, "test": test_metrics},
        preprocessing_logic="median/nmost-frequent imputation; one-hot categorical encoding",
    )

    bundle = {
        "pipeline": pipeline,
        "feature_columns": FEATURE_COLUMNS,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_column": TARGET_COLUMN,
        "dataset_type": "synthetic",
        "metadata": metadata,
        "data_note": "Trained on sample/synthetic artisan pricing rows unless you pass another CSV.",
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)
    write_model_metadata(model_path, metadata)

    return {
        "model_path": str(model_path),
        "train_metrics": train_metrics,
        "test_metrics": test_metrics,
        "y_test": y_test,
        "y_pred_test": pipeline.predict(x_test),
    }


def load_price_bundle(model_path: Path = PRICE_MODEL_PATH) -> dict:
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Price model not found. Train first: {model_path}")
    bundle = joblib.load(model_path)
    metadata_path = Path(model_path).with_suffix(Path(model_path).suffix + ".metadata.json")
    if not metadata_path.exists():
        raise ValueError("Saved price model has no metadata. Retrain it with the current ML module.")
    import json
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    validate_model_metadata(Path(model_path), metadata)
    if bundle.get("feature_columns") != metadata["feature_names"]:
        raise ValueError("Saved price model preprocessing/features are incompatible. Retrain it.")
    bundle["metadata"] = metadata
    return bundle


def predict_price(input_row: dict, model_path: Path = PRICE_MODEL_PATH) -> dict:
    bundle = load_price_bundle(model_path)
    row = pd.DataFrame([input_row]).apply(_normalise_size, axis=1)
    if "market_price" not in row.columns:
        row["market_price"] = pd.NA
    missing = [column for column in bundle["feature_columns"] if column not in row.columns]
    if missing:
        raise ValueError(f"Missing price features: {missing}")

    material = float(row["raw_material_cost"].iloc[0])
    labour = float(row["labour_cost"].iloc[0])
    cost_block = cost_based_prices(material, labour)

    model_price = float(bundle["pipeline"].predict(row[bundle["feature_columns"]])[0])
    model_price = max(0.0, model_price)

    # Recommendation never goes below the transparent cost floor.
    suggested = max(model_price, cost_block["cost_based_minimum_price"])
    expected_profit = suggested - cost_block["estimated_production_cost"]

    return {
        "prediction_status": "exploratory",
        "dataset_type": "synthetic",
        "synthetic_model": True,
        "model_estimated_price": round(model_price, 2),
        "suggested_selling_price": round(suggested, 2),
        "estimated_production_cost": cost_block["estimated_production_cost"],
        "expected_profit_at_suggested_price": round(expected_profit, 2),
        "cost_based_minimum_price": cost_block["cost_based_minimum_price"],
        "cost_based_target_price": cost_block["cost_based_target_price"],
        "used_cost_floor": bool(model_price < cost_block["cost_based_minimum_price"]),
        "price_components": cost_block,
        "disclaimer": (
            "model_estimated_price is a statistical guess from similar sample "
            "listings. cost_based_minimum_price is a cost-plus rule. Neither "
            "value is automatically a fair market price."
        ),
    }
