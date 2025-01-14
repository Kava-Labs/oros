// ThemeContext.tsx
import { createContext } from 'react';
import { Theme } from './themes';

export interface ThemeContextProps {
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(
  undefined,
);
