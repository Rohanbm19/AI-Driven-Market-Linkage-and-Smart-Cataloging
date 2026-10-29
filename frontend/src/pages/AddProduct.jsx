import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mic,
  Upload,
  CheckCircle,
  Tag,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  Database,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Check,
  Package,
  MapPin,
  User,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../i18n/index.js';
import { useVoiceInput } from '../hooks/useVoiceInput.js';
import { api } from '../services/api.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';

// Pre-curated sample photos so artisans/evaluators can quickly test with 1 click if they don't have an image ready
const SAMPLE_PHOTOS = [
  {
    name: 'Terracotta Pottery',
    url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Handloom Silk',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Brass Urli',
    url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Carved Woodwork',
    url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Blue Pottery',
    url: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
  }
];

export default function AddProduct() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form input states - initialized EMPTY so user enters their own values
  const [title, setTitle] = useState('');
  const [craftType, setCraftType] = useState('pottery');
  const [customCraftType, setCustomCraftType] = useState('');
  const [artisanName, setArtisanName] = useState('');
  const [region, setRegion] = useState('');
  const [materials, setMaterials] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('5');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Image upload state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // AI & submission states
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiPriceRange, setAiPriceRange] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // { success: boolean, savedInSupabase: boolean, id: string, message: string }
  const [formError, setFormError] = useState('');

  const supabaseConnected = isSupabaseConfigured();

  // Voice Input hook
  const { isListening, toggleListening } = useVoiceInput({
    currentLang: lang,
    onResult: (text) => {
      setDescription((prev) => (prev ? `${prev} ${text}` : text));
    }
  });

  // Handle image file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setIsUploadingImage(true);

    try {
      const uploadResult = await api.uploadProductImage(file);
      if (uploadResult?.url) {
        setPhotoUrl(uploadResult.url);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      // Fallback local reader
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      setPhotoUrl(imageUrlInput.trim());
      setPhotoFile(null);
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI Smart Catalog Generator
  const handleGenerateAi = async () => {
    setFormError('');
    setLoadingAi(true);

    const effectiveCategory = craftType === 'other' ? (customCraftType || 'Traditional Craft') : craftType;

    try {
      const result = await api.generateSmartCatalog({
        craftType: effectiveCategory,
        region: region || 'Heritage Village, India',
        materials: materials || 'Organic raw materials',
        description: description,
        language: lang
      });

      if (result) {
        // Auto-fill or polish the fields, but keep them totally editable by the user
        if (!title.trim() || title === '') {
          setTitle(result.title);
        }
        if (result.description) {
          setDescription(result.description);
        }
        if (!price || Number(price) === 0) {
          setPrice(String(result.suggestedPrice));
        }
        if (result.tags && (!tags || tags.trim() === '')) {
          setTags(result.tags.join(', '));
        }
        if (result.priceRange) {
          setAiPriceRange(result.priceRange);
        }
        setAiGenerated(true);
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setFormError('AI assistant is temporarily offline. You can continue filling values manually.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Save to Database (Supabase)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!title.trim()) {
      setFormError('Please enter a Craft Title.');
      return;
    }
    if (!region.trim()) {
      setFormError('Please enter the Artisan Region / Village.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError('Please enter a valid price in ₹.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a Craft Story or description.');
      return;
    }

    const effectiveCategory = craftType === 'other' ? (customCraftType.trim() || 'other') : craftType;
    const finalPhoto = photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

    setSubmitting(true);

    try {
      const productPayload = {
        title: title.trim(),
        category: effectiveCategory,
        price: Number(price),
        artisan_name: artisanName.trim() || 'Master Artisan',
        artisan_id: `art-${Date.now()}`,
        region: region.trim(),
        description: description.trim(),
        materials: materials.trim()
          ? materials.split(',').map((m) => m.trim()).filter(Boolean)
          : ['Traditional Raw Materials'],
        image_url: finalPhoto,
        enhanced_image_url: finalPhoto,
        tags: tags.trim()
          ? tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : ['Handmade', 'KalaSetu Direct'],
        stock: Number(stock) || 1
      };

      const res = await api.createProduct(productPayload);

      if (res.success) {
        setSaveStatus({
          success: true,
          savedInSupabase: res.savedInSupabase,
          id: res.data.id,
          message: res.savedInSupabase
            ? 'Successfully saved and published to Supabase database!'
            : (res.supabaseError
              ? `Saved to local catalog (Supabase error: ${res.supabaseError})`
              : 'Saved to local catalog! Configure VITE_SUPABASE_URL in .env to sync to Supabase cloud.')
        });

        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 }
        });
      } else {
        setFormError('Failed to save craft. Please check the inputs.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setFormError(err.message || 'Error occurred while saving to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setCraftType('pottery');
    setCustomCraftType('');
    setArtisanName('');
    setRegion('');
    setMaterials('');
    setPrice('');
    setStock('5');
    setDescription('');
    setTags('');
    setPhotoUrl('');
    setPhotoFile(null);
    setAiGenerated(false);
    setAiPriceRange(null);
    setSaveStatus(null);
    setFormError('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header with Supabase Connection Status */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{t.hero.listBtn || 'List Your Craft'}</h1>
          <p className="page-subtitle">
            Enter your craft details, use AI to generate fair pricing & heritage stories, and save directly to the Supabase database.
          </p>
        </div>

        {/* Supabase Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: supabaseConnected ? '#ecfdf5' : '#fffbeb',
            color: supabaseConnected ? '#065f46' : '#92400e',
            border: `1px solid ${supabaseConnected ? '#a7f3d0' : '#fde68a'}`
          }}
          title={
            supabaseConnected
              ? 'Connected to live Supabase database'
              : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to save directly to Supabase cloud'
          }
        >
          <Database size={15} color={supabaseConnected ? '#059669' : '#d97706'} />
          <span>{supabaseConnected ? 'Supabase Connected' : 'Supabase Demo Mode'}</span>
        </div>
      </div>

      {/* Success Celebration View */}
      {saveStatus?.success ? (
        <div
          className="card"
          style={{
            maxWidth: '720px',
            margin: '2rem auto',
            textAlign: 'center',
            padding: '3rem 2rem',
            border: '2px solid #10b981',
            background: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
          >
            <CheckCircle size={40} />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
            Craft Listed Successfully!
          </h2>
          <p style={{ color: '#374151', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
            {saveStatus.message}
          </p>

          {/* Product Preview Snippet */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              gap: '1.25rem',
              alignItems: 'center',
              textAlign: 'left',
              maxWidth: '520px',
              margin: '0 auto 2rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <img
              src={photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400&q=80'}
              alt={title}
              style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </h4>
              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {artisanName || 'Artisan'} • {region}
              </p>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{price}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/product/${saveStatus.id}`} className="btn btn-primary">
              <Eye size={18} />
              <span>View Product Detail</span>
            </Link>
            <Link to="/" className="btn btn-secondary">
              <span>Go to Marketplace</span>
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={handleResetForm}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} />
              <span>List Another Craft</span>
            </button>
          </div>
        </div>
      ) : (
        /* The Input Form Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '2rem'
          }}
        >
          {/* Left Column: Form Details */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                1. Craft & Artisan Details
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Required fields
              </span>
            </div>

            {formError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Product Title */}
              <div className="form-group">
                <label className="form-label">
                  Craft Title / Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bankura Terracotta Sacred Horse, Kanjivaram Silk Saree"
                  required
                />
              </div>

              {/* Craft Category & Custom Category */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: craftType === 'other' ? '1fr 1fr' : '1fr',
                  gap: '1rem'
                }}
              >
                <div className="form-group">
                  <label className="form-label">Craft Category *</label>
                  <select
                    className="form-select"
                    value={craftType}
                    onChange={(e) => setCraftType(e.target.value)}
                  >
                    <option value="pottery">Terracotta & Clay Art</option>
                    <option value="textiles">Handloom & Silk Textiles</option>
                    <option value="metal">Brass & Metalware</option>
                    <option value="woodwork">Carved Woodwork & Lacquer</option>
                    <option value="ceramics">Blue Pottery & Ceramics</option>
                    <option value="stone">Stone & Marble Carving</option>
                    <option value="leather">Shantiniketan Leather Craft</option>
                    <option value="other">Other / Custom Craft</option>
                  </select>
                </div>

                {craftType === 'other' && (
                  <div className="form-group">
                    <label className="form-label">Specify Craft Technique *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={customCraftType}
                      onChange={(e) => setCustomCraftType(e.target.value)}
                      placeholder="e.g. Dhokra casting, Madhubani"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Artisan Name & Region */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Artisan / Maker Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={artisanName}
                    onChange={(e) => setArtisanName(e.target.value)}
                    placeholder="e.g. Shankar Das, Meenakshi S."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Artisan Region / Village *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Bishnupur, West Bengal"
                    required
                  />
                </div>
              </div>

              {/* Materials Used */}
              <div className="form-group">
                <label className="form-label">Raw Materials Used</label>
                <input
                  type="text"
                  className="form-input"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="e.g. Natural River Clay, Mineral Slip, Pure Mulberry Silk"
                />
              </div>

              {/* Craft Story (Voice or Text) */}
              <div className="form-group">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.45rem'
                  }}
                >
                  <label className="form-label" style={{ margin: 0 }}>
                    Craft Story & Heritage Description *
                  </label>
                  <button
                    type="button"
                    className={`voice-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleListening}
                    style={{ width: '34px', height: '34px' }}
                    title="Speak in your native language"
                  >
                    <Mic size={16} />
                  </button>
                </div>

                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe how this piece is created, ancestral tradition, inspiration, or unique techniques... (You can also speak in Hindi, Tamil, Kannada, Bengali, or English)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isListening
                    ? '🎙️ Listening... speak in your native mother tongue'
                    : 'Tip: Tap the mic icon to dictate, or click "Generate AI Details" below to generate a story.'}
                </span>
              </div>

              {/* Photo Upload Section */}
              <div className="form-group">
                <label className="form-label">Craft Photograph</label>

                {photoUrl ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt="Craft preview"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>
                        Image Loaded
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {photoFile ? photoFile.name : 'Image URL applied'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                      title="Remove Photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#ffffff',
                        transition: 'var(--transition)'
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) {
                          handleFileChange({ target: { files: e.dataTransfer.files } });
                        }
                      }}
                    >
                      <Upload size={28} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                        {isUploadingImage ? 'Uploading image...' : 'Click or Drag to Upload Craft Photo'}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Supports PNG, JPG, WebP from your phone or computer
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {showUrlInput ? 'Hide URL input' : 'Or paste image URL instead'}
                      </button>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Sample quick picks below ↓
                      </span>
                    </div>

                    {showUrlInput && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="url"
                          className="form-input"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Paste image web URL (https://...)"
                        />
                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="btn btn-secondary btn-sm"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {/* Quick Sample Photos */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                      {SAMPLE_PHOTOS.map((sample) => (
                        <button
                          key={sample.name}
                          type="button"
                          onClick={() => setPhotoUrl(sample.url)}
                          style={{
                            background: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <img
                            src={sample.url}
                            alt=""
                            style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'cover' }}
                          />
                          <span>{sample.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Price & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Selling Price (INR ₹) *</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        fontSize: '1.1rem'
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      style={{ paddingLeft: '2.2rem' }}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 1850"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Units</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags & Search Keywords</label>
                <input
                  type="text"
                  className="form-input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. GI Tagged, Handmade, Organic Dyes, Pure Silk"
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  className="btn btn-secondary"
                  style={{ flex: 1, minWidth: '180px' }}
                  disabled={loadingAi}
                >
                  {loadingAi ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>{t.aiCatalog.generating}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} color="#7c3aed" />
                      <span>Generate AI Details</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5, minWidth: '220px' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>Save & Publish to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Interactive Card Preview */}
          <div>
            <div
              className="card"
              style={{
                border: '1.5px solid #d8b4fe',
                background: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)',
                position: 'sticky',
                top: '5.5rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #f3e8ff',
                  paddingBottom: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b21a8' }}>
                  <Sparkles size={20} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Live Listing & AI Catalog Preview
                  </h3>
                </div>

                <span
                  style={{
                    background: '#ede9fe',
                    color: '#6b21a8',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                >
                  Real-time
                </span>
              </div>

              {/* Product Visual Card Preview */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e9d5ff',
                  overflow: 'hidden',
                  marginBottom: '1.25rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ position: 'relative', height: '220px', background: '#f3f4f6' }}>
                  <img
                    src={photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'}
                    alt="Craft visual"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      backdropFilter: 'blur(4px)',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {craftType === 'other' ? (customCraftType || 'Craft') : craftType}
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#111827' }}>
                    {title || 'Your Craft Title Will Appear Here'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{region || 'Origin Region / Village'}</span>
                    <span>•</span>
                    <User size={14} />
                    <span>{artisanName || 'Artisan Name'}</span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: '#4b5563',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {description || 'Craft story and ancestral technique description will be shown here. Type on the left or tap the microphone to dictate.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '0.75rem'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                        DIRECT ARTISAN PRICE
                      </span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ₹{price || '0'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                      ✓ Fair Trade Direct
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Price Benchmark & Tags info */}
              {aiPriceRange && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    AI Fair Trade Benchmark
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>
                      ₹{aiPriceRange.min} – ₹{aiPriceRange.max}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#4b5563' }}>
                      (Estimated based on materials & region)
                    </span>
                  </div>
                </div>
              )}

              {/* Tags Preview */}
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#6b21a8',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '0.4rem'
                  }}
                >
                  SEO Keywords & Tags
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(tags ? tags.split(',') : ['Handmade', 'Artisan Direct', 'Fair Trade']).map((t) => (
                    <span
                      key={t}
                      style={{
                        background: '#f3e8ff',
                        color: '#6b21a8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      #{t.trim().replace(/^#/, '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
