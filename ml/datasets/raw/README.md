# Sample datasets (synthetic)

Every CSV in this folder is **labelled synthetic data** for KalaSetu ML development.

- Files include `data_source=synthetic_sample` and a `disclaimer` column.
- Predictions trained on these rows are **not** real artisan market insights.
- Replace these files with live exports later, keeping the same column names, or map a Kaggle e-commerce sales file through `src/data_preprocessing.py` (`normalize_kaggle_sales_dataframe` / `aggregate_kaggle_to_demand`).

## Files

| File | Used by |
| --- | --- |
| `artisan_product_demand_sample.csv` | Demand Random Forest |
| `artisan_product_pricing_sample.csv` | Price Random Forest |
| `artisan_customer_behaviour_sample.csv` | K-Means segmentation |
| `artisan_monthly_trends_sample.csv` | Category trend analysis |
| `sales_history.csv` | Real completed-sales demand preprocessing |
| `price_history.csv` | Schema for actual cost and completed-selling-price records |
| `customer_purchase_history.csv` | Schema for anonymized completed-purchase segmentation |

## Real completed-sales format

`sales_history.csv` is a schema-only/anonymized real-sales input. It contains
no customer identities or personal fields. Required columns:

```text
order_id,product_id,product_category,order_date,quantity,product_location,unit_price,order_status
```

Only statuses `completed`, `complete`, `paid`, or `delivered` contribute to
sales quantities. Cancelled, returned, incomplete, and unknown statuses are
excluded. The preprocessing script aggregates completed quantities by
category, location, and month, then creates a previous-period historical
units feature. Product views and enquiries remain unavailable unless a
separate real observations source is added.

Do not populate this file with synthetic records and label them real. Replace
the file only with authorized, anonymized export data.

## Price and customer schemas

`price_history.csv` is reserved for actual raw material cost, labour cost,
production time, category, size, and completed selling prices. It is not
currently populated or connected to the website.

`customer_purchase_history.csv` is reserved for pseudonymous/anonymized
customer aggregates only. Cancelled and returned transactions must be
excluded before aggregation. It must not contain names, email addresses,
phone numbers, addresses, or free-text customer records.

Regenerate with:

```powershell
python src\generate_sample_data.py
```
