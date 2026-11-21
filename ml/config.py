"""
KalaSetu ML module configuration.

Training paths stay inside ml/. The backend supplies live inference inputs
to the demand model through predict.py; training remains file-based.
"""

from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent

DATASETS_DIR = ML_ROOT / "datasets"
RAW_DATA_DIR = DATASETS_DIR / "raw"
PROCESSED_DATA_DIR = DATASETS_DIR / "processed"
MODELS_DIR = ML_ROOT / "models"
OUTPUTS_DIR = ML_ROOT / "outputs"
NOTEBOOKS_DIR = ML_ROOT / "notebooks"

RANDOM_STATE = 42
TEST_SIZE = 0.20

DEMAND_CSV = RAW_DATA_DIR / "artisan_product_demand_sample.csv"
PRICE_CSV = RAW_DATA_DIR / "artisan_product_pricing_sample.csv"
CUSTOMER_CSV = RAW_DATA_DIR / "artisan_customer_behaviour_sample.csv"
TRENDS_CSV = RAW_DATA_DIR / "artisan_monthly_trends_sample.csv"

DEMAND_MODEL_PATH = MODELS_DIR / "demand_random_forest.joblib"
PRICE_MODEL_PATH = MODELS_DIR / "price_random_forest.joblib"
SEGMENT_MODEL_PATH = MODELS_DIR / "customer_kmeans.joblib"
TREND_SUMMARY_PATH = MODELS_DIR / "product_trend_summary.joblib"

# Handmade product categories used in the sample (synthetic) datasets.
PRODUCT_CATEGORIES = [
    "Pottery",
    "Wooden Crafts",
    "Jewellery",
    "Textiles",
    "Baskets",
    "Paintings",
]

LOCATIONS = [
    "Jaipur",
    "Varanasi",
    "Channapatna",
    "Bankura",
    "Kutch",
    "Mysuru",
    "Moradabad",
    "Srinagar",
    "Madurai",
    "Kolkata",
]

SEASONS = {
    1: "Winter",
    2: "Winter",
    3: "Summer",
    4: "Summer",
    5: "Summer",
    6: "Monsoon",
    7: "Monsoon",
    8: "Monsoon",
    9: "Monsoon",
    10: "Autumn",
    11: "Autumn",
    12: "Winter",
}

# Indicative Indian festival months (used only as a feature, not a calendar of record).
FESTIVAL_BY_MONTH = {
    1: "Pongal / Makar Sankranti",
    3: "Holi",
    4: "Ugadi / Vishu",
    8: "Raksha Bandhan / Independence Day",
    9: "Ganesh Chaturthi / Onam",
    10: "Navratri / Durga Puja",
    11: "Diwali",
    12: "Christmas",
}

DEMAND_CLASS_LABELS = ("Low", "Medium", "High")

# Cost-based floor used when recommending a selling price.
# This is NOT the model prediction; it is a transparent cost rule.
MINIMUM_MARGIN_ON_COST = 0.15
TARGET_MARGIN_ON_COST = 0.30

N_CLUSTERS = 4
N_ESTIMATORS = 120

# Column aliases so Kaggle-style e-commerce files can be mapped
# onto the artisan feature names used by this module.
# Compatible with common "E-Commerce Sales Analytics" / Superstore-style CSVs.
KAGGLE_COLUMN_ALIASES = {
    "category": "product_category",
    "sub-category": "product_subcategory",
    "sub_category": "product_subcategory",
    "product name": "product_name",
    "product_name": "product_name",
    "city": "location",
    "state": "location",
    "country": "country",
    "quantity": "units_sold",
    "sales": "revenue",
    "profit": "profit",
    "order date": "order_date",
    "order_date": "order_date",
    "invoicedate": "order_date",
    "invoice date": "order_date",
    "customer id": "customer_id",
    "customerid": "customer_id",
    "customer_id": "customer_id",
    "unitprice": "unit_price",
    "unit price": "unit_price",
    "unit_price": "unit_price",
    "stockcode": "product_id",
    "product id": "product_id",
}

DATA_DISCLAIMER = (
    "Sample / synthetic data for KalaSetu ML development only. "
    "Predictions from these files are not real market insights."
)
