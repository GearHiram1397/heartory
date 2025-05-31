import { SubscriptionPlan } from '@/types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Basic memory storage for personal use',
    price: 0,
    interval: 'month',
    storageLimit: 500, // 500 MB
    features: [
      'Up to 500 MB storage',
      'Create up to 3 memory vaults',
      'Basic memory types (photos, text, quotes)',
      'Share with up to 2 family members'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Enhanced storage for your precious memories',
    price: 4.99,
    interval: 'month',
    storageLimit: 5000, // 5 GB
    features: [
      'Up to 5 GB storage',
      'Unlimited memory vaults',
      'All memory types including video and audio',
      'Share with up to 10 family members',
      'Advanced privacy controls',
      'Priority support'
    ],
    isPopular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Ultimate memory preservation experience',
    price: 9.99,
    interval: 'month',
    storageLimit: 20000, // 20 GB
    features: [
      'Up to 20 GB storage',
      'Unlimited memory vaults',
      'All memory types including high-quality video',
      'Unlimited sharing with family and friends',
      'Advanced privacy and backup options',
      'Priority support',
      'Early access to new features'
    ]
  }
];

// Annual plans (20% discount)
export const ANNUAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = SUBSCRIPTION_PLANS.map(plan => {
  if (plan.id === 'free') return plan;
  
  return {
    ...plan,
    interval: 'year',
    price: Math.round(plan.price * 12 * 0.8 * 100) / 100, // 20% discount, rounded to 2 decimal places
  };
});

export const formatStorageSize = (sizeInMB: number): string => {
  if (sizeInMB < 1000) {
    return `${sizeInMB} MB`;
  } else {
    return `${(sizeInMB / 1000).toFixed(1)} GB`;
  }
};

export const formatPrice = (price: number, interval: 'month' | 'year'): string => {
  if (price === 0) return 'Free';
  
  return `$${price}${interval === 'month' ? '/mo' : '/yr'}`;
};