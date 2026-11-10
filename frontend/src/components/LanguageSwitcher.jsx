import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../i18n/index.js';

export default function LanguageSwitcher({ variant = 'header', label }) {
  const { lang, setLang, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`lang-switcher ${variant === 'card' ? 'is-card-variant' : ''}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`lang-btn ${variant === 'card' ? 'lang-btn-card' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t.common?.selectLanguage}
        title={t.common?.changeLanguageTitle}
      >
        <Globe size={15} className="lang-icon" />
        <span className="lang-label">
          {label ? `${label}: ` : ''}
          <strong>{currentLanguage.native}</strong>
          <span className="lang-subcode"> ({currentLanguage.label})</span>
        </span>
        <ChevronDown size={14} className={`lang-chevron ${isOpen ? 'is-open' : ''}`} />
      </button>

      {isOpen && (
        <div className={`lang-dropdown ${variant === 'card' ? 'lang-dropdown-card' : ''}`}>
          <div className="lang-dropdown-header">{t.common?.selectLanguage}</div>
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`lang-option ${item.code === lang ? 'active' : ''}`}
              onClick={() => {
                setLang(item.code);
                setIsOpen(false);
              }}
            >
              <div className="lang-option-text">
                <span className="lang-native">{item.native}</span>
                <span className="lang-english">{item.label}</span>
              </div>
              {item.code === lang && <Check size={14} className="lang-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
