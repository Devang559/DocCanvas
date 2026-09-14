import React, { createContext, ReactNode, useContext } from 'react';
import { colors } from '../utils/theme';

export interface Theme {
  dark: boolean;
  background: string;
  foreground: string;
  card: string;
  border: string;
}

const lightTheme: Theme = {
  dark: false,
  background: colors.background,
  foreground: colors.foreground,
  card: colors.card,
  border: colors.border,
};

const darkTheme: Theme = {
  dark: true,
  background: '#0f1117',
  foreground: '#e4e4e7',
  card: '#1a1d26',
  border: '#2d3238',
};

export const ThemeContext = createContext<Theme>(lightTheme);

export const ThemeProvider: React.FC<{
  dark: boolean;
  children: ReactNode;
}> = ({ dark, children }) => {
  const value = dark ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): Theme => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
