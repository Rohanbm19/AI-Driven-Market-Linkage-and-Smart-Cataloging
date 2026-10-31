import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
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
  Calculator,
  ArrowLeft,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { useLanguage } from '../i18n/index.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import VoiceTextInput from '../components/VoiceTextInput.jsx';
import { detectLanguage } from '../utils/detectLanguage.js';

export default function AddProduct() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);

  const cf = t?.catalogForm || {};

  // Form state
  const [title, setTitle] = useState('');
  const [craftType, setCraftType] = useState('pottery');
  const [customCraftType, setCustomCraftType] = useState('');
  const [artisanName, setArtisanName] = useState('Shankar Das');
  const [region, setRegion] = useState('');
  const [materials, setMaterials] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('5');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Cost & Fair Pricing State
  const [materialCost, setMaterialCost] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [hourlyWage, setHourlyWage] = useState('150');
  const [packagingCost, setPackagingCost] = useState('80');

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
  const [saveStatus, setSaveStatus] = useState(null);
  const [formError, setFormError] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const supabaseConnected = isSupabaseConfigured();

  // Load existing product if in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadItem() {
      setLoadingExisting(true);
      try {
        const item = await api.getProductById(id);
        if (isMounted && item) {
          setTitle(item.title || '');
          setCraftType(item.category || 'pottery');
          setArtisanName(item.artisan_name || 'Shankar Das');
          setRegion(item.region || '');
          setMaterials(Array.isArray(item.materials) ? item.materials.join(', ') : (item.materials || ''));
          setPrice(String(item.price || ''));
          setStock(String(item.stock || '1'));
          setDescription(item.description || '');
          setTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
          setPhotoUrl(item.image_url || '');
        }
      } catch (err) {
        console.error('Failed to load craft for editing:', err);
      } finally {
        if (isMounted) setLoadingExisting(false);
      }
    }

    loadItem();
    return () => {
      isMounted = false;
    };
  }, [id]);

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

  // Cost calculations
  const matNum = Number(materialCost) || 0;
  const hoursNum = Number(laborHours) || 0;
  const wageNum = Number(hourlyWage) || 150;
  const pkgNum = Number(packagingCost) || 0;
  const computedLaborCost = hoursNum * wageNum;
  const computedTotalCost = matNum + computedLaborCost + pkgNum;
  const computedArtisanMargin = Math.round(computedTotalCost * 0.30);
  const computedFairSellingPrice = Math.round(computedTotalCost + computedArtisanMargin);

  const handleApplyFairPrice = () => {
    if (computedFairSellingPrice > 0) {
      setPrice(String(computedFairSellingPrice));
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
        if (!title.trim()) setTitle(result.title);
        if (result.description) setDescription(result.description);
        if (!price || Number(price) === 0) setPrice(String(result.suggestedPrice));
        if (result.tags && (!tags || tags.trim() === '')) setTags(result.tags.join(', '));
        if (result.priceRange) setAiPriceRange(result.priceRange);
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
        artisan_name: artisanName.trim() || (cf.defaultArtisan || 'Master Artisan'),
        artisan_id: 'art-1',
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

      let res;
      if (isEditMode) {
        res = await api.updateProduct(id, productPayload);
      } else {
        res = await api.createProduct(productPayload);
      }

      if (res.success) {
        setSaveStatus({
          success: true,
          savedInSupabase: res.savedInSupabase,
          id: res.data.id,
          message: isEditMode
            ? (res.savedInSupabase ? 'Craft listing successfully updated in Supabase cloud!' : 'Craft updated locally!')
            : (res.savedInSupabase ? 'Successfully saved and published to Supabase database!' : 'Saved to local catalog!')
        });

        confetti({
          particleCount: 100,
          spread: 70,
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this craft?')) return;
    try {
      await api.deleteProduct(id);
      navigate('/artisan-profile');
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setCraftType('pottery');
    setCustomCraftType('');
    setArtisanName('Shankar Das');
    setRegion('');
    setMaterials('');
    setPrice('');
    setStock('5');
    setDescription('');
    setTags('');
    setPhotoUrl('');
    setPhotoFile(null);
    setMaterialCost('');
    setLaborHours('');
    setPackagingCost('80');
    setAiGenerated(false);
    setAiPriceRange(null);
    setSaveStatus(null);
    setFormError('');
  };

  if (loadingExisting) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading craft details...</p>
      </div>
    );
  }

  const categoryOptions = [
    { id: 'pottery', label: cf.categories?.pottery || 'Terracotta & Pottery' },
    { id: 'textiles', label: cf.categories?.textiles || 'Handloom & Silk' },
    { id: 'metal', label: cf.categories?.metal || 'Brass & Bell Metal' },
    { id: 'woodwork', label: cf.categories?.woodwork || 'Channapatna Wood' },
    { id: 'painting', label: cf.categories?.painting || 'Pattachitra Art' },
    { id: 'other', label: cf.categories?.other || 'Other Heritage Craft' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {isEditMode && (
              <Link to="/artisan-profile" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </Link>
            )}
            <h1 className="page-title">
              {isEditMode ? (cf.editTitle || 'Edit Craft Listing') : (cf.title || 'List Your Craft')}
            </h1>
          </div>
          <p className="page-subtitle">
            {isEditMode
              ? (cf.editSubtitle || 'Update your craft specifications, materials, pricing, and heritage story.')
              : (cf.subtitle || 'Enter your craft details, calculate fair wages, speak your heritage story, and publish directly.')}
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
            color: supabaseConnected ? '#059669' : '#d97706',
            border: `1px solid ${supabaseConnected ? '#a7f3d0' : '#fde68a'}`
          }}
        >
          <Database size={14} />
          <span>{supabaseConnected ? (cf.dbOnline || 'Supabase Database: Online') : (cf.dbLocal || 'Local Storage Mode')}</span>
        </div>
      </div>

      {/* Success Notification */}
      {saveStatus && saveStatus.success && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <CheckCircle size={28} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#065f46', fontSize: '1.1rem' }}>
              {isEditMode ? (cf.successUpdatedTitle || 'Craft Listing Updated!') : (cf.successCreatedTitle || 'Craft Successfully Published!')}
            </h3>
            <p style={{ margin: '0 0 0.75rem 0', color: '#047857', fontSize: '0.9rem' }}>
              {saveStatus.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to={`/product/${saveStatus.id}`}
                className="btn btn-sm btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>{cf.viewLiveListing || 'View Live Listing'}</span>
                <ArrowRight size={14} />
              </Link>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-sm btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={14} />
                  <span>{cf.listAnother || 'List Another Craft'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {formError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          gap: '2rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Form Fields */}
        <div>
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.75rem'
                }}
              >
                <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                  {cf.craftIdentity || 'Craft & Artisan Identity'}
                </h2>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={loadingAi}
                  className="btn btn-sm btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #b83d22 100%)'
                  }}
                >
                  <Sparkles size={14} />
                  <span>{loadingAi ? (cf.generatingAi || 'Generating AI Details...') : (cf.autoGenAi || 'Auto-Generate AI Story & Title')}</span>
                </button>
              </div>

              {/* Craft Category */}
              <div className="form-group">
                <label className="form-label">{cf.categoryLabel || 'Craft Category'} *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCraftType(cat.id)}
                      style={{
                        padding: '0.55rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: craftType === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: craftType === cat.id ? 'var(--primary-light)' : '#ffffff',
                        color: craftType === cat.id ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: craftType === cat.id ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition)'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {craftType === 'other' && (
                  <input
                    type="text"
                    className="form-input"
                    value={customCraftType}
                    onChange={(e) => setCustomCraftType(e.target.value)}
                    placeholder={cf.customCategoryPlaceholder || 'Enter custom craft name (e.g. Dokra Casting, Bidriware, Blue Pottery)'}
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              {/* Craft Title */}
              <div className="form-group">
                <label className="form-label">{cf.productTitleLabel || 'Product / Craft Title'} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={cf.productTitlePlaceholder || 'e.g. Bankura Terracotta Sacred Horse, Kanjivaram Pure Silk Saree'}
                  required
                />
              </div>

              {/* Artisan Name & Region */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{cf.artisanNameLabel || 'Artisan / Maker Name'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={artisanName}
                    onChange={(e) => setArtisanName(e.target.value)}
                    placeholder={cf.artisanNamePlaceholder || 'e.g. Shankar Das, Meenakshi S.'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{cf.regionLabel || 'Artisan Region / Village'} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={cf.regionPlaceholder || 'e.g. Bishnupur, West Bengal'}
                    required
                  />
                </div>
              </div>

              {/* Materials Used */}
              <div className="form-group">
                <label className="form-label">{cf.materialsLabel || 'Raw Materials Used'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder={cf.materialsPlaceholder || 'e.g. Natural River Clay, Mineral Slip, Pure Mulberry Silk, Gold Zari'}
                />
              </div>

              {/* Craft Heritage Story with Multilingual Voice Dictation */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <VoiceTextInput
                  id="product-desc"
                  label={cf.storyLabel || 'Craft Story & Heritage Description (Speak in Your Native Language)'}
                  value={description}
                  onChange={(newText) => setDescription(newText)}
                  rows={4}
                  required
                  defaultLang={lang}
                  placeholder={cf.storyPlaceholder || 'Speak in Hindi, Tamil, Kannada, Telugu, Malayalam, Bengali, or English...'}
                />
              </div>
            </div>

            {/* Fair Trade Cost & Pricing Calculator Card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: '#fdfbf7', border: '1px solid #f3ebd8' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={18} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    {cf.calculatorTitle || 'Fair Trade Wage & Cost Calculator'}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                  {cf.calculatorBadge || '✓ Prevents Artisan Undervaluation'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>{cf.materialCostLabel || 'Material Cost (₹)'}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    placeholder="e.g. 450"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>{cf.laborHoursLabel || 'Labor Hours (hrs)'}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-input"
                    value={laborHours}
                    onChange={(e) => setLaborHours(e.target.value)}
                    placeholder="e.g. 6"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>{cf.wageLabel || 'Artisan Wage (₹/hr)'}</label>
                  <input
                    type="number"
                    min="50"
                    className="form-input"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                    placeholder="150"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>{cf.packagingLabel || 'Packaging (₹)'}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                    placeholder="80"
                  />
                </div>
              </div>

              {/* Total Production Cost Breakdown */}
              <div
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {cf.totalProductionCost || 'Total Production Cost:'} <strong>₹{computedTotalCost}</strong> (₹{matNum} + ₹{computedLaborCost} + ₹{pkgNum})
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                    {cf.suggestedFairPrice || 'Suggested Fair Price:'} ₹{computedFairSellingPrice} {cf.artisanProfitMargin || '(+30% Artisan Profit)'}
                  </div>
                </div>

                {computedFairSellingPrice > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyFairPrice}
                    className="btn btn-sm btn-secondary"
                    style={{ fontWeight: 600 }}
                  >
                    {cf.applyFairPrice || 'Apply Fair Price'} (₹{computedFairSellingPrice})
                  </button>
                )}
              </div>
            </div>

            {/* Price, Stock & Tags */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{cf.sellingPriceLabel || 'Selling Price (₹)'} *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1850"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{cf.stockLabel || 'Available Stock (Units)'} *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 5"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{cf.tagsLabel || 'Tags / Keywords (comma separated)'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={cf.tagsPlaceholder || 'GI Tagged, Terracotta, Handmade, Natural Clay, Festive Decor'}
                />
              </div>

              {/* Photo Upload Section */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{cf.photoLabel || 'Craft Photograph'}</label>

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
                        {photoFile ? photoFile.name : 'Photo preview ready'}
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
                    >
                      <Upload size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                        {isUploadingImage ? 'Uploading Image...' : (cf.uploadPrompt || 'Click to Upload Craft Photo')}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {cf.uploadHint || 'PNG, JPG or WebP up to 10MB'}
                      </span>
                    </div>

                    <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {showUrlInput ? (cf.hideUrl || 'Hide Image URL option') : (cf.pasteUrl || 'Or paste an Image URL')}
                      </button>
                    </div>

                    {showUrlInput && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                        />
                        <button type="button" onClick={handleApplyUrl} className="btn btn-secondary btn-sm">
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span>{isEditMode ? (cf.updating || 'Updating Listing...') : (cf.publishing || 'Publishing Craft...')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>{isEditMode ? (cf.updateBtn || 'Update & Publish Changes') : (cf.publishBtn || 'Publish Craft to Marketplace')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  {cf.clearForm || 'Clear Form'}
                </button>
              </div>

              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-sm"
                  style={{
                    background: '#fee2e2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Trash2 size={15} />
                  <span>{cf.deleteCraft || 'Delete This Craft'}</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Live Craft Preview Card */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cf.livePreview || 'Live Buyer Preview'}
            </span>
            <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              {cf.liveSync || 'Live Sync'}
            </span>
          </div>

          <div
            className="product-card"
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ height: '220px', position: 'relative', background: '#f3f4f6' }}>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={title || 'Craft preview'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af'
                  }}
                >
                  <ImageIcon size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.82rem' }}>{cf.noPhotoAdded || 'No photo added yet'}</span>
                </div>
              )}

              <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  {craftType.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                {title || (cf.untitledCraft || 'Untitled Craft Item')}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                <MapPin size={13} color="var(--primary)" />
                <span>{region || (cf.defaultRegion || 'Artisan Village, India')}</span>
                <span>•</span>
                <span>{artisanName || (cf.defaultArtisan || 'Master Artisan')}</span>
              </div>

              <p
                style={{
                  color: '#4b5563',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  margin: '0 0 1rem 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {description || (cf.storyPlaceholder || 'Craft heritage description will appear here as you speak or write...')}
              </p>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                    {cf.directPrice || 'Direct Artisan Price'}
                  </span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{price ? Number(price).toLocaleString('en-IN') : '0'}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                  ✓ {stock || 1} {cf.available || 'available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
