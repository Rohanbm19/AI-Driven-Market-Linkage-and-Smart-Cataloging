
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  Send,
  CheckCircle2,
  Wand2,
  Edit3,
  Trash2,
  Layers,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { api } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useLanguage } from '../i18n/index.js';
import { useAuth } from '../context/AuthContext.jsx';


export default function ProductDetail() {
  const { id } = useParams();
  const { id: userId, isArtisan, fullName, email } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showSlider, setShowSlider] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [buyerName, setBuyerName] = useState(fullName || '');
  const [buyerEmail, setBuyerEmail] = useState(email || '');
  const [deleting, setDeleting] = useState(false);

  const trackedViews = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    async function loadItem() {
      try {
        setLoading(true);
        setLoadError('');

        const item = await api.getProductById(id, lang);

        if (isMounted) {
          setProduct(item || null);
          if (!item) setLoadError('This product is unavailable or has been removed.');
        }
      } catch (err) {
        console.error('Error fetching product by id:', err);
        if (isMounted) {
          setProduct(null);
          setLoadError(err.message || 'Unable to load product details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadItem();

    return () => {
      isMounted = false;
    };
  }, [id, lang]);

  useEffect(() => {
    if (
      !product ||
      trackedViews.current.has(id) ||
      (isArtisan && product.artisan_id === userId)
    ) {
      return;
    }

    trackedViews.current.add(id);

    api.trackProductView(id).catch(error => {
      trackedViews.current.delete(id);
      console.warn('Could not record product view:', error.message);
    });
  }, [id, product, isArtisan, userId]);

  const handleSendEnquiry = async (e) => {
    e.preventDefault();

    if (!enquiryMsg.trim() || !buyerName.trim() || !buyerEmail.trim()) return;

    setEnquirySubmitting(true);

    try {
      await api.submitEnquiry({
        buyer_id: userId || null,
        product_id: product.id,
        product_title: product.title,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        message: enquiryMsg.trim()
      });

      setEnquirySent(true);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      window.alert(err.message || 'Could not send enquiry. Please try again.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"?`)) return;

    setDeleting(true);

    try {
      await api.deleteProduct(product.id);
      navigate('/');
    } catch (err) {
      window.alert('Could not delete product: ' + err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="empty-market-state">
        <p className="empty-title">Product not found</p>
        <p className="empty-subtitle">
          {loadError || 'This product is unavailable or has been removed.'}
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const parsedMaterials = Array.isArray(product.materials)
    ? product.materials
    : typeof product.materials === 'string'
      ? product.materials.split(',').map(m => m.trim()).filter(Boolean)
      : [];

  const parsedTags = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === 'string'
      ? product.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
      : ['Handmade'];

  const formattedPrice = Number(product.price || 0).toLocaleString('en-IN');
  const isOwner = isArtisan && product.artisan_id === userId;
  const stock = Number(product.stock ?? 1);
  const hasEnhancedImage = Boolean(product.enhanced_image_url);
  const mainImage = product.enhanced_image_url || product.image_url;

  return (
    <main className="product-detail-page">

      {/* Navigation and artisan actions */}
      <div className="product-detail-header">
        <Link to="/" className="product-back-link">
          <ArrowLeft size={17} />
          Back to Marketplace
        </Link>

        {isOwner && (
          <div className="product-owner-actions">
            <Link
              to={`/edit-product/${product.id}`}
              className="product-edit-button"
            >
              <Edit3 size={15} />
              Edit Listing
            </Link>

            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={deleting}
              className="product-delete-button"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="product-detail-layout">

        {/* Product image */}
        <section className="product-gallery">
          <div className="product-image-container">
            {showSlider && hasEnhancedImage ? (
              <BeforeAfterSlider
                beforeImage={product.original_image_url || product.image_url}
                afterImage={product.enhanced_image_url}
                beforeLabel="Original Photo"
                afterLabel="Enhanced Photo"
              />
            ) : (
              <img
                src={mainImage}
                alt={product.title}
                className="product-main-image"
              />
            )}

            {product.fair_trade && (
              <span className="product-fairtrade-badge">
                <ShieldCheck size={14} />
                Fair Trade
              </span>
            )}
          </div>

          {hasEnhancedImage && (
            <div className="product-image-actions">
              <button
                type="button"
                className="product-compare-button"
                onClick={() => setShowSlider(!showSlider)}
              >
                <Wand2 size={16} />
                {showSlider ? 'Show Product Image' : 'Compare Image Enhancement'}
              </button>

              <span>Authentic Handcrafted Product</span>
            </div>
          )}
        </section>

        {/* Product information */}
        <section className="product-information">

          <div className="product-tags">
            {parsedTags.map((tag, index) => (
              <Badge key={`${tag}-${index}`} type="craft">
                {tag}
              </Badge>
            ))}

            {product.fair_trade && (
              <Badge type="verified">Fair Trade Certified</Badge>
            )}
          </div>

          <h1 className="product-title">{product.title}</h1>

          <div className="product-artisan">
            <div className="product-artisan-details">
              <span className="product-artisan-label">Crafted by</span>
              <Link to="/artisan-profile">
                {product.artisan_name || 'Master Artisan'}
              </Link>
            </div>

            <div className="product-region">
              <MapPin size={16} />
              {product.region || 'India'}
            </div>
          </div>

          {/* Price */}
          <div className="product-price-section">
            <div>
              <span className="product-price-label">Direct Artisan Price</span>
              <div className="product-price">₹{formattedPrice}</div>
              <span className="product-price-note">
                Directly sourced from the artisan
              </span>
            </div>

            <div className={`product-stock ${stock > 0 ? 'available' : 'unavailable'}`}>
              <span className="product-stock-dot" />
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </div>
          </div>

          {/* Description */}
          <div className="product-description">
            <h2>About this Craft</h2>
            <p>{product.description || 'No description available.'}</p>
          </div>

          {/* Materials */}
          {parsedMaterials.length > 0 && (
            <div className="product-materials">
              <h3>
                <Layers size={17} />
                Materials Used
              </h3>

              <div className="product-material-list">
                {parsedMaterials.map((material, index) => (
                  <span key={`${material}-${index}`}>{material}</span>
                ))}
              </div>
            </div>
          )}

          {/* Enquiry */}
          <div className="product-enquiry-card">
            <div className="product-enquiry-heading">
              <div className="product-enquiry-icon">
                <Send size={18} />
              </div>

              <div>
                <h2>Contact Artisan</h2>
                <p>Send an enquiry for product details or bulk orders.</p>
              </div>
            </div>

            {enquirySent ? (
              <div className="product-enquiry-success">
                <CheckCircle2 size={23} />
                <div>
                  <strong>Enquiry sent successfully!</strong>
                  <p>
                    Your enquiry has been shared with{' '}
                    {product.artisan_name || 'the artisan'}.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="product-enquiry-form">
                <div className="product-form-row">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    className="form-input"
                    value={buyerName}
                    onChange={e => setBuyerName(e.target.value)}
                  />

                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    className="form-input"
                    value={buyerEmail}
                    onChange={e => setBuyerEmail(e.target.value)}
                  />
                </div>

                <textarea
                  rows={4}
                  required
                  placeholder="Ask about dimensions, customization, bulk discounts or delivery..."
                  className="form-textarea"
                  value={enquiryMsg}
                  onChange={e => setEnquiryMsg(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="btn btn-primary product-enquiry-submit"
                >
                  <Send size={16} />
                  {enquirySubmitting ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
