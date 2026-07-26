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
    price: 6.99,
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
    price: 12.99,
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

// Explicit annual prices (better than a flat %: Premium ~30% off, Pro ~24% off).
const ANNUAL_PRICE: Record<string, number> = {
  premium: 59,
  pro: 119,
};

export const ANNUAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = SUBSCRIPTION_PLANS.filter(
  (p) => p.id !== 'free'
).map((plan) => ({
  ...plan,
  interval: 'year',
  price: ANNUAL_PRICE[plan.id] ?? Math.round(plan.price * 12 * 0.8 * 100) / 100,
}));

// The "forever" tier: a one-time payment that funds a long-term storage reserve
// so these memories outlive the subscription. The differentiator in grief-tech.
export const LEGACY_PLAN: SubscriptionPlan = {
  id: 'legacy',
  name: 'Legacy',
  description: 'Keep these memories forever — one payment, no subscription',
  price: 249,
  interval: 'lifetime',
  storageLimit: 20000, // 20 GB
  features: [
    'Everything in Pro, forever',
    'One payment — never billed again',
    '20 GB, funded by a long-term storage reserve',
    'Pass vaults on to your beneficiaries',
    'Priority support for life',
  ],
};

export const formatStorageSize = (sizeInMB: number): string => {
  if (sizeInMB < 1000) {
    return `${sizeInMB} MB`;
  } else {
    return `${(sizeInMB / 1000).toFixed(1)} GB`;
  }
};

export const formatPrice = (
  price: number,
  interval: 'month' | 'year' | 'lifetime'
): string => {
  if (price === 0) return 'Free';
  if (interval === 'lifetime') return `$${price} once`;
  return `$${price}${interval === 'month' ? '/mo' : '/yr'}`;
};
