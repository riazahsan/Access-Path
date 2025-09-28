import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem('accessibility-theme') as ThemeMode;
    return savedTheme || 'light';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('accessibility-theme', newTheme);
  };

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');

    // Add current theme class
    root.classList.add(`theme-${theme}`);

    // Apply CSS custom properties based on theme
    switch (theme) {
      case 'light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f8fafc');
        root.style.setProperty('--text-primary', '#1f2937');
        root.style.setProperty('--text-secondary', '#6b7280');
        root.style.setProperty('--border-color', '#e5e7eb');
        root.style.setProperty('--route-accessible', '#22c55e');
        root.style.setProperty('--route-moderate', '#f59e0b');
        root.style.setProperty('--route-limited', '#ef4444');
        root.style.setProperty('--route-default', '#3887be');
        root.style.setProperty('--map-marker-bg', '#ffffff');
        root.style.setProperty('--map-marker-border', '#374151');
        break;

      case 'dark':
        root.style.setProperty('--bg-primary', '#1f2937');
        root.style.setProperty('--bg-secondary', '#111827');
        root.style.setProperty('--text-primary', '#f9fafb');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--border-color', '#374151');
        root.style.setProperty('--route-accessible', '#34d399');
        root.style.setProperty('--route-moderate', '#fbbf24');
        root.style.setProperty('--route-limited', '#f87171');
        root.style.setProperty('--route-default', '#60a5fa');
        root.style.setProperty('--map-marker-bg', '#374151');
        root.style.setProperty('--map-marker-border', '#d1d5db');
        break;

      case 'high-contrast':
        root.style.setProperty('--bg-primary', '#000000');
        root.style.setProperty('--bg-secondary', '#1a1a1a');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#cccccc');
        root.style.setProperty('--border-color', '#ffffff');
        root.style.setProperty('--route-accessible', '#00ff00');
        root.style.setProperty('--route-moderate', '#ffff00');
        root.style.setProperty('--route-limited', '#ff0000');
        root.style.setProperty('--route-default', '#00ccff');
        root.style.setProperty('--map-marker-bg', '#000000');
        root.style.setProperty('--map-marker-border', '#ffffff');
        break;
    }

    // Add accessibility announcements
    const announcement = `Theme changed to ${theme.replace('-', ' ')} mode`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.style.position = 'absolute';
    ariaLive.style.left = '-10000px';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);

    setTimeout(() => {
      document.body.removeChild(ariaLive);
    }, 1000);

  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;