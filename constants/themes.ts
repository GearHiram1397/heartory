import { colors } from './colors';

// Base theme interface
export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
  };
  gradients: {
    primary: {
      start: string;
      end: string;
    };
    secondary: {
      start: string;
      end: string;
    };
  };
}

// Light theme (default)
export const lightTheme: Theme = {
  id: 'light',
  name: 'Light',
  isDark: false,
  colors: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8F7FF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E5E5E5',
    card: '#FFFFFF',
    primary: colors.rosewood,
    secondary: colors.sepia,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
  },
  gradients: {
    primary: colors.sunsetGlow,
    secondary: colors.sereneTwilight,
  },
};

// Dark theme
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  isDark: true,
  colors: {
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    text: '#F5F5F5',
    textSecondary: '#BBBBBB',
    border: '#333333',
    card: '#1E1E1E',
    primary: '#D67EA6', // Lighter version of rosewood for dark mode
    secondary: '#A67C52', // Lighter version of sepia for dark mode
    success: '#5DC264',
    error: '#F77066',
    warning: '#FFCF47',
  },
  gradients: {
    primary: {
      start: '#FF8E8E',
      end: '#FFE380',
    },
    secondary: {
      start: '#8A3FE8',
      end: '#4A95FF',
    },
  },
};

// Sepia theme (warm, nostalgic)
export const sepiaTheme: Theme = {
  id: 'sepia',
  name: 'Sepia',
  isDark: false,
  colors: {
    background: '#F9F3E9',
    backgroundSecondary: '#F0E6D6',
    text: '#5D4037',
    textSecondary: '#8D6E63',
    border: '#D7CCC8',
    card: '#FFF8E1',
    primary: '#A1887F',
    secondary: '#8D6E63',
    success: '#81C784',
    error: '#E57373',
    warning: '#FFD54F',
  },
  gradients: {
    primary: {
      start: '#D7CCC8',
      end: '#BCAAA4',
    },
    secondary: {
      start: '#A1887F',
      end: '#8D6E63',
    },
  },
};

// Midnight theme (dark blue)
export const midnightTheme: Theme = {
  id: 'midnight',
  name: 'Midnight',
  isDark: true,
  colors: {
    background: '#0F2027',
    backgroundSecondary: '#203A43',
    text: '#E0E0E0',
    textSecondary: '#B0BEC5',
    border: '#37474F',
    card: '#1C313A',
    primary: '#4FC3F7',
    secondary: '#81D4FA',
    success: '#4DB6AC',
    error: '#EF5350',
    warning: '#FFD54F',
  },
  gradients: {
    primary: {
      start: '#0F2027',
      end: '#2C5364',
    },
    secondary: {
      start: '#203A43',
      end: '#2C5364',
    },
  },
};

// Available themes
export const themes = [lightTheme, darkTheme, sepiaTheme, midnightTheme];