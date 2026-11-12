import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import en from './en.js';
import hi from './hi.js';
import kn from './kn.js';
import ta from './ta.js';
import te from './te.js';
import ml from './ml.js';
import bn from './bn.js';
import extra from './extra.js';
import pageTranslations from './pages.js';

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

// Recursively merge `source` on top of `target` (returns a new object).
function deepMerge(target, source) {
  const out = { ...target };
  Object.keys(source || {}).forEach((key) => {
    out[key] = isPlainObject(source[key]) && isPlainObject(out[key])
      ? deepMerge(out[key], source[key])
      : source[key];
  });
  return out;
}

const base = { en, hi, kn, ta, te, ml, bn };

// Order of precedence (lowest -> highest):
//   English base -> English extras -> language base -> language extras
// so any string missing in a language gracefully falls back to English.
const englishFull = deepMerge(en, extra.en);
export const translations = Object.keys(base).reduce((acc, code) => {
  const withBase = deepMerge(englishFull, base[code]);
  const withExtras = deepMerge(withBase, extra[code] || {});
  acc[code] = deepMerge(withExtras, pageTranslations[code] || pageTranslations.en);
  return acc;
}, {});

export const languageList = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' }
];

/** Replace {name} placeholders:  fill(t.addCraft.applyFair, { price: 104 }) */
export function fill(template, vars = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => (
    vars[key] !== undefined ? vars[key] : `{${key}}`
  ));
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem('kalasetu_lang');
      return saved && translations[saved] ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kalasetu_lang', lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.en;

  // Locale-aware helpers so numbers/currency follow the chosen language.
  const formatNumber = useCallback(
    (value) => Number(value || 0).toLocaleString(lang === 'en' ? 'en-IN' : `${lang}-IN`),
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, languages: languageList, formatNumber }),
    [lang, t, formatNumber]
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
