import React from 'react';
import { 
  View, 
  ViewProps, 
  StyleSheet, 
  Pressable, 
  PressableProps 
} from 'react-native';
import { useActiveTheme } from '@/store/themeStore';

interface ThemedCardProps extends ViewProps {
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  style, 
  elevation = 'small',
  ...props 
}) => {
  const theme = useActiveTheme();
  
  let shadowStyle = {};
  
  switch (elevation) {
    case 'none':
      shadowStyle = {};
      break;
    case 'small':
      shadowStyle = theme.isDark ? styles.darkShadowSmall : styles.shadowSmall;
      break;
    case 'medium':
      shadowStyle = theme.isDark ? styles.darkShadowMedium : styles.shadowMedium;
      break;
    case 'large':
      shadowStyle = theme.isDark ? styles.darkShadowLarge : styles.shadowLarge;
      break;
  }
  
  return (
    <View 
      style={[
        styles.card,
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
        shadowStyle,
        style
      ]} 
      {...props} 
    />
  );
};

interface ThemedPressableCardProps extends PressableProps {
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

export const ThemedPressableCard: React.FC<ThemedPressableCardProps> = ({ 
  style, 
  elevation = 'small',
  ...props 
}) => {
  const theme = useActiveTheme();
  
  let shadowStyle = {};
  
  switch (elevation) {
    case 'none':
      shadowStyle = {};
      break;
    case 'small':
      shadowStyle = theme.isDark ? styles.darkShadowSmall : styles.shadowSmall;
      break;
    case 'medium':
      shadowStyle = theme.isDark ? styles.darkShadowMedium : styles.shadowMedium;
      break;
    case 'large':
      shadowStyle = theme.isDark ? styles.darkShadowLarge : styles.shadowLarge;
      break;
  }
  
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
        shadowStyle,
        style
      ]} 
      {...props} 
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  darkShadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  darkShadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  darkShadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
});