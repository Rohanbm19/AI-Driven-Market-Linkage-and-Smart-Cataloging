"""
Load, clean and encode market-analysis tables.

The train/test split happens before fitting encoders so test information
does not leak into training.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import (
    KAGGLE_COLUMN_ALIASES,
    PROCESSED_DATA_DIR,
    RANDOM_STATE,
    SEASONS,
    TEST_SIZE,
)

from generate_sample_data import write_sample_datasets


def ensure_sample_datasets() -> None:
    write_sample_datasets()


def read_csv_file(csv_path: Path) -> pd.DataFrame:
    if not Path(csv_path).exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    frame = pd.read_csv(csv_path)
    if frame.empty:
        raise ValueError(f"CSV is empty: {csv_path}")
    return frame


def clean_dataframe(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()
    cleaned.columns = [str(column).strip() for column in cleaned.columns]
    cleaned = cleaned.drop_duplicates()
    for column in cleaned.select_dtypes(include=["object"]).columns:
        cleaned[column] = cleaned[column].astype(str).str.strip()
        # Keep the literal festival label "None". Only empty / nan strings are missing.
        cleaned[column] = cleaned[column].replace({"nan": np.nan, "": np.nan, "<NA>": np.nan})
    return cleaned.reset_index(drop=True)


def add_calendar_features(frame: pd.DataFrame, date_column: str = "order_date") -> pd.DataFrame:
    if date_column not in frame.columns:
        return frame
    result = frame.copy()
    result[date_column] = pd.to_datetime(result[date_column], errors="coerce")
    result["month"] = result[date_column].dt.month
    result["year"] = result[date_column].dt.year
    result["season"] = result["month"].map(SEASONS)
    return result


def normalize_kaggle_sales_dataframe(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Map a Kaggle e-commerce sales file onto names this module understands.

    Typical source columns: Order Date, Category, Quantity, Sales, City,
    Customer ID, UnitPrice. Unknown columns are kept with original names.
    """
    renamed = frame.copy()
    rename_map = {}
    for column in renamed.columns:
        key = str(column).strip().lower()
        if key in KAGGLE_COLUMN_ALIASES:
            rename_map[column] = KAGGLE_COLUMN_ALIASES[key]
    renamed = renamed.rename(columns=rename_map)
    renamed = add_calendar_features(renamed)
    return renamed


def aggregate_kaggle_to_demand(frame: pd.DataFrame) -> pd.DataFrame:
    """
    Collapse invoice-level Kaggle rows into monthly category demand features.

    Historical units are the previous month's quantity for that category and
    location so the target (units_sold) is not copied into the features.
    """
    work = normalize_kaggle_sales_dataframe(frame)
    required = {"product_category", "units_sold"}
    missing = required - set(work.columns)
    if missing:
        raise ValueError(
            "Kaggle file needs at least Category and Quantity (mapped to "
            f"product_category and units_sold). Missing: {sorted(missing)}"
        )
    if "location" not in work.columns:
        work["location"] = "Unknown"
    if "month" not in work.columns:
        work["month"] = 1
    aggregations = {
        "units_sold": ("units_sold", "sum"),
        "product_views": ("units_sold", "count"),
        "buyer_enquiries": ("units_sold", lambda series: max(0, int(series.count() * 0.2))),
    }
    if "revenue" in work.columns:
        aggregations["revenue"] = ("revenue", "sum")
    grouped = (
        work.groupby(["product_category", "location", "year", "month"], dropna=False)
        .agg(**aggregations)
        .reset_index()
    )
    grouped = grouped.sort_values(["product_category", "location", "year", "month"])
    grouped["historical_units_sold"] = (
        grouped.groupby(["product_category", "location"])["units_sold"].shift(1)
    )
    grouped = grouped.dropna(subset=["historical_units_sold"])
    grouped["season"] = grouped["month"].map(SEASONS)
    grouped["is_festival_period"] = 0
    grouped["festival_name"] = "Unknown"
    return grouped


def split_features_and_target(
    frame: pd.DataFrame,
    feature_columns: Iterable[str],
    target_column: str,
) -> tuple[pd.DataFrame, pd.Series]:
    missing = [column for column in list(feature_columns) + [target_column] if column not in frame.columns]
    if missing:
        raise ValueError(f"Required columns missing: {missing}")
    features = frame.loc[:, list(feature_columns)].copy()
    target = frame[target_column].copy()
    return features, target


def make_train_test_split(
    features: pd.DataFrame,
    target: pd.Series,
    stratify: pd.Series | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    return train_test_split(
        features,
        target,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=stratify,
    )


def build_column_transformer(
    numeric_columns: list[str],
    categorical_columns: list[str],
    scale_numeric: bool = False,
) -> ColumnTransformer:
    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    numeric_pipeline = Pipeline(numeric_steps)
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
            ),
        ]
    )
    return ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, numeric_columns),
            ("categorical", categorical_pipeline, categorical_columns),
        ],
        remainder="drop",
    )


def save_processed_split(
    name: str,
    x_train: pd.DataFrame,
    x_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> None:
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    train_frame = x_train.copy()
    train_frame["target"] = y_train.values
    test_frame = x_test.copy()
    test_frame["target"] = y_test.values
    train_frame.to_csv(PROCESSED_DATA_DIR / f"{name}_train.csv", index=False)
    test_frame.to_csv(PROCESSED_DATA_DIR / f"{name}_test.csv", index=False)
