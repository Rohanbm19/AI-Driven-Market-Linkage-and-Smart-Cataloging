
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  Send,
  CheckCircle2,
  Wand2,
  Edit3,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useLanguage } from '../i18n/index.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const productText = t?.product || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState('');

  const [showSlider, setShowSlider] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch the product whenever its ID or selected language changes.
  useEffect(() => {
    let active = true;

    async function loadItem() {
      setLoading(true);
      setProductError('');
      setProduct(null);

      try {
        const item = await api.getProductById(id, lang);

        if (active && item) {
          setProduct(item);
        } else if (active) {
          setProductError('Product not found.');
        }
      } catch (error) {
        console.error('Error fetching product by id:', error);

        if (active) {
          setProductError(
            error.message || 'Unable to load product.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      active = false;
    };
  }, [id, lang]);

  const handleSendEnquiry = async (e) => {
    e.preventDefault();

    if (
      !enquiryMsg.trim() ||
      !buyerName.trim() ||
      !buyerEmail.trim() ||
      !product
    ) {
      return;
    }

    setEnquirySubmitting(true);

    try {
      await api.submitEnquiry({
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
    } catch (error) {
      console.error('Failed to submit enquiry:', error);
    } finally {
      setEnquirySubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;

    if (
      !window.confirm(
        `Are you sure you want to delete "${product.title}"?`
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      await api.deleteProduct(product.id);
      navigate('/');
    } catch (error) {
      alert('Could not delete product: ' + error.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-market-state">
        <p>Loading product...</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="empty-market-state">
        <p className="empty-title">
          {productError || 'Product not found.'}
        </p>

        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={16} />
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const parsedMaterials = Array.isArray(product.materials)
    ? product.materials
    : typeof product.materials === 'string'
    ? product.materials.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  const parsedTags = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === 'string'
    ? product.tags.split(',').map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean)
    : [];

  const formattedPrice = Number(product.price || 0).toLocaleString(
    lang === 'en' ? 'en-IN' : lang
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.92rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>{productText.backToMarketplace || 'Back to Marketplace'}</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to={`/edit-product/${product.id}`}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none'
            }}
          >
            <Edit3 size={15} />
            <span>{productText.editListing || 'Edit Craft Listing'}</span>
          </Link>

          <button
            type="button"
            onClick={handleDeleteProduct}
            disabled={deleting}
            className="btn btn-sm"
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={15} />
            <span>
              {deleting
                ? productText.deleting || 'Deleting...'
                : productText.delete || 'Delete'}
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start'
        }}
      >
        {/* Product Images */}
        <div>
          {showSlider && product.enhanced_image_url ? (
            <BeforeAfterSlider
              beforeImage={product.original_image_url || product.image_url}
              afterImage={product.enhanced_image_url}
              beforeLabel={productText.originalPhoto || 'Original Photo'}
              afterLabel={productText.enhancedPhoto || 'OpenCV Enhanced'}
            />
          ) : (
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)',
                height: '420px'
              }}
            >
              <img
                src={product.enhanced_image_url || product.image_url}
                alt={product.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem'
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${
                showSlider ? 'btn-primary' : 'btn-secondary'
              }`}
              onClick={() => setShowSlider(!showSlider)}
            >
              <Wand2 size={16} />
              <span>
                {showSlider
                  ? productText.showStandardPhoto || 'Show Standard Photo'
                  : productText.compareImages || 'Compare AI Studio Quality'}
              </span>
            </button>

            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)'
              }}
            >
              {productText.authenticHandcraft || '100% Authentic Handcraft'}
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            {parsedTags.map((tag) => (
              <Badge key={tag} type="craft">
                {tag}
              </Badge>
            ))}

            {product.fair_trade && (
              <Badge type="verified">
                {productText.fairTradeCertified || 'Fair Trade Certified'}
              </Badge>
            )}
          </div>

          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              lineHeight: 1.25
            }}
          >
            {product.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-muted)',
              marginBottom: '1.25rem',
              flexWrap: 'wrap'
            }}
          >
            <MapPin size={16} color="var(--primary)" />
            <span style={{ fontWeight: 500 }}>{product.region}</span>
            <span>•</span>

            <span>
              {productText.craftedBy || 'Crafted by'}{' '}
              <Link
                to="/artisan-profile"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                {product.artisan_name || productText.defaultArtisan || 'Master Artisan'}
              </Link>
            </span>
          </div>

          {/* Price */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  display: 'block'
                }}
              >
                {productText.fairTradePrice || 'Fair Trade Direct Price'}
              </span>

              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--primary)'
                }}
              >
                ₹{formattedPrice}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#059669',
                  fontWeight: 600,
                  display: 'block'
                }}
              >
                ✓ {productText.inStock || 'In Stock'} ({product.stock || 1} {productText.available || 'available'})
              </span>

              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)'
                }}
              >
                {productText.directShipping || 'Ships directly from artisan cluster'}
              </span>
            </div>
          </div>

          {/* Description and Materials */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              {productText.heritageTechnique || 'Craft Heritage & Technique'}
            </h3>

            <p
              style={{
                color: '#4b5563',
                lineHeight: 1.6,
                marginBottom: '1rem',
                whiteSpace: 'pre-line'
              }}
            >
              {product.description}
            </p>

            {parsedMaterials.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <strong
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-main)'
                  }}
                >
                  {productText.materials || 'Materials'}:
                </strong>

                {parsedMaterials.map((material) => (
                  <span
                    key={material}
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: '#374151'
                    }}
                  >
                    {material}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Artisan Enquiry */}
          <div className="card">
            <h3
              style={{
                fontSize: '1.1rem',
                marginBottom: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={18} color="var(--primary)" />
              <span>
                {productText.contactArtisan || 'Contact Artisan / Send Bulk Enquiry'}
              </span>
            </h3>

            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem'
              }}
            >
              {productText.directMessage || 'Direct message to'}{' '}
              {product.artisan_name || productText.defaultArtisan || 'Artisan'}.
              {' '}
              {productText.preferredLanguageResponse || 'Responses will be received in your preferred language.'}
            </p>

            {enquirySent ? (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#065f46'
                }}
              >
                <CheckCircle2 size={24} color="#059669" />

                <div>
                  <strong>
                    {productText.enquirySent || 'Enquiry Dispatched & Saved!'}
                  </strong>

                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    {product.artisan_name || productText.defaultArtisan || 'Artisan'}{' '}
                    {productText.enquiryNotified || 'has been notified and can view your enquiry on their dashboard.'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  <input
                    type="text"
                    required
                    placeholder={productText.yourName || 'Your Name'}
                    className="form-input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />

                  <input
                    type="email"
                    required
                    placeholder={productText.yourEmail || 'Your Email'}
                    className="form-input"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      productText.enquiryPlaceholder ||
                      'Ask about dimensions, customization, bulk discounts, or delivery timelines...'
                    }
                    className="form-textarea"
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Send size={16} />
                  <span>
                    {enquirySubmitting
                      ? productText.sending || 'Sending...'
                      : productText.sendEnquiry || 'Send Direct Enquiry'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
