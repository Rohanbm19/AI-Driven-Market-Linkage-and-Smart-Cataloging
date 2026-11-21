"""
Train every KalaSetu market-analysis model.

Run from the ml/ folder after activating the virtual environment:

    python train.py
"""

from __future__ import annotations

import json
import sys
import argparse
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent
SRC_DIR = ML_ROOT / "src"
for path in (str(ML_ROOT), str(SRC_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from config import (
    CUSTOMER_CSV,
    DATA_DISCLAIMER,
    DEMAND_CSV,
    OUTPUTS_DIR,
    PRICE_CSV,
    TRENDS_CSV,
)
from src.data_preprocessing import ensure_sample_datasets
from src.customer_segmentation import train_segmentation_model
from src.demand_prediction import train_demand_model
from src.evaluation import format_metrics_block, write_json_report, write_text_report
from src.plots import save_actual_vs_predicted, save_cluster_pca, save_trend_lines
from src.price_prediction import train_price_model
from src.product_trend_analysis import train_trend_summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Train KalaSetu ML models.")
    parser.add_argument(
        "--demand-csv",
        type=Path,
        default=DEMAND_CSV,
        help="Demand training CSV. Default: synthetic development CSV.",
    )
    args = parser.parse_args()
    print(DATA_DISCLAIMER)
    ensure_sample_datasets()
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    print("\n=== Demand prediction (Random Forest) ===")
    try:
        demand = train_demand_model(args.demand_csv)
    except ValueError as error:
        print("WARNING: Demand training blocked.")
        print(f"  {error}")
        print("  No demand model was overwritten.")
        demand = None

    if demand is not None:
        print(format_metrics_block("Train", demand["train_metrics"]))
        print(format_metrics_block("Test", demand["test_metrics"]))

    print("\n=== Price recommendation (Random Forest) ===")
    price = train_price_model(PRICE_CSV)
    print(format_metrics_block("Train", price["train_metrics"]))
    print(format_metrics_block("Test", price["test_metrics"]))

    print("\n=== Customer segmentation (K-Means) ===")
    segments = train_segmentation_model(CUSTOMER_CSV)
    print(format_metrics_block("Train", segments["train_metrics"]))
    print(format_metrics_block("Test", segments["test_metrics"]))
    print("Cluster profiles:")
    print(json.dumps(segments["cluster_profiles"], indent=2))

    print("\n=== Product trend analysis ===")
    trends = train_trend_summary(TRENDS_CSV)
    print("Trending categories:", trends["summary"]["trending_categories"])
    print("Decreasing categories:", trends["summary"]["decreasing_categories"])

    demand_plot = None
    if demand is not None:
        demand_plot = save_actual_vs_predicted(
            demand["y_test"],
            demand["y_pred_test"],
            "Demand model: actual vs predicted (test split)",
            OUTPUTS_DIR / "demand_actual_vs_predicted.png",
        )
    price_plot = save_actual_vs_predicted(
        price["y_test"],
        price["y_pred_test"],
        "Price model: actual vs predicted (test split, sample data)",
        OUTPUTS_DIR / "price_actual_vs_predicted.png",
    )
    cluster_plot = save_cluster_pca(
        segments["features"],
        segments["labels"],
        OUTPUTS_DIR / "customer_clusters_pca.png",
    )
    trend_plot = save_trend_lines(
        trends["monthly_frame"],
        OUTPUTS_DIR / "category_monthly_trends.png",
    )

    report = {
        "disclaimer": DATA_DISCLAIMER,
        "demand": (
            {
                "model_path": demand["model_path"],
                "dataset_type": demand["dataset_type"],
                "training_date_range": demand["training_date_range"],
                "reliable_for_live_use": demand["reliable_for_live_use"],
                "metadata_path": demand["metadata_path"],
                "train_metrics": demand["train_metrics"],
                "test_metrics": demand["test_metrics"],
                "demand_cuts": demand["demand_cuts"],
            }
            if demand is not None
            else {
                "status": "blocked",
                "reason": "Real sales_history.csv is empty or has insufficient real rows.",
                "model_overwritten": False,
            }
        ),
        "price": {
            "model_path": price["model_path"],
            "train_metrics": price["train_metrics"],
            "test_metrics": price["test_metrics"],
        },
        "segmentation": {
            "model_path": segments["model_path"],
            "train_metrics": segments["train_metrics"],
            "test_metrics": segments["test_metrics"],
            "cluster_profiles": segments["cluster_profiles"],
        },
        "trends": {
            "model_path": trends["model_path"],
            "trending_categories": trends["summary"]["trending_categories"],
            "decreasing_categories": trends["summary"]["decreasing_categories"],
            "categories": trends["summary"]["categories"],
        },
        "charts": {
            "demand": str(demand_plot) if demand_plot is not None else None,
            "price": str(price_plot),
            "clusters": str(cluster_plot),
            "trends": str(trend_plot),
        },
    }
    json_path = write_json_report(OUTPUTS_DIR / "evaluation_report.json", report)
    text_path = write_text_report(
        OUTPUTS_DIR / "evaluation_report.txt",
        "\n".join(
            [
                "KalaSetu ML evaluation report",
                DATA_DISCLAIMER,
                "",
                (
                    "\n".join(
                        [
                            format_metrics_block("Demand train", demand["train_metrics"]),
                            format_metrics_block("Demand test", demand["test_metrics"]),
                        ]
                    )
                    if demand is not None
                    else "Demand training: BLOCKED - sales_history.csv is empty or insufficient."
                ),
                "",
                format_metrics_block("Price train", price["train_metrics"]),
                format_metrics_block("Price test", price["test_metrics"]),
                "",
                format_metrics_block("Segmentation train", segments["train_metrics"]),
                format_metrics_block("Segmentation test", segments["test_metrics"]),
                "",
                "Trending categories: " + ", ".join(trends["summary"]["trending_categories"]),
                "Decreasing categories: " + ", ".join(trends["summary"]["decreasing_categories"]),
            ]
        ),
    )
    print(f"\nSaved report: {json_path}")
    print(f"Saved report: {text_path}")
    print("Training finished.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
