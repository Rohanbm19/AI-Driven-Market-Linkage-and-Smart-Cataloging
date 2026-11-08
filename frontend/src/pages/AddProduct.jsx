import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  Upload,
  CheckCircle,
  Trash2,
  AlertCircle,
  Check,
  MapPin,
  Calculator,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Database,
  Image as ImageIcon,
  ShieldCheck,
  Layers,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import {
  enhanceProductImage,
  IMAGE_BACKGROUND_PRESETS,
  validateImageFile
} from '../services/imageEnhancer.js';
import { useLanguage } from '../i18n/index.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import VoiceInputField from '../components/VoiceInputField.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function AddProduct() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  const cf = t?.catalogForm || {};

  // Form State
  const [title, setTitle] = useState('');
  const [craftCategory, setCraftCategory] = useState('');
  const [artisanName, setArtisanName] = useState('Shankar Das');
  const [region, setRegion] = useState('');
  const [materials, setMaterials] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('5');
  const [tags, setTags] = useState('');

  // Cost & Fair Wage Calculator State
  const [materialCost, setMaterialCost] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [hourlyWage, setHourlyWage] = useState('150');
  const [packagingCost, setPackagingCost] = useState('80');

  // Photo State
  const [photoUrl, setPhotoUrl] = useState('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState('');
  const [enhancedPhotoUrl, setEnhancedPhotoUrl] = useState('');
  const [enhancedPhotoFile, setEnhancedPhotoFile] = useState(null);
  const [enhancedImageAccepted, setEnhancedImageAccepted] = useState(false);
  const [imageBackgroundPreset, setImageBackgroundPreset] = useState('none');
  const [imageBackgroundFile, setImageBackgroundFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);
  const [enhancementError, setEnhancementError] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // AI & Submission Status State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formError, setFormError] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const supabaseConnected = isSupabaseConfigured();

  useEffect(() => () => {
    if (originalPhotoUrl.startsWith('blob:')) URL.revokeObjectURL(originalPhotoUrl);
    if (enhancedPhotoUrl.startsWith('blob:')) URL.revokeObjectURL(enhancedPhotoUrl);
  }, [originalPhotoUrl, enhancedPhotoUrl]);

  // Load existing craft if in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadItem() {
      setLoadingExisting(true);
      try {
        const item = await api.getProductById(id);
        if (isMounted && item) {
          setTitle(item.title || '');
          const categoryLabels = {
            pottery: 'Terracotta & Pottery',
            textiles: 'Handloom & Silk',
            metal: 'Brass & Bell Metal',
            woodwork: 'Channapatna Wood',
            painting: 'Pattachitra Art',
            other: 'Other Heritage Craft'
          };
          setCraftCategory(categoryLabels[item.category] || item.category || '');
          setArtisanName(item.artisan_name || 'Shankar Das');
          setRegion(item.region || '');
          setMaterials(Array.isArray(item.materials) ? item.materials.join(', ') : (item.materials || ''));
          setPrice(String(item.price || ''));
          setStock(String(item.stock || '5'));
          setDescription(item.description || '');
          setTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
          setPhotoUrl(item.image_url || '');
          setOriginalPhotoUrl(item.original_image_url || item.image_url || '');
          setEnhancedPhotoUrl(item.enhanced_image_url || '');
          setEnhancedImageAccepted(Boolean(
            item.original_image_url &&
            item.enhanced_image_url &&
            item.image_url === item.enhanced_image_url &&
            item.original_image_url !== item.image_url
          ));
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

  // Keep the original upload intact until the artisan accepts an enhanced copy.
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      validateImageFile(file);
    } catch (error) {
      setEnhancementError(error.message);
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoUrl(previewUrl);
    setOriginalPhotoUrl(previewUrl);
    setEnhancedPhotoUrl('');
    setEnhancedPhotoFile(null);
    setEnhancedImageAccepted(false);
    setImageBackgroundPreset('none');
    setImageBackgroundFile(null);
    setEnhancementError('');
    setIsUploadingImage(true);

    try {
      const uploadResult = await api.uploadProductImage(file);
      if (uploadResult?.url) {
        setPhotoUrl(uploadResult.url);
        setOriginalPhotoUrl(uploadResult.url);
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      setEnhancementError(err.message || 'The original image could not be uploaded.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEnhanceImage = async () => {
    if (!photoFile) {
      setEnhancementError('Choose an image file before enhancing it.');
      return;
    }

    setEnhancementError('');
    setIsEnhancingImage(true);
    try {
      const enhancedFile = await enhanceProductImage(
        photoFile,
        imageBackgroundPreset,
        imageBackgroundFile
      );
      setEnhancedPhotoFile(enhancedFile);
      setEnhancedPhotoUrl(URL.createObjectURL(enhancedFile));
      setEnhancedImageAccepted(false);
    } catch (error) {
      setEnhancementError(error.message || 'Image enhancement failed. Please try again.');
    } finally {
      setIsEnhancingImage(false);
    }
  };

  const handleAcceptEnhancedImage = async () => {
    if (!enhancedPhotoUrl) return;

    setEnhancementError('');
    if (!enhancedPhotoFile) {
      setPhotoUrl(enhancedPhotoUrl);
      setEnhancedImageAccepted(true);
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadResult = await api.uploadProductImage(enhancedPhotoFile);
      if (!uploadResult?.url) {
        throw new Error('The enhanced image could not be saved.');
      }
      if (enhancedPhotoUrl.startsWith('blob:')) URL.revokeObjectURL(enhancedPhotoUrl);
      setEnhancedPhotoUrl(uploadResult.url);
      setPhotoUrl(uploadResult.url);
      setEnhancedImageAccepted(true);
    } catch (error) {
      setEnhancementError(error.message || 'The enhanced image could not be saved.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleKeepOriginalImage = () => {
    setPhotoUrl(originalPhotoUrl);
    setEnhancedImageAccepted(false);
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      const url = imageUrlInput.trim();
      setPhotoUrl(url);
      setOriginalPhotoUrl(url);
      setEnhancedPhotoUrl('');
      setEnhancedPhotoFile(null);
      setEnhancedImageAccepted(false);
      setPhotoFile(null);
      setEnhancementError('');
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setOriginalPhotoUrl('');
    setEnhancedPhotoUrl('');
    setEnhancedPhotoFile(null);
    setEnhancedImageAccepted(false);
    setImageBackgroundPreset('none');
    setImageBackgroundFile(null);
    setPhotoFile(null);
    setEnhancementError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTryAgain = () => {
    handleRemovePhoto();
    fileInputRef.current?.click();
  };

  // Cost & Fair Price Calculations
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
    setAiSuccessMessage('');
    setLoadingAi(true);

    const effectiveCategory = craftCategory.trim() || 'Traditional Craft';

    try {
      const result = await api.generateSmartCatalog({
        craftType: effectiveCategory,
        region: region || 'Heritage Village, India',
        materials: materials || 'Organic raw materials',
        description: description,
        language: lang
      });

      if (result) {
        if (!title.trim() && result.title) setTitle(result.title);
        if (result.description) setDescription(result.description);
        if (!price || Number(price) === 0) setPrice(String(result.suggestedPrice));
        if (result.tags && (!tags || tags.trim() === '')) setTags(result.tags.join(', '));
        setAiSuccessMessage('AI Smart Catalog generated with authentic heritage description and market tags!');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setFormError('AI assistant is temporarily offline. You can continue filling values manually.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Submit & Publish to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a Product / Craft Title.');
      return;
    }
    if (!craftCategory.trim()) {
      setFormError('Please enter a Craft Category.');
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

    const finalPhoto = photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

    setSubmitting(true);

    try {
      const productPayload = {
        title: title.trim(),
        category: craftCategory.trim(),
        price: Number(price),
        artisan_name: artisanName.trim() || (cf.defaultArtisan || 'Master Artisan'),
        artisan_id: 'art-1',
        region: region.trim(),
        description: description.trim(),
        materials: materials.trim()
          ? materials.split(',').map((m) => m.trim()).filter(Boolean)
          : ['Traditional Raw Materials'],
        image_url: finalPhoto,
        original_image_url: originalPhotoUrl || finalPhoto,
        enhanced_image_url: enhancedImageAccepted ? enhancedPhotoUrl : null,
        tags: tags.trim()
          ? tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : ['GI Certified', 'Handmade', 'KalaSetu Direct'],
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
            ? (res.savedInSupabase ? 'Craft listing successfully updated in Supabase cloud database!' : 'Craft updated locally!')
            : (res.savedInSupabase ? 'Successfully published to KalaSetu global catalog on Supabase!' : 'Saved to local catalog!')
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
    setCraftCategory('');
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
    setAiSuccessMessage('');
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

  return (
    <div className="cataloging-page-container">
      {/* Page Title & Status Header */}
      <div className="catalog-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {isEditMode && (
              <Link to="/artisan-profile" className="back-link" title="Back to profile">
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
              : 'Enter your craft details, calculate fair wages, speak your heritage story, and publish directly to global buyers.'}
          </p>
        </div>

        {/* Database Status Pill */}
        <div className={`db-status-pill ${supabaseConnected ? 'is-connected' : 'is-local'}`}>
          <Database size={14} />
          <span>{supabaseConnected ? 'Supabase Database: Online' : 'Local Storage Mode'}</span>
        </div>
      </div>

      {/* Success Notification */}
      {saveStatus && saveStatus.success && (
        <div className="catalog-success-banner">
          <CheckCircle size={28} className="success-icon" />
          <div className="success-content">
            <h3>
              {isEditMode ? 'Craft Listing Updated!' : 'Craft Successfully Published!'}
            </h3>
            <p>{saveStatus.message}</p>
            <div className="success-action-btns">
              <Link
                to={`/product/${saveStatus.id}`}
                className="btn btn-sm btn-primary"
              >
                <span>View Live Listing</span>
                <ArrowRight size={14} />
              </Link>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-sm btn-secondary"
                >
                  <RefreshCw size={14} />
                  <span>List Another Craft</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Success Feedback */}
      {aiSuccessMessage && (
        <div className="ai-feedback-banner">
          <Sparkles size={16} />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {formError && (
        <div className="form-error-banner" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="catalog-two-column-layout">
        {/* LEFT SIDE: Craft and Artisan Details Form */}
        <div className="catalog-form-col">
          <form onSubmit={handleSubmit} noValidate>
            {/* Card 1: Craft & Artisan Identity with Language Selector at Top-Right */}
            <div className="card catalog-card">
              <div className="catalog-card-header">
                <div className="catalog-card-header-left">
                  <h2 className="catalog-card-title">
                    Craft & Artisan Details
                  </h2>
                  <span className="card-title-sub">Universal Voice Dictation Enabled</span>
                </div>

                {/* LANGUAGE SELECTOR: Inside Craft & Artisan Details card at top-right */}
                <div className="catalog-card-header-right">
                  <LanguageSwitcher variant="card" />
                </div>
              </div>

              {/* HORIZONTAL DIVIDER BELOW CRAFT & ARTISAN DETAILS HEADING */}
              <hr className="form-divider" />

              {/* 1. CRAFT CATEGORY */}
              <div className="form-group">
                <VoiceInputField
                  id="craft-category"
                  label="Craft Category"
                  value={craftCategory}
                  onChange={setCraftCategory}
                  placeholder="e.g. Terracotta Pottery, Wood Carving, Blue Pottery, Handloom Weaving"
                  required
                  currentLang={lang}
                  hint="Speak or type the traditional craft category name."
                />
              </div>

              {/* 2. PRODUCT / CRAFT TITLE */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <VoiceInputField
                  id="craft-title"
                  label="Product / Craft Title"
                  value={title}
                  onChange={(val) => setTitle(val)}
                  placeholder="e.g. Bankura Terracotta Sacred Horse, Kanjivaram Pure Silk Saree"
                  required
                  currentLang={lang}
                  hint="Speak or type the traditional product name."
                />
              </div>

              {/* HORIZONTAL DIVIDER DIRECTLY BELOW PRODUCT / CRAFT TITLE */}
              <hr className="form-divider" />

              {/* 3. ARTISAN / MAKER NAME & 4. ARTISAN REGION / VILLAGE */}
              <div className="form-grid-two">
                <div className="form-group">
                  <VoiceInputField
                    id="artisan-name"
                    label="Artisan / Maker Name"
                    value={artisanName}
                    onChange={(val) => setArtisanName(val)}
                    placeholder="e.g. Shankar Das, Meenakshi S."
                    currentLang={lang}
                  />
                </div>

                <div className="form-group">
                  <VoiceInputField
                    id="artisan-region"
                    label="Artisan Region / Village"
                    value={region}
                    onChange={(val) => setRegion(val)}
                    placeholder="e.g. Bishnupur, West Bengal"
                    required
                    currentLang={lang}
                  />
                </div>
              </div>

              {/* Raw Materials Used with Voice Input */}
              <div className="form-group">
                <VoiceInputField
                  id="raw-materials"
                  label="Raw Materials Used"
                  value={materials}
                  onChange={(val) => setMaterials(val)}
                  placeholder="e.g. Natural Alluvial Clay, Pure Mulberry Silk, Virgin Brass, Vegetable Dyes"
                  currentLang={lang}
                  hint="Comma-separated materials used in creation."
                />
              </div>

              {/* Craft Story & Heritage Description with Voice Input in Selected Language */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <VoiceInputField
                  id="craft-story"
                  type="textarea"
                  rows={4}
                  label="Craft Story & Heritage Description"
                  value={description}
                  onChange={(val) => setDescription(val)}
                  placeholder="Speak in English, Kannada, Hindi, Tamil, Telugu, or Malayalam to describe your creation process, cultural history, ancestry, or firing techniques..."
                  required
                  currentLang={lang}
                  hint="Artisans can speak freely in their native tongue. AI preserves and translates this for global collectors."
                />
              </div>
            </div>

            {/* Fair Price & Artisan Wage Calculation Card */}
            <div className="card catalog-card calculator-card">
              <div className="calculator-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={19} color="var(--primary)" />
                  <h3 className="calculator-title">
                    Fair Trade Artisan Wage & Cost Calculation
                  </h3>
                </div>
                <span className="fair-trade-badge">
                  <ShieldCheck size={14} />
                  <span>Prevents Artisan Undervaluation</span>
                </span>
              </div>

              <div className="calculator-grid">
                <VoiceInputField
                  id="calc-material-cost"
                  type="number"
                  label="Material Cost (₹)"
                  value={materialCost}
                  onChange={(val) => setMaterialCost(val)}
                  placeholder="450"
                  currentLang={lang}
                />

                <VoiceInputField
                  id="calc-labor-hours"
                  type="number"
                  step="0.5"
                  label="Labor Hours (hrs)"
                  value={laborHours}
                  onChange={(val) => setLaborHours(val)}
                  placeholder="6"
                  currentLang={lang}
                />

                <VoiceInputField
                  id="calc-hourly-wage"
                  type="number"
                  label="Artisan Wage (₹/hr)"
                  value={hourlyWage}
                  onChange={(val) => setHourlyWage(val)}
                  placeholder="150"
                  currentLang={lang}
                />

                <VoiceInputField
                  id="calc-packaging-cost"
                  type="number"
                  label="Packaging (₹)"
                  value={packagingCost}
                  onChange={(val) => setPackagingCost(val)}
                  placeholder="80"
                  currentLang={lang}
                />
              </div>

              {/* Cost Breakdown & One-Click Apply */}
              <div className="calc-breakdown-bar">
                <div className="calc-breakdown-stats">
                  <div className="calc-stat-sub">
                    Total Production Cost: <strong>₹{computedTotalCost}</strong> (₹{matNum} mat + ₹{computedLaborCost} wage + ₹{pkgNum} pkg)
                  </div>
                  <div className="calc-stat-main">
                    Suggested Fair Price: <strong>₹{computedFairSellingPrice}</strong> <span className="profit-tag">(+30% Artisan Profit)</span>
                  </div>
                </div>

                {computedFairSellingPrice > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyFairPrice}
                    className="btn btn-sm btn-apply-price"
                  >
                    Apply Fair Price (₹{computedFairSellingPrice})
                  </button>
                )}
              </div>
            </div>

            {/* Selling Price, Stock & Tags */}
            <div className="card catalog-card">
              <div className="form-grid-two">
                <div className="form-group">
                  <VoiceInputField
                    id="craft-price"
                    type="number"
                    label="Selling Price (₹)"
                    value={price}
                    onChange={(val) => setPrice(val)}
                    placeholder="e.g. 1850"
                    required
                    currentLang={lang}
                  />
                </div>

                <div className="form-group">
                  <VoiceInputField
                    id="craft-stock"
                    type="number"
                    label="Available Stock (Units)"
                    value={stock}
                    onChange={(val) => setStock(val)}
                    placeholder="e.g. 5"
                    required
                    currentLang={lang}
                  />
                </div>
              </div>

              <div className="form-group">
                <VoiceInputField
                  id="craft-tags"
                  label="Tags / Search Keywords (comma separated)"
                  value={tags}
                  onChange={(val) => setTags(val)}
                  placeholder="GI Tagged, Terracotta, Natural Clay, Heritage Handcrafted, Living Tradition"
                  currentLang={lang}
                />
              </div>

              {/* Product Image Upload */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Product Image Upload
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />

                {photoUrl ? (
                  <>
                    <div className="uploaded-photo-preview">
                      <img
                        src={photoUrl}
                        alt="Selected craft photo"
                        className="photo-thumb"
                      />
                      <div className="photo-info">
                        <span className="photo-title">
                          {enhancedImageAccepted ? 'Enhanced Photo Selected' : 'Original Photo Selected'}
                        </span>
                        <span className="photo-subtitle">
                          {photoFile ? photoFile.name : 'Image URL loaded successfully'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        disabled={isUploadingImage || isEnhancingImage}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="photo-remove-btn"
                        title="Remove Photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {originalPhotoUrl && photoFile && !enhancedPhotoUrl && (
                      <div className="image-enhancement-controls">
                        <label className="image-background-field" htmlFor="product-image-background">
                          <span>Background option</span>
                          <select
                            id="product-image-background"
                            className="image-background-select"
                            value={imageBackgroundPreset}
                            onChange={(event) => {
                              setImageBackgroundPreset(event.target.value);
                              setEnhancementError('');
                            }}
                            disabled={isUploadingImage || isEnhancingImage}
                          >
                            {IMAGE_BACKGROUND_PRESETS.map((preset) => (
                              <option key={preset.value} value={preset.value}>{preset.label}</option>
                            ))}
                          </select>
                        </label>
                        {imageBackgroundPreset === 'custom' && (
                          <>
                            <input
                              ref={backgroundInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                try {
                                  if (file) validateImageFile(file);
                                  setImageBackgroundFile(file);
                                  setEnhancementError('');
                                } catch (error) {
                                  setEnhancementError(error.message);
                                  event.target.value = '';
                                }
                              }}
                              hidden
                            />
                            <button
                              type="button"
                              className="image-enhancer-upload"
                              onClick={() => backgroundInputRef.current?.click()}
                              disabled={isUploadingImage || isEnhancingImage}
                            >
                              <Upload size={16} />
                              <span>
                                {imageBackgroundFile?.name || 'Select a JPEG, PNG, or WebP background'}
                              </span>
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleEnhanceImage}
                          disabled={isUploadingImage || isEnhancingImage
                            || (imageBackgroundPreset === 'custom' && !imageBackgroundFile)}
                        >
                          {isEnhancingImage ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Sparkles size={16} />
                          )}
                          <span>
                            {isEnhancingImage
                              ? 'Enhancing image...'
                              : imageBackgroundPreset === 'none'
                                ? 'Enhance Image'
                                : 'Enhance & Replace Background'}
                          </span>
                        </button>
                        <span className="image-enhancement-note">
                          Your original stays unchanged; review before choosing what to publish.
                        </span>
                      </div>
                    )}

                    {originalPhotoUrl && enhancedPhotoUrl && originalPhotoUrl !== enhancedPhotoUrl && (
                      <div className="image-enhancement-review">
                        <BeforeAfterSlider
                          beforeImage={originalPhotoUrl}
                          afterImage={enhancedPhotoUrl}
                          beforeLabel="Original"
                          afterLabel="Enhanced"
                        />
                        <div className="image-enhancement-actions">
                          <button
                            type="button"
                            className={`btn btn-sm ${enhancedImageAccepted ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleAcceptEnhancedImage}
                            disabled={isUploadingImage || isEnhancingImage || enhancedImageAccepted}
                          >
                            <Check size={16} />
                            <span>{enhancedImageAccepted ? 'Enhanced Image Accepted' : 'Accept Enhanced Image'}</span>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${enhancedImageAccepted ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleKeepOriginalImage}
                            disabled={isUploadingImage || isEnhancingImage}
                          >
                            <ImageIcon size={16} />
                            <span>Keep Original Image</span>
                          </button>
                          {photoFile && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleTryAgain}
                              disabled={isUploadingImage || isEnhancingImage}
                            >
                              <Upload size={16} />
                              <span>Try Again — Upload New Photo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {enhancementError && (
                      <p className="image-enhancement-error" role="alert">
                        <AlertCircle size={16} />
                        <span>{enhancementError}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="upload-dropzone-wrapper">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="upload-dropzone"
                    >
                      <Upload size={26} className="upload-icon" />
                      <div className="upload-title">
                        {isUploadingImage ? 'Uploading Image...' : 'Click to Upload Craft Photo'}
                      </div>
                      <span className="upload-desc">
                        PNG, JPG, or WebP up to 10MB
                      </span>
                    </div>

                    {enhancementError && (
                      <p className="image-enhancement-error" role="alert">
                        <AlertCircle size={16} />
                        <span>{enhancementError}</span>
                      </p>
                    )}

                    <div className="url-toggle-row">
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="url-toggle-btn"
                      >
                        {showUrlInput ? 'Hide Image URL option' : 'Or paste an Image URL'}
                      </button>
                    </div>

                    {showUrlInput && (
                      <div className="url-input-group">
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
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
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: K. Generate AI Catalog & L. Publish Product */}
            <div className="catalog-actions-bar">
              {/* Generate AI Catalog Button */}
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={loadingAi}
                className="btn btn-ai-generate"
              >
                <Sparkles size={17} />
                <span>
                  {loadingAi ? 'Generating AI Catalog...' : 'Generate AI Catalog'}
                </span>
              </button>

              {/* Publish Product Button */}
              <div className="publish-btns-group">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-publish"
                >
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span>{isEditMode ? 'Updating Listing...' : 'Publishing Craft...'}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>
                        {isEditMode ? 'Update & Publish Changes' : 'Publish Product'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Clear Form
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-danger-delete"
                  >
                    <Trash2 size={16} />
                    <span>Delete Craft</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE: LIVE BUYER PREVIEW */}
        <div className="catalog-preview-col">
          <div className="preview-sticky-wrap">
            <div className="preview-top-badge">
              <span className="preview-heading-text">Live Buyer Preview</span>
            </div>

            {/* Luxury Artisan Product Preview Card */}
            <div className="preview-card">
              <div className="preview-img-container">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={title || 'Craft preview'}
                    className="preview-img"
                  />
                ) : (
                  <div className="preview-placeholder-box">
                    <ImageIcon size={44} className="placeholder-icon" />
                    <span>Craft photo preview will appear here</span>
                  </div>
                )}

                <div className="preview-category-tag">
                  {(craftCategory || 'HERITAGE CRAFT').toUpperCase()}
                </div>

              </div>

              <div className="preview-card-body">
                <h3 className="preview-card-title">
                  {title || 'Untitled Traditional Craft'}
                </h3>

                <div className="preview-artisan-line">
                  <MapPin size={14} className="map-icon" />
                  <span className="preview-region">{region || 'Heritage Village, India'}</span>
                  <span className="dot-sep">•</span>
                  <span className="preview-artisan-name">{artisanName || 'Master Craftsman'}</span>
                </div>

                <div className="preview-materials-line">
                  <strong>Materials: </strong>
                  <span>{materials || 'Natural traditional materials'}</span>
                </div>

                <p className="preview-card-story">
                  {description || 'Craft story and ancestral heritage description will appear live here as you speak or write in your chosen language...'}
                </p>

                <div className="preview-card-footer">
                  <div className="preview-price-block">
                    <span className="price-label">Artisan Direct Price</span>
                    <span className="price-amount">
                      ₹{price ? Number(price).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>

                  <div className="preview-stock-badge">
                    <span className="stock-check">✓</span>
                    <span>{stock || 1} available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog-signin-row">
        <Link to="/login" className="btn btn-signin" aria-label="Sign In">
          <User size={16} />
          <span>{t.nav?.login || 'Sign In'}</span>
        </Link>
      </div>
    </div>
  );
}
