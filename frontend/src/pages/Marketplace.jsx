
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
import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.jsx';
import { useVoiceInput } from '../hooks/useVoiceInput.js';

// 14 TRADITIONAL CRAFT IMAGE CARDS
const craftCategories = [
  {
    name: 'Terracotta Art',
    category: 'pottery',
    description: 'Earth transformed into timeless art',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700&q=85'
  },
  {
    name: 'Brass Handicrafts',
    category: 'metal',
    description: 'Traditional metal craftsmanship',
    image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=700&q=85'
  },
  {
    name: 'Silk Textiles',
    category: 'textiles',
    description: 'Woven with heritage and tradition',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&q=85'
  },
  {
    name: 'Wood Carving',
    category: 'woodwork',
    description: 'Beautiful details carved by hand',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=700&q=85'
  },
  {
    name: 'Blue Pottery',
    category: 'pottery',
    description: 'Colorful traditional ceramic art',
    image: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=700&q=85'
  },
  {
    name: 'Bamboo Crafts',
    category: 'other',
    description: 'Sustainable handmade creations',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=700&q=85'
  },
  {
    name: 'Traditional Paintings',
    category: 'painting',
    description: 'Stories expressed through art',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=85'
  },
  {
    name: 'Handmade Decor',
    category: 'other',
    description: 'Unique creations for your home',
    image: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=700&q=85'
  },
  {
    name: 'Channapatna Toys',
    category: 'woodwork',
    description: 'Colorful traditional wooden toys',
    image: 'https://images.unsplash.com/photo-1599623560574-39d485900c95?w=700&q=85'
  },
  {
    name: 'Madhubani Art',
    category: 'painting',
    description: 'Beautiful traditional folk paintings',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=700&q=85'
  },
  {
    name: 'Jute Crafts',
    category: 'other',
    description: 'Eco-friendly handmade creations',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&q=85'
  },
  {
    name: 'Cane Weaving',
    category: 'other',
    description: 'Handwoven baskets and decor',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=700&q=85'
  },
  {
    name: 'Leather Crafts',
    category: 'other',
    description: 'Traditional handcrafted leather goods',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&q=85'
  },
  {
    name: 'Embroidery',
    category: 'textiles',
    description: 'Intricate handmade textile art',
    image: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=700&q=85'
  }
];

export default function Marketplace() {
  const { t, lang } = useLanguage();

  const hero = t.hero;
  const market = t.market;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // FETCH PRODUCTS
  useEffect(() => {
    let active = true;

    async function fetchCatalog() {
      setLoading(true);
      setProductError('');
      setProducts([]);

      try {
        const data = await api.getProducts(lang);

        if (active) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching marketplace catalog:', error);

        if (active) {
          setProducts([]);
          setProductError(
            error.message || 'Unable to load products.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      active = false;
    };
  }, [lang]);

  // VOICE SEARCH
  const { isListening, toggleListening } = useVoiceInput({
    currentLang: lang,
    onResult: (text) => {
      setSearchQuery(text);
    }
  });

  // CATEGORY LIST
  const categoryList = [
    { id: 'all', label: market.allCategories },
    { id: 'pottery', label: market.pottery },
    { id: 'textiles', label: market.textiles },
    { id: 'metal', label: market.metal },
    { id: 'woodwork', label: market.woodwork },
    { id: 'painting', label: market.painting },
    { id: 'other', label: market.other }
  ];

  // FILTER PRODUCTS
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
          p.tags.some((tag) =>
            String(tag).toLowerCase().includes(q)
          ));

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

  // CRAFT CARD CLICK
  const handleCraftClick = (category) => {
    setSelectedCategory(category);
    setSearchQuery('');

    document.getElementById('marketplace-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="marketplace-page">

      {/* HERO SECTION */}
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

            <a
              href="#marketplace-grid"
              className="btn btn-hero-explore"
            >
              <span>{hero.exploreBtn}</span>
              <ArrowRight size={17} />
            </a>

            <Link
              to="/add-product"
              className="btn btn-hero-list"
            >
              <Sparkles size={17} />
              <span>{hero.listBtn}</span>
            </Link>

          </div>
        </div>

        {/* HERO IMAGE SHOWCASE */}
        <div className="hero-visual-showcase" aria-hidden="true">

          <div className="hero-craft-card hero-craft-card-1">
            <img
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=85"
              alt="Terracotta pottery"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroTerracotta}
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-2">
            <img
              src="https://i1.himalayas.life/c/u/f67894297b6134a6b759b3a9ec15b6cb/2025/12/28100022/15575946613630631093.jpg"
              alt="Brass handicrafts"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroBrass}
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-3">
            <img
              src="https://i.etsystatic.com/34625692/r/il/e5757a/5156395254/il_570xN.5156395254_mezu.jpg"
              alt="Silk textiles"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              {market.heroSilk}
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-4">
            <img
              src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=85"
              alt="Wooden crafts"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              Wood Crafts
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-5">
            <img
              src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=85"
              alt="Traditional paintings"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              Paintings
            </div>
          </div>

          <div className="hero-craft-card hero-craft-card-6">
            <img
              src="https://thumbs.dreamstime.com/z/art-basket-weaving-various-designs-materials-display-craftsmanship-concept-beautiful-handmade-wicker-straw-397506013.jpg"
              alt="Handmade decor"
              className="hero-craft-img"
            />
            <div className="hero-craft-badge">
              Handmade Decor
            </div>
          </div>

        </div>
      </section>

    

      {/* SEARCH AND FILTER */}
      <div className="market-filter-card">

        <div className="market-search-row">

          <div className="market-search-input-wrapper">

            <Search
              size={18}
              className="search-icon"
            />

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
                Ã—
              </button>
            )}

          </div>

          {/* VOICE SEARCH */}
          <button
            type="button"
            className={`voice-search-btn ${
              isListening ? 'listening' : ''
            }`}
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

        {/* CATEGORY FILTERS */}
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

          {/* VERIFIED FILTER */}
          <label className="verified-filter-toggle">

            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="verified-checkbox"
            />

            <ShieldCheck
              size={16}
              color="var(--primary)"
            />

            <span>
              {market.verifiedOnly}
            </span>

          </label>

        </div>
      </div>

      {/* MARKETPLACE PRODUCT GRID */}
      <div
        id="marketplace-grid"
        className="marketplace-grid-section"
      >

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

        {/* LOADING */}
        {loading ? (

          <div className="empty-market-state">

            <div
              className="spinner"
              style={{ margin: '0 auto 1rem auto' }}
            />

            <p className="empty-subtitle">
              Loading products...
            </p>

          </div>

        ) : productError ? (

          /* ERROR */
          <div className="empty-market-state">

            <p className="empty-title">
              Unable to load products
            </p>

            <p className="empty-subtitle">
              {productError}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
            >
              Retry
            </button>

          </div>

        ) : filteredProducts.length === 0 ? (

          /* EMPTY STATE */
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

          /* PRODUCT CARDS */
          <div className="product-grid">

            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}

          </div>

        )}

      </div>
    </div>
  );
}

