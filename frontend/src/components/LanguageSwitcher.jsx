import React from 'react';
import { useLanguage } from '../i18n/index.jsx';

export default function LanguageSwitcher({ variant = 'header' }) {
  const { lang, setLang, languages } = useLanguage();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      aria-label="Select language"
      className={`ks-language-select ${variant === 'card' ? 'ks-language-select--card' : ''}`}
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.label}
        </option>
      ))}
    </select>
  );
}
