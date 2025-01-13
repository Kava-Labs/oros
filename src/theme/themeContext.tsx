// ThemeContext.tsx
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Theme, themes, ThemeName, baseTheme } from './theme';

interface ThemeContextProps {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get the theme name from the environment variable
  const selectedThemeName: ThemeName =
    (import.meta.env.VITE_THEME as ThemeName) || 'base';
  const selectedTheme = themes[selectedThemeName] || themes.base;

  // Merge the base theme with the selected theme
  const currentTheme: Theme = {
    ...baseTheme,
    ...selectedTheme,
    colors: {
      ...baseTheme.colors,
      ...selectedTheme.colors,
    },
    typography: {
      ...baseTheme.typography,
      ...selectedTheme.typography,
    },
    spacing: {
      ...baseTheme.spacing,
      ...selectedTheme.spacing,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...selectedTheme.borderRadius,
    },
  };

  // Apply CSS variables dynamically
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(currentTheme).forEach(([section, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--${section}-${key}`, value as string);
        });
      }
    });
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
