
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Eye,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Users,
  IndianRupee,
  Activity,
  ChartNoAxesCombined
} from 'lucide-react';

import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.js';

function formatNumber(value, lang = 'en') {
  return new Intl.NumberFormat(`${lang}-IN`, {
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function formatPrice(value, lang = 'en') {
  return new Intl.NumberFormat(`${lang}-IN`, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getErrorMessage(error) {
  return error?.message || 'Something went wrong. Please try again.';
}

function ResultDetails({ result, lang }) {
  if (!result) return null;

  const prediction = result.prediction || result;

  const primaryValue =
    prediction.predicted_sales_quantity ??
    prediction.predicted_units ??
    prediction.estimated_price ??
    prediction.predicted_price ??
    prediction.cluster ??
    result.predicted_sales_quantity ??
    result.predicted_units ??
    result.estimated_price ??
    result.predicted_price ??
    null;

  const primaryLabel =
    prediction.predicted_sales_quantity !== undefined
      ? 'Predicted sales quantity'
      : prediction.predicted_units !== undefined
        ? 'Predicted units'
        : prediction.estimated_price !== undefined
          ? 'Estimated price'
          : prediction.predicted_price !== undefined
            ? 'Predicted price'
            : prediction.cluster !== undefined
              ? 'Assigned cluster'
              : 'Prediction result';

  const details = [
    ['Demand class', prediction.demand_class ?? result.demand_class],
    ['Production cost', result.production_cost],
    ['Estimated profit', result.estimated_profit],
    ['Cost-based minimum', result.cost_based_min],
    ['Target price', result.target_price],
    ['Cluster', result.cluster],
    ['Dataset type', result.datasetType ?? result.dataset_type],
    ['Prediction status', result.prediction_status]
  ].filter(([, value]) => value !== undefined && value !== null);

  const disclaimer =
    result.disclaimer ||
    result.note ||
    result.warning ||
    'Exploratory result. Validate this prediction against real marketplace data before making business decisions.';

  return (
    <div className="insights-ai-result" aria-live="polite">
      <div className="insights-ai-result-heading">
        <span><ShieldCheck size={17} /> Prediction generated</span>
        {result.prediction_status && (
          <span className="insights-ai-status">
            {String(result.prediction_status).replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {primaryValue !== null && (
        <div className="insights-ai-primary">
          <span>{primaryLabel}</span>
          <strong>
            {typeof primaryValue === 'number' &&
            (primaryLabel.toLowerCase().includes('price'))
              ? formatPrice(primaryValue, lang)
              : formatNumber(primaryValue, lang)}
          </strong>
        </div>
      )}

      {details.length > 0 && (
        <div className="insights-ai-metrics">
          {details.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>
                {typeof value === 'number' && (
                  label.toLowerCase().includes('price') ||
                  label.toLowerCase().includes('cost') ||
                  label.toLowerCase().includes('profit')
                )
                  ? formatPrice(value, lang)
                  : String(value)}
                {label === 'Demand class' ? '' : ''}
              </strong>
            </div>
          ))}
        </div>
      )}

      <p className="insights-ai-disclaimer">{disclaimer}</p>

      <details className="insights-ai-raw">
        <summary>View complete model response</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

function JsonDataPanel({ data, emptyMessage = 'No information available.' }) {
  if (!data) {
    return <p className="insights-ai-empty">{emptyMessage}</p>;
  }

  return (
    <details className="insights-ai-raw" open>
      <summary>View model information</summary>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

export default function MarketInsights() {
  const { t, lang } = useLanguage();
  const text = t.insights || {};

  // Existing live marketplace state
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // Existing live demand forecast state
  const [demandCategory, setDemandCategory] = useState('');
  const [demandForecast, setDemandForecast] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState('');

  // ML model information
  const [mlInsights, setMlInsights] = useState(null);
  const [mlTrends, setMlTrends] = useState(null);
  const [mlInfoLoading, setMlInfoLoading] = useState(true);
  const [mlInfoError, setMlInfoError] = useState('');

  // Exploratory demand form
  const [demandForm, setDemandForm] = useState({
    category: 'Pottery',
    location: 'Jaipur',
    historicalUnits: '20',
    views: '300',
    enquiries: '8',
    month: '11',
    festival: 'Diwali'
  });
  const [mlDemandResult, setMlDemandResult] = useState(null);
  const [mlDemandLoading, setMlDemandLoading] = useState(false);
  const [mlDemandError, setMlDemandError] = useState('');

  // Price prediction form
  const [priceForm, setPriceForm] = useState({
    category: 'Textiles',
    material: '600',
    labour: '1400',
    size: 'Medium',
    hours: '12',
    marketPrice: '2800'
  });
  const [priceResult, setPriceResult] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Customer segmentation form
  const [segmentForm, setSegmentForm] = useState({
    purchases: '22',
    aov: '950',
    frequency: '12',
    categories: 'Pottery, Baskets'
  });
  const [segmentResult, setSegmentResult] = useState(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [segmentError, setSegmentError] = useState('');

  // Load existing live marketplace insights
  useEffect(() => {
    let active = true;

    async function loadInsights() {
      setLoading(true);
      setError('');

      try {
        const result = await api.getMarketInsights();

        if (active) {
          setInsights(result);

          const supportedCategories = (result.categories || []).filter(
            (category) => category.ml_supported
          );

          setDemandCategory((current) => (
            supportedCategories.some(
              (category) => category.category === current
            )
              ? current
              : supportedCategories[0]?.category || ''
          ));
        }
      } catch (loadError) {
        console.error('Could not load live market insights:', loadError);

        if (active) {
          setInsights(null);
          setError(getErrorMessage(loadError) || text.loadError);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInsights();

    return () => {
      active = false;
    };
  }, [retry, text.loadError]);

  // Load ML evaluation and category trends
  useEffect(() => {
    let active = true;

    async function loadMlInformation() {
      setMlInfoLoading(true);
      setMlInfoError('');

      const [insightsResult, trendsResult] = await Promise.allSettled([
        api.getMlInsights(),
        api.getMlTrends()
      ]);

      if (!active) return;

      if (insightsResult.status === 'fulfilled') {
        setMlInsights(insightsResult.value);
      } else {
        setMlInfoError(getErrorMessage(insightsResult.reason));
      }

      if (trendsResult.status === 'fulfilled') {
        setMlTrends(trendsResult.value);
      } else {
        setMlInfoError((current) => (
          current
            ? `${current} | ${getErrorMessage(trendsResult.reason)}`
            : getErrorMessage(trendsResult.reason)
        ));
      }

      setMlInfoLoading(false);
    }

    loadMlInformation();

    return () => {
      active = false;
    };
  }, [retry]);

  const categories = useMemo(() => (
    [...(insights?.categories || [])].sort(
      (a, b) => Number(b.enquiries_30d || 0) -
        Number(a.enquiries_30d || 0)
    )
  ), [insights]);

  const demandCategories = categories.filter(
    (category) => category.ml_supported
  );

  const overview = insights?.overview;

  const maxEnquiries = Math.max(
    1,
    ...categories.map((category) => Number(category.enquiries_30d || 0))
  );

  const stats = overview
    ? [
      {
        value: formatNumber(overview.total_products, lang),
        label: text.liveProducts,
        Icon: Package,
        color: 'saffron'
      },
      {
        value: formatNumber(overview.views_30d, lang),
        label: text.views30d,
        Icon: Eye,
        color: 'blue'
      },
      {
        value: formatNumber(overview.enquiries_30d, lang),
        label: text.enquiries30d,
        Icon: TrendingUp,
        color: 'green'
      },
      {
        value: formatPrice(overview.average_listing_price, lang),
        label: text.averagePrice,
        Icon: DollarSign,
        color: 'violet'
      }
    ]
    : [];

  const categoryLabel = (category) => (
    t.market?.[String(category).toLowerCase()] ||
    String(category)
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );

  const demandLabel = (direction) => {
    const key = String(direction || '')
      .replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());

    return text[key] || text.insufficientHistory || key;
  };

  // Existing live marketplace forecast
  const handleDemandForecast = async () => {
    if (!demandCategory || demandLoading) return;

    setDemandLoading(true);
    setDemandError('');
    setDemandForecast(null);

    try {
      setDemandForecast(
        await api.getLiveDemandForecast(demandCategory)
      );
    } catch (forecastError) {
      setDemandError(getErrorMessage(forecastError));
    } finally {
      setDemandLoading(false);
    }
  };

  // Exploratory ML demand prediction
  const handleMlDemand = async (event) => {
    event.preventDefault();

    setMlDemandLoading(true);
    setMlDemandError('');
    setMlDemandResult(null);

    try {
      const payload = {
        category: demandForm.category,
        location: demandForm.location.trim(),
        historicalUnits: Number(demandForm.historicalUnits),
        views: Number(demandForm.views),
        enquiries: Number(demandForm.enquiries),
        month: Number(demandForm.month),
        festival: demandForm.festival.trim()
      };

      const result = await api.predictMlDemand(payload);
      setMlDemandResult(result);
    } catch (predictionError) {
      setMlDemandError(getErrorMessage(predictionError));
    } finally {
      setMlDemandLoading(false);
    }
  };

  // ML price prediction
  const handlePricePrediction = async (event) => {
    event.preventDefault();

    setPriceLoading(true);
    setPriceError('');
    setPriceResult(null);

    try {
      const payload = {
        category: priceForm.category,
        material: Number(priceForm.material),
        labour: Number(priceForm.labour),
        size: priceForm.size,
        hours: Number(priceForm.hours),
        marketPrice: Number(priceForm.marketPrice)
      };

      const result = await api.predictMlPrice(payload);
      setPriceResult(result);
    } catch (predictionError) {
      setPriceError(getErrorMessage(predictionError));
    } finally {
      setPriceLoading(false);
    }
  };

  // ML customer segmentation
  const handleSegmentPrediction = async (event) => {
    event.preventDefault();

    setSegmentLoading(true);
    setSegmentError('');
    setSegmentResult(null);

    try {
      const payload = {
        purchases: Number(segmentForm.purchases),
        aov: Number(segmentForm.aov),
        frequency: Number(segmentForm.frequency),
        categories: segmentForm.categories
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      };

      const result = await api.predictMlSegment(payload);
      setSegmentResult(result);
    } catch (predictionError) {
      setSegmentError(getErrorMessage(predictionError));
    } finally {
      setSegmentLoading(false);
    }
  };

  const updateDemandForm = (event) => {
    const { name, value } = event.target;

    setDemandForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const updatePriceForm = (event) => {
    const { name, value } = event.target;

    setPriceForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const updateSegmentForm = (event) => {
    const { name, value } = event.target;

    setSegmentForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const mlDisclaimer =
    'Development notice: ML model outputs and evaluation metrics are based on synthetic sample data. They are exploratory and are not verified real-world market predictions.';

  return (
    <div className="insights-page">

      {/* HERO */}
      <section className="insights-hero">
        <div className="insights-hero-copy">
          <span className="insights-kicker">
            <Sparkles size={15} aria-hidden="true" />
            {text.growth}
          </span>

          <h1>{text.title}</h1>
          <p>{text.desc}</p>
        </div>

        <div className="insights-hero-mark" aria-hidden="true">
          <div className="insights-hero-orbit insights-hero-orbit-one" />
          <div className="insights-hero-orbit insights-hero-orbit-two" />

          <div className="insights-hero-emblem">
            <BarChart3 size={34} strokeWidth={1.8} />
            <span>{formatNumber(categories.length, lang)}</span>
            <small>{text.topCrafts}</small>
          </div>
        </div>
      </section>

      {/* LIVE MARKETPLACE DASHBOARD */}
      {loading ? (
        <div className="insights-state" role="status">
          <span className="spinner" />
          <p>{text.loading}</p>
        </div>
      ) : error ? (
        <div className="insights-state is-error" role="alert">
          <p><strong>{text.loadError}</strong></p>
          <p>{error}</p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            <RefreshCw size={15} />
            {t.market?.retry || 'Retry'}
          </button>
        </div>
      ) : (
        <>
          {/* MARKET STATISTICS */}
          <section className="insights-stats" aria-label={text.title}>
            {stats.map(({ value, label, Icon, color }) => (
              <article className="insights-stat-card" key={label}>
                <div className={`insights-stat-icon ${color}`}>
                  <Icon size={21} strokeWidth={2} aria-hidden="true" />
                </div>

                <div className="insights-stat-content">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>

                <ArrowUpRight
                  className="insights-stat-arrow"
                  size={17}
                  aria-hidden="true"
                />
              </article>
            ))}
          </section>

          {/* EXISTING LIVE DEMAND FORECAST */}
          <section className="insights-panel insights-ml-panel">
            <div className="insights-panel-heading">
              <div>
                <span className="insights-section-kicker">
                  {text.mlTitle}
                </span>
                <h2>{text.mlDescription}</h2>
              </div>

              <span className="insights-panel-icon">
                <Sparkles size={19} />
              </span>
            </div>

            <div className="insights-ml-controls">
              <label className="insights-ml-select">
                <span>{text.mlSelectCategory}</span>

                <select
                  className="form-input"
                  value={demandCategory}
                  onChange={(event) => {
                    setDemandCategory(event.target.value);
                    setDemandForecast(null);
                    setDemandError('');
                  }}
                  disabled={
                    demandCategories.length === 0 || demandLoading
                  }
                >
                  {demandCategories.map((category) => (
                    <option
                      key={category.category}
                      value={category.category}
                    >
                      {categoryLabel(category.category)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDemandForecast}
                disabled={!demandCategory || demandLoading}
              >
                {demandLoading && (
                  <RefreshCw size={16} className="animate-spin" />
                )}

                {demandLoading
                  ? text.mlLoading
                  : text.mlRunForecast}
              </button>
            </div>

            {categories.some((category) => !category.ml_supported) && (
              <small className="insights-ml-note">
                {text.mlUnsupportedNote}
              </small>
            )}

            {demandError && (
              <p className="insights-ml-error" role="alert">
                {text.mlError}: {demandError}
              </p>
            )}

            {demandForecast && (
              <div className="insights-ml-result" aria-live="polite">
                <div className="insights-ml-result-main">
                  <strong>
                    {formatNumber(
                      demandForecast.prediction?.predicted_sales_quantity,
                      lang
                    )}
                  </strong>

                  <span>{text.mlEstimatedUnits}</span>
                </div>

                <p>
                  {text.mlDemandClass}:{' '}
                  <strong>
                    {text[
                      String(
                        demandForecast.prediction?.demand_class || ''
                      ).toLowerCase()
                    ] || demandForecast.prediction?.demand_class || '—'}
                  </strong>
                </p>

                <p>
                  {text.mlLiveSignals}:{' '}
                  {formatNumber(
                    demandForecast.liveInputs?.productViews30d,
                    lang
                  )} {text.views}
                  {' · '}
                  {formatNumber(
                    demandForecast.liveInputs?.buyerEnquiries30d,
                    lang
                  )} {text.enquiries}
                </p>

                <small>
                  {demandForecast.disclaimer || text.mlTrainingNote}
                </small>
              </div>
            )}
          </section>

          {/* CATEGORY ACTIVITY AND BENCHMARK */}
          {categories.length === 0 ? (
            <div className="insights-state">
              <Package size={28} aria-hidden="true" />
              <p>{text.noData}</p>
            </div>
          ) : (
            <>
              <section className="insights-overview">
                <article className="insights-panel insights-growth-panel">
                  <div className="insights-panel-heading">
                    <div>
                      <span className="insights-section-kicker">
                        {text.enquiries30d}
                      </span>
                      <h2>{text.buyerActivity}</h2>
                    </div>

                    <span className="insights-panel-icon">
                      <BarChart3 size={19} />
                    </span>
                  </div>

                  <div className="insights-growth-list">
                    {categories.map((category) => {
                      const count = Number(
                        category.enquiries_30d || 0
                      );

                      const name = categoryLabel(category.category);

                      return (
                        <div
                          className="insights-growth-row"
                          key={category.category}
                        >
                          <div className="insights-growth-label">
                            <span>{name}</span>
                            <strong>{formatNumber(count, lang)}</strong>
                          </div>

                          <div
                            className="insights-growth-track"
                            role="img"
                            aria-label={`${name}: ${formatNumber(count, lang)} ${text.enquiries}`}
                          >
                            <span
                              style={{
                                width: `${(count / maxEnquiries) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <aside className="insights-benchmark">
                  <div className="insights-benchmark-top">
                    <span className="insights-benchmark-icon">
                      <Eye size={19} />
                    </span>
                    <span>{text.views30d}</span>
                  </div>

                  <div className="insights-margin-value">
                    {formatNumber(overview?.views_30d, lang)}
                  </div>

                  <h2>{text.buyerActivity}</h2>
                  <p>{text.dataSourceNote}</p>

                  <div className="insights-benchmark-divider" />

                  <div className="insights-benchmark-foot">
                    <ShieldCheck size={17} aria-hidden="true" />
                    <span>{text.enquiries30d}</span>
                    <strong>
                      {formatNumber(overview?.enquiries_30d, lang)}
                    </strong>
                  </div>
                </aside>
              </section>

              {/* CATEGORY CARDS */}
              <section className="insights-crafts-panel">
                <div className="insights-panel-heading">
                  <div>
                    <span className="insights-section-kicker">
                      {text.intensity}
                    </span>
                    <h2>{text.topCrafts}</h2>
                  </div>

                  <span className="insights-craft-count">
                    {categories.length}
                  </span>
                </div>

                <div className="insights-craft-grid">
                  {categories.map((category, index) => {
                    const hasGrowth =
                      category.enquiry_growth_percent !== null &&
                      category.enquiry_growth_percent !== undefined;

                    const growth = Number(
                      category.enquiry_growth_percent
                    );

                    const DirectionIcon =
                      growth < 0 ? TrendingDown : TrendingUp;

                    return (
                      <article
                        className="insights-craft-card"
                        key={category.category}
                      >
                        <div className="insights-craft-card-heading">
                          <span className="insights-craft-index">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div>
                            <h3>{categoryLabel(category.category)}</h3>

                            <span className="insights-craft-region">
                              {formatNumber(category.total_products, lang)}{' '}
                              {text.categoryProducts}
                            </span>
                          </div>

                          <span
                            className={`insights-demand demand-${category.demand_direction}`}
                          >
                            {demandLabel(category.demand_direction)}
                          </span>
                        </div>

                        <div className="insights-craft-metrics">
                          <div>
                            <span>{text.enquiries}</span>
                            <strong>
                              {formatNumber(category.enquiries_30d, lang)}
                            </strong>
                          </div>

                          <div>
                            <span>{text.views}</span>
                            <strong>
                              {formatNumber(category.views_30d, lang)}
                            </strong>
                          </div>

                          <div>
                            <span>{text.averagePrice}</span>
                            <strong>
                              {formatPrice(category.average_price, lang)}
                            </strong>
                          </div>
                        </div>

                        <div className="insights-craft-buyers">
                          {hasGrowth ? (
                            <span className="insights-growth-summary">
                              <DirectionIcon size={15} aria-hidden="true" />
                              {text.growth}: {growth > 0 ? '+' : ''}
                              {formatNumber(growth, lang)}%
                            </span>
                          ) : (
                            <span className="insights-growth-summary">
                              <BarChart3 size={15} aria-hidden="true" />
                              {text.noGrowthBaseline}
                            </span>
                          )}

                          <span className="insights-price-range">
                            {text.priceRange}:{' '}
                            {formatPrice(category.min_price, lang)} –{' '}
                            {formatPrice(category.max_price, lang)}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* =====================================
          EXPLORATORY ML FEATURES
      ====================================== */}

      <section className="insights-ai-section">
        <div className="insights-ai-section-heading">
          <span className="insights-section-kicker">
            <BrainCircuit size={16} />
            KALASETU AI MARKET INTELLIGENCE
          </span>

          <h2>Machine Learning Analysis</h2>

          <p>
            Explore demand, estimate product prices and understand
            customer segments using the trained ML models.
          </p>
        </div>

        <div className="insights-ai-notice">
          <ShieldCheck size={19} />
          <p>{mlDisclaimer}</p>
        </div>

        {/* ML DEMAND PREDICTION */}
        <article className="insights-panel insights-ai-panel">
          <div className="insights-panel-heading">
            <div>
              <span className="insights-section-kicker">
                <ChartNoAxesCombined size={15} />
                MODEL 01
              </span>
              <h2>AI Demand Prediction</h2>
              <p>
                Estimate product demand using historical units,
                product views, enquiries, location and festival inputs.
              </p>
            </div>

            <span className="insights-panel-icon">
              <TrendingUp size={20} />
            </span>
          </div>

          <form className="insights-ai-form" onSubmit={handleMlDemand}>
            <label>
              Product category
              <select
                className="form-input"
                name="category"
                value={demandForm.category}
                onChange={updateDemandForm}
              >
                <option value="Pottery">Pottery</option>
                <option value="Textiles">Textiles</option>
                <option value="Woodwork">Woodwork</option>
                <option value="Metal">Metal</option>
                <option value="Jewellery">Jewellery</option>
                <option value="Baskets">Baskets</option>
              </select>
            </label>

            <label>
              Location
              <input
                className="form-input"
                name="location"
                value={demandForm.location}
                onChange={updateDemandForm}
                placeholder="Example: Jaipur"
                required
              />
            </label>

            <label>
              Historical units sold
              <input
                className="form-input"
                type="number"
                min="0"
                name="historicalUnits"
                value={demandForm.historicalUnits}
                onChange={updateDemandForm}
                required
              />
            </label>

            <label>
              Product views
              <input
                className="form-input"
                type="number"
                min="0"
                name="views"
                value={demandForm.views}
                onChange={updateDemandForm}
                required
              />
            </label>

            <label>
              Buyer enquiries
              <input
                className="form-input"
                type="number"
                min="0"
                name="enquiries"
                value={demandForm.enquiries}
                onChange={updateDemandForm}
                required
              />
            </label>

            <label>
              Month (1–12)
              <input
                className="form-input"
                type="number"
                min="1"
                max="12"
                name="month"
                value={demandForm.month}
                onChange={updateDemandForm}
                required
              />
            </label>

            <label>
              Festival / occasion
              <input
                className="form-input"
                name="festival"
                value={demandForm.festival}
                onChange={updateDemandForm}
                placeholder="Example: Diwali"
              />
            </label>

            <div className="insights-ai-form-action">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mlDemandLoading}
              >
                {mlDemandLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {mlDemandLoading
                  ? 'Predicting demand...'
                  : 'Predict demand'}
              </button>
            </div>
          </form>

          {mlDemandError && (
            <p className="insights-ml-error" role="alert">
              {mlDemandError}
            </p>
          )}

          <ResultDetails result={mlDemandResult} lang={lang} />
        </article>

        {/* ML PRICE PREDICTION */}
        <article className="insights-panel insights-ai-panel">
          <div className="insights-panel-heading">
            <div>
              <span className="insights-section-kicker">
                <IndianRupee size={15} />
                MODEL 02
              </span>
              <h2>AI Product Price Prediction</h2>
              <p>
                Estimate a product price using material cost, labour,
                working hours, size and market price.
              </p>
            </div>

            <span className="insights-panel-icon">
              <DollarSign size={20} />
            </span>
          </div>

          <form className="insights-ai-form" onSubmit={handlePricePrediction}>
            <label>
              Product category
              <select
                className="form-input"
                name="category"
                value={priceForm.category}
                onChange={updatePriceForm}
              >
                <option value="Textiles">Textiles</option>
                <option value="Pottery">Pottery</option>
                <option value="Woodwork">Woodwork</option>
                <option value="Metal">Metal</option>
                <option value="Jewellery">Jewellery</option>
                <option value="Baskets">Baskets</option>
              </select>
            </label>

            <label>
              Material cost (₹)
              <input
                className="form-input"
                type="number"
                min="0"
                name="material"
                value={priceForm.material}
                onChange={updatePriceForm}
                required
              />
            </label>

            <label>
              Labour cost (₹)
              <input
                className="form-input"
                type="number"
                min="0"
                name="labour"
                value={priceForm.labour}
                onChange={updatePriceForm}
                required
              />
            </label>

            <label>
              Product size
              <select
                className="form-input"
                name="size"
                value={priceForm.size}
                onChange={updatePriceForm}
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </label>

            <label>
              Working hours
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                name="hours"
                value={priceForm.hours}
                onChange={updatePriceForm}
                required
              />
            </label>

            <label>
              Current market price (₹)
              <input
                className="form-input"
                type="number"
                min="0"
                name="marketPrice"
                value={priceForm.marketPrice}
                onChange={updatePriceForm}
                required
              />
            </label>

            <div className="insights-ai-form-action">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={priceLoading}
              >
                {priceLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <IndianRupee size={16} />
                )}
                {priceLoading
                  ? 'Calculating price...'
                  : 'Predict product price'}
              </button>
            </div>
          </form>

          {priceError && (
            <p className="insights-ml-error" role="alert">
              {priceError}
            </p>
          )}

          <ResultDetails result={priceResult} lang={lang} />
        </article>

        {/* CUSTOMER SEGMENTATION */}
        <article className="insights-panel insights-ai-panel">
          <div className="insights-panel-heading">
            <div>
              <span className="insights-section-kicker">
                <Users size={15} />
                MODEL 03
              </span>
              <h2>Customer Segmentation</h2>
              <p>
                Identify a customer group using purchase count,
                average order value, frequency and preferred categories.
              </p>
            </div>

            <span className="insights-panel-icon">
              <Users size={20} />
            </span>
          </div>

          <form
            className="insights-ai-form"
            onSubmit={handleSegmentPrediction}
          >
            <label>
              Number of purchases
              <input
                className="form-input"
                type="number"
                min="0"
                name="purchases"
                value={segmentForm.purchases}
                onChange={updateSegmentForm}
                required
              />
            </label>

            <label>
              Average order value (₹)
              <input
                className="form-input"
                type="number"
                min="0"
                name="aov"
                value={segmentForm.aov}
                onChange={updateSegmentForm}
                required
              />
            </label>

            <label>
              Purchase frequency
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.1"
                name="frequency"
                value={segmentForm.frequency}
                onChange={updateSegmentForm}
                required
              />
            </label>

            <label>
              Preferred categories (comma separated)
              <input
                className="form-input"
                name="categories"
                value={segmentForm.categories}
                onChange={updateSegmentForm}
                placeholder="Pottery, Baskets"
              />
            </label>

            <div className="insights-ai-form-action">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={segmentLoading}
              >
                {segmentLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Users size={16} />
                )}
                {segmentLoading
                  ? 'Analysing customer...'
                  : 'Identify customer segment'}
              </button>
            </div>
          </form>

          {segmentError && (
            <p className="insights-ml-error" role="alert">
              {segmentError}
            </p>
          )}

          <ResultDetails result={segmentResult} lang={lang} />
        </article>

        {/* ML TRENDS */}
        <article className="insights-panel insights-ai-panel">
          <div className="insights-panel-heading">
            <div>
              <span className="insights-section-kicker">
                <Activity size={15} />
                MODEL 04
              </span>
              <h2>Market Trend Analysis</h2>
              <p>
                Review category-level trend information generated
                by the trained market intelligence model.
              </p>
            </div>

            <span className="insights-panel-icon">
              <TrendingUp size={20} />
            </span>
          </div>

          {mlInfoLoading ? (
            <div className="insights-ai-loading">
              <RefreshCw size={18} className="animate-spin" />
              Loading market trends...
            </div>
          ) : mlTrends ? (
            <JsonDataPanel data={mlTrends} />
          ) : (
            <p className="insights-ai-empty">
              Market trend information is currently unavailable.
            </p>
          )}
        </article>

        {/* MODEL EVALUATION */}
        <article className="insights-panel insights-ai-panel">
          <div className="insights-panel-heading">
            <div>
              <span className="insights-section-kicker">
                <BarChart3 size={15} />
                MODEL 05
              </span>
              <h2>ML Model Performance</h2>
              <p>
                Review the evaluation metrics and training information
                for the demand, price and customer segmentation models.
              </p>
            </div>

            <span className="insights-panel-icon">
              <BrainCircuit size={20} />
            </span>
          </div>

          {mlInfoLoading ? (
            <div className="insights-ai-loading">
              <RefreshCw size={18} className="animate-spin" />
              Loading model evaluation...
            </div>
          ) : mlInsights ? (
            <JsonDataPanel data={mlInsights} />
          ) : (
            <p className="insights-ai-empty">
              Model evaluation information is currently unavailable.
            </p>
          )}

          {mlInfoError && (
            <p className="insights-ml-error" role="alert">
              {mlInfoError}
            </p>
          )}

          <div className="insights-ai-notice insights-ai-notice-small">
            <ShieldCheck size={17} />
            <p>{mlDisclaimer}</p>
          </div>
        </article>
      </section>
    </div>
  );
}
