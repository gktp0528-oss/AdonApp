export const lightTheme = {
  colors: {
    bg: '#ffffff',
    surface: '#f4f4f5',
    text: '#18181b',
    muted: '#71717a',
    primary: '#bef264',
    border: '#e4e4e7',
    accent: '#bef264',
    card: '#ffffff',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
};

export const darkTheme = {
  colors: {
    bg: '#09090b', // Zinc 950
    surface: '#18181b', // Zinc 900
    text: '#fafafa', // Zinc 50
    muted: '#a1a1aa', // Zinc 400
    primary: '#bef264', // Keep Brand Accent
    border: '#27272a', // Zinc 800
    accent: '#bef264',
    card: '#18181b',
  },
  spacing: lightTheme.spacing,
};

export type AppTheme = typeof lightTheme;
export const theme = lightTheme; // Default for backward compatibility
