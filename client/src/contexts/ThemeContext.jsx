import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export const availableThemes = [
  'Socratica Dark',
  'Monokai Pro',
  'One Dark Pro',
  'Catppuccin',
];

const themeClassMap = {
  'Socratica Dark': 'socratica-dark',
  'Monokai Pro': 'monokai-pro',
  'One Dark Pro': 'one-dark-pro',
  'Catppuccin': 'catppuccin',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('socratica-theme') || 'Socratica Dark';
    }
    return 'Socratica Dark';
  });

  useEffect(() => {
    document.documentElement.classList.remove(...Object.values(themeClassMap));
    document.documentElement.classList.add(themeClassMap[theme] || 'socratica-dark');
    localStorage.setItem('socratica-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}