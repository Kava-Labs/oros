import OrosLogo from '../../src/assets/orosLogo.svg';
import HardDotFunLogo from '../../src/assets/hardDotFunDiamond.svg';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary?: string;
  bgQuaternary?: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary?: string;
  textMuted?: string;
  accent: string;
  accentTransparent: string;
  accentBorder: string;
  link: string;
  linkHover: string;
}

export interface ThemeTypography {
  fontFamilyBase: string;
  fontWeightLight: number;
  fontWeightRegular: number;
  fontWeightBold: number;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeBorderRadius {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  logo?: string;
}

// Base theme with shared styles
export const baseTheme: Theme = {
  colors: {
    bgPrimary: '#121212',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2d2d2d',
    bgQuaternary: '#333333',
    textPrimary: '#ffffff',
    textSecondary: '#d1d1d1',
    textTertiary: '#bbbbbb',
    textMuted: 'rgb(150, 150, 150)',
    accent: '#0070f3',
    accentTransparent: 'rgba(0, 112, 243, 0.75)',
    accentBorder: 'rgba(0, 112, 243, 0.2)',
    link: '#1e90ff',
    linkHover: '#87cefa',
  },
  typography: {
    fontFamilyBase: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightBold: 700,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },
  logo: OrosLogo,
};

// Theme for hardDotFun, extending the base theme
export const hardDotFunTheme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    accent: 'rgb(247, 73, 40)',
    accentTransparent: 'rgba(247, 73, 40, 0.75)',
    accentBorder: 'rgba(247, 73, 40, 0.2)',
  },
  logo: HardDotFunLogo,
};

// Theme for kavaWebapp, extending the base theme
export const kavaWebappTheme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    accent: '#0070f3',
    accentTransparent: 'rgba(0, 112, 243, 0.75)',
    accentBorder: 'rgba(0, 112, 243, 0.2)',
  },
};

// Export all themes
export const themes = {
  hardDotFun: hardDotFunTheme,
  kavaWebapp: kavaWebappTheme,
  base: baseTheme,
};

// Define ThemeName type
export type ThemeName = keyof typeof themes;
