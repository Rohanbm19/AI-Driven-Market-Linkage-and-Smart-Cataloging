import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useLanguage } from '../i18n/index.jsx';
import {
  enhanceProductImage,
  IMAGE_BACKGROUND_PRESETS,
  validateImageFile
} from '../services/imageEnhancer.js';

export default function ImageEnhancer() {
  const { t } = useLanguage();
  const text = t.enhancer || {};

  const fileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState('');
  const [enhancedFile, setEnhancedFile] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState('');
  const [backgroundPreset, setBackgroundPreset] = useState('none');
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const errorMessages = {
    'Choose an image to continue.': text.chooseImageError,
    'Choose an image to enhance.': text.chooseImageError,
    'Image files must be 10 MB or smaller.': text.imageTooLarge,
    'Use a JPEG, PNG, or WebP image.': text.imageTypeError,
    'Choose a background image or select a studio preset.': text.chooseBackgroundError,
    'Could not reach the image enhancement service. Check that the FastAPI service is running.': text.serviceUnavailable,
    'Image enhancement failed. Please try again.': text.enhancementFailed,
    'The image service returned an invalid response.': text.invalidResponse
  };

  const localizeError = (message) => {
    return errorMessages[message] || text.serviceError;
  };

  const presetLabels = {
    none: text.keepOriginal,
    clean_white: text.cleanWhite,
    warm_sand: text.warmSand,
    soft_sage: text.softSage,
    custom: text.customBackground
  };

  useEffect(() => () => {
    if (originalImage.startsWith('blob:')) URL.revokeObjectURL(originalImage);
    if (enhancedImage.startsWith('blob:')) URL.revokeObjectURL(enhancedImage);
  }, [originalImage, enhancedImage]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
    } catch (validationError) {
      setError(localizeError(validationError.message));
      event.target.value = '';
      return;
    }

    setOriginalFile(file);
    setOriginalImage(URL.createObjectURL(file));
    setEnhancedFile(null);
    setEnhancedImage('');
    setError('');
  };

  const handleEnhance = async () => {
    if (!originalFile) {
      setError(text.chooseImageError);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await enhanceProductImage(
        originalFile,
        backgroundPreset,
        backgroundFile
      );
      setEnhancedFile(result);
      setEnhancedImage(URL.createObjectURL(result));
    } catch (processingError) {
      setError(localizeError(processingError.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="image-enhancer-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{text.title}</h1>
          <p className="page-subtitle">{text.desc}</p>
        </div>
      </div>

      <div className="image-enhancer-grid">
        <section className="card image-enhancer-preview-card">
          <h2 className="image-enhancer-section-title">
            <Sparkles size={18} color="var(--primary)" />
            <span>{text.compare}</span>
          </h2>

          {originalImage && enhancedImage ? (
            <BeforeAfterSlider
              beforeImage={originalImage}
              afterImage={enhancedImage}
              beforeLabel={text.originalPhoto}
              afterLabel={
                backgroundPreset === 'none'
                  ? text.enhancedPhoto
                  : text.newBackground
              }
            />
          ) : originalImage ? (
            <div className="image-enhancer-single-preview">
              <img src={originalImage} alt={text.originalAlt} />
              <span>{text.previewHint}</span>
            </div>
          ) : (
            <div className="image-enhancer-empty">
              <Upload size={30} />
              <p>{text.selectPreview}</p>
            </div>
          )}

          {enhancedImage && (
            <p className="image-enhancer-hint">{text.compareHint}</p>
          )}
        </section>

        <section className="card image-enhancer-controls">
          <h2 className="image-enhancer-section-title">{text.heading}</h2>
          <p className="image-enhancer-copy">{text.help}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            hidden
          />

          <button
            type="button"
            className="image-enhancer-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} />
            <span>{originalFile ? originalFile.name : text.selectPhoto}</span>
          </button>

          <p className="image-enhancer-hint">{text.maxSize}</p>

          <label className="image-background-field" htmlFor="image-background-preset">
            <span>{text.backgroundOption}</span>
            <select
              id="image-background-preset"
              className="image-background-select"
              value={backgroundPreset}
              onChange={(event) => {
                setBackgroundPreset(event.target.value);
                setError('');
              }}
              disabled={isProcessing}
            >
              {IMAGE_BACKGROUND_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {presetLabels[preset.value] || preset.label}
                </option>
              ))}
            </select>
          </label>

          {backgroundPreset === 'custom' && (
            <>
              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;

                  try {
                    if (file) validateImageFile(file);
                    setBackgroundFile(file);
                    setError('');
                  } catch (validationError) {
                    setError(localizeError(validationError.message));
                    event.target.value = '';
                  }
                }}
                hidden
              />

              <button
                type="button"
                className="image-enhancer-upload"
                onClick={() => backgroundInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload size={18} />
                <span>
                  {backgroundFile?.name || text.selectBackground}
                </span>
              </button>
            </>
          )}

          <label className="image-background-field" htmlFor="image-background-preset">
            <span>{text.studioBackground}</span>
            <select
              id="image-background-preset"
              className="image-background-select"
              value={backgroundPreset}
              onChange={(event) => {
                setBackgroundPreset(event.target.value);
                setError('');
              }}
              disabled={isProcessing}
            >
              {IMAGE_BACKGROUND_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {presetLabels[preset.value] || preset.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn-primary image-enhancer-submit"
            onClick={handleEnhance}
            disabled={
              !originalFile ||
              isProcessing ||
              (backgroundPreset === 'custom' && !backgroundFile)
            }
          >
            {isProcessing ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
            )}
            <span>
              {isProcessing
                ? text.processing
                : backgroundPreset === 'none'
                  ? text.enhanceImage
                  : text.enhanceReplace}
            </span>
          </button>

          {error && (
            <p className="image-enhancement-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </p>
          )}

          {enhancedImage && enhancedFile && (
            <a
              className="btn btn-secondary image-enhancer-download"
              href={enhancedImage}
              download={enhancedFile.name}
            >
              <Download size={17} />
              <span>{text.download}</span>
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
