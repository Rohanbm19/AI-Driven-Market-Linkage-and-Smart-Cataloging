"""
Create labelled synthetic artisan CSVs inside ml/datasets/raw/.

These rows are invented for software testing. They are not sales from
real artisans and must not be shown as live market intelligence.
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ML_ROOT = Path(__file__).resolve().parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from config import (
    CUSTOMER_CSV,
    DATA_DISCLAIMER,
    DEMAND_CSV,
    FESTIVAL_BY_MONTH,
    LOCATIONS,
    PRICE_CSV,
    PRODUCT_CATEGORIES,
    RANDOM_STATE,
    RAW_DATA_DIR,
    SEASONS,
    TRENDS_CSV,
)

CATEGORY_BASE_DEMAND = {
    "Pottery": 18,
    "Wooden Crafts": 22,
    "Jewellery": 14,
    "Textiles": 28,
    "Baskets": 16,
    "Paintings": 10,
    "Brass/Metalware": 12,
    "Other Handmade Products": 11,
}

CATEGORY_MATERIAL = {
    "Pottery": (80, 450),
    "Wooden Crafts": (120, 700),
    "Jewellery": (400, 4500),
    "Textiles": (250, 2800),
    "Baskets": (40, 220),
    "Paintings": (150, 900),
    "Brass/Metalware": (300, 2200),
    "Other Handmade Products": (100, 1200),
}

CATEGORY_LABOUR = {
    "Pottery": (200, 1200),
    "Wooden Crafts": (300, 1800),
    "Jewellery": (500, 3500),
    "Textiles": (400, 4000),
    "Baskets": (150, 800),
    "Paintings": (400, 2500),
    "Brass/Metalware": (500, 3000),
    "Other Handmade Products": (200, 1800),
}

SIZE_CM = {"Small": 12, "Medium": 28, "Large": 48}


def _month_features(month: int) -> tuple[str, int, str]:
    season = SEASONS[month]
    festival_name = FESTIVAL_BY_MONTH.get(month, "None")
    is_festival = 0 if festival_name == "None" else 1
    return season, is_festival, festival_name


def build_demand_frame(rng: np.random.Generator, n_rows: int = 720) -> pd.DataFrame:
    rows = []
    for i in range(n_rows):
        category = PRODUCT_CATEGORIES[i % len(PRODUCT_CATEGORIES)]
        location = LOCATIONS[i % len(LOCATIONS)]
        month = int(rng.integers(1, 13))
        season, is_festival, festival_name = _month_features(month)
        historical_units = max(1, int(rng.normal(CATEGORY_BASE_DEMAND[category], 8)))
        product_views = int(rng.integers(20, 900))
        buyer_enquiries = int(rng.integers(0, 40))
        festival_boost = 8 if is_festival else 0
        season_boost = {"Winter": 3, "Summer": 0, "Monsoon": -2, "Autumn": 6}[season]
        noise = rng.normal(0, 4)
        units_sold = (
            0.35 * historical_units
            + 0.012 * product_views
            + 0.55 * buyer_enquiries
            + festival_boost
            + season_boost
            + CATEGORY_BASE_DEMAND[category] * 0.25
            + noise
        )
        units_sold = int(max(0, round(units_sold)))
        rows.append(
            {
                "record_id": f"DEM-{i + 1:04d}",
                "product_category": category,
                "location": location,
                "historical_units_sold": historical_units,
                "product_views": product_views,
                "buyer_enquiries": buyer_enquiries,
                "month": month,
                "season": season,
                "is_festival_period": is_festival,
                "festival_name": festival_name,
                "units_sold": units_sold,
                "data_source": "synthetic_sample",
                "disclaimer": DATA_DISCLAIMER,
            }
        )
    return pd.DataFrame(rows)


def build_price_frame(rng: np.random.Generator, n_rows: int = 420) -> pd.DataFrame:
    rows = []
    sizes = list(SIZE_CM.keys())
    for i in range(n_rows):
        category = PRODUCT_CATEGORIES[i % len(PRODUCT_CATEGORIES)]
        material_lo, material_hi = CATEGORY_MATERIAL[category]
        labour_lo, labour_hi = CATEGORY_LABOUR[category]
        raw_material_cost = round(float(rng.uniform(material_lo, material_hi)), 2)
        labour_cost = round(float(rng.uniform(labour_lo, labour_hi)), 2)
        product_size = sizes[i % 3]
        production_time_hours = round(float(rng.uniform(2, 48)), 1)
        production_cost = raw_material_cost + labour_cost
        size_premium = {"Small": 40, "Medium": 120, "Large": 280}[product_size]
        time_premium = production_time_hours * 18
        # Some listings have no comparable market price (common for unique crafts).
        has_market_price = rng.random() > 0.18
        market_price = (
            round(production_cost * 1.35 + size_premium + rng.normal(0, 80), 2)
            if has_market_price
            else np.nan
        )
        selling_price = (
            production_cost * 1.32
            + size_premium
            + time_premium * 0.25
            + (0.15 * market_price if has_market_price else 0)
            + rng.normal(0, 60)
        )
        selling_price = round(float(max(production_cost * 1.05, selling_price)), 2)
        rows.append(
            {
                "record_id": f"PRC-{i + 1:04d}",
                "product_category": category,
                "raw_material_cost": raw_material_cost,
                "labour_cost": labour_cost,
                "product_size": product_size,
                "product_size_cm": SIZE_CM[product_size],
                "production_time_hours": production_time_hours,
                "market_price": market_price,
                "selling_price": selling_price,
                "data_source": "synthetic_sample",
                "disclaimer": DATA_DISCLAIMER,
            }
        )
    return pd.DataFrame(rows)


def build_customer_frame(rng: np.random.Generator, n_rows: int = 200) -> pd.DataFrame:
    """Four behaviour styles so K-Means has structure to recover."""
    segment_templates = [
        {
            "purchases": (18, 40),
            "aov": (800, 1800),
            "frequency": (8, 18),
            "n_categories": (3, 6),
            "style": "frequent_mid_value",
        },
        {
            "purchases": (3, 8),
            "aov": (3500, 12000),
            "frequency": (1, 4),
            "n_categories": (1, 2),
            "style": "occasional_premium",
        },
        {
            "purchases": (25, 60),
            "aov": (250, 700),
            "frequency": (10, 24),
            "n_categories": (2, 4),
            "style": "high_frequency_budget",
        },
        {
            "purchases": (1, 4),
            "aov": (400, 1200),
            "frequency": (1, 2),
            "n_categories": (1, 2),
            "style": "rare_low_engagement",
        },
    ]
    rows = []
    for i in range(n_rows):
        template = segment_templates[i % 4]
        n_cats = int(rng.integers(template["n_categories"][0], template["n_categories"][1] + 1))
        chosen = list(rng.choice(PRODUCT_CATEGORIES, size=n_cats, replace=False))
        rows.append(
            {
                "customer_id": f"CUST-{i + 1:04d}",
                "total_purchases": int(rng.integers(*template["purchases"])),
                "average_order_value": round(float(rng.uniform(*template["aov"])), 2),
                "purchase_frequency": int(rng.integers(*template["frequency"])),
                "categories_purchased": "|".join(chosen),
                "unique_categories_count": n_cats,
                "behaviour_style_label": template["style"],
                "data_source": "synthetic_sample",
                "disclaimer": DATA_DISCLAIMER,
            }
        )
    return pd.DataFrame(rows)


def build_trends_frame(rng: np.random.Generator) -> pd.DataFrame:
    rows = []
    record_id = 1
    for year in (2023, 2024, 2025):
        for month in range(1, 13):
            if year == 2025 and month > 10:
                break
            season, is_festival, festival_name = _month_features(month)
            for category in PRODUCT_CATEGORIES:
                base = CATEGORY_BASE_DEMAND[category] * 12
                time_index = (year - 2023) * 12 + month
                trend = {
                    "Pottery": 0.4,
                    "Wooden Crafts": 0.9,
                    "Jewellery": 0.2,
                    "Textiles": 1.1,
                    "Baskets": -2.8,
                    "Paintings": 0.55,
                    "Brass/Metalware": 0.35,
                    "Other Handmade Products": 0.25,
                }[category]
                festival_boost = 40 if is_festival else 0
                units = int(
                    max(
                        5,
                        rng.normal(base, 18) + trend * time_index + festival_boost,
                    )
                )
                views = int(max(30, units * rng.uniform(8, 18)))
                enquiries = int(max(0, rng.normal(units * 0.12, 6)))
                rows.append(
                    {
                        "record_id": f"TRD-{record_id:04d}",
                        "year": year,
                        "month": month,
                        "year_month": f"{year}-{month:02d}",
                        "product_category": category,
                        "units_sold": units,
                        "product_views": views,
                        "buyer_enquiries": enquiries,
                        "season": season,
                        "is_festival_period": is_festival,
                        "festival_name": festival_name,
                        "data_source": "synthetic_sample",
                        "disclaimer": DATA_DISCLAIMER,
                    }
                )
                record_id += 1
    return pd.DataFrame(rows)


def write_sample_datasets() -> dict[str, Path]:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(RANDOM_STATE)
    demand = build_demand_frame(rng)
    price = build_price_frame(rng)
    customers = build_customer_frame(rng)
    trends = build_trends_frame(rng)
    demand.to_csv(DEMAND_CSV, index=False)
    price.to_csv(PRICE_CSV, index=False)
    customers.to_csv(CUSTOMER_CSV, index=False)
    trends.to_csv(TRENDS_CSV, index=False)
    return {
        "demand": DEMAND_CSV,
        "price": PRICE_CSV,
        "customers": CUSTOMER_CSV,
        "trends": TRENDS_CSV,
    }


if __name__ == "__main__":
    paths = write_sample_datasets()
    print("Wrote labelled synthetic sample CSVs:")
    for name, path in paths.items():
        print(f"  {name}: {path}")
