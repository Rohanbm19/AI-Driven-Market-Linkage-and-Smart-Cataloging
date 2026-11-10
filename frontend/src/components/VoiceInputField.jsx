import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/index.js';
import { useVoiceInput, VOICE_LANGUAGES } from '../hooks/useVoiceInput.js';

/**
 * Universal Voice-Enabled Input for KalaSetu AI Cataloging
 * Works for text inputs, numbers, and multi-line textareas.
 * Fully supports English, Kannada, Hindi, Tamil, Telugu, and Malayalam.
 */
export default function VoiceInputField({
  id,
  label,
  value = '',
  onChange,
  placeholder = '',
  type = 'text',
  rows = 4,
  required = false,
  disabled = false,
  min,
  step,
  currentLang = 'en',
  hint,
  aiFilled = false,
  className = ''
}) {
  const { t } = useLanguage();
  const v = t.voice || {};
  const baseTextRef = useRef(value);
  const valueRef = useRef(value);
  const [internalError, setInternalError] = useState('');

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Handle incoming speech transcript
  const handleVoiceResult = useCallback((spokenText) => {
    const spoken = (spokenText || '').trim();
    if (!spoken) return;

    if (type === 'number') {
      // Clean spoken string to extract digits
      // Support Indian spoken number forms or digits: e.g. "1500", "₹ 2000"
      const cleaned = spoken.replace(/[^0-9.]/g, '');
      if (cleaned) {
        onChange?.(cleaned);
      } else {
        onChange?.(spoken);
      }
    } else {
      const base = (baseTextRef.current || '').trim();
      if (!base) {
        onChange?.(spoken);
      } else {
        // Safe append with single space
        onChange?.(`${base} ${spoken}`);
      }
    }
  }, [onChange, type]);

  const {
    isListening,
    isSupported,
    error: voiceError,
    startListening,
    stopListening
  } = useVoiceInput({
    onResult: handleVoiceResult,
    currentLang
  });

  const activeLangObj = VOICE_LANGUAGES.find((l) => l.code === currentLang) || VOICE_LANGUAGES[0];

  const handleMicToggle = () => {
    if (disabled) return;

    if (!isSupported) {
      setInternalError(v.unsupported);
      return;
    }

    setInternalError('');

    if (isListening) {
      stopListening();
      baseTextRef.current = valueRef.current;
    } else {
      baseTextRef.current = valueRef.current;
      startListening(currentLang);
    }
  };

  const handleManualChange = (e) => {
    const val = e.target.value;
    baseTextRef.current = val;
    onChange?.(val);
  };

  const displayError = internalError || voiceError;

  return (
    <div className={`voice-input-group ${isListening ? 'is-recording' : ''} ${aiFilled ? 'is-ai-filled' : ''} ${className}`}>
      {/* Label & Voice Status */}
      <div className="voice-input-header">
        {label && (
          <label htmlFor={id} className="form-label" style={{ margin: 0 }}>
            {label} {required && <span className="req-asterisk">*</span>}
            {aiFilled && (
              <span className="ai-chip" title={t.autofill?.estimateNote}>
                <Sparkles size={10} />
                {t.autofill?.aiChip || 'AI'}
              </span>
            )}
          </label>
        )}

        {isListening && (
          <div className="voice-listening-pill" title="Listening to speech">
            <span className="pulse-dot" />
            <span className="listening-text">
              {v.listeningIn} {activeLangObj.native}...
            </span>
          </div>
        )}
      </div>

      {/* Input wrapper with embedded microphone action */}
      <div className={`voice-control-wrapper ${type === 'textarea' ? 'is-textarea' : ''}`}>
        {type === 'textarea' ? (
          <textarea
            id={id}
            className={`form-input voice-input-element voice-textarea ${isListening ? 'recording-border' : ''}`}
            rows={rows}
            value={value}
            onChange={handleManualChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        ) : (
          <input
            id={id}
            type={type}
            min={min}
            step={step}
            className={`form-input voice-input-element ${isListening ? 'recording-border' : ''}`}
            value={value}
            onChange={handleManualChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        )}

        {/* Action Microphone Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={disabled}
          className={`voice-mic-btn ${isListening ? 'active-recording' : ''}`}
          aria-label={isListening ? `${v.stopListening} (${activeLangObj.native})` : `${v.speakIn} ${activeLangObj.native}`}
          title={isListening ? `${v.clickToFinish} (${activeLangObj.native})` : `${v.clickToSpeak} ${activeLangObj.native}`}
        >
          {isListening ? (
            <MicOff size={16} className="mic-icon mic-active" />
          ) : (
            <Mic size={16} className="mic-icon" />
          )}
          <span className="voice-lang-badge">{activeLangObj.code.toUpperCase()}</span>
        </button>
      </div>

      {/* Helper hint or Error Display */}
      {displayError ? (
        <div className="voice-error-msg" role="alert">
          <AlertCircle size={14} />
          <span>{displayError}</span>
        </div>
      ) : hint ? (
        <div className="voice-input-hint">{hint}</div>
      ) : null}
    </div>
  );
}

