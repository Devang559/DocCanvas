export const colors = {
  background: '#ffffff',
  foreground: '#1f2937',
  primary: '#8b5cf6',
  primaryForeground: '#ffffff',
  card: '#ffffff',
  cardForeground: '#1f2937',
  muted: '#f3f4f6',
  mutedForeground: '#6b7280',
  border: '#e5e5e5',
  input: '#e5e5e5',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    900: '#0f172a',
  },
  black: '#000000',
} as const;

export type ColorName = keyof typeof colors | `slate.${keyof typeof colors.slate}`;

export const shadowStyles = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
