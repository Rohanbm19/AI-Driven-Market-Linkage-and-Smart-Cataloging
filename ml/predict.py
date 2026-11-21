"""
Run one-off predictions from the trained models. The backend also invokes
the demand command with live marketplace features.

Examples (from the ml/ folder, with the virtual environment active):

    python predict.py demand --category Pottery --location Jaipur --historical-units 20 --views 300 --enquiries 8 --month 11 --festival Diwali
    python predict.py price --category Textiles --material 600 --labour 1400 --size Medium --hours 12 --market-price 2800
    python predict.py segment --purchases 22 --aov 950 --frequency 12 --categories "Pottery|Baskets"
    python predict.py trends
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent
SRC_DIR = ML_ROOT / "src"
for path in (str(ML_ROOT), str(SRC_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from config import SEASONS
from src.customer_segmentation import predict_customer_segment
from src.demand_prediction import predict_demand
from src.price_prediction import predict_price
from src.product_trend_analysis import get_trend_report


def _print(payload: dict) -> None:
    print(json.dumps(payload, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="KalaSetu ML predictions (CLI and backend inference)."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    demand = sub.add_parser("demand", help="Predict sales quantity and Low/Medium/High demand.")
    demand.add_argument("--category", required=True)
    demand.add_argument("--location", required=True)
    demand.add_argument(
        "--historical-units",
        type=float,
        default=None,
        help="Completed historical units. Omit or pass 0 when unavailable.",
    )
    demand.add_argument("--views", type=float, required=True)
    demand.add_argument("--enquiries", type=float, required=True)
    demand.add_argument("--month", type=int, required=True)
    demand.add_argument("--festival", default="None", help="Festival name, or None.")

    price = sub.add_parser("price", help="Estimate selling price vs cost-based floor.")
    price.add_argument("--category", required=True)
    price.add_argument("--material", type=float, required=True, help="Raw material cost (INR).")
    price.add_argument("--labour", type=float, required=True, help="Labour cost (INR).")
    price.add_argument("--size", default="Medium", choices=["Small", "Medium", "Large"])
    price.add_argument("--hours", type=float, required=True, help="Production time in hours.")
    price.add_argument("--market-price", type=float, default=None)

    segment = sub.add_parser("segment", help="Assign a customer behaviour cluster.")
    segment.add_argument("--purchases", type=float, required=True)
    segment.add_argument("--aov", type=float, required=True, help="Average order value (INR).")
    segment.add_argument("--frequency", type=float, required=True)
    segment.add_argument("--categories", default="", help="Pipe-separated categories.")

    sub.add_parser("trends", help="Show saved category trend summary.")
    return parser


def run_demand(args: argparse.Namespace) -> dict:
    month = int(args.month)
    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12")
    festival = args.festival if args.festival and args.festival.lower() != "none" else "None"
    payload = {
        "product_category": args.category,
        "location": args.location,
        "historical_units_sold": args.historical_units,
        "product_views": args.views,
        "buyer_enquiries": args.enquiries,
        "month": month,
        "season": SEASONS[month],
        "is_festival_period": 0 if festival == "None" else 1,
        "festival_name": festival,
    }
    return predict_demand(payload)


def run_price(args: argparse.Namespace) -> dict:
    payload = {
        "product_category": args.category,
        "raw_material_cost": args.material,
        "labour_cost": args.labour,
        "product_size": args.size,
        "production_time_hours": args.hours,
        "market_price": args.market_price,
    }
    return predict_price(payload)


def run_segment(args: argparse.Namespace) -> dict:
    payload = {
        "total_purchases": args.purchases,
        "average_order_value": args.aov,
        "purchase_frequency": args.frequency,
        "categories_purchased": args.categories,
    }
    return predict_customer_segment(payload)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        if args.command == "demand":
            _print(run_demand(args))
        elif args.command == "price":
            _print(run_price(args))
        elif args.command == "segment":
            _print(run_segment(args))
        elif args.command == "trends":
            _print(get_trend_report())
        else:
            parser.error("Unknown command")
    except Exception as error:
        print(f"Prediction failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
