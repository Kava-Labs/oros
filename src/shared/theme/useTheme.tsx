import { useContext } from 'react';
import { ThemeContext } from './themeContext';

/**
 * TODO: This should recursively flatten so we don't have to add manual
 *       keys when we want to add/modify properties on the theme
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');

  // Destructure theme to make properties like `colors` directly accessible
  const {
    theme: { layout, colors, typography, spacing, borderRadius, logo },
  } = context;

  // Return the destructured properties for direct use
  return { layout, colors, typography, spacing, borderRadius, logo };
};
