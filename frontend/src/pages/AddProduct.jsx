
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
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  enhanceProductImage,
  IMAGE_BACKGROUND_PRESETS,
  validateImageFile
} from '../services/imageEnhancer.js';
import { useLanguage, fill } from '../i18n/index.js';
import {
  analyzeStory,
  detectCategoryKey,
  MIN_STORY_LENGTH
} from '../services/craftAutofill.js';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import VoiceInputField from '../components/VoiceInputField.jsx';

const SUPPORTED_LANGUAGES = ['en', 'hi', 'kn', 'ta', 'te', 'ml'];

export default function AddProduct() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { id: userId, fullName, studioName } = useAuth();
  const { t, lang, formatNumber } = useLanguage();

  const fileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const touchedRef = useRef(new Set());
  const translationsRef = useRef(null);
  const translationSourceRef = useRef('');
  const autoFillTimerRef = useRef(null);
  const generationRequestRef = useRef(0);

  const cf = t?.catalogForm || {};
  const a = t?.addCraft || {};
  const af = t?.autofill || {};

  // FORM STATE
  const [title, setTitle] = useState('');
  const [craftCategory, setCraftCategory] = useState('');
  const [artisanName, setArtisanName] = useState('Shankar Das');
  const [region, setRegion] = useState('');
  const [materials, setMaterials] = useState('');
  // Original artisan story (typed or spoken) is the AI input.
  const [craftStory, setCraftStory] = useState('');
  // Polished, editable product description shown to buyers.
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('5');
  const [tags, setTags] = useState('');

  // COST CALCULATOR
  const [materialCost, setMaterialCost] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [hourlyWage, setHourlyWage] = useState('150');
  const [packagingCost, setPackagingCost] = useState('80');

  // IMAGE STATE
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
  const [enhErr, setEnhErr] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // AI STATE
  const [loadingAi, setLoadingAi] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [autoWorking, setAutoWorking] = useState(false);
  const [autoCount, setAutoCount] = useState(null);
  const [autoFeedbackSource, setAutoFeedbackSource] = useState(null);
  const [aiFilled, setAiFilled] = useState({});

  // SUBMISSION STATE
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [formErr, setFormErr] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const errText = (error) => (
    error ? (error.key ? a[error.key] : error.raw) : ''
  );

  const enhancementError = errText(enhErr);
  const formError = errText(formErr);

  // MANUAL EDIT PROTECTION
  const invalidatePendingAiGeneration = () => {
    if (!loadingAi) return;
    generationRequestRef.current += 1;
    setLoadingAi(false);
  };

  const editField = (field, setter) => (value) => {
    invalidatePendingAiGeneration();
    touchedRef.current.add(field);

    translationsRef.current = null;
    translationSourceRef.current = '';

    setAiFilled((previous) => ({
      ...previous,
      [field]: false
    }));

    setter(value);
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

  // PRODUCT DATA USED FOR TRANSLATIONS
  const getCurrentProductData = () => ({
    title: title.trim(),
    category: detectCategoryKey(craftCategory) || craftCategory.trim(),
    description: description.trim(),
    region: region.trim(),
    materials: materials
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    tags: tags
      .split(',')
      .map((item) => item.trim().replace(/^#/, ''))
      .filter(Boolean)
  });

  const getTranslationSourceKey = (product) => JSON.stringify({
    title: product.title,
    category: product.category,
    description: product.description,
    region: product.region,
    materials: product.materials,
    tags: product.tags
  });

  const normalizeTranslations = (translations) => {
    if (!translations || typeof translations !== 'object') {
      throw new Error('AI did not return product translations.');
    }

    const result = {};

    for (const language of SUPPORTED_LANGUAGES) {
      const translation = translations[language];

      if (
        !translation ||
        typeof translation !== 'object' ||
        !translation.title ||
        !translation.description
      ) {
        throw new Error(
          `AI translation is missing for language: ${language}`
        );
      }

      result[language] = {
        title: String(translation.title),
        description: String(translation.description),
        region: String(translation.region || ''),
        materials: Array.isArray(translation.materials)
          ? translation.materials
          : [],
        tags: Array.isArray(translation.tags)
          ? translation.tags
          : [],
        story: String(
          translation.story || translation.description
        ),
        seo_keywords: Array.isArray(translation.seo_keywords)
          ? translation.seo_keywords.join(', ')
          : String(translation.seo_keywords || '')
      };
    }

    return result;
  };

  // GEMINI CATALOG GENERATION
  const generateCatalogWithAI = async ({ applyFields = true } = {}) => {
    const requestId = ++generationRequestRef.current;
    if (autoFillTimerRef.current) {
      clearTimeout(autoFillTimerRef.current);
      autoFillTimerRef.current = null;
      setAutoWorking(false);
    }
    setLoadingAi(true);
    setFormErr(null);

    try {
      if (craftStory.trim().length < MIN_STORY_LENGTH) {
        throw new Error(
          af.writeFirst || 'Please enter a longer craft story first.'
        );
      }

      const response = await api.generateSmartCatalog({
        description: craftStory.trim(),
        story: craftStory.trim(),
        craftType: craftCategory.trim(),
        category: craftCategory.trim(),
        title: title.trim(),
        region: region.trim(),
        materials: materials.trim(),
        language: lang
      });

      if (requestId !== generationRequestRef.current) return null;

      if (!response?.success) {
        throw new Error(
          response?.message || 'AI catalog generation failed.'
        );
      }

      const catalog = response.catalog || response;
      const generatedTranslations = normalizeTranslations(
        response.translations
      );

      // Keep the artisan's original story separate from the buyer-facing copy.
      // Prefer the catalog description, then the English translation.
      const generatedDescription = String(
        catalog.description || generatedTranslations.en?.description || ''
      ).trim();

      let finalTitle = title.trim();
      let finalCategory = craftCategory.trim();
      let finalRegion = region.trim();
      let finalMaterials = materials.trim();
      let finalTags = tags.trim();
      let filledFieldCount = 0;

      if (applyFields) {
        if (generatedDescription && !touchedRef.current.has('description')) {
          setDescription(generatedDescription);
          filledFieldCount += 1;
          setAiFilled((previous) => ({ ...previous, description: 'ai' }));
        }
        if (!touchedRef.current.has('title') && catalog.title) {
          finalTitle = String(catalog.title);
          setTitle(finalTitle);
          filledFieldCount += 1;
          setAiFilled((previous) => ({
            ...previous,
            title: 'ai'
          }));
        }

        if (!touchedRef.current.has('category') && catalog.category) {
          finalCategory = String(catalog.category);
          setCraftCategory(finalCategory);
          filledFieldCount += 1;
          setAiFilled((previous) => ({
            ...previous,
            category: 'ai'
          }));
        }

        if (!touchedRef.current.has('region') && catalog.region) {
          finalRegion = String(catalog.region);
          setRegion(finalRegion);
          filledFieldCount += 1;
          setAiFilled((previous) => ({
            ...previous,
            region: 'ai'
          }));
        }

        if (
          !touchedRef.current.has('materials') &&
          Array.isArray(catalog.materials)
        ) {
          finalMaterials = catalog.materials.join(', ');
          setMaterials(finalMaterials);
          if (catalog.materials.length > 0) filledFieldCount += 1;
          setAiFilled((previous) => ({
            ...previous,
            materials: 'ai'
          }));
        }

        if (!touchedRef.current.has('tags')) {
          const generatedTags = catalog.tags || [];

          if (Array.isArray(generatedTags)) {
            finalTags = generatedTags.join(', ');
            setTags(finalTags);
            if (generatedTags.length > 0) filledFieldCount += 1;
            setAiFilled((previous) => ({
              ...previous,
              tags: 'ai'
            }));
          }
        }
      }

      const finalProduct = {
        title: finalTitle,
        category: detectCategoryKey(finalCategory) || finalCategory,
        description: description.trim(),
        region: finalRegion,
        materials: finalMaterials
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        tags: finalTags
          .split(',')
          .map((item) => item.trim().replace(/^#/, ''))
          .filter(Boolean)
      };

      translationsRef.current = generatedTranslations;
      translationSourceRef.current = getTranslationSourceKey(finalProduct);

      if (applyFields) {
        setAutoCount(filledFieldCount);
        setAutoFeedbackSource('ai');
      }

      return {
        catalog,
        translations: generatedTranslations
      };
    } catch (error) {
      const generationError = new Error(
        `AI catalog generation failed: ${error.message || 'Unknown error.'}`
      );
      if (requestId === generationRequestRef.current) {
        setFormErr({ raw: generationError.message });
      }
      throw generationError;
    } finally {
      if (requestId === generationRequestRef.current) {
        setLoadingAi(false);
      }
    }
  };

  // LOCAL AUTOFILL WHILE TYPING
  const runAutofill = ({ force = false } = {}) => {
    const result = analyzeStory(craftStory, {
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
      applied[field] = 'suggestion';
    });

    setAiFilled((previous) => (
      force ? applied : { ...previous, ...applied }
    ));

    const count = Object.keys(applied).length;

    setAutoCount(count > 0 ? count : null);
    setAutoFeedbackSource(count > 0 ? 'suggestions' : null);
  };

  useEffect(() => {
    if (isEditMode || !autoMode) return undefined;

    if (craftStory.trim().length < MIN_STORY_LENGTH) {
      setAutoWorking(false);
      setAutoCount(null);
      setAutoFeedbackSource(null);
      return undefined;
    }

    setAutoCount(null);
    setAutoFeedbackSource(null);
    setAutoWorking(true);

    const timer = setTimeout(() => {
      autoFillTimerRef.current = null;
      runAutofill();
      setAutoWorking(false);
    }, 900);
    autoFillTimerRef.current = timer;

    return () => {
      clearTimeout(timer);
      if (autoFillTimerRef.current === timer) {
        autoFillTimerRef.current = null;
      }
      setAutoWorking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftStory, lang, autoMode, isEditMode]);

  // CLEAN UP TEMPORARY IMAGE URLS
  useEffect(() => () => {
    if (originalPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalPhotoUrl);
    }

    if (enhancedPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(enhancedPhotoUrl);
    }
  }, [originalPhotoUrl, enhancedPhotoUrl]);

  // LOAD EXISTING PRODUCT
  useEffect(() => {
    if (!id) return undefined;

    let isMounted = true;

    async function loadItem() {
      setLoadingExisting(true);

      try {
        // Always load the original source product.
        // Do not load a translated copy when editing.
        const item = await api.getProductById(id, 'en');

        if (isMounted && item) {
          setTitle(item.title || '');
          setCraftCategory(
            cf.categories?.[item.category] || item.category || ''
          );
          setArtisanName(item.artisan_name || 'Shankar Das');
          setRegion(item.region || '');

          setMaterials(
            Array.isArray(item.materials)
              ? item.materials.join(', ')
              : (item.materials || '')
          );

          setPrice(String(item.price ?? ''));
          setStock(String(item.stock ?? '5'));
          setDescription(item.description || '');
          setCraftStory(item.description || '');

          setTags(
            Array.isArray(item.tags)
              ? item.tags.join(', ')
              : (item.tags || '')
          );

          setPhotoUrl(item.image_url || '');
          setOriginalPhotoUrl(
            item.original_image_url || item.image_url || ''
          );
          setEnhancedPhotoUrl(item.enhanced_image_url || '');

          setEnhancedImageAccepted(Boolean(
            item.original_image_url &&
            item.enhanced_image_url &&
            item.image_url === item.enhanced_image_url &&
            item.original_image_url !== item.image_url
          ));
        }
      } catch (error) {
        console.error('Failed to load craft for editing:', error);
        setFormErr({
          raw: error.message || 'Could not load this product.'
        });
      } finally {
        if (isMounted) setLoadingExisting(false);
      }
    }

    loadItem();

    return () => {
      isMounted = false;
    };

    // Intentionally depend only on id.
    // Changing the interface language must not reload the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // IMAGE UPLOAD
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    event.target.value = '';

    try {
      validateImageFile(file);
    } catch (error) {
      setEnhErr({ raw: error.message });
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
    } catch (error) {
      setEnhErr({
        raw: error.message || 'Image upload failed.'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // IMAGE ENHANCEMENT
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

      if (enhancedPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(enhancedPhotoUrl);
      }

      setEnhancedPhotoFile(enhancedFile);
      setEnhancedPhotoUrl(URL.createObjectURL(enhancedFile));
      setEnhancedImageAccepted(false);
    } catch (error) {
      setEnhErr({
        raw: error.message || 'Image enhancement failed.'
      });
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
        throw new Error('Could not save enhanced image.');
      }

      if (enhancedPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(enhancedPhotoUrl);
      }

      setEnhancedPhotoUrl(uploadResult.url);
      setPhotoUrl(uploadResult.url);
      setEnhancedImageAccepted(true);
    } catch (error) {
      setEnhErr({
        raw: error.message || 'Could not save enhanced image.'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleKeepOriginalImage = () => {
    setPhotoUrl(originalPhotoUrl);
    setEnhancedImageAccepted(false);
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;

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

  // FAIR PRICE CALCULATOR
  const matNum = Number(materialCost) || 0;
  const hoursNum = Number(laborHours) || 0;
  const wageNum = Number(hourlyWage) || 150;
  const pkgNum = Number(packagingCost) || 0;

  const computedLaborCost = hoursNum * wageNum;
  const computedTotalCost = matNum + computedLaborCost + pkgNum;
  const computedArtisanMargin = Math.round(computedTotalCost * 0.30);

  const computedFairSellingPrice = Math.round(
    computedTotalCost + computedArtisanMargin
  );

  const handleApplyFairPrice = () => {
    if (computedFairSellingPrice > 0) {
      editField('price', setPrice)(
        String(computedFairSellingPrice)
      );
    }
  };

  // GEMINI BUTTON
  const handleAutofillClick = async () => {
    const generation = generateCatalogWithAI({ applyFields: true });
    const requestId = generationRequestRef.current;

    try {
      await generation;
    } catch (error) {
      console.error('AI catalog generation failed:', error);
      if (requestId === generationRequestRef.current) {
        setFormErr({ raw: error.message || 'AI catalog generation failed.' });
      }
    }
  };

  // PUBLISH PRODUCT
  const handleSubmit = async (event) => {
    event.preventDefault();
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

    if (!craftStory.trim()) {
      setFormErr({ raw: 'Please enter the artisan craft story using text or voice.' });
      return;
    }

    if (!description.trim()) {
      setFormErr({ raw: 'Please generate or enter a product description before publishing.' });
      return;
    }

    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      setFormErr({
        raw: 'Stock must be a whole number and cannot be negative.'
      });
      return;
    }

    if (isUploadingImage || isEnhancingImage || loadingAi) {
      setFormErr({
        raw: 'Please wait until the current operation finishes.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const productData = getCurrentProductData();
      const sourceKey = getTranslationSourceKey(productData);

      let translations = translationsRef.current;

      if (
        !translations ||
        translationSourceRef.current !== sourceKey
      ) {
        const aiResult = await generateCatalogWithAI({
          applyFields: false
        });

        if (!aiResult) return;
        translations = aiResult.translations;
      }

      if (!translations) {
        throw new Error('Product translations could not be generated.');
      }

      const finalPhoto = photoUrl || null;

      const productPayload = {
        title: title.trim(),
        category: productData.category,
        price: Number(price),
        artisan_name: artisanName.trim() || 'Master Artisan',

        // Replace null with the authenticated artisan ID
        // when real artisan authentication is implemented.
        artisan_id: userId,

        region: region.trim(),
        description: description.trim(),
        materials: productData.materials,

        image_url: finalPhoto,
        original_image_url: originalPhotoUrl || finalPhoto,
        enhanced_image_url: enhancedImageAccepted
          ? enhancedPhotoUrl
          : null,

        tags: productData.tags,
        stock: Number(stock),
        translations
      };

      let response;

      if (isEditMode) {
        response = await api.updateProduct(id, productPayload);
      } else {
        response = await api.createProduct(productPayload);
      }

      if (!response?.success) {
        throw new Error('Product could not be saved.');
      }

      if (response.translationsSaved === false) {
        throw new Error(
          response.translationError ||
          'Product was saved, but its translations could not be saved. Please check the backend and try again.'
        );
      }

      setSaveStatus({
        success: true,
        savedInSupabase: response.savedInSupabase,
        id: response.data.id
      });

      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Product save error:', error);

      setFormErr({
        raw: error.message || 'Could not save the product.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE PRODUCT
  const handleDelete = async () => {
    if (!window.confirm(a.confirmDelete)) return;

    try {
      await api.deleteProduct(id);
      navigate('/artisan-profile');
    } catch (error) {
      alert(`${a.deleteFailed} ${error.message}`);
    }
  };

  // RESET FORM
  const handleResetForm = () => {
    setTitle('');
    setCraftCategory('');
    setArtisanName('Shankar Das');
    setRegion('');
    setMaterials('');
    setPrice('');
    setStock('5');
    setCraftStory('');
    setDescription('');
    setTags('');

    setPhotoUrl('');
    setOriginalPhotoUrl('');
    setEnhancedPhotoUrl('');
    setEnhancedPhotoFile(null);
    setEnhancedImageAccepted(false);
    setPhotoFile(null);
    setImageBackgroundPreset('none');
    setImageBackgroundFile(null);

    setMaterialCost('');
    setLaborHours('');
    setHourlyWage('150');
    setPackagingCost('80');

    touchedRef.current.clear();
    translationsRef.current = null;
    translationSourceRef.current = '';

    setAiFilled({});
    setAutoCount(null);
    setAutoFeedbackSource(null);
    setSaveStatus(null);
    setFormErr(null);
    setEnhErr(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // LOADING SCREEN
  if (loadingExisting) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          className="spinner"
          style={{ margin: '0 auto 1rem auto' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>{a.loading}</p>
      </div>
    );
  }

  const successTitle = isEditMode
    ? a.successUpdated
    : a.successCreated;

  const successMessage = saveStatus
    ? (
      isEditMode
        ? (
          saveStatus.savedInSupabase
            ? a.savedCloudUpdate
            : a.savedLocalUpdate
        )
        : (
          saveStatus.savedInSupabase
            ? a.savedCloudNew
            : a.savedLocalNew
        )
    )
    : '';

  const showEstimateNote =
    aiFilled.laborHours ||
    aiFilled.materialCost ||
    aiFilled.price;

  // PAGE
  return (
    <>
      <style>{`
        .cataloging-page-container .craft-description-group {
          width: 100%;
          margin-bottom: 1rem;
        }
        .cataloging-page-container .craft-description-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .cataloging-page-container .craft-description-edit-label {
          color: var(--catalog-muted);
          font-size: 0.78rem;
          font-weight: 600;
        }
        .cataloging-page-container .craft-description-input {
          display: block;
          width: 100%;
          min-height: 190px;
          padding: 14px 16px;
          line-height: 1.65;
          resize: vertical;
          box-sizing: border-box;
          color: var(--catalog-text);
          background: var(--catalog-surface);
          border: 1px solid var(--catalog-border);
          border-radius: 12px;
          font: inherit;
        }
        .cataloging-page-container .craft-description-input:focus {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
        .cataloging-page-container .craft-description-footer {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-top: 7px;
        }
        .cataloging-page-container .craft-description-count {
          flex: 0 0 auto;
          color: var(--catalog-muted);
          font-size: 0.78rem;
        }
        @media (max-width: 600px) {
          .cataloging-page-container .craft-description-input {
            min-height: 160px;
          }
        }

        /*
         * Add Product theme + preview/publish surface.
         * Uses the app's light/dark theme markers and keeps the preview
         * and publish actions visually connected as one section.
         */
        .cataloging-page-container {
          --catalog-surface: var(--card-bg, var(--surface, #ffffff));
          --catalog-page: var(--page-bg, var(--background, #f7f5f0));
          --catalog-text: var(--text-primary, var(--text, #29251f));
          --catalog-muted: var(--text-muted, #746d63);
          --catalog-border: var(--border-color, #e7e0d6);
          --catalog-preview-bg: var(--catalog-surface);
          color: var(--catalog-text);
          color-scheme: light;
        }
        .dark .cataloging-page-container,
        [data-theme="dark"] .cataloging-page-container,
        [data-bs-theme="dark"] .cataloging-page-container,
        [data-mode="dark"] .cataloging-page-container,
        html.dark .cataloging-page-container {
          --catalog-surface: var(--card-bg, var(--surface, #242321));
          --catalog-page: var(--page-bg, var(--background, #181817));
          --catalog-text: var(--text-primary, var(--text, #f4f0e9));
          --catalog-muted: var(--text-muted, #b8b0a5);
          --catalog-border: var(--border-color, #403d38);
          --catalog-preview-bg: var(--catalog-surface);
          color-scheme: dark;
        }
        .cataloging-page-container .catalog-card,
        .cataloging-page-container .preview-card {
          color: var(--catalog-text);
          background: var(--catalog-surface);
          border-color: var(--catalog-border);
        }
        .cataloging-page-container .preview-card-body {
          color: var(--catalog-text);
        }
        .cataloging-page-container .preview-card-story,
        .cataloging-page-container .preview-artisan-line,
        .cataloging-page-container .preview-materials-line {
          color: var(--catalog-muted);
        }
        .cataloging-page-container .form-divider {
          border-color: var(--catalog-border);
        }

        /* One continuous surface behind Live Buyer Preview + Publish buttons */
        .catalog-preview-before-publish {
          width: 100% !important;
          max-width: none !important;
          margin: 18px 0 0 !important;
          padding: 20px 18px 18px;
          float: none !important;
          box-sizing: border-box;
          background: var(--catalog-surface);
          border: 1px solid var(--catalog-border);
          border-bottom: 0;
          border-radius: 16px 16px 0 0;
        }
        .cataloging-page-container .catalog-actions-bar {
          margin-top: 0 !important;
          padding: 16px 18px 20px;
          background: var(--catalog-surface);
          border: 1px solid var(--catalog-border);
          border-top: 0;
          border-radius: 0 0 16px 16px;
          box-sizing: border-box;
        }
        .cataloging-page-container .catalog-actions-bar .btn-secondary {
          color: var(--catalog-text);
        }
        .catalog-preview-before-publish .preview-sticky-wrap {
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .catalog-preview-before-publish .preview-top-badge {
          text-align: center;
          margin-bottom: 12px;
        }
        .catalog-preview-before-publish .preview-card {
          width: 100% !important;
          max-width: 560px !important;
          margin: 0 auto !important;
          overflow: hidden;
          border-radius: 14px;
        }
        .catalog-preview-before-publish .preview-img-container {
          width: 100% !important;
          height: 340px !important;
          min-height: 340px !important;
          overflow: hidden;
          background: #f6f1e9;
          position: relative;
        }
        .dark .catalog-preview-before-publish .preview-img-container,
        [data-theme="dark"] .catalog-preview-before-publish .preview-img-container,
        [data-bs-theme="dark"] .catalog-preview-before-publish .preview-img-container,
        [data-mode="dark"] .catalog-preview-before-publish .preview-img-container,
        html.dark .catalog-preview-before-publish .preview-img-container {
          background: #302d28;
        }
        .catalog-preview-before-publish .preview-img {
          display: block;
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          object-position: center;
        }
        .catalog-preview-before-publish .preview-placeholder-box {
          width: 100%;
          height: 100%;
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
        }
        .catalog-preview-before-publish .preview-card-body {
          padding: 15px 18px !important;
        }
        .catalog-preview-before-publish .preview-card-title {
          font-size: 19px;
          margin: 0 0 8px;
        }
        .catalog-preview-before-publish .preview-card-story {
          font-size: 13px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 600px) {
          .catalog-preview-before-publish {
            max-width: 100% !important;
            padding-left: 12px;
            padding-right: 12px;
          }
          .catalog-preview-before-publish .preview-img-container,
          .catalog-preview-before-publish .preview-placeholder-box {
            height: 280px !important;
            min-height: 280px !important;
          }
        }
      `}</style>
      <div className="cataloging-page-container">

      {/* PAGE HEADER */}
      <div className="catalog-header-bar">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.25rem'
            }}
          >
            {isEditMode && (
              <Link
                to="/artisan-profile"
                className="back-link"
                title={a.backToProfile}
              >
                <ArrowLeft size={18} />
              </Link>
            )}

            <h1 className="page-title">
              {isEditMode ? a.editTitle : a.title}
            </h1>
          </div>

          <p className="page-subtitle">
            {isEditMode ? a.editSubtitle : a.pageSubtitle}
          </p>
        </div>

      </div>

      {/* SUCCESS MESSAGE */}
      {saveStatus && saveStatus.success && (
        <div className="catalog-success-banner">
          <CheckCircle size={28} className="success-icon" />

          <div className="success-content">
            <h3>{successTitle}</h3>
            <p>{successMessage}</p>

            <div className="success-action-btns">
              <Link
                to={`/product/${saveStatus.id}`}
                className="btn btn-sm btn-primary"
              >
                <span>{a.viewListing}</span>
                <ArrowRight size={14} />
              </Link>

              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-sm btn-secondary"
                >
                  <RefreshCw size={14} />
                  <span>{a.listAnother}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI FEEDBACK */}
      {autoCount !== null && !isEditMode && (
        <div className="ai-feedback-banner">
          <Sparkles size={16} />
          <span>
            {autoFeedbackSource === 'suggestions'
              ? fill(
                  af.suggestions || 'Local suggestions filled {n} fields from your story. Review them before using.',
                  { n: autoCount }
                )
              : autoCount > 0
                ? fill(af.done, { n: autoCount })
                : af.nothing}
          </span>
        </div>
      )}

      {/* ERROR */}
      {formError && (
        <div className="form-error-banner" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{formError}</span>
        </div>
      )}

      {/* TWO COLUMN LAYOUT */}
      <div className="catalog-two-column-layout">

        {/* LEFT COLUMN */}
        <div className="catalog-form-col">
          <form onSubmit={handleSubmit} noValidate>

            {/* CRAFT DETAILS */}
            <div className="card catalog-card">
              <div className="catalog-card-header">
                <div className="catalog-card-header-left">
                  <h2 className="catalog-card-title">
                    {a.detailsTitle}
                  </h2>

                  <span className="card-title-sub">
                    {a.voiceEnabled}
                  </span>
                </div>
              </div>

              <hr className="form-divider" />

              {/* ORIGINAL CRAFT STORY: TEXT + VOICE INPUT */}
              <div className="form-group craft-description-group">
                <div className="craft-description-heading">
                  <label className="form-label" htmlFor="craft-story">
                    {a.storyLabel || 'Tell us your craft story'} <span aria-hidden="true">*</span>
                  </label>
                  <span className="craft-description-edit-label">Text or voice</span>
                </div>

                <VoiceInputField
                  id="craft-story"
                  type="textarea"
                  rows={5}
                  maxLength={3000}
                  value={craftStory}
                  onChange={(value) => {
                    invalidatePendingAiGeneration();
                    setCraftStory(value);
                    setAutoCount(null);
                    setAutoFeedbackSource(null);
                    translationsRef.current = null;
                    translationSourceRef.current = '';
                  }}
                  placeholder={a.storyPlaceholder || 'Tell us how you make this product, which materials you use, and what makes it special...'}
                  required
                  currentLang={lang}
                  hint={a.storyHint || 'You can type your story or use the microphone. The AI will use this story to prepare your product listing.'}
                />
                <small className="craft-description-count">{craftStory.length}/3000</small>
              </div>

              {/* AI CATALOG GENERATION */}
              {!isEditMode && (
                <div className="autofill-bar">
                  <div className="autofill-bar-text">
                    <Sparkles size={18} />

                    <div>
                      <strong>{af.title}</strong>
                      <span>
                        Generate product details and six language translations
                      </span>
                    </div>
                  </div>

                  <div className="autofill-bar-actions">
                    {autoWorking && (
                      <span className="autofill-working">
                        <RefreshCw
                          size={13}
                          className="animate-spin"
                        />
                        {af.working}
                      </span>
                    )}

                    <label className="autofill-switch">
                      <input
                        type="checkbox"
                        checked={autoMode}
                        onChange={(event) => setAutoMode(event.target.checked)}
                      />

                      <span className="autofill-switch-track" />
                      <span>{af.toggle}</span>
                    </label>

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleAutofillClick}
                      disabled={loadingAi || submitting}
                    >
                      {loadingAi ? (
                        <RefreshCw
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Sparkles size={14} />
                      )}

                      <span>
                        {loadingAi
                          ? 'Generating...'
                          : Object.values(aiFilled).some(Boolean)
                            ? af.refill
                            : 'Generate with AI'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* BUYER-FACING PRODUCT DESCRIPTION: AI AUTOFILL + MANUAL EDIT */}
              <div className="form-group craft-description-group">
                <div className="craft-description-heading">
                  <label className="form-label" htmlFor="product-description">
                    Product Description <span aria-hidden="true">*</span>
                  </label>
                  <span className="craft-description-edit-label">AI generated · Editable</span>
                </div>

                <textarea
                  id="product-description"
                  name="productDescription"
                  className="form-input craft-description-input"
                  rows={6}
                  value={description}
                  onChange={(event) => {
                    editField('description', setDescription)(event.target.value);
                  }}
                  placeholder="Your polished product description will appear here after AI generation. You can also write or edit it yourself."
                  required
                  maxLength={3000}
                  aria-describedby="product-description-help product-description-count"
                />

                <div className="craft-description-footer">
                  <small id="product-description-help" className="form-hint">
                    This is the description buyers will see on your product listing. Review and edit it before publishing.
                  </small>
                  <small id="product-description-count" className="craft-description-count">
                    {description.length}/3000
                  </small>
                </div>
              </div>

              <hr className="form-divider" />

              {/* CATEGORY */}
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

              {/* TITLE */}
              <div
                className="form-group"
                style={{ marginBottom: '1.25rem' }}
              >
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

              {/* ARTISAN AND REGION */}
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

              {/* MATERIALS */}
              <div
                className="form-group"
                style={{ marginBottom: 0 }}
              >
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

            {/* FAIR PRICE CALCULATOR */}
            <div className="card catalog-card calculator-card">
              <div className="calculator-header">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Calculator
                    size={19}
                    color="var(--primary)"
                  />

                  <h3 className="calculator-title">
                    {a.calcTitle}
                  </h3>
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
                  onChange={setHourlyWage}
                  placeholder="150"
                  currentLang={lang}
                />

                <VoiceInputField
                  id="calc-packaging-cost"
                  type="number"
                  label={a.packaging}
                  value={packagingCost}
                  onChange={setPackagingCost}
                  placeholder="80"
                  currentLang={lang}
                />
              </div>

              <div className="calc-breakdown-bar">
                <div className="calc-breakdown-stats">
                  <div className="calc-stat-sub">
                    {a.totalCost}{' '}
                    <strong>
                      ₹{formatNumber(computedTotalCost)}
                    </strong>{' '}

                    {fill(a.breakdown, {
                      mat: formatNumber(matNum),
                      wage: formatNumber(computedLaborCost),
                      pkg: formatNumber(pkgNum)
                    })}
                  </div>

                  <div className="calc-stat-main">
                    {a.fairPrice}{' '}
                    <strong>
                      ₹{formatNumber(computedFairSellingPrice)}
                    </strong>{' '}

                    <span className="profit-tag">
                      {a.profit}
                    </span>
                  </div>
                </div>

                {computedFairSellingPrice > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyFairPrice}
                    className="btn btn-sm btn-apply-price"
                  >
                    {fill(a.applyFair, {
                      price: formatNumber(computedFairSellingPrice)
                    })}
                  </button>
                )}
              </div>

              {showEstimateNote && (
                <p className="ai-estimate-note">
                  {af.estimateNote}
                </p>
              )}
            </div>

            {/* PRICE, STOCK AND TAGS */}
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
                    onChange={setStock}
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

              {/* PRODUCT IMAGE */}
              <div
                className="form-group"
                style={{ marginBottom: 0 }}
              >
                <label className="form-label">
                  {a.photoLabel}
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
                        alt={title || a.photoLabel}
                        className="photo-thumb"
                      />

                      <div className="photo-info">
                        <span className="photo-title">
                          {enhancedImageAccepted
                            ? a.enhancedSelected
                            : a.originalSelected}
                        </span>

                        <span className="photo-subtitle">
                          {photoFile ? photoFile.name : a.urlLoaded}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                        disabled={isUploadingImage || isEnhancingImage}
                      >
                        {a.change}
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="photo-remove-btn"
                        title={a.removePhoto}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {originalPhotoUrl && photoFile && !enhancedPhotoUrl && (
                      <div className="image-enhancement-controls">
                        <label
                          className="image-background-field"
                          htmlFor="product-image-background"
                        >
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
                              <option
                                key={preset.value}
                                value={preset.value}
                              >
                                {preset.label}
                              </option>
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
                              <span>
                                {imageBackgroundFile?.name || a.selectBg}
                              </span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleEnhanceImage}
                          disabled={
                            isUploadingImage ||
                            isEnhancingImage ||
                            (
                              imageBackgroundPreset === 'custom' &&
                              !imageBackgroundFile
                            )
                          }
                        >
                          {isEnhancingImage ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                            />
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

                        <span className="image-enhancement-note">
                          {a.originalStays}
                        </span>
                      </div>
                    )}

                    {originalPhotoUrl &&
                      enhancedPhotoUrl &&
                      originalPhotoUrl !== enhancedPhotoUrl && (
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
                              className={`btn btn-sm ${
                                enhancedImageAccepted
                                  ? 'btn-primary'
                                  : 'btn-secondary'
                              }`}
                              onClick={handleAcceptEnhancedImage}
                              disabled={
                                isUploadingImage ||
                                isEnhancingImage ||
                                enhancedImageAccepted
                              }
                            >
                              <Check size={16} />

                              <span>
                                {enhancedImageAccepted
                                  ? a.enhancedAccepted
                                  : a.acceptEnhanced}
                              </span>
                            </button>

                            <button
                              type="button"
                              className={`btn btn-sm ${
                                enhancedImageAccepted
                                  ? 'btn-secondary'
                                  : 'btn-primary'
                              }`}
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
                      <p
                        className="image-enhancement-error"
                        role="alert"
                      >
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
                      <Upload
                        size={26}
                        className="upload-icon"
                      />

                      <div className="upload-title">
                        {isUploadingImage ? a.uploading : a.uploadPrompt}
                      </div>

                      <span className="upload-desc">
                        {a.uploadHint}
                      </span>
                    </div>

                    {enhancementError && (
                      <p
                        className="image-enhancement-error"
                        role="alert"
                      >
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
                          onChange={(event) => setImageUrlInput(event.target.value)}
                        />

                        <button
                          type="button"
                          onClick={handleApplyUrl}
                          className="btn btn-secondary btn-sm"
                        >
                          {a.apply}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LIVE BUYER PREVIEW - BEFORE PUBLISH */}
            <div className="catalog-preview-col catalog-preview-before-publish">
          <div className="preview-sticky-wrap">
            <div className="preview-top-badge">
              <span className="preview-heading-text">
                {a.previewHeading}
              </span>
            </div>

            <div className="preview-card">
              <div className="preview-img-container">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={title || a.previewHeading}
                    className="preview-img"
                  />
                ) : (
                  <div className="preview-placeholder-box">
                    <ImageIcon
                      size={44}
                      className="placeholder-icon"
                    />

                    <span>{a.previewPhoto}</span>
                  </div>
                )}

                <div className="preview-category-tag">
                  {(craftCategory || a.heritageCraft).toUpperCase()}
                </div>
              </div>

              <div className="preview-card-body">
                <h3 className="preview-card-title">
                  {title || a.untitled}
                </h3>

                <div className="preview-artisan-line">
                  <MapPin size={14} className="map-icon" />

                  <span className="preview-region">
                    {region || a.defaultRegion}
                  </span>

                  <span className="dot-sep">•</span>

                  <span className="preview-artisan-name">
                    {artisanName || a.defaultMaker}
                  </span>
                </div>

                <div className="preview-materials-line">
                  <strong>{a.materialsPrefix} </strong>
                  <span>{materials || a.defaultMaterials}</span>
                </div>

                <p className="preview-card-story">
                  {description || a.previewStory}
                </p>

                <div className="preview-card-footer">
                  <div className="preview-price-block">
                    <span className="price-label">
                      {a.priceLabel}
                    </span>

                    <span className="price-amount">
                      ₹{price ? formatNumber(price) : '0'}
                    </span>
                  </div>

                  <div className="preview-stock-badge">
                    <span className="stock-check">✓</span>

                    <span>
                      {stock || 1} {a.available}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


            {/* FORM ACTIONS */}
            <div className="catalog-actions-bar">
              <div className="publish-btns-group">
                <button
                  type="submit"
                  disabled={submitting || loadingAi}
                  className="btn btn-publish"
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner"
                        style={{
                          width: '16px',
                          height: '16px',
                          borderWidth: '2px'
                        }}
                      />

                      <span>
                        {isEditMode ? a.updating : a.publishing}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />

                      <span>
                        {isEditMode ? a.update : a.publish}
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
                  {a.clear}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="btn btn-danger-delete"
                    disabled={submitting}
                  >
                    <Trash2 size={16} />
                    <span>{a.deleteBtn}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

      </div>

      </div>
    </>
  );
}
