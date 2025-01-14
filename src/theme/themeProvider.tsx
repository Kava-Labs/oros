// ThemeContext.tsx
import React, { ReactNode, useLayoutEffect, useMemo } from 'react';
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
      case 'hard.fun':
        return 'hardDotFun';
      case 'localhost':
        return 'hardDotFun';
      default:
        return 'base';
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
  useLayoutEffect(() => {
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
