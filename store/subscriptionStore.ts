import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionState, SubscriptionPlan, UserSubscription, ReferralInfo } from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptions';

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plans: SUBSCRIPTION_PLANS,
      currentSubscription: null,
      referralInfo: null,
      isLoading: false,
      error: null,
      
      fetchPlans: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const plans = await subscriptionService.getPlans();
          set({ plans, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch subscription plans",
            isLoading: false 
          });
        }
      },
      
      fetchCurrentSubscription: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const subscription = await subscriptionService.getCurrentSubscription();
          set({ currentSubscription: subscription, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch subscription",
            isLoading: false 
          });
        }
      },
      
      fetchReferralInfo: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const referralInfo = await subscriptionService.getReferralInfo();
          set({ referralInfo, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch referral information",
            isLoading: false 
          });
        }
      },
      
      subscribeToPlan: async (planId: string, interval: 'month' | 'year', paymentMethodId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const subscription = await subscriptionService.subscribeToPlan(planId, interval, paymentMethodId);
          set({ currentSubscription: subscription, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to subscribe to plan",
            isLoading: false 
          });
          throw error;
        }
      },
      
      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        
        try {
          await subscriptionService.cancelSubscription();
          
          // Update the subscription status
          const currentSubscription = get().currentSubscription;
          if (currentSubscription) {
            set({ 
              currentSubscription: { 
                ...currentSubscription, 
                status: 'canceled',
                autoRenew: false
              },
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to cancel subscription",
            isLoading: false 
          });
        }
      },
      
      updateAutoRenew: async (autoRenew: boolean) => {
        set({ isLoading: true, error: null });
        
        try {
          await subscriptionService.updateAutoRenew(autoRenew);
          
          // Update the subscription status
          const currentSubscription = get().currentSubscription;
          if (currentSubscription) {
            set({ 
              currentSubscription: { 
                ...currentSubscription, 
                autoRenew
              },
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update auto-renew setting",
            isLoading: false 
          });
        }
      },
      
      generateReferralCode: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const code = await subscriptionService.generateReferralCode();
          
          // Update referral info
          await get().fetchReferralInfo();
          
          set({ isLoading: false });
          return code;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to generate referral code",
            isLoading: false 
          });
          throw error;
        }
      },
      
      inviteFriend: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await subscriptionService.inviteFriend(email);
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to send invitation",
            isLoading: false 
          });
        }
      },
      
      redeemReferralCode: async (code: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await subscriptionService.redeemReferralCode(code);
          
          // Refresh subscription after redeeming
          await get().fetchCurrentSubscription();
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to redeem referral code",
            isLoading: false 
          });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'heartory-subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        currentSubscription: state.currentSubscription,
        referralInfo: state.referralInfo,
      }),
    }
  )
);