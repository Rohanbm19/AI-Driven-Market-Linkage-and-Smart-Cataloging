import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useLanguage } from '../i18n/index.js';
import { enhanceProductImage, validateImageFile } from '../services/imageEnhancer.js';

export default function ImageEnhancer() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState('');
  const [enhancedFile, setEnhancedFile] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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
      setError(validationError.message);
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
      setError('Choose an image to enhance.');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      const result = await enhanceProductImage(originalFile);
      setEnhancedFile(result);
      setEnhancedImage(URL.createObjectURL(result));
    } catch (processingError) {
      setError(processingError.message || 'Image enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="image-enhancer-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.enhancer.title}</h1>
          <p className="page-subtitle">{t.enhancer.desc}</p>
        </div>
      </div>

      <div className="image-enhancer-grid">
        <section className="card image-enhancer-preview-card">
          <h2 className="image-enhancer-section-title">
            <Sparkles size={18} color="var(--primary)" />
            <span>Before &amp; After</span>
          </h2>
          {originalImage && enhancedImage ? (
            <BeforeAfterSlider
              beforeImage={originalImage}
              afterImage={enhancedImage}
              beforeLabel="Original Photo"
              afterLabel="OpenCV Enhanced"
            />
          ) : originalImage ? (
            <div className="image-enhancer-single-preview">
              <img src={originalImage} alt="Original artisan product" />
              <span>Original photo — enhance it to compare</span>
            </div>
          ) : (
            <div className="image-enhancer-empty">
              <Upload size={30} />
              <p>Select an artisan product photo to preview it here.</p>
            </div>
          )}
          {enhancedImage && (
            <p className="image-enhancer-hint">
              Drag the center handle to compare the original and enhanced image.
            </p>
          )}
        </section>

        <section className="card image-enhancer-controls">
          <h2 className="image-enhancer-section-title">Enhance a Product Photo</h2>
          <p className="image-enhancer-copy">
            OpenCV makes restrained lighting, noise, color-balance, and detail adjustments.
            It does not generate or replace product details.
          </p>

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
            <span>{originalFile ? originalFile.name : 'Select a JPEG, PNG, or WebP photo'}</span>
          </button>
          <p className="image-enhancer-hint">Maximum file size: 10 MB.</p>

          <button
            type="button"
            className="btn btn-primary image-enhancer-submit"
            onClick={handleEnhance}
            disabled={!originalFile || isProcessing}
          >
            {isProcessing ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
            )}
            <span>{isProcessing ? t.enhancer.processing : 'Enhance Image'}</span>
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
              <span>Download Enhanced Image</span>
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
