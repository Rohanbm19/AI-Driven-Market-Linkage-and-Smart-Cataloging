"""
Category trend analysis from monthly handmade-product series.

This is descriptive time-series arithmetic (growth, slope, seasonality),
not a claim about the real artisan market.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import TREND_SUMMARY_PATH

from data_preprocessing import clean_dataframe, read_csv_file
from model_metadata import model_metadata, validate_model_metadata, write_model_metadata


def load_trend_table(csv_path: Path) -> pd.DataFrame:
    frame = clean_dataframe(read_csv_file(csv_path))
    if "year_month" not in frame.columns:
        if {"year", "month"}.issubset(frame.columns):
            frame["year_month"] = (
                frame["year"].astype(int).astype(str)
                + "-"
                + frame["month"].astype(int).map(lambda value: f"{value:02d}")
            )
        else:
            raise ValueError("Trend CSV needs year_month or year and month columns.")
    frame = frame.sort_values(["product_category", "year_month"])
    return frame


def _linear_slope(values: np.ndarray) -> float:
    if len(values) < 2:
        return 0.0
    time_index = np.arange(len(values), dtype=float)
    if np.allclose(values, values[0]):
        return 0.0
    slope, _intercept = np.polyfit(time_index, values.astype(float), 1)
    return float(slope)


def _direction(slope: float, recent_growth: float) -> str:
    # Long-run monthly slope is the primary signal; short windows can spike
    # around festivals and should not reverse a clear multi-month trend.
    if slope <= -0.8:
        return "decreasing"
    if slope >= 0.8:
        return "increasing"
    if recent_growth >= 0.12:
        return "increasing"
    if recent_growth <= -0.12:
        return "decreasing"
    return "stable"


def analyse_category(category_frame: pd.DataFrame) -> dict:
    series = category_frame.sort_values("year_month")
    units = series["units_sold"].to_numpy(dtype=float)
    views = series["product_views"].to_numpy(dtype=float)
    enquiries = series["buyer_enquiries"].to_numpy(dtype=float)
    recent = units[-3:].mean() if len(units) >= 3 else units.mean()
    earlier = units[-6:-3].mean() if len(units) >= 6 else units[: max(1, len(units) // 2)].mean()
    recent_growth = float((recent - earlier) / earlier) if earlier else 0.0
    slope = _linear_slope(units)
    if "season" in series.columns:
        seasonal = (
            series.groupby("season")["units_sold"].mean().round(2).to_dict()
        )
        peak_season = max(seasonal, key=seasonal.get) if seasonal else None
    else:
        seasonal = {}
        peak_season = None
    return {
        "product_category": series["product_category"].iloc[0],
        "months_observed": int(len(series)),
        "total_units_sold": int(units.sum()),
        "avg_monthly_units": round(float(units.mean()), 2),
        "avg_monthly_views": round(float(views.mean()), 2),
        "avg_monthly_enquiries": round(float(enquiries.mean()), 2),
        "units_slope_per_month": round(slope, 4),
        "recent_3m_vs_prior_3m_growth": round(recent_growth, 4),
        "demand_direction": _direction(slope, recent_growth),
        "seasonal_average_units": seasonal,
        "peak_season": peak_season,
        "latest_year_month": str(series["year_month"].iloc[-1]),
        "latest_units_sold": int(units[-1]),
    }


def train_trend_summary(csv_path: Path, model_path: Path = TREND_SUMMARY_PATH) -> dict:
    frame = load_trend_table(csv_path)
    summaries = []
    for category, group in frame.groupby("product_category"):
        summaries.append(analyse_category(group))
    summary_frame = pd.DataFrame(summaries).sort_values(
        "units_slope_per_month", ascending=False
    )
    trending = summary_frame[summary_frame["demand_direction"] == "increasing"]
    declining = summary_frame[summary_frame["demand_direction"] == "decreasing"]

    payload = {
        "categories": summary_frame.to_dict(orient="records"),
        "trending_categories": trending["product_category"].tolist(),
        "decreasing_categories": declining["product_category"].tolist(),
        "top_by_slope": summary_frame.head(3)["product_category"].tolist(),
        "disclaimer": (
            "Trend arrows come from the sample monthly CSV. They are not "
            "live KalaSetu marketplace insights."
        ),
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, model_path)
    metadata = model_metadata(
        model_version="trend-v2",
        dataset_type="synthetic",
        training_date_range={
            "training_start": str(frame["year_month"].min()),
            "training_end": str(frame["year_month"].max()),
        },
        feature_names=["year_month", "product_category", "units_sold", "product_views", "buyer_enquiries"],
        evaluation_metrics={"method": "descriptive_slope_and_growth"},
        preprocessing_logic="group by category and year_month; synthetic monthly observations",
    )
    write_model_metadata(model_path, metadata)
    return {
        "model_path": str(model_path),
        "summary": payload,
        "monthly_frame": frame,
        "summary_frame": summary_frame,
    }


def load_trend_summary(model_path: Path = TREND_SUMMARY_PATH) -> dict:
    if not Path(model_path).exists():
        raise FileNotFoundError(f"Trend summary not found. Train first: {model_path}")
    summary = joblib.load(model_path)
    metadata_path = Path(model_path).with_suffix(Path(model_path).suffix + ".metadata.json")
    if not metadata_path.exists():
        raise ValueError("Saved trend summary has no metadata. Retrain it with the current ML module.")
    import json
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    validate_model_metadata(Path(model_path), metadata)
    summary["metadata"] = metadata
    return summary


def get_trend_report(model_path: Path = TREND_SUMMARY_PATH) -> dict:
    summary = load_trend_summary(model_path)
    return summary
