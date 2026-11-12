
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

const STORAGE_KEY = 'kalasetu_theme';

const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch (error) {
    console.warn('Unable to access theme storage:', error);
  }

  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to the entire application.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    document.documentElement.style.colorScheme = theme;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Unable to save theme:', error);
    }
  }, [theme]);

  // Switch between light and dark mode.
  const toggleTheme = useCallback(() => {
    setTheme(currentTheme =>
      currentTheme === 'dark' ? 'light' : 'dark'
    );
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
}
