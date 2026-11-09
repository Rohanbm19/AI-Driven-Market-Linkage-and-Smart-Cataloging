import React from 'react';
import { useLanguage } from '../i18n/index.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="ks-site-header">
      <div className="ks-brand">
        <h1>{t.brand || 'KalaSetu'}</h1>
        <span>Crafts • Culture • Connect</span>
      </div>

      <div className="ks-header-controls">
        <LanguageSwitcher />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="ks-theme-button"
        >
          <span className="ks-theme-icon" aria-hidden="true">
            {theme === 'light' ? '☾' : '☀'}
          </span>
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}
