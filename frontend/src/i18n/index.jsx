
import React, {
  createContext,
  useContext,
  useState,
  useEffect
} from 'react';

import en from './en.js';
import hi from './hi.js';
import kn from './kn.js';
import ta from './ta.js';
import te from './te.js';
import ml from './ml.js';
import bn from './bn.js';

const translations = {
  en,
  hi,
  kn,
  ta,
  te,
  ml,
  bn
};

export const languageList = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' }
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('kalasetu_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kalasetu_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t, languages: languageList }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
