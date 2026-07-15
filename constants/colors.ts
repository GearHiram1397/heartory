// Color palette for Heartory app
export const colors = {
  // Primary gradients
  sunsetGlow: {
    start: '#FF6B6B',
    end: '#FFD93D',
  },
  sereneTwilight: {
    start: '#6A11CB',
    end: '#2575FC',
  },
  
  // Accent colors
  rosewood: '#B24592',
  sepia: '#704214',
  
  // UI colors
  background: '#FFFFFF',
  backgroundDark: '#F8F7FF',
  text: '#333333',
  textLight: '#666666',
  border: '#E5E5E5',
  
  // Functional colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
};

// Light/dark palette in the shape expected by the Expo starter-template
// helpers (Themed.tsx, EditScreenInfo.tsx, the legacy (tabs) group). Those
// files are unused by the real app and slated for removal — this default
// export only exists so the project typechecks until they are deleted.
const tintColorLight = colors.rosewood;
const tintColorDark = '#fff';

export default {
  light: {
    text: colors.text,
    background: colors.background,
    tint: tintColorLight,
    tabIconDefault: colors.textLight,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: colors.textLight,
    tabIconSelected: tintColorDark,
  },
};