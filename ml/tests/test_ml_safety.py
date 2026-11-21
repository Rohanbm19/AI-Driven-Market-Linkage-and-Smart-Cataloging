from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

import pandas as pd

ML_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ML_ROOT / "src"
for path in (str(ML_ROOT), str(SRC_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from src.data_preprocessing import aggregate_completed_sales_to_demand, chronological_split
from src.demand_prediction import predict_demand


class MLSafetyTests(unittest.TestCase):
    def test_completed_sales_status_filter_and_aggregation(self):
        rows = [
            ["1", "P1", "Pottery", "2025-01-05", 3, "Jaipur", 100, "completed"],
            ["2", "P1", "Pottery", "2025-01-10", 2, "Jaipur", 100, "paid"],
            ["3", "P1", "Pottery", "2025-01-12", 99, "Jaipur", 100, "cancelled"],
            ["4", "P1", "Pottery", "2025-02-10", 4, "Jaipur", 100, "completed"],
        ]
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "sales_history.csv"
            pd.DataFrame(
                rows,
                columns=[
                    "order_id", "product_id", "product_category", "order_date",
                    "quantity", "product_location", "unit_price", "order_status",
                ],
            ).to_csv(path, index=False)
            frame, summary = aggregate_completed_sales_to_demand(path)

        self.assertEqual(summary["dataset_type"], "real")
        self.assertEqual(summary["excluded_rows"], 1)
        self.assertEqual(int(frame["units_sold"].iloc[0]), 4)
        self.assertEqual(int(frame["historical_units_sold"].iloc[0]), 5)

    def test_chronological_split_keeps_later_rows_for_test(self):
        frame = pd.DataFrame({
            "observation_date": pd.to_datetime(["2025-03-01"] * 2 + ["2025-01-01"] * 8),
        })
        train, test = chronological_split(frame)
        self.assertEqual(len(test), 2)
        self.assertLessEqual(train["observation_date"].max(), test["observation_date"].min())

    def test_missing_historical_sales_returns_warning_not_prediction(self):
        result = predict_demand({
            "product_category": "Pottery",
            "location": "Jaipur",
            "historical_units_sold": 0,
            "product_views": 300,
            "buyer_enquiries": 8,
            "month": 11,
            "season": "Autumn",
            "is_festival_period": 1,
            "festival_name": "Diwali",
        })
        self.assertEqual(result["prediction_status"], "insufficient_data")
        self.assertIn("Historical completed-sales units", result["warning"])
        self.assertNotIn("predicted_sales_quantity", result)

    def test_unseen_category_returns_warning(self):
        result = predict_demand({
            "product_category": "Unseen craft",
            "location": "Jaipur",
            "historical_units_sold": 20,
            "product_views": 300,
            "buyer_enquiries": 8,
            "month": 11,
            "season": "Autumn",
            "is_festival_period": 1,
            "festival_name": "Diwali",
        })
        self.assertEqual(result["prediction_status"], "insufficient_category_data")
        self.assertNotIn("predicted_sales_quantity", result)

    def test_saved_demand_metadata_exists_and_identifies_synthetic(self):
        metadata_path = ML_ROOT / "models" / "demand_random_forest.joblib.metadata.json"
        self.assertTrue(metadata_path.exists())
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        self.assertEqual(metadata["dataset_type"], "synthetic")
        self.assertIn("training_date_range", metadata)


if __name__ == "__main__":
    unittest.main()
