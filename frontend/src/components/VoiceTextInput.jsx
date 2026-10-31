import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, Languages, RotateCcw } from 'lucide-react';
import { useVoiceInput, VOICE_LANGUAGES } from '../hooks/useVoiceInput.js';

export default function VoiceTextInput({
  value = '',
  onChange,
  label,
  placeholder = 'Type your craft story or speak in your native language...',
  rows = 4,
  disabled = false,
  required = false,
  defaultLang = 'en',
  id
}) {
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const baseTextRef = useRef(value);
  const valueRef = useRef(value);

  useEffect(() => {
    if (defaultLang) {
      setSelectedLang(defaultLang);
    }
  }, [defaultLang]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleVoiceResult = useCallback((sessionSpokenText) => {
    const base = (baseTextRef.current || '').trim();
    const spoken = (sessionSpokenText || '').trim();

    if (!spoken) return;

    const separator = base ? ' ' : '';
    const newCombined = base + separator + spoken;
    onChange?.(newCombined);
  }, [onChange]);

  const {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening
  } = useVoiceInput({
    onResult: handleVoiceResult,
    currentLang: selectedLang
  });

  const handleMicToggle = () => {
    if (disabled || !isSupported) return;

    if (isListening) {
      stopListening();
      baseTextRef.current = valueRef.current;
    } else {
      baseTextRef.current = valueRef.current;
      startListening(selectedLang);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    baseTextRef.current = val;
    onChange?.(val);
  };

  const currentLangObj = VOICE_LANGUAGES.find((l) => l.code === selectedLang) || VOICE_LANGUAGES[0];

  return (
    <div className="voice-input-container">
      {/* Top Toolbar */}
      <div className="voice-input-toolbar">
        {label ? (
          <label htmlFor={id} className="form-label" style={{ margin: 0, fontWeight: 600 }}>
            {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
          </label>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Languages size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            aria-label="Select speaking language"
            value={selectedLang}
            onChange={(e) => {
              const newLang = e.target.value;
              setSelectedLang(newLang);
              if (isListening) {
                stopListening();
                setTimeout(() => startListening(newLang), 200);
              }
            }}
            disabled={disabled}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'white',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            {VOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Controlled Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          id={id}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          required={required}
          className="form-textarea voice-textarea"
          style={{
            borderColor: isListening ? '#16a34a' : undefined,
            boxShadow: isListening ? '0 0 0 3px rgba(22, 163, 74, 0.15)' : undefined,
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
        />
      </div>

      {/* Footer Controls & Live Status */}
      <div className="voice-input-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={!isSupported || disabled}
            className={`btn btn-sm ${isListening ? 'btn-listening' : 'btn-secondary'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: isListening ? '#dc2626' : undefined,
              color: isListening ? '#ffffff' : undefined,
              borderColor: isListening ? '#b91c1c' : undefined,
              fontWeight: 600
            }}
            title={!isSupported ? 'Speech recognition not supported in this browser' : (isListening ? 'Stop Speaking' : 'Start Speaking')}
          >
            {isListening ? (
              <>
                <MicOff size={16} />
                <span>Stop Speaking</span>
              </>
            ) : (
              <>
                <Mic size={16} color="var(--primary)" />
                <span>Speak in {currentLangObj.name.split(' ')[0]}</span>
              </>
            )}
          </button>

          {value && (
            <button
              type="button"
              onClick={() => {
                baseTextRef.current = '';
                onChange?.('');
              }}
              className="btn btn-sm"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                padding: '0.35rem 0.5rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              title="Clear text"
            >
              <RotateCcw size={13} style={{ marginRight: '0.25rem' }} /> Clear
            </button>
          )}
        </div>

        {/* Live Status text */}
        <div style={{ fontSize: '0.82rem' }}>
          {isListening ? (
            <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'inline-block',
                  animation: 'pulse 1s infinite'
                }}
              />
              Listening in {currentLangObj.name}... Speak now
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              {isSupported
                ? `Ready for ${currentLangObj.name} voice dictation`
                : 'Browser voice unavailable (Use Chrome for best experience)'}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: 'var(--radius-sm)',
            color: '#b91c1c',
            fontSize: '0.82rem',
            marginTop: '0.25rem'
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Unsupported browser warning */}
      {!isSupported && (
        <p style={{ margin: '0.25rem 0 0', color: '#b45309', fontSize: '0.8rem' }}>
          Note: Web Speech API is supported in Chrome, Edge, and Safari. You can still type manually in any language.
        </p>
      )}
    </div>
  );
}
