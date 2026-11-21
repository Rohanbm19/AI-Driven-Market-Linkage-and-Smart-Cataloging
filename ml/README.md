# KalaSetu Machine Learning — Training and Live Demand Inference

The Python models train from CSV files under `datasets/`. The Express backend invokes the trained demand model for the Market Insights page and supplies recent product views, buyer enquiries, and product-region data from Supabase.

The CSVs under `datasets/raw/` are **synthetic sample data**. They are not imported into Supabase and do not provide production training labels. The web estimate combines live inference inputs with a sample-trained model, so it is exploratory and not a production market forecast.

## What is included

| Feature | Algorithm | Script |
| --- | --- | --- |
| Product demand prediction | Random Forest regressor | `src/demand_prediction.py` |
| Smart price recommendation | Random Forest regressor | `src/price_prediction.py` |
| Customer segmentation | K-Means | `src/customer_segmentation.py` |
| Product trend analysis | Monthly growth, slope, seasonality | `src/product_trend_analysis.py` |

Price outputs always separate:

- **model_estimated_price** — statistical guess from similar sample listings
- **cost_based_minimum_price** — production cost plus a 15% floor
- **suggested_selling_price** — the model guess, raised to the cost floor if needed

A predicted rupee amount is **not** automatically a fair market price.

## Folder layout

```
ml/
├── datasets/raw/          labelled synthetic CSVs
├── datasets/processed/    train/test splits written during training
├── models/                joblib files after training
├── notebooks/
├── src/
├── outputs/               charts and evaluation reports
├── config.py
├── train.py
├── predict.py
└── requirements.txt
```

## PowerShell: install and run

Use Python 3.10 or newer. Commands assume the project root is `d:\Projects\AI-Driven-Market-Linkage-and-Smart-Cataloging`.

```powershell
cd d:\Projects\AI-Driven-Market-Linkage-and-Smart-Cataloging\ml

python -m venv .venv

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

python train.py
```

`train.py` writes sample CSVs if needed, trains all models, stores joblib files in `models/`, and writes charts plus `outputs/evaluation_report.json`.

### Individual predictions

```powershell
python predict.py demand --category Pottery --location Jaipur --historical-units 20 --views 300 --enquiries 8 --month 11 --festival Diwali

python predict.py price --category Textiles --material 600 --labour 1400 --size Medium --hours 12 --market-price 2800

python predict.py segment --purchases 22 --aov 950 --frequency 12 --categories "Pottery|Baskets"

python predict.py trends
```

### Optional: regenerate sample CSVs only

```powershell
python src\generate_sample_data.py
```

## Live website integration

1. Install the Python dependencies and train the model as described above. The backend uses `ml/.venv/Scripts/python.exe` on Windows or `ml/.venv/bin/python` on Unix when that environment exists.
2. Start the Express backend and the frontend, and apply the Supabase migrations used by Market Insights.
3. Open **Market Insights**, choose a category, and select **Estimate demand**. The frontend calls:

   ```text
   GET http://localhost:5000/api/market/ml/demand?category=<database-category>
   ```

The backend reads recent category views and enquiries from `market_insights_by_category`, picks the most common product location, and passes those live values to `predict.py`. One-hot category encoding learns categories dynamically and safely ignores unseen category levels. The prediction command refuses estimates for categories with fewer than five training observations.

KalaSetu currently has no completed-sales history table. The existing backend sets `historical_units_sold` to `0` as a missing-data sentinel. The prediction layer interprets zero, null, and missing values as unavailable history rather than real sales, and returns an insufficient-data warning. It does not display false confidence. The sample-trained model should not be used for business decisions until it is retrained and evaluated on representative, consented marketplace sales data.

The existing price predictor and customer-segmentation model remain offline CLI workflows: the app does not yet store consistent production-cost or completed-purchase history needed to feed them with reliable live inputs. The website's SQL-based Market Insights remain database aggregations and do not depend on these sample model outputs.

## Real completed-sales training

Place an anonymized export at `datasets/raw/sales_history.csv`. The file
schema and status policy are documented in `datasets/raw/README.md`.

Train demand from completed sales:

```powershell
python train.py --demand-csv datasets\raw\sales_history.csv
```

The current `train.py` defaults to the synthetic development CSV. It must not
be pointed at real sales until `sales_history.csv` contains authorized,
anonymized rows. Cancelled, returned, incomplete, and unknown statuses are
excluded. Monthly aggregation creates lagged historical units so the same
period's target sales are not used as a feature.

The demand pipeline uses chronological train/test separation, never a random
train/test split. Results include MAE, RMSE, R², date ranges, dataset type,
feature names, dependency versions, and compatibility metadata. If real
observations are insufficient, predictions are labelled exploratory or
insufficient-data and no false confidence score is shown.

## Kaggle e-commerce files

`src/data_preprocessing.py` maps common Kaggle sales columns (`Category`, `Quantity`, `Order Date`, `City`, `Customer ID`, `Sales`) onto this module’s names. Invoice-level files can be rolled up with `aggregate_kaggle_to_demand` so historical units are **lagged** and the current period is not used as a feature.

## Metrics

Regression models report **MAE**, **RMSE**, and **R²** on a held-out test split. Clustering reports **silhouette** and **Davies–Bouldin** scores. Numbers in `outputs/` are measured on the current sample; they are not 100% accuracy and should not be quoted as production KPIs.
