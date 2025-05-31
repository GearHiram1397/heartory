import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useActiveTheme } from '@/store/themeStore';

interface ThemedViewProps extends ViewProps {
  variant?: 'primary' | 'secondary';
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  style, 
  variant = 'primary',
  ...props 
}) => {
  const theme = useActiveTheme();
  
  const backgroundColor = variant === 'primary' 
    ? theme.colors.background 
    : theme.colors.backgroundSecondary;
  
  return (
    <View 
      style={[
        { backgroundColor },
        style
      ]} 
      {...props} 
    />
  );
};

export const ThemedSafeAreaView: React.FC<ThemedViewProps> = ({ 
  style, 
  variant = 'primary',
  ...props 
}) => {
  const theme = useActiveTheme();
  
  const backgroundColor = variant === 'primary' 
    ? theme.colors.background 
    : theme.colors.backgroundSecondary;
  
  return (
    <View 
      style={[
        styles.safeArea,
        { backgroundColor },
        style
      ]} 
      {...props} 
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});