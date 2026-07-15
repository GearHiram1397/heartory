import { SubscriptionPlan, UserSubscription, ReferralInfo } from '@/types/subscription';
import { mockApiService } from './mockService';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, ANNUAL_SUBSCRIPTION_PLANS } from '@/constants/subscriptions';

// Monetization actions (subscribe/cancel/referrals) remain mocked until the
// Stripe integration lands in Phase 1. Reads below are backed by Supabase.
const BYTES_PER_MB = 1024 * 1024;

export const subscriptionService = {
  // Plan catalog is static marketing/config data (features, pricing tiers).
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    return [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS];
  },

  // The user's actual subscription + real storage usage, from Postgres.
  getCurrentSubscription: async (): Promise<UserSubscription | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      planId: data.plan_id,
      status: data.status as UserSubscription['status'],
      startDate: data.current_period_start,
      endDate: data.current_period_end ?? '',
      autoRenew: data.auto_renew,
      storageUsed: Math.round((data.storage_used_bytes / BYTES_PER_MB) * 10) / 10,
      paymentMethodId: data.stripe_subscription_id ?? undefined,
    };
  },

  // --- Monetization actions: mocked until Phase 1 (Stripe). ---
  // These will be replaced by Stripe Checkout + webhook-driven subscription
  // state; the client will never mutate subscription rows directly.
  subscribeToPlan: async (
    planId: string,
    interval: 'month' | 'year',
    paymentMethodId?: string
  ): Promise<UserSubscription> => {
    return mockApiService.subscription.subscribeToPlan(planId, interval, paymentMethodId);
  },

  cancelSubscription: async (): Promise<void> => {
    return mockApiService.subscription.cancelSubscription();
  },

  updateAutoRenew: async (autoRenew: boolean): Promise<void> => {
    return mockApiService.subscription.updateAutoRenew(autoRenew);
  },

  getReferralInfo: async (): Promise<ReferralInfo | null> => {
    return mockApiService.subscription.getReferralInfo();
  },

  generateReferralCode: async (): Promise<string> => {
    return mockApiService.subscription.generateReferralCode();
  },

  inviteFriend: async (email: string): Promise<void> => {
    return mockApiService.subscription.inviteFriend(email);
  },

  redeemReferralCode: async (code: string): Promise<void> => {
    return mockApiService.subscription.redeemReferralCode(code);
  },
};