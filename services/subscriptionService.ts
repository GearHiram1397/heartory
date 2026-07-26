import { SubscriptionPlan, UserSubscription, ReferralInfo } from '@/types/subscription';
import { mockApiService } from './mockService';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, ANNUAL_SUBSCRIPTION_PLANS, LEGACY_PLAN } from '@/constants/subscriptions';

// Monetization actions (subscribe/cancel/referrals) remain mocked until the
// Stripe integration lands in Phase 1. Reads below are backed by Supabase.
const BYTES_PER_MB = 1024 * 1024;
const REFERRAL_BASE_URL = process.env.EXPO_PUBLIC_REFERRAL_URL ?? 'https://heartory.app/refer';

export const subscriptionService = {
  // Plan catalog is static marketing/config data (features, pricing tiers).
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    return [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS, LEGACY_PLAN];
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

  // --- Stripe Checkout (hosted, PCI-safe) ---
  // Returns a Stripe Checkout URL for the app to open in a browser. Card data
  // never touches our servers. Webhooks are the source of truth for the
  // resulting subscription state.
  startCheckout: async (
    planId: string,
    interval: 'month' | 'year' | 'lifetime'
  ): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { planId, interval },
    });
    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error(data?.error || 'Could not start checkout.');
    return data.url as string;
  },

  // Returns a Stripe Billing Portal URL to manage/cancel the subscription and
  // update payment methods.
  openBillingPortalUrl: async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('stripe-portal', { body: {} });
    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error(data?.error || 'Could not open the billing portal.');
    return data.url as string;
  },

  // Deprecated: subscription changes now flow through Stripe Checkout + the
  // billing portal. Kept for the legacy CheckoutModal callback signature.
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

  // --- Referrals (real, backed by Postgres). Reward fulfilment (free months)
  // is applied via Stripe coupons out-of-band; the counts drive it. ---
  getReferralInfo: async (): Promise<ReferralInfo | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: code, error: codeErr } = await supabase.rpc('ensure_referral_code');
    if (codeErr) throw new Error(codeErr.message);

    const { data: stats } = await supabase.rpc('referral_stats');
    const row = Array.isArray(stats) ? stats[0] : undefined;
    const count = row?.referrals_count ?? 0;

    return {
      code: code as string,
      referralsCount: count,
      referralLink: `${REFERRAL_BASE_URL}/${code}`,
      freeMonthsEarned: count,
      hasClaimedFreeMonth: row?.has_claimed ?? false,
    };
  },

  generateReferralCode: async (): Promise<string> => {
    // Codes are stable per user; this returns the existing one (creating it
    // on first use).
    const { data, error } = await supabase.rpc('ensure_referral_code');
    if (error) throw new Error(error.message);
    return data as string;
  },

  inviteFriend: async (_email: string): Promise<void> => {
    // The invite itself is delivered via the share sheet in the UI; the
    // referral is recorded server-side when the invitee redeems the code.
    return;
  },

  redeemReferralCode: async (code: string): Promise<void> => {
    const { error } = await supabase.rpc('redeem_referral', { p_code: code });
    if (error) throw new Error(error.message);
  },
};