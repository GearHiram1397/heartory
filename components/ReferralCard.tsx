import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Gift, Copy, UserPlus } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedCard } from './ThemedCard';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface ReferralCardProps {
  onInvite: () => void;
}

// Shows the user's referral code + progress and an invite CTA.
export const ReferralCard: React.FC<ReferralCardProps> = ({ onInvite }) => {
  const { referralInfo, fetchReferralInfo } = useSubscriptionStore();
  const theme = useActiveTheme();

  useEffect(() => {
    if (!referralInfo) fetchReferralInfo();
  }, [referralInfo, fetchReferralInfo]);

  const handleCopy = async () => {
    if (referralInfo?.code) {
      await Clipboard.setStringAsync(referralInfo.code);
    }
  };

  return (
    <ThemedCard style={styles.card} elevation="small">
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Gift size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <ThemedText preset="label">Invite friends, earn free months</ThemedText>
          <ThemedText variant="secondary" style={styles.subtitle}>
            {referralInfo
              ? `${referralInfo.referralsCount} joined · ${referralInfo.freeMonthsEarned} free month${
                  referralInfo.freeMonthsEarned === 1 ? '' : 's'
                } earned`
              : 'Share Heartory with the people you love'}
          </ThemedText>
        </View>
      </View>

      {referralInfo?.code ? (
        <Pressable
          onPress={handleCopy}
          style={[styles.codeRow, { backgroundColor: theme.colors.backgroundSecondary }]}
        >
          <ThemedText style={styles.code}>{referralInfo.code}</ThemedText>
          <Copy size={16} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}

      <ThemedButton
        title="Invite a Friend"
        onPress={onInvite}
        leftIcon={<UserPlus size={18} color="#fff" />}
        buttonStyle={styles.inviteButton}
      />
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inviteButton: {
    marginTop: 4,
  },
});
