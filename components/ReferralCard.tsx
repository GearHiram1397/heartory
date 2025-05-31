import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { SubscriptionPlan } from '@/types/subscription';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedCard } from './ThemedCard';
import { ThemedText } from './ThemedText';
import { formatPrice, formatStorageSize } from '@/constants/subscriptions';

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plan,
  isSelected,
  onSelect
}) => {
  const theme = useActiveTheme();
  
  return (
    <Pressable onPress={onSelect}>
      <ThemedCard 
        style={[
          styles.card,
          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
          plan.isPopular && styles.popularCard
        ]}
      >
        {plan.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
            <ThemedText style={styles.popularText}>Popular</ThemedText>
          </View>
        )}
        
        <View style={styles.header}>
          <ThemedText preset="subtitle" style={styles.planName}>{plan.name}</ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText preset="title" style={styles.price}>
              {formatPrice(plan.price, plan.interval)}
            </ThemedText>
            {plan.interval === 'year' && plan.price > 0 && (
              <ThemedText variant="secondary" style={styles.savingsText}>
                Save 20%
              </ThemedText>
            )}
          </View>
        </View>
        
        <ThemedText variant="secondary" style={styles.description}>
          {plan.description}
        </ThemedText>
        
        <View style={styles.storageContainer}>
          <ThemedText style={styles.storageText}>
            {formatStorageSize(plan.storageLimit)} storage
          </ThemedText>
        </View>
        
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Check size={16} color={theme.colors.primary} style={styles.checkIcon} />
              <ThemedText style={styles.featureText}>{feature}</ThemedText>
            </View>
          ))}
        </View>
        
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
            <Check size={16} color="#FFFFFF" />
            <ThemedText style={styles.selectedText}>Selected</ThemedText>
          </View>
        )}
      </ThemedCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  popularCard: {
    paddingTop: 24,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontWeight: '700',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontWeight: '700',
  },
  savingsText: {
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  storageContainer: {
    marginBottom: 16,
  },
  storageText: {
    fontWeight: '600',
    fontSize: 16,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 8,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
});