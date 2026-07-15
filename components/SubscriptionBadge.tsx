import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Crown, Sparkles } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';

interface SubscriptionBadgeProps {
  size?: 'small' | 'medium';
}

// A small pill showing the user's current plan. Free plans get a muted look;
// paid plans get an accent colour + icon.
export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ size = 'medium' }) => {
  const { currentSubscription, plans } = useSubscriptionStore();
  const theme = useActiveTheme();

  const planId = currentSubscription?.planId ?? 'free';
  const plan = plans.find((p) => p.id === planId);
  const label = plan?.name ?? 'Free';

  const isPaid = planId !== 'free';
  const isSmall = size === 'small';

  const backgroundColor = isPaid ? theme.colors.primary : theme.colors.backgroundSecondary;
  const textColor = isPaid ? '#fff' : theme.colors.textSecondary;
  const iconSize = isSmall ? 12 : 14;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      {isPaid &&
        (planId === 'pro' ? (
          <Crown size={iconSize} color={textColor} style={styles.icon} />
        ) : (
          <Sparkles size={iconSize} color={textColor} style={styles.icon} />
        ))}
      <ThemedText style={[styles.text, { color: textColor, fontSize: isSmall ? 11 : 13 }]}>
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
