// Design system colors
export const colors = {
  primary: '#679B00',
  secondary: '#3500C6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: {
    primary: '#000000',
    secondary: '#666666',
    disabled: '#AAAAAA',
  },
  white: '#FFFFFF',
  disabled: '#CCCCCC',
  error: '#FF3333',
  success: '#00C851',
  warning: '#FF8800',
  border: '#E0E0E0',
  shadow: '#000000',
} as const;

// Design system typography
export const fonts = {
  family: {
    regular: 'Inter',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
} as const;

// Design system spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// Design system border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Typography helper
export const typography = {
  fontSize: fonts.sizes,
  fontWeight: fonts.weights,
} as const;

// Order validation constants
export const orderValidation = {
  title: {
    maxLength: 70,
  },
  description: {
    maxLength: 500,
  },
} as const;

// Main theme object
export const theme = {
  colors,
  fonts,
  spacing,
  borderRadius,
  typography,
  orderValidation,
} as const;

export type Theme = typeof theme;