export const Colors = {
  background: '#0d0d0d',
  surface: '#1a1a1a',
  surfaceHigh: '#242424',
  border: '#2e2e2e',
  text: '#e8e8e8',
  textMuted: '#888',
  textDim: '#555',
  accent: '#4ade80',       // green — matches typical terminal prompt colour
  accentDim: '#166534',
  error: '#f87171',
  warning: '#fbbf24',
  success: '#4ade80',
  terminalBg: '#0a0a0a',
  terminalFg: '#e8e8e8',
  terminalCursor: '#4ade80',
} as const;

export const Fonts = {
  mono: 'JetBrainsMono_400Regular' as const,
  monoBold: 'JetBrainsMono_700Bold' as const,
  sansRegular: undefined,   // system default
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export const FontSizes = {
  terminal: 13,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;
