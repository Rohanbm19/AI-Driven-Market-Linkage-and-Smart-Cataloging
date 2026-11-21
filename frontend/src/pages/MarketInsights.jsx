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
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.js';

function formatNumber(value, lang) {
  return new Intl.NumberFormat(`${lang}-IN`, {
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatPrice(value, lang) {
  return new Intl.NumberFormat(`${lang}-IN`, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export default function MarketInsights() {
  const { t, lang } = useLanguage();
  const text = t.insights || {};
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [demandCategory, setDemandCategory] = useState('');
  const [demandForecast, setDemandForecast] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState('');

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
            supportedCategories.some((category) => category.category === current)
              ? current
              : supportedCategories[0]?.category || ''
          ));
        }
      } catch (loadError) {
        console.error('Could not load live market insights:', loadError);
        if (active) {
          setInsights(null);
          setError(loadError.message || text.loadError);
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

  const categories = useMemo(() => (
    [...(insights?.categories || [])].sort(
      (a, b) => Number(b.enquiries_30d || 0) - Number(a.enquiries_30d || 0)
    )
  ), [insights]);
  const demandCategories = categories.filter((category) => category.ml_supported);
  const overview = insights?.overview;
  const maxEnquiries = Math.max(
    1,
    ...categories.map((category) => Number(category.enquiries_30d || 0))
  );
  const stats = overview
    ? [
      { value: formatNumber(overview.total_products, lang), label: text.liveProducts, Icon: Package, color: 'saffron' },
      { value: formatNumber(overview.views_30d, lang), label: text.views30d, Icon: Eye, color: 'blue' },
      { value: formatNumber(overview.enquiries_30d, lang), label: text.enquiries30d, Icon: TrendingUp, color: 'green' },
      { value: formatPrice(overview.average_listing_price, lang), label: text.averagePrice, Icon: DollarSign, color: 'violet' }
    ]
    : [];

  const categoryLabel = (category) => (
    t.market?.[String(category).toLowerCase()] ||
    String(category).replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  );

  const demandLabel = (direction) => {
    const key = String(direction || '').replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
    return text[key] || text.insufficientHistory;
  };

  const handleDemandForecast = async () => {
    if (!demandCategory || demandLoading) return;
    setDemandLoading(true);
    setDemandError('');
    setDemandForecast(null);

    try {
      setDemandForecast(await api.getLiveDemandForecast(demandCategory));
    } catch (forecastError) {
      setDemandError(forecastError.message || text.mlError);
    } finally {
      setDemandLoading(false);
    }
  };

  return (
    <div className="insights-page">
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
                <ArrowUpRight className="insights-stat-arrow" size={17} aria-hidden="true" />
              </article>
            ))}
          </section>

          <section className="insights-panel insights-ml-panel">
            <div className="insights-panel-heading">
              <div>
                <span className="insights-section-kicker">{text.mlTitle}</span>
                <h2>{text.mlDescription}</h2>
              </div>
              <span className="insights-panel-icon"><Sparkles size={19} /></span>
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
                  disabled={demandCategories.length === 0 || demandLoading}
                >
                  {demandCategories.map((category) => (
                    <option key={category.category} value={category.category}>
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
                {demandLoading && <RefreshCw size={16} className="animate-spin" />}
                {demandLoading ? text.mlLoading : text.mlRunForecast}
              </button>
            </div>
            {categories.some((category) => !category.ml_supported) && (
              <small className="insights-ml-note">{text.mlUnsupportedNote}</small>
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
                      demandForecast.prediction.predicted_sales_quantity,
                      lang
                    )}
                  </strong>
                  <span>{text.mlEstimatedUnits}</span>
                </div>
                <p>
                  {text.mlDemandClass}:{' '}
                  <strong>
                    {text[demandForecast.prediction.demand_class.toLowerCase()] ||
                      demandForecast.prediction.demand_class}
                  </strong>
                </p>
                <p>
                  {text.mlLiveSignals}: {formatNumber(demandForecast.liveInputs.productViews30d, lang)} {text.views}
                  {' · '}
                  {formatNumber(demandForecast.liveInputs.buyerEnquiries30d, lang)} {text.enquiries}
                </p>
                <small>{text.mlTrainingNote}</small>
              </div>
            )}
          </section>

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
                      <span className="insights-section-kicker">{text.enquiries30d}</span>
                      <h2>{text.buyerActivity}</h2>
                    </div>
                    <span className="insights-panel-icon"><BarChart3 size={19} /></span>
                  </div>
                  <div className="insights-growth-list">
                    {categories.map((category) => {
                      const count = Number(category.enquiries_30d || 0);
                      const name = categoryLabel(category.category);
                      return (
                        <div className="insights-growth-row" key={category.category}>
                          <div className="insights-growth-label">
                            <span>{name}</span>
                            <strong>{formatNumber(count, lang)}</strong>
                          </div>
                          <div
                            className="insights-growth-track"
                            role="img"
                            aria-label={`${name}: ${formatNumber(count, lang)} ${text.enquiries}`}
                          >
                            <span style={{ width: `${(count / maxEnquiries) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <aside className="insights-benchmark">
                  <div className="insights-benchmark-top">
                    <span className="insights-benchmark-icon"><Eye size={19} /></span>
                    <span>{text.views30d}</span>
                  </div>
                  <div className="insights-margin-value">
                    {formatNumber(overview.views_30d, lang)}
                  </div>
                  <h2>{text.buyerActivity}</h2>
                  <p>{text.dataSourceNote}</p>
                  <div className="insights-benchmark-divider" />
                  <div className="insights-benchmark-foot">
                    <ShieldCheck size={17} aria-hidden="true" />
                    <span>{text.enquiries30d}</span>
                    <strong>{formatNumber(overview.enquiries_30d, lang)}</strong>
                  </div>
                </aside>
              </section>

              <section className="insights-crafts-panel">
                <div className="insights-panel-heading">
                  <div>
                    <span className="insights-section-kicker">{text.intensity}</span>
                    <h2>{text.topCrafts}</h2>
                  </div>
                  <span className="insights-craft-count">{categories.length}</span>
                </div>

                <div className="insights-craft-grid">
                  {categories.map((category, index) => {
                    const hasGrowth = category.enquiry_growth_percent !== null &&
                      category.enquiry_growth_percent !== undefined;
                    const growth = Number(category.enquiry_growth_percent);
                    const DirectionIcon = growth < 0 ? TrendingDown : TrendingUp;

                    return (
                      <article className="insights-craft-card" key={category.category}>
                        <div className="insights-craft-card-heading">
                          <span className="insights-craft-index">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3>{categoryLabel(category.category)}</h3>
                            <span className="insights-craft-region">
                              {formatNumber(category.total_products, lang)} {text.categoryProducts}
                            </span>
                          </div>
                          <span className={`insights-demand demand-${category.demand_direction}`}>
                            {demandLabel(category.demand_direction)}
                          </span>
                        </div>

                        <div className="insights-craft-metrics">
                          <div>
                            <span>{text.enquiries}</span>
                            <strong>{formatNumber(category.enquiries_30d, lang)}</strong>
                          </div>
                          <div>
                            <span>{text.views}</span>
                            <strong>{formatNumber(category.views_30d, lang)}</strong>
                          </div>
                          <div>
                            <span>{text.averagePrice}</span>
                            <strong>{formatPrice(category.average_price, lang)}</strong>
                          </div>
                        </div>

                        <div className="insights-craft-buyers">
                          {hasGrowth ? (
                            <span className="insights-growth-summary">
                              <DirectionIcon size={15} aria-hidden="true" />
                              {text.growth}: {growth > 0 ? '+' : ''}{formatNumber(growth, lang)}%
                            </span>
                          ) : (
                            <span className="insights-growth-summary">
                              <BarChart3 size={15} aria-hidden="true" />
                              {text.noGrowthBaseline}
                            </span>
                          )}
                          <span className="insights-price-range">
                            {text.priceRange}: {formatPrice(category.min_price, lang)} – {formatPrice(category.max_price, lang)}
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
    </div>
  );
}
