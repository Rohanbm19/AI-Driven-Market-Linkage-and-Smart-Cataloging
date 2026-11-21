CREATE OR REPLACE VIEW public.market_insights_by_category
WITH (security_invoker = TRUE) AS
WITH normalized_products AS (
  SELECT
    id,
    CASE
      WHEN LOWER(TRIM(category)) IN ('pottery', 'terracotta pottery')
        THEN 'pottery'
      ELSE LOWER(TRIM(category))
    END AS category_key,
    CASE
      WHEN LOWER(TRIM(category)) IN ('pottery', 'terracotta pottery')
        THEN 'Pottery'
      ELSE category
    END AS category,
    stock,
    price
  FROM public.products
),
product_totals AS (
  SELECT
    category_key,
    MIN(category) AS category,
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE stock > 0) AS in_stock_products,
    ROUND(AVG(price), 2) AS average_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price
  FROM normalized_products
  GROUP BY category_key
),
view_totals AS (
  SELECT
    np.category_key,
    COUNT(*) FILTER (
      WHERE v.viewed_at >= NOW() - INTERVAL '30 days'
    ) AS views_30d,
    COUNT(*) FILTER (
      WHERE v.viewed_at >= NOW() - INTERVAL '60 days'
        AND v.viewed_at < NOW() - INTERVAL '30 days'
    ) AS previous_views_30d
  FROM public.product_views v
  JOIN normalized_products np ON np.id = v.product_id
  GROUP BY np.category_key
),
enquiry_totals AS (
  SELECT
    np.category_key,
    COUNT(*) FILTER (
      WHERE e.created_at >= NOW() - INTERVAL '30 days'
    ) AS enquiries_30d,
    COUNT(*) FILTER (
      WHERE e.created_at >= NOW() - INTERVAL '60 days'
        AND e.created_at < NOW() - INTERVAL '30 days'
    ) AS previous_enquiries_30d
  FROM public.enquiries e
  JOIN normalized_products np ON np.id = e.product_id
  GROUP BY np.category_key
)
SELECT
  pt.category,
  pt.total_products,
  pt.in_stock_products,
  COALESCE(vt.views_30d, 0) AS views_30d,
  COALESCE(vt.previous_views_30d, 0) AS previous_views_30d,
  COALESCE(et.enquiries_30d, 0) AS enquiries_30d,
  COALESCE(et.previous_enquiries_30d, 0) AS previous_enquiries_30d,
  pt.average_price,
  pt.min_price,
  pt.max_price,
  CASE
    WHEN COALESCE(et.previous_enquiries_30d, 0) > 0
      THEN ROUND(
        100.0 * (et.enquiries_30d - et.previous_enquiries_30d)
          / et.previous_enquiries_30d,
        1
      )
    ELSE NULL
  END AS enquiry_growth_percent,
  CASE
    WHEN COALESCE(et.previous_enquiries_30d, 0) = 0
      AND COALESCE(et.enquiries_30d, 0) > 0 THEN 'new_activity'
    WHEN COALESCE(et.previous_enquiries_30d, 0) = 0 THEN 'insufficient_history'
    WHEN et.enquiries_30d > et.previous_enquiries_30d THEN 'increasing'
    WHEN et.enquiries_30d < et.previous_enquiries_30d THEN 'decreasing'
    ELSE 'stable'
  END AS demand_direction
FROM product_totals pt
LEFT JOIN view_totals vt ON vt.category_key = pt.category_key
LEFT JOIN enquiry_totals et ON et.category_key = pt.category_key;
