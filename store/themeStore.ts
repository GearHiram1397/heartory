import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Theme, lightTheme, darkTheme, themes } from '@/constants/themes';

interface ThemeState {
  theme: Theme;
  themeMode: 'system' | 'light' | 'dark' | 'custom';
  customThemeId: string | null;
  
  // Actions
  setThemeMode: (mode: 'system' | 'light' | 'dark' | 'custom') => void;
  setCustomTheme: (themeId: string) => void;
  getTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: lightTheme,
      themeMode: 'system',
      customThemeId: null,
      
      setThemeMode: (mode) => set({ themeMode: mode }),
      
      setCustomTheme: (themeId) => {
        const selectedTheme = themes.find(theme => theme.id === themeId);
        if (selectedTheme) {
          set({ 
            customThemeId: themeId,
            themeMode: 'custom',
            theme: selectedTheme
          });
        }
      },
      
      getTheme: () => {
        const { themeMode, customThemeId } = get();
        
        if (themeMode === 'light') {
          return lightTheme;
        } else if (themeMode === 'dark') {
          return darkTheme;
        } else if (themeMode === 'custom' && customThemeId) {
          const customTheme = themes.find(theme => theme.id === customThemeId);
          return customTheme || lightTheme;
        } else if (themeMode === 'system') {
          const colorScheme = useColorScheme();
          return colorScheme === 'dark' ? darkTheme : lightTheme;
        }
        
        return lightTheme;
      },
    }),
    {
      name: 'heartory-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook to get the current theme based on settings and system preference
export function useActiveTheme(): Theme {
  const { themeMode, customThemeId } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  if (themeMode === 'light') {
    return lightTheme;
  } else if (themeMode === 'dark') {
    return darkTheme;
  } else if (themeMode === 'custom' && customThemeId) {
    const customTheme = themes.find(theme => theme.id === customThemeId);
    return customTheme || lightTheme;
  } else if (themeMode === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  }
  
  return lightTheme;
}