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

from src.generate_sample_data import write_sample_datasets

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



def aggregate_completed_sales_to_demand(
    csv_path: Path,
    period: str = "monthly",
) -> tuple[pd.DataFrame, dict]:
    """
    Aggregate completed sales separately for each product.

    Historical units are taken from the previous observed sales period
    for the same product. Missing sales periods are not assumed to be
    zero because product availability is not yet known.
    """

    required = {
        "order_id",
        "product_id",
        "product_category",
        "order_date",
        "quantity",
        "product_location",
        "unit_price",
        "order_status",
    }

    if period not in {"monthly", "weekly"}:
        raise ValueError("period must be either 'monthly' or 'weekly'.")

    work = clean_dataframe(read_csv_file(csv_path))

    missing = sorted(required - set(work.columns))
    if missing:
        raise ValueError(
            f"sales_history.csv missing required columns: {missing}"
        )

    original_rows = len(work)

    # Clean and validate values.
    work["order_date"] = pd.to_datetime(
        work["order_date"], errors="coerce"
    )
    work["quantity"] = pd.to_numeric(
        work["quantity"], errors="coerce"
    )
    work["unit_price"] = pd.to_numeric(
        work["unit_price"], errors="coerce"
    )

    for column in [
        "product_id",
        "product_category",
        "product_location",
        "order_status",
    ]:
        work[column] = work[column].astype("string").str.strip()

    work = work.dropna(
        subset=[
            "order_id",
            "product_id",
            "product_category",
            "product_location",
            "order_date",
            "quantity",
            "order_status",
        ]
    )

    work = work[
        (work["product_id"] != "")
        & (work["quantity"] > 0)
    ].copy()

    # Only completed or delivered orders count as sales.
    statuses = work["order_status"].str.lower()

    completed = work[
        statuses.isin({"completed", "complete", "delivered"})
    ].copy()

    if completed.empty:
        raise ValueError(
            "No completed sales rows found. Check order_status values."
        )

    # Create monthly or weekly periods.
    if period == "monthly":
        completed["period_start"] = (
            completed["order_date"]
            .dt.to_period("M")
            .dt.to_timestamp()
        )
    else:
        completed["period_start"] = (
            completed["order_date"]
            .dt.to_period("W-SUN")
            .dt.start_time
        )

    # Aggregate sales independently for every product.
    group_columns = [
        "product_id",
        "product_category",
        "product_location",
        "period_start",
    ]

    grouped = (
        completed.groupby(group_columns, dropna=False)
        .agg(
            units_sold=("quantity", "sum"),
            completed_orders=("order_id", "nunique"),
            average_selling_price=("unit_price", "mean"),
        )
        .reset_index()
        .sort_values(group_columns)
    )

    # Get the previous observed sales quantity for the same product.
    product_groups = [
        "product_id",
        "product_category",
        "product_location",
    ]

    grouped["historical_units_sold"] = (
        grouped.groupby(product_groups)["units_sold"].shift(1)
    )

    # First observed period has no previous sales history.
    grouped = grouped.dropna(
        subset=["historical_units_sold"]
    ).copy()

    if grouped.empty:
        raise ValueError(
            "Not enough historical periods per product. "
            "Each product needs sales in at least two different periods."
        )

    grouped["observation_date"] = grouped["period_start"]
    grouped["month"] = grouped["period_start"].dt.month
    grouped["season"] = grouped["month"].map(SEASONS)

    # These engagement values are unavailable in the sales CSV.
    grouped["product_views"] = np.nan
    grouped["buyer_enquiries"] = np.nan

    grouped["is_festival_period"] = np.nan
    grouped["festival_name"] = "Unknown"
    grouped["location"] = grouped["product_location"]
    grouped["data_source"] = "real_completed_sales"

    summary = {
        "dataset_type": "real",
        "period": period,
        "original_rows": int(original_rows),
        "completed_rows": int(len(completed)),
        "excluded_rows": int(original_rows - len(completed)),
        "unique_products": int(completed["product_id"].nunique()),
        "observations": int(len(grouped)),
        "training_date_range": None,
        "testing_date_range": None,
        "note": (
            "Sales are grouped by product and period. "
            "Missing sales periods are not assumed to be zero."
        ),
    }

    return grouped, summary




def chronological_split(
    frame: pd.DataFrame,
    date_column: str = "observation_date",
    test_fraction: float = 0.20,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split data chronologically using unique dates.

    All observations from the same date remain in either
    training or testing, never both.
    """

    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction must be between 0 and 1.")

    work = frame.copy()

    work[date_column] = pd.to_datetime(
        work[date_column], errors="coerce"
    )

    work = (
        work.dropna(subset=[date_column])
        .sort_values(date_column)
        .reset_index(drop=True)
    )

    if len(work) < 10:
        raise ValueError(
            f"Insufficient chronological data: {len(work)} observations. "
            "At least 10 are required."
        )

    unique_dates = sorted(work[date_column].unique())

    if len(unique_dates) < 2:
        raise ValueError(
            "At least two different dates are required "
            "for chronological train/test splitting."
        )

    test_date_count = max(
        1,
        int(np.ceil(len(unique_dates) * test_fraction))
    )

    test_start_date = unique_dates[-test_date_count]

    train = work[
        work[date_column] < test_start_date
    ].copy()

    test = work[
        work[date_column] >= test_start_date
    ].copy()

    if train.empty or test.empty:
        raise ValueError(
            "Insufficient data for chronological train/test split."
        )

    assert train[date_column].max() < test[date_column].min()

    return train, test



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
