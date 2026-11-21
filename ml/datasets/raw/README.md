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

Regenerate with:

```powershell
python src\generate_sample_data.py
```
