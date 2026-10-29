import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowLeft,
  Share2,
  Heart,
  Send,
  CheckCircle2,
  Layers,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, MOCK_PRODUCTS } from '../services/api.js';
import Badge from '../components/Badge.jsx';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useLanguage } from '../i18n/index.js';

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [product, setProduct] = useState(
    () => MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0]
  );
  const [loading, setLoading] = useState(true);

  const [showSlider, setShowSlider] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      try {
        const item = await api.getProductById(id);
        if (isMounted && item) {
          setProduct(item);
        }
      } catch (err) {
        console.error('Error fetching product by id:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadItem();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSendEnquiry = (e) => {
    e.preventDefault();
    if (!enquiryMsg.trim()) return;

    setEnquirySent(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const parsedMaterials = Array.isArray(product.materials)
    ? product.materials
    : typeof product.materials === 'string'
    ? product.materials.split(',').map((m) => m.trim()).filter(Boolean)
    : [];

  const parsedTags = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === 'string'
    ? product.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
    : ['Handmade'];

  const formattedPrice = Number(product.price || 0).toLocaleString('en-IN');

  return (
    <div>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: '1.5rem',
          fontWeight: 500,
          fontSize: '0.92rem'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Marketplace</span>
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left: Product Images & Studio Enhancement Toggle */}
        <div>
          {showSlider && product.enhanced_image_url ? (
            <BeforeAfterSlider
              beforeImage={product.image_url}
              afterImage={product.enhanced_image_url}
              beforeLabel="Workshop Photo"
              afterLabel="AI Studio Render"
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
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
              className={`btn btn-sm ${showSlider ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowSlider(!showSlider)}
            >
              <Wand2 size={16} />
              <span>{showSlider ? 'Show Standard Photo' : 'Compare AI Studio Quality'}</span>
            </button>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              100% Authentic Handcraft
            </span>
          </div>
        </div>

        {/* Right: Craft Details & Enquiry */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {parsedTags.map((tag) => (
              <Badge key={tag} type="craft">
                {tag}
              </Badge>
            ))}
            {product.fair_trade && <Badge type="verified">Fair Trade Certified</Badge>}
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.25 }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            <MapPin size={16} color="var(--primary)" />
            <span style={{ fontWeight: 500 }}>{product.region}</span>
            <span>•</span>
            <span>
              Crafted by <strong>{product.artisan_name || 'Master Artisan'}</strong>
            </span>
          </div>

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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                Fair Trade Direct Price
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{formattedPrice}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, display: 'block' }}>
                ✓ In Stock ({product.stock || 1} available)
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Ships directly from artisan cluster
              </span>
            </div>
          </div>

          {/* Description & Materials */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              Craft Heritage & Technique
            </h3>
            <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {product.description}
            </p>

            {parsedMaterials.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>Materials:</strong>
                {parsedMaterials.map((m) => (
                  <span
                    key={m}
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      color: '#374151'
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Direct Artisan Enquiry Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={18} color="var(--primary)" />
              <span>Contact Artisan / Send Bulk Enquiry</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Direct message to {product.artisan_name || 'Artisan'}. Responses will be received in your preferred language.
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
                  <strong>Enquiry Dispatched!</strong>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    {product.artisan_name || 'Artisan'} has been notified via KalaSetu WhatsApp & SMS gateway.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    className="form-input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email or Phone"
                    className="form-input"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <textarea
                    rows={3}
                    required
                    placeholder="Ask about dimensions, customization, bulk discounts, or delivery timelines..."
                    className="form-textarea"
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Send size={16} />
                  <span>Send Direct Enquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
