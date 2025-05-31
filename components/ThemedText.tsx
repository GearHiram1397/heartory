import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useActiveTheme } from '@/store/themeStore';

interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary';
  preset?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  style, 
  variant = 'primary',
  preset,
  ...props 
}) => {
  const theme = useActiveTheme();
  
  const color = variant === 'primary' 
    ? theme.colors.text 
    : theme.colors.textSecondary;
  
  let presetStyle = {};
  
  switch (preset) {
    case 'title':
      presetStyle = styles.title;
      break;
    case 'subtitle':
      presetStyle = styles.subtitle;
      break;
    case 'body':
      presetStyle = styles.body;
      break;
    case 'caption':
      presetStyle = styles.caption;
      break;
    case 'label':
      presetStyle = styles.label;
      break;
  }
  
  return (
    <Text 
      style={[
        { color },
        presetStyle,
        style
      ]} 
      {...props} 
    />
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
});