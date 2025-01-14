// ThemeContext.tsx
import React, { ReactNode, useInsertionEffect, useMemo } from 'react';
import { Theme, themes, ThemeName, baseTheme } from './themes';
import { ThemeContext } from './themeContext';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const parentHost = (() => {
    try {
      return window.parent.location.hostname;
    } catch {
      return '';
    }
  })();

  const themeName: ThemeName = useMemo(() => {
    switch (parentHost) {
      case 'app.kava.io':
        return 'kavaWebapp';
      // TODO: temporary for demo
      case 'oros-preview':
        return 'kavaWebapp';
      case 'hard.fun':
        return 'hardDotFun';
      case 'hardfunai':
        return 'hardDotFun';
      // TODO: temporary for local development
      case 'localhost':
        return 'hardDotFun';
      default:
        return 'hardDotFun';
    }
  }, [parentHost]);

  const selectedTheme = themes[themeName] || themes.base;

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
