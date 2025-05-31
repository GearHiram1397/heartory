import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const theme = useActiveTheme();
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
        {icon || <Plus size={40} color={theme.colors.primary} />}
      </View>
      <ThemedText preset="title" style={styles.title}>{title}</ThemedText>
      <ThemedText variant="secondary" style={styles.description}>{description}</ThemedText>
      <ThemedButton
        title={actionLabel}
        onPress={onAction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});