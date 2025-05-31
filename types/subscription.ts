export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year';
    storageLimit: number; // in MB
    features: string[];
    isPopular?: boolean;
  }
  
  export interface UserSubscription {
    planId: string;
    status: 'active' | 'canceled' | 'expired' | 'trial';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    storageUsed: number; // in MB
    paymentMethodId?: string;
  }
  
  export interface ReferralInfo {
    code: string;
    referralsCount: number;
    referralLink: string;
    freeMonthsEarned: number;
    hasClaimedFreeMonth: boolean;
  }
  
  export interface SubscriptionState {
    plans: SubscriptionPlan[];
    currentSubscription: UserSubscription | null;
    referralInfo: ReferralInfo | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    fetchPlans: () => Promise<void>;
    fetchCurrentSubscription: () => Promise<void>;
    fetchReferralInfo: () => Promise<void>;
    subscribeToPlan: (planId: string, interval: 'month' | 'year', paymentMethodId?: string) => Promise<void>;
    cancelSubscription: () => Promise<void>;
    updateAutoRenew: (autoRenew: boolean) => Promise<void>;
    generateReferralCode: () => Promise<string>;
    inviteFriend: (email: string) => Promise<void>;
    redeemReferralCode: (code: string) => Promise<void>;
    clearError: () => void;
  }