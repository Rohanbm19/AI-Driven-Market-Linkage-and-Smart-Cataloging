
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Mic,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { api, MOCK_PRODUCTS } from '../services/api.js';
import { useLanguage } from '../i18n/index.js';
import { useVoiceInput } from '../hooks/useVoiceInput.js';

export default function Marketplace() {
  const { t, lang } = useLanguage();

  const hero = t.hero;
  const market = t.market;

  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalog() {
      try {
        const data = await api.getProducts();

        if (isMounted && data && data.length > 0) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Error fetching marketplace catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const { isListening, toggleListening } = useVoiceInput({
    currentLang: lang,
    onResult: (text) => {
      setSearchQuery(text);
    }
  });

  const categoryList = [
    { id: 'all', label: market.allCategories },
    { id: 'pottery', label: market.pottery },
    { id: 'textiles', label: market.textiles },
    { id: 'metal', label: market.metal },
    { id: 'woodwork', label: market.woodwork },
    { id: 'painting', label: market.painting },
    { id: 'other', label: market.other }
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        (p.artisan_name && p.artisan_name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) &&
          p.tags.some((tag) => tag.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        (selectedCategory === 'pottery' &&
          (p.category === 'pottery' || p.category === 'ceramics')) ||
        (selectedCategory === 'textiles' &&
          (p.category === 'textiles' || p.category === 'silk'));

      const matchesVerified = !verifiedOnly || p.is_verified;

      return matchesSearch && matchesCategory && matchesVerified;
    });
  }, [products, searchQuery, selectedCategory, verifiedOnly]);

  return (
    <div className="marketplace-page">
      {/* Homepage Hero Section */}
      <section className="hero-banner">
        <div className="hero-pattern-overlay" aria-hidden="true" />

        <div className="hero-content">
          <h1 className="hero-title">
            {hero.title}
          </h1>

          <p className="hero-desc">
            {hero.subtitle}
          </p>

          <div className="hero-cta-group">
            <a href="#marketplace-grid" className="btn btn-hero-explore">
              <span>{hero.exploreBtn}</span>
              <ArrowRight size={17} />
            </a>

            <Link to="/add-product" className="btn btn-hero-list">
              <Sparkles size={17} />
              <span>{hero.listBtn}</span>
            </Link>
          </div>
        </div>

        {/* Traditional Indian Crafts Showcase */}
        <div className="hero-visual-showcase" aria-hidden="true">
          <div className="hero-craft-card hero-craft-card-1">
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=480&q=80"
              alt={market.heroTerracottaAlt}
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroTerracotta}
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-2">
            <img
              src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=480&q=80"
              alt={market.heroBrassAlt}
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroBrass}
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-3">
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=480&q=80"
              alt={market.heroSilkAlt}
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroSilk}
            </div>
          </div>
        </div>
      </section>

      {/* Search and Voice Filter Bar */}
      <div className="market-filter-card">
        <div className="market-search-row">
          <div className="market-search-input-wrapper">
            <Search size={18} className="search-icon" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={market.searchLongPlaceholder}
              className="form-input search-input"
            />

            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title={market.clearSearch}
                aria-label={market.clearSearch}
              >
                ×
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <button
            type="button"
            className={`voice-search-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            title={
              isListening
                ? market.listeningStopTitle
                : market.voiceSearchTitle
            }
            aria-label={market.voiceSearch}
          >
            <Mic size={18} />
            <span className="voice-btn-text">
              {isListening
                ? market.listening
                : market.voiceSearch}
            </span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="market-categories-row">
          <div className="category-scroll-container">
            {categoryList.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-pill ${
                  selectedCategory === cat.id ? 'active' : ''
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <label className="verified-filter-toggle">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="verified-checkbox"
            />
            <ShieldCheck size={16} color="var(--primary)" />
            <span>{market.verifiedOnly}</span>
          </label>
        </div>
      </div>

      {/* Product Grid Section */}
      <div id="marketplace-grid" className="marketplace-grid-section">
        <div className="market-grid-header">
          <div>
            <h2 className="market-grid-title">
              {market.curatedTitle}
            </h2>

            <p className="market-grid-subtitle">
              {market.gridSubtitle}
            </p>
          </div>

          <span className="market-count-badge">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? market.craftSingular
              : market.craftPlural}{' '}
            {market.available}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-market-state">
            <p className="empty-title">
              {market.noMatches}
            </p>

            <p className="empty-subtitle">
              {market.emptySubtitle}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setVerifiedOnly(false);
              }}
              className="btn btn-secondary"
            >
              {market.resetFilters}
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
