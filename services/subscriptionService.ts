import { SubscriptionPlan, UserSubscription, ReferralInfo } from '@/types/subscription';
import { apiRequest } from './api';
import { mockApiService } from './mockService';

// Flag to use mock data instead of real API
const USE_MOCK = true;

export const subscriptionService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    if (USE_MOCK) {
      return mockApiService.subscription.getPlans();
    }
    
    return apiRequest<SubscriptionPlan[]>('/subscriptions/plans', 'GET');
  },
  
  getCurrentSubscription: async (): Promise<UserSubscription | null> => {
    if (USE_MOCK) {
      return mockApiService.subscription.getCurrentSubscription();
    }
    
    try {
      return await apiRequest<UserSubscription>('/subscriptions/current', 'GET');
    } catch (error) {
      // If no subscription exists, return null instead of throwing
      if (error instanceof Error && error.message.includes('No subscription found')) {
        return null;
      }
      throw error;
    }
  },
  
  subscribeToPlan: async (planId: string, interval: 'month' | 'year', paymentMethodId?: string): Promise<UserSubscription> => {
    if (USE_MOCK) {
      return mockApiService.subscription.subscribeToPlan(planId, interval, paymentMethodId);
    }
    
    return apiRequest<UserSubscription>('/subscriptions/subscribe', 'POST', { 
      planId, 
      interval,
      paymentMethodId 
    });
  },
  
  cancelSubscription: async (): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.subscription.cancelSubscription();
    }
    
    await apiRequest<void>('/subscriptions/cancel', 'POST');
  },
  
  updateAutoRenew: async (autoRenew: boolean): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.subscription.updateAutoRenew(autoRenew);
    }
    
    await apiRequest<void>('/subscriptions/auto-renew', 'POST', { autoRenew });
  },
  
  getReferralInfo: async (): Promise<ReferralInfo | null> => {
    if (USE_MOCK) {
      return mockApiService.subscription.getReferralInfo();
    }
    
    try {
      return await apiRequest<ReferralInfo>('/subscriptions/referrals', 'GET');
    } catch (error) {
      // If no referral info exists, return null instead of throwing
      if (error instanceof Error && error.message.includes('No referral information found')) {
        return null;
      }
      throw error;
    }
  },
  
  generateReferralCode: async (): Promise<string> => {
    if (USE_MOCK) {
      return mockApiService.subscription.generateReferralCode();
    }
    
    const response = await apiRequest<{ code: string }>('/subscriptions/referrals/generate', 'POST');
    return response.code;
  },
  
  inviteFriend: async (email: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.subscription.inviteFriend(email);
    }
    
    await apiRequest<void>('/subscriptions/referrals/invite', 'POST', { email });
  },
  
  redeemReferralCode: async (code: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.subscription.redeemReferralCode(code);
    }
    
    await apiRequest<void>('/subscriptions/referrals/redeem', 'POST', { code });
  }
};