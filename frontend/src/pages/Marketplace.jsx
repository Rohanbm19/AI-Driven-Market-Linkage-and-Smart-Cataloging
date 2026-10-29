import React, { useState, useEffect, useMemo } from 'react';
import { Search, Mic, Sparkles, Filter, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { api, MOCK_PRODUCTS } from '../services/api.js';
import { useLanguage } from '../i18n/index.js';
import { useVoiceInput } from '../hooks/useVoiceInput.js';

export default function Marketplace() {
  const { t, lang } = useLanguage();
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.region && p.region.toLowerCase().includes(q)) ||
        (p.artisan_name && p.artisan_name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        (selectedCategory === 'pottery' && (p.category === 'ceramics' || p.category === 'pottery'));

      const matchesVerified = !verifiedOnly || p.is_verified;

      return matchesSearch && matchesCategory && matchesVerified;
    });
  }, [products, searchQuery, selectedCategory, verifiedOnly]);

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-tag">
            <Sparkles size={14} />
            <span>{t.hero.badge}</span>
          </div>
          <h1 className="hero-title">{t.hero.title}</h1>
          <p className="hero-desc">{t.hero.subtitle}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#marketplace-grid" className="btn btn-primary">
              <span>{t.hero.exploreBtn}</span>
              <ArrowRight size={16} />
            </a>
            <Link to="/add-product" className="btn btn-secondary">
              <Sparkles size={16} />
              <span>{t.hero.listBtn}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Search & Voice Filter Bar */}
      <div
        style={{
          background: 'white',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.market.searchPlaceholder}
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          {/* Voice Input Button */}
          <button
            type="button"
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            title={t.market.voiceHint}
          >
            <Mic size={18} />
          </button>
        </div>

        {/* Categories Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          {[
            { id: 'all', label: t.market.allCategories },
            { id: 'pottery', label: t.market.pottery },
            { id: 'textiles', label: t.market.textiles },
            { id: 'metal', label: t.market.metal },
            { id: 'woodwork', label: t.market.woodwork }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-sm ${
                selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <label
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>{t.market.verifiedOnly}</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      <div id="marketplace-grid">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Curated Artisan Collection ({filteredProducts.length})
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600
              }}
            >
              Clear Search
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
              No crafts matched your search. Try a different term or category.
            </p>
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
