import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { themes } from '@/constants/themes';
import { ThemedText } from './ThemedText';
import { ThemedPressableCard } from './ThemedCard';
import { ThemedView } from './ThemedView';

interface ThemeSelectorProps {
  onClose?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { themeMode, customThemeId, setThemeMode, setCustomTheme } = useThemeStore();
  
  const handleSelectThemeMode = (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    if (onClose) onClose();
  };
  
  const handleSelectCustomTheme = (themeId: string) => {
    setCustomTheme(themeId);
    if (onClose) onClose();
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText preset="title">Appearance</ThemedText>
      
      <View style={styles.section}>
        <ThemedText preset="subtitle">Theme Mode</ThemedText>
        
        <View style={styles.optionsContainer}>
          <ThemedPressableCard
            style={[
              styles.optionCard,
              themeMode === 'system' && styles.selectedCard
            ]}
            onPress={() => handleSelectThemeMode('system')}
          >
            <ThemedText style={styles.optionText}>System</ThemedText>
          </ThemedPressableCard>
          
          <ThemedPressableCard
            style={[
              styles.optionCard,
              themeMode === 'light' && styles.selectedCard
            ]}
            onPress={() => handleSelectThemeMode('light')}
          >
            <ThemedText style={styles.optionText}>Light</ThemedText>
          </ThemedPressableCard>
          
          <ThemedPressableCard
            style={[
              styles.optionCard,
              themeMode === 'dark' && styles.selectedCard
            ]}
            onPress={() => handleSelectThemeMode('dark')}
          >
            <ThemedText style={styles.optionText}>Dark</ThemedText>
          </ThemedPressableCard>
        </View>
      </View>
      
      <View style={styles.section}>
        <ThemedText preset="subtitle">Custom Themes</ThemedText>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themesScrollContent}
        >
          {themes.map((theme) => (
            <ThemedPressableCard
              key={theme.id}
              style={[
                styles.themeCard,
                themeMode === 'custom' && customThemeId === theme.id && styles.selectedCard
              ]}
              onPress={() => handleSelectCustomTheme(theme.id)}
            >
              <View 
                style={[
                  styles.themeColorPreview, 
                  { backgroundColor: theme.colors.background }
                ]}
              >
                <View 
                  style={[
                    styles.themeAccentColor, 
                    { backgroundColor: theme.colors.primary }
                  ]} 
                />
              </View>
              <ThemedText style={styles.themeText}>{theme.name}</ThemedText>
            </ThemedPressableCard>
          ))}
        </ScrollView>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginTop: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  optionCard: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#B24592',
  },
  optionText: {
    fontWeight: '500',
  },
  themesScrollContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  themeCard: {
    width: 100,
    height: 120,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeColorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeAccentColor: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  themeText: {
    textAlign: 'center',
  },
});