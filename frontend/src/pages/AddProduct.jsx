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
import { useLanguage, fill } from '../i18n/index.js';
import { analyzeStory, detectCategoryKey, MIN_STORY_LENGTH } from '../services/craftAutofill.js';
import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import VoiceInputField from '../components/VoiceInputField.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function AddProduct() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { t, lang, formatNumber } = useLanguage();
  const fileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  const cf = t?.catalogForm || {};
  const a = t?.addCraft || {};
  const af = t?.autofill || {};

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
  const [enhErr, setEnhErr] = useState(null); // { key } or { raw }
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // AI & Submission Status State
  const [loadingAi, setLoadingAi] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [autoWorking, setAutoWorking] = useState(false);
  const [autoCount, setAutoCount] = useState(null); // null = no message, 0 = nothing found
  const [aiFilled, setAiFilled] = useState({});
  const touchedRef = useRef(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formErr, setFormErr] = useState(null); // { key } or { raw }
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const supabaseConnected = isSupabaseConfigured();

  const errText = (e) => (e ? (e.key ? a[e.key] : e.raw) : '');
  const enhancementError = errText(enhErr);
  const formError = errText(formErr);

  // ----- Field editing: any manual edit "locks" that field so AI never overwrites it -----
  const editField = (field, setter) => (val) => {
    touchedRef.current.add(field);
    setAiFilled((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
    setter(val);
  };

  const fieldSetters = {
    category: setCraftCategory,
    title: setTitle,
    region: setRegion,
    materials: setMaterials,
    tags: setTags,
    artisanName: setArtisanName,
    laborHours: setLaborHours,
    materialCost: setMaterialCost,
    price: setPrice
  };

  // Read the story and fill every field the user has not edited by hand.
  const runAutofill = ({ force = false, silent = false } = {}) => {
    const result = analyzeStory(description, {
      lang,
      t,
      wage: hourlyWage,
      packaging: packagingCost
    });

    if (force) touchedRef.current.clear();

    const applied = {};
    Object.entries(result.fields).forEach(([field, value]) => {
      if (touchedRef.current.has(field)) return;
      fieldSetters[field]?.(value);
      applied[field] = true;
    });

    setAiFilled((prev) => (force ? applied : { ...prev, ...applied }));
    const n = Object.keys(applied).length;
    if (!silent || n > 0) setAutoCount(n);
  };

  // Auto-fill while the artisan types/speaks (and re-translate AI fields when the language changes)
  useEffect(() => {
    if (isEditMode || !autoMode) return undefined;
    if (description.trim().length < MIN_STORY_LENGTH) {
      setAutoWorking(false);
      return undefined;
    }
    setAutoWorking(true);
    const timer = setTimeout(() => {
      runAutofill({ silent: true });
      setAutoWorking(false);
    }, 900);
    return () => {
      clearTimeout(timer);
      setAutoWorking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, lang, autoMode, isEditMode]);

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
          setCraftCategory(cf.categories?.[item.category] || item.category || '');
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
      setEnhErr({ raw: error.message });
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
    setEnhErr(null);
    setIsUploadingImage(true);

    try {
      const uploadResult = await api.uploadProductImage(file);
      if (uploadResult?.url) {
        setPhotoUrl(uploadResult.url);
        setOriginalPhotoUrl(uploadResult.url);
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      setEnhErr(err.message ? { raw: err.message } : { key: 'uploadFailed' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEnhanceImage = async () => {
    if (!photoFile) {
      setEnhErr({ key: 'needFile' });
      return;
    }

    setEnhErr(null);
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
      setEnhErr(error.message ? { raw: error.message } : { key: 'enhanceFailed' });
    } finally {
      setIsEnhancingImage(false);
    }
  };

  const handleAcceptEnhancedImage = async () => {
    if (!enhancedPhotoUrl) return;

    setEnhErr(null);
    if (!enhancedPhotoFile) {
      setPhotoUrl(enhancedPhotoUrl);
      setEnhancedImageAccepted(true);
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadResult = await api.uploadProductImage(enhancedPhotoFile);
      if (!uploadResult?.url) {
        throw new Error(a.enhancedSaveFailed);
      }
      if (enhancedPhotoUrl.startsWith('blob:')) URL.revokeObjectURL(enhancedPhotoUrl);
      setEnhancedPhotoUrl(uploadResult.url);
      setPhotoUrl(uploadResult.url);
      setEnhancedImageAccepted(true);
    } catch (error) {
      setEnhErr({ raw: error.message || a.enhancedSaveFailed });
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
      setEnhErr(null);
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
    setEnhErr(null);
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
      editField('price', setPrice)(String(computedFairSellingPrice));
    }
  };

  // "Auto-fill from my story" button (re-fills everything, including fields edited before)
  const handleAutofillClick = () => {
    setFormErr(null);
    if (description.trim().length < MIN_STORY_LENGTH) {
      setFormErr({ raw: af.writeFirst });
      return;
    }
    runAutofill({ force: true });
  };

  // Submit & Publish to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr(null);

    if (!title.trim()) {
      setFormErr({ key: 'errTitle' });
      return;
    }
    if (!craftCategory.trim()) {
      setFormErr({ key: 'errCategory' });
      return;
    }
    if (!region.trim()) {
      setFormErr({ key: 'errRegion' });
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormErr({ key: 'errPrice' });
      return;
    }
    if (!description.trim()) {
      setFormErr({ key: 'errStory' });
      return;
    }

    const finalPhoto = photoUrl || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';

    setSubmitting(true);

    try {
      const productPayload = {
        title: title.trim(),
        category: detectCategoryKey(craftCategory) || craftCategory.trim(),
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
          id: res.data.id
        });

        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 }
        });
      } else {
        setFormErr({ key: 'errSave' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setFormErr(err.message ? { raw: err.message } : { key: 'errSaveGeneric' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(a.confirmDelete)) return;
    try {
      await api.deleteProduct(id);
      navigate('/artisan-profile');
    } catch (err) {
      alert(`${a.deleteFailed} ${err.message}`);
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
    touchedRef.current.clear();
    setAiFilled({});
    setAutoCount(null);
    setSaveStatus(null);
    setFormErr(null);
  };

  if (loadingExisting) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem auto' }} />
        <p style={{ color: 'var(--text-muted)' }}>{a.loading}</p>
      </div>
    );
  }

  const successTitle = isEditMode ? a.successUpdated : a.successCreated;
  const successMessage = saveStatus
    ? (isEditMode
      ? (saveStatus.savedInSupabase ? a.savedCloudUpdate : a.savedLocalUpdate)
      : (saveStatus.savedInSupabase ? a.savedCloudNew : a.savedLocalNew))
    : '';
  const showEstimateNote = aiFilled.laborHours || aiFilled.materialCost || aiFilled.price;

  return (
    <div className="cataloging-page-container">
      {/* Page Title & Status Header */}
      <div className="catalog-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            {isEditMode && (
              <Link to="/artisan-profile" className="back-link" title={a.backToProfile}>
                <ArrowLeft size={18} />
              </Link>
            )}
            <h1 className="page-title">{isEditMode ? a.editTitle : a.title}</h1>
          </div>
          <p className="page-subtitle">{isEditMode ? a.editSubtitle : a.pageSubtitle}</p>
        </div>

        {/* Database Status Pill */}
        <div className={`db-status-pill ${supabaseConnected ? 'is-connected' : 'is-local'}`}>
          <Database size={14} />
          <span>{supabaseConnected ? a.dbOnline : a.dbLocal}</span>
        </div>
      </div>

      {/* Success Notification */}
      {saveStatus && saveStatus.success && (
        <div className="catalog-success-banner">
          <CheckCircle size={28} className="success-icon" />
          <div className="success-content">
            <h3>{successTitle}</h3>
            <p>{successMessage}</p>
            <div className="success-action-btns">
              <Link to={`/product/${saveStatus.id}`} className="btn btn-sm btn-primary">
                <span>{a.viewListing}</span>
                <ArrowRight size={14} />
              </Link>
              {!isEditMode && (
                <button type="button" onClick={handleResetForm} className="btn btn-sm btn-secondary">
                  <RefreshCw size={14} />
                  <span>{a.listAnother}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Auto-fill Feedback (re-translates when the language changes) */}
      {autoCount !== null && !isEditMode && (
        <div className="ai-feedback-banner">
          <Sparkles size={16} />
          <span>{autoCount > 0 ? fill(af.done, { n: autoCount }) : af.nothing}</span>
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
            <div className="card catalog-card">
              <div className="catalog-card-header">
                <div className="catalog-card-header-left">
                  <h2 className="catalog-card-title">{a.detailsTitle}</h2>
                  <span className="card-title-sub">{a.voiceEnabled}</span>
                </div>
                <div className="catalog-card-header-right">
                  <LanguageSwitcher variant="card" />
                </div>
              </div>

              <hr className="form-divider" />

              {/* STORY FIRST: this is the only thing the artisan has to provide */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <VoiceInputField
                  id="craft-story"
                  type="textarea"
                  rows={5}
                  label={a.storyLabel}
                  value={description}
                  onChange={setDescription}
                  placeholder={a.storyPlaceholder}
                  required
                  currentLang={lang}
                  hint={a.storyHint}
                />
              </div>

              {/* AI auto-fill bar */}
              {!isEditMode && (
                <div className="autofill-bar">
                  <div className="autofill-bar-text">
                    <Sparkles size={18} />
                    <div>
                      <strong>{af.title}</strong>
                      <span>{af.hint}</span>
                    </div>
                  </div>
                  <div className="autofill-bar-actions">
                    {autoWorking && (
                      <span className="autofill-working">
                        <RefreshCw size={13} className="animate-spin" />
                        {af.working}
                      </span>
                    )}
                    <label className="autofill-switch">
                      <input
                        type="checkbox"
                        checked={autoMode}
                        onChange={(e) => setAutoMode(e.target.checked)}
                      />
                      <span className="autofill-switch-track" />
                      <span>{af.toggle}</span>
                    </label>
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleAutofillClick}>
                      <Sparkles size={14} />
                      <span>{aiFilled && Object.values(aiFilled).some(Boolean) ? af.refill : af.button}</span>
                    </button>
                  </div>
                </div>
              )}

              <hr className="form-divider" />

              {/* CRAFT CATEGORY */}
              <div className="form-group">
                <VoiceInputField
                  id="craft-category"
                  label={a.categoryLabel}
                  value={craftCategory}
                  onChange={editField('category', setCraftCategory)}
                  placeholder={a.categoryPlaceholder}
                  required
                  currentLang={lang}
                  hint={a.categoryHint}
                  aiFilled={aiFilled.category}
                />
              </div>

              {/* PRODUCT / CRAFT TITLE */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <VoiceInputField
                  id="craft-title"
                  label={a.titleLabel}
                  value={title}
                  onChange={editField('title', setTitle)}
                  placeholder={a.titlePlaceholder}
                  required
                  currentLang={lang}
                  hint={a.titleHint}
                  aiFilled={aiFilled.title}
                />
              </div>

              <hr className="form-divider" />

              {/* ARTISAN NAME & REGION */}
              <div className="form-grid-two">
                <div className="form-group">
                  <VoiceInputField
                    id="artisan-name"
                    label={a.artisanLabel}
                    value={artisanName}
                    onChange={editField('artisanName', setArtisanName)}
                    placeholder={a.artisanPlaceholder}
                    currentLang={lang}
                    aiFilled={aiFilled.artisanName}
                  />
                </div>

                <div className="form-group">
                  <VoiceInputField
                    id="artisan-region"
                    label={a.regionLabel}
                    value={region}
                    onChange={editField('region', setRegion)}
                    placeholder={a.regionPlaceholder}
                    required
                    currentLang={lang}
                    aiFilled={aiFilled.region}
                  />
                </div>
              </div>

              {/* RAW MATERIALS */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <VoiceInputField
                  id="raw-materials"
                  label={a.materialsLabel}
                  value={materials}
                  onChange={editField('materials', setMaterials)}
                  placeholder={a.materialsPlaceholder}
                  currentLang={lang}
                  hint={a.materialsHint}
                  aiFilled={aiFilled.materials}
                />
              </div>
            </div>

            {/* Fair Price & Artisan Wage Calculation Card */}
            <div className="card catalog-card calculator-card">
              <div className="calculator-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calculator size={19} color="var(--primary)" />
                  <h3 className="calculator-title">{a.calcTitle}</h3>
                </div>
                <span className="fair-trade-badge">
                  <ShieldCheck size={14} />
                  <span>{a.calcBadge}</span>
                </span>
              </div>

              <div className="calculator-grid">
                <VoiceInputField
                  id="calc-material-cost"
                  type="number"
                  label={a.materialCost}
                  value={materialCost}
                  onChange={editField('materialCost', setMaterialCost)}
                  placeholder="450"
                  currentLang={lang}
                  aiFilled={aiFilled.materialCost}
                />

                <VoiceInputField
                  id="calc-labor-hours"
                  type="number"
                  step="0.5"
                  label={a.laborHours}
                  value={laborHours}
                  onChange={editField('laborHours', setLaborHours)}
                  placeholder="6"
                  currentLang={lang}
                  aiFilled={aiFilled.laborHours}
                />

                <VoiceInputField
                  id="calc-hourly-wage"
                  type="number"
                  label={a.wage}
                  value={hourlyWage}
                  onChange={(val) => setHourlyWage(val)}
                  placeholder="150"
                  currentLang={lang}
                />

                <VoiceInputField
                  id="calc-packaging-cost"
                  type="number"
                  label={a.packaging}
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
                    {a.totalCost} <strong>₹{formatNumber(computedTotalCost)}</strong>{' '}
                    {fill(a.breakdown, {
                      mat: formatNumber(matNum),
                      wage: formatNumber(computedLaborCost),
                      pkg: formatNumber(pkgNum)
                    })}
                  </div>
                  <div className="calc-stat-main">
                    {a.fairPrice} <strong>₹{formatNumber(computedFairSellingPrice)}</strong>{' '}
                    <span className="profit-tag">{a.profit}</span>
                  </div>
                </div>

                {computedFairSellingPrice > 0 && (
                  <button type="button" onClick={handleApplyFairPrice} className="btn btn-sm btn-apply-price">
                    {fill(a.applyFair, { price: formatNumber(computedFairSellingPrice) })}
                  </button>
                )}
              </div>
              {showEstimateNote && <p className="ai-estimate-note">{af.estimateNote}</p>}
            </div>

            {/* Selling Price, Stock & Tags */}
            <div className="card catalog-card">
              <div className="form-grid-two">
                <div className="form-group">
                  <VoiceInputField
                    id="craft-price"
                    type="number"
                    label={a.sellingPrice}
                    value={price}
                    onChange={editField('price', setPrice)}
                    placeholder={a.sellingPricePlaceholder}
                    required
                    currentLang={lang}
                    aiFilled={aiFilled.price}
                  />
                </div>

                <div className="form-group">
                  <VoiceInputField
                    id="craft-stock"
                    type="number"
                    label={a.stock}
                    value={stock}
                    onChange={(val) => setStock(val)}
                    placeholder="5"
                    required
                    currentLang={lang}
                  />
                </div>
              </div>

              <div className="form-group">
                <VoiceInputField
                  id="craft-tags"
                  label={a.tags}
                  value={tags}
                  onChange={editField('tags', setTags)}
                  placeholder={a.tagsPlaceholder}
                  currentLang={lang}
                  aiFilled={aiFilled.tags}
                />
              </div>

              {/* Product Image Upload */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{a.photoLabel}</label>

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
                      <img src={photoUrl} alt={title || a.photoLabel} className="photo-thumb" />
                      <div className="photo-info">
                        <span className="photo-title">
                          {enhancedImageAccepted ? a.enhancedSelected : a.originalSelected}
                        </span>
                        <span className="photo-subtitle">{photoFile ? photoFile.name : a.urlLoaded}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        disabled={isUploadingImage || isEnhancingImage}
                      >
                        {a.change}
                      </button>
                      <button type="button" onClick={handleRemovePhoto} className="photo-remove-btn" title={a.removePhoto}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {originalPhotoUrl && photoFile && !enhancedPhotoUrl && (
                      <div className="image-enhancement-controls">
                        <label className="image-background-field" htmlFor="product-image-background">
                          <span>{a.bgOption}</span>
                          <select
                            id="product-image-background"
                            className="image-background-select"
                            value={imageBackgroundPreset}
                            onChange={(event) => {
                              setImageBackgroundPreset(event.target.value);
                              setEnhErr(null);
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
                                  setEnhErr(null);
                                } catch (error) {
                                  setEnhErr({ raw: error.message });
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
                              <span>{imageBackgroundFile?.name || a.selectBg}</span>
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
                              ? a.enhancing
                              : imageBackgroundPreset === 'none'
                                ? a.enhance
                                : a.enhanceBg}
                          </span>
                        </button>
                        <span className="image-enhancement-note">{a.originalStays}</span>
                      </div>
                    )}

                    {originalPhotoUrl && enhancedPhotoUrl && originalPhotoUrl !== enhancedPhotoUrl && (
                      <div className="image-enhancement-review">
                        <BeforeAfterSlider
                          beforeImage={originalPhotoUrl}
                          afterImage={enhancedPhotoUrl}
                          beforeLabel={a.original}
                          afterLabel={a.enhanced}
                        />
                        <div className="image-enhancement-actions">
                          <button
                            type="button"
                            className={`btn btn-sm ${enhancedImageAccepted ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={handleAcceptEnhancedImage}
                            disabled={isUploadingImage || isEnhancingImage || enhancedImageAccepted}
                          >
                            <Check size={16} />
                            <span>{enhancedImageAccepted ? a.enhancedAccepted : a.acceptEnhanced}</span>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${enhancedImageAccepted ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleKeepOriginalImage}
                            disabled={isUploadingImage || isEnhancingImage}
                          >
                            <ImageIcon size={16} />
                            <span>{a.keepOriginal}</span>
                          </button>
                          {photoFile && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleTryAgain}
                              disabled={isUploadingImage || isEnhancingImage}
                            >
                              <Upload size={16} />
                              <span>{a.tryAgain}</span>
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
                    <div onClick={() => fileInputRef.current?.click()} className="upload-dropzone">
                      <Upload size={26} className="upload-icon" />
                      <div className="upload-title">{isUploadingImage ? a.uploading : a.uploadPrompt}</div>
                      <span className="upload-desc">{a.uploadHint}</span>
                    </div>

                    {enhancementError && (
                      <p className="image-enhancement-error" role="alert">
                        <AlertCircle size={16} />
                        <span>{enhancementError}</span>
                      </p>
                    )}

                    <div className="url-toggle-row">
                      <button type="button" onClick={() => setShowUrlInput(!showUrlInput)} className="url-toggle-btn">
                        {showUrlInput ? a.hideUrl : a.pasteUrl}
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
                        <button type="button" onClick={handleApplyUrl} className="btn btn-secondary btn-sm">
                          {a.apply}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="catalog-actions-bar">
              <div className="publish-btns-group">
                <button type="submit" disabled={submitting} className="btn btn-publish">
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      <span>{isEditMode ? a.updating : a.publishing}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>{isEditMode ? a.update : a.publish}</span>
                    </>
                  )}
                </button>

                <button type="button" onClick={handleResetForm} className="btn btn-secondary" disabled={submitting}>
                  {a.clear}
                </button>

                {isEditMode && (
                  <button type="button" onClick={handleDelete} className="btn btn-danger-delete">
                    <Trash2 size={16} />
                    <span>{a.deleteBtn}</span>
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
              <span className="preview-heading-text">{a.previewHeading}</span>
            </div>

            <div className="preview-card">
              <div className="preview-img-container">
                {photoUrl ? (
                  <img src={photoUrl} alt={title || a.previewHeading} className="preview-img" />
                ) : (
                  <div className="preview-placeholder-box">
                    <ImageIcon size={44} className="placeholder-icon" />
                    <span>{a.previewPhoto}</span>
                  </div>
                )}

                <div className="preview-category-tag">
                  {(craftCategory || a.heritageCraft).toUpperCase()}
                </div>
              </div>

              <div className="preview-card-body">
                <h3 className="preview-card-title">{title || a.untitled}</h3>

                <div className="preview-artisan-line">
                  <MapPin size={14} className="map-icon" />
                  <span className="preview-region">{region || a.defaultRegion}</span>
                  <span className="dot-sep">•</span>
                  <span className="preview-artisan-name">{artisanName || a.defaultMaker}</span>
                </div>

                <div className="preview-materials-line">
                  <strong>{a.materialsPrefix} </strong>
                  <span>{materials || a.defaultMaterials}</span>
                </div>

                <p className="preview-card-story">{description || a.previewStory}</p>

                <div className="preview-card-footer">
                  <div className="preview-price-block">
                    <span className="price-label">{a.priceLabel}</span>
                    <span className="price-amount">₹{price ? formatNumber(price) : '0'}</span>
                  </div>

                  <div className="preview-stock-badge">
                    <span className="stock-check">✓</span>
                    <span>{stock || 1} {a.available}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog-signin-row">
        <Link to="/login" className="btn btn-signin" aria-label={a.signIn || t.common?.signIn}>
          <User size={16} />
          <span>{t.nav?.login || 'Sign In'}</span>
        </Link>
      </div>
    </div>
  );
}
