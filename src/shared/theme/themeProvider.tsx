import React, { ReactNode, useInsertionEffect, useMemo } from 'react';
import { Theme, themes, ThemeName, baseTheme } from './themes';
import { ThemeContext } from './themeContext';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Function to extract and validate the theme from query parameters
  const getThemeFromQuery = (): ThemeName | null => {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme') as ThemeName | null;
    return theme && themes[theme] ? theme : null;
  };

  const queryTheme = getThemeFromQuery();

  const themeName: ThemeName = useMemo(() => {
    if (queryTheme) {
      return queryTheme;
    }
    // Fallback to default theme `base`
    return 'base';
  }, [queryTheme]);

  const selectedTheme = themes[themeName] || themes.base;

  /**
   * Having selected theme allows for multiple theming options in
   * the future if we want to have custom branding for a specific
   * partner or offer different "Oros" themes, like 'light' or 'dark' mode
   */
  const currentTheme: Theme = useMemo(() => {
    return {
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
  }, [selectedTheme]);

  // Apply CSS variables dynamically
  useInsertionEffect(() => {
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
