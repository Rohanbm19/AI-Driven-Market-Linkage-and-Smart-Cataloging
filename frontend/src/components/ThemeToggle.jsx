import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext.jsx';
import { useLanguage } from '../i18n/index.js';

/**
 * Sun / moon switch. Reads its labels from the active language
 * so the tooltip and screen-reader text change with the language too.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const label = isDark
    ? (t.theme?.switchToLight || 'Switch to light mode')
    : (t.theme?.switchToDark || 'Switch to dark mode');

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
    >
      <span className="theme-toggle-icons" aria-hidden="true">
        <Sun size={14} />
        <Moon size={14} />
      </span>
      <span className="theme-toggle-thumb" aria-hidden="true">
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  );
}
