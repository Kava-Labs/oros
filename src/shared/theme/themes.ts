import { ComponentType } from 'react';
import KavaAILogo from '../../core/assets/KavaAILogo';
// import OrosLogo from '../../features/blockchain/assets/orosLogo.svg';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary?: string;
  bgQuaternary?: string;
  borderPrimary: string;
  borderSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary?: string;
  textMuted?: string;
  accent: string;
  accentTransparent: string;
  accentBorder: string;
  accentTwo?: string;
  accentTwoTransparent?: string;
  accentTwoBorder?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logo?: ComponentType<any>;
}

// Base theme with shared styles
export const baseTheme: Theme = {
  colors: {
    bgPrimary: '#212121',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2d2d2d',
    bgQuaternary: '#333333',
    borderPrimary: 'rgb(180 180 180)',
    borderSecondary: 'rgb(62, 62, 62)',
    textPrimary: '#ffffff',
    textSecondary: 'rgb(180 180 180)',
    textTertiary: '#bbbbbb',
    textMuted: 'rgb(150, 150, 150)',
    accent: 'rgb(255, 67, 62)',
    accentTransparent: 'rgba(255, 67, 62, 0.75)',
    accentTwo: 'rgb(147, 130, 215)',
    accentTwoTransparent: 'rgba(9147, 130, 215, 0.75)',
    accentTwoBorder: 'rgba(147, 130, 215, 0.2)',
    accentBorder: 'rgba(255, 67, 62, 0.2)',
    link: '#1e90ff',
    linkHover: '#87cefa',
  },
  typography: {
    fontFamilyBase: "'Inter', system-ui, -apple-system, sans-serif",
    fontWeightLight: 200,
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
  logo: KavaAILogo,
};

export const orosTheme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
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
  // logo: OrosLogo,
};

/** This allows for simple config overrides if we want to build a quick
 *  reskin theme or allow multiple theme options in the future
 */
export const themes = {
  base: baseTheme,
};

// Define ThemeName type
export type ThemeName = keyof typeof themes;
