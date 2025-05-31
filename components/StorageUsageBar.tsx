import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';
import { formatStorageSize } from '@/constants/subscriptions';

interface StorageUsageBarProps {
  compact?: boolean;
}

export const StorageUsageBar: React.FC<StorageUsageBarProps> = ({ compact = false }) => {
  const { currentSubscription, plans } = useSubscriptionStore();
  const theme = useActiveTheme();
  
  if (!currentSubscription) {
    return null;
  }
  
  // Find the current plan
  const currentPlan = plans.find(plan => plan.id === currentSubscription.planId);
  if (!currentPlan) {
    return null;
  }
  
  const storageUsed = currentSubscription.storageUsed;
  const storageLimit = currentPlan.storageLimit;
  const usagePercentage = Math.min(100, (storageUsed / storageLimit) * 100);
  
  // Determine color based on usage
  let barColor = theme.colors.primary;
  if (usagePercentage > 90) {
    barColor = theme.colors.error;
  } else if (usagePercentage > 75) {
    barColor = theme.colors.warning;
  }
  
  return (
    <View style={styles.container}>
      {!compact && (
        <View style={styles.labelContainer}>
          <ThemedText variant="secondary" style={styles.label}>
            Storage
          </ThemedText>
          <ThemedText variant="secondary" style={styles.usageText}>
            {formatStorageSize(storageUsed)} of {formatStorageSize(storageLimit)} used
          </ThemedText>
        </View>
      )}
      
      <View style={[styles.barBackground, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <View 
          style={[
            styles.barFill, 
            { 
              width: `${usagePercentage}%`,
              backgroundColor: barColor
            }
          ]} 
        />
      </View>
      
      {compact && (
        <ThemedText variant="secondary" style={styles.compactText}>
          {formatStorageSize(storageUsed)} / {formatStorageSize(storageLimit)}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
  },
  usageText: {
    fontSize: 14,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  compactText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});