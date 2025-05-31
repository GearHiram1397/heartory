import { MemoryVault, Memory, SharedUser } from '@/types';
import { User } from '@/types/auth';
import { SubscriptionPlan, UserSubscription, ReferralInfo } from '@/types/subscription';
import { PaymentMethod, PaymentMethodInput, Invoice, BillingAddress } from '@/types/billing';
import { SUBSCRIPTION_PLANS, ANNUAL_SUBSCRIPTION_PLANS } from '@/constants/subscriptions';

// Mock users
const mockUsers: Record<string, User> = {
  'user1': {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
  },
  'user2': {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  'user3': {
    id: 'user3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  }
};

// Mock memories
const mockMemories: Record<string, Memory> = {
  'memory1': {
    id: 'memory1',
    type: 'photo',
    content: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714',
    caption: 'Summer vacation at the beach',
    date: '2023-07-15',
    tags: ['summer', 'beach', 'vacation'],
    createdAt: '2023-07-16T10:30:00Z',
    updatedAt: '2023-07-16T10:30:00Z',
  },
  'memory2': {
    id: 'memory2',
    type: 'text',
    content: 'Today was an amazing day. We went hiking in the mountains and saw the most beautiful sunset from the peak. The colors were incredible - deep oranges and purples that seemed to go on forever.',
    date: '2023-06-22',
    tags: ['hiking', 'mountains', 'sunset'],
    createdAt: '2023-06-23T18:45:00Z',
    updatedAt: '2023-06-23T18:45:00Z',
  },
  'memory3': {
    id: 'memory3',
    type: 'quote',
    content: 'The best thing about memories is making them.',
    caption: 'Something my grandfather always said',
    date: '2023-05-10',
    createdAt: '2023-05-10T14:20:00Z',
    updatedAt: '2023-05-10T14:20:00Z',
  },
  'memory4': {
    id: 'memory4',
    type: 'photo',
    content: 'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1',
    caption: 'Family dinner',
    date: '2023-04-30',
    tags: ['family', 'dinner'],
    createdAt: '2023-04-30T20:15:00Z',
    updatedAt: '2023-04-30T20:15:00Z',
  },
  'memory5': {
    id: 'memory5',
    type: 'video',
    content: 'https://example.com/video1.mp4', // This would be a real video URL in production
    caption: 'First steps',
    date: '2023-03-12',
    tags: ['baby', 'milestone'],
    createdAt: '2023-03-12T09:10:00Z',
    updatedAt: '2023-03-12T09:10:00Z',
  },
};

// Mock vaults
const mockVaults: Record<string, MemoryVault> = {
  'vault1': {
    id: 'vault1',
    name: 'Family Memories',
    description: 'Special moments with the family',
    coverImage: 'https://images.unsplash.com/photo-1609220136736-443140cffec6',
    memories: [mockMemories.memory1, mockMemories.memory2],
    sharedWith: ['user2'],
    createdAt: '2023-07-01T08:00:00Z',
    updatedAt: '2023-07-16T10:30:00Z',
    ownerId: 'user1',
  },
  'vault2': {
    id: 'vault2',
    name: 'Travel Adventures',
    description: 'Exploring the world one trip at a time',
    coverImage: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b',
    memories: [mockMemories.memory3],
    sharedWith: [],
    createdAt: '2023-05-05T12:30:00Z',
    updatedAt: '2023-05-10T14:20:00Z',
    ownerId: 'user1',
  },
  'vault3': {
    id: 'vault3',
    name: 'Childhood Memories',
    description: 'Growing up years',
    coverImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b40',
    memories: [mockMemories.memory4, mockMemories.memory5],
    sharedWith: ['user2', 'user3'],
    createdAt: '2023-03-10T15:45:00Z',
    updatedAt: '2023-04-30T20:15:00Z',
    ownerId: 'user1',
  },
};

// Mock subscription data
let mockCurrentSubscription: UserSubscription = {
  planId: 'free',
  status: 'active',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  autoRenew: true,
  storageUsed: 125, // 125 MB used
};

let mockReferralInfo: ReferralInfo = {
  code: 'FRIEND25',
  referralsCount: 2,
  referralLink: 'https://memora.app/refer/FRIEND25',
  freeMonthsEarned: 2,
  hasClaimedFreeMonth: true,
};

// Mock payment methods
let mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    cardBrand: 'Visa',
    last4: '4242',
    expiryMonth: '12',
    expiryYear: '25',
    cardholderName: 'John Doe',
    isDefault: true
  }
];

// Mock invoices
let mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 4.99,
    description: 'Premium Plan - Monthly',
    status: 'paid',
    planId: 'premium',
    paymentMethodId: 'pm_1'
  },
  {
    id: 'inv_2',
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 4.99,
    description: 'Premium Plan - Monthly',
    status: 'paid',
    planId: 'premium',
    paymentMethodId: 'pm_1'
  }
];

// Mock billing address
let mockBillingAddress: BillingAddress | null = {
  line1: '123 Main St',
  line2: 'Apt 4B',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94105',
  country: 'US'
};

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service
export const mockApiService = {
  // Initialize mock data
  init: () => {
    console.log('Mock API service initialized');
  },
  
  // Auth services
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await delay(1000); // Simulate network delay
      
      // Find user by email (in a real app, we would check password too)
      const user = Object.values(mockUsers).find(u => u.email === email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      return user;
    },
    
    register: async (name: string, email: string, password: string): Promise<User> => {
      await delay(1000); // Simulate network delay
      
      // Check if email already exists
      if (Object.values(mockUsers).some(u => u.email === email)) {
        throw new Error('Email already in use');
      }
      
      // Create new user
      const newUser: User = {
        id: `user${Object.keys(mockUsers).length + 1}`,
        name,
        email,
      };
      
      mockUsers[newUser.id] = newUser;
      
      return newUser;
    },
    
    getCurrentUser: async (): Promise<User> => {
      await delay(500);
      return mockUsers.user1; // Always return the first user for demo
    },
    
    updateProfile: async (userData: Partial<User>): Promise<User> => {
      await delay(1000);
      
      const user = mockUsers.user1;
      const updatedUser = { ...user, ...userData };
      mockUsers.user1 = updatedUser;
      
      return updatedUser;
    },
  },
  
  // Vault services
  vaults: {
    getAll: async (): Promise<MemoryVault[]> => {
      await delay(1000);
      return Object.values(mockVaults);
    },
    
    getById: async (id: string): Promise<MemoryVault> => {
      await delay(800);
      
      const vault = mockVaults[id];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      return vault;
    },
    
    create: async (vault: Omit<MemoryVault, 'id' | 'memories' | 'sharedWith' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<MemoryVault> => {
      await delay(1200);
      
      // Check if user has reached vault limit based on subscription
      const vaultCount = Object.values(mockVaults).length;
      if (mockCurrentSubscription.planId === 'free' && vaultCount >= 3) {
        throw new Error('Free plan limited to 3 memory vaults. Please upgrade to create more.');
      }
      
      const newVault: MemoryVault = {
        id: `vault${Object.keys(mockVaults).length + 1}`,
        ...vault,
        memories: [],
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'user1', // Always assign to the first user for demo
      };
      
      mockVaults[newVault.id] = newVault;
      
      return newVault;
    },
    
    update: async (id: string, updates: Partial<Omit<MemoryVault, 'id' | 'memories'>>): Promise<MemoryVault> => {
      await delay(1000);
      
      const vault = mockVaults[id];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      const updatedVault = { 
        ...vault, 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      mockVaults[id] = updatedVault;
      
      return updatedVault;
    },
    
    delete: async (id: string): Promise<void> => {
      await delay(800);
      
      if (!mockVaults[id]) {
        throw new Error('Vault not found');
      }
      
      delete mockVaults[id];
    },
    
    share: async (id: string, email: string): Promise<void> => {
      await delay(1000);
      
      const vault = mockVaults[id];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      const user = Object.values(mockUsers).find(u => u.email === email);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (vault.sharedWith.includes(user.id)) {
        throw new Error('Vault already shared with this user');
      }
      
      // Check sharing limits based on subscription
      if (mockCurrentSubscription.planId === 'free' && vault.sharedWith.length >= 2) {
        throw new Error('Free plan limited to sharing with 2 people. Please upgrade to share with more.');
      }
      
      vault.sharedWith.push(user.id);
      vault.updatedAt = new Date().toISOString();
    },
    
    unshare: async (id: string, userId: string): Promise<void> => {
      await delay(800);
      
      const vault = mockVaults[id];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      if (!vault.sharedWith.includes(userId)) {
        throw new Error('Vault not shared with this user');
      }
      
      vault.sharedWith = vault.sharedWith.filter(id => id !== userId);
      vault.updatedAt = new Date().toISOString();
    },
    
    getSharedUsers: async (id: string): Promise<SharedUser[]> => {
      await delay(800);
      
      const vault = mockVaults[id];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      return vault.sharedWith.map(userId => {
        const user = mockUsers[userId];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        };
      });
    },
  },
  
  // Memory services
  memories: {
    create: async (vaultId: string, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> => {
      await delay(1200);
      
      const vault = mockVaults[vaultId];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      // Check storage limits based on subscription
      const currentPlan = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS]
        .find(plan => plan.id === mockCurrentSubscription.planId);
      
      if (currentPlan) {
        // Simulate file size (in MB)
        let estimatedSize = 0;
        
        if (memory.type === 'photo') {
          estimatedSize = 2; // 2 MB per photo
        } else if (memory.type === 'video') {
          estimatedSize = 20; // 20 MB per video
        } else if (memory.type === 'audio') {
          estimatedSize = 5; // 5 MB per audio
        } else {
          estimatedSize = 0.1; // 0.1 MB for text/quote
        }
        
        // Check if adding this memory would exceed storage limit
        if (mockCurrentSubscription.storageUsed + estimatedSize > currentPlan.storageLimit) {
          throw new Error(`Storage limit reached. Please upgrade your plan or free up space.`);
        }
        
        // Update storage used
        mockCurrentSubscription.storageUsed += estimatedSize;
      }
      
      const newMemory: Memory = {
        id: `memory${Object.keys(mockMemories).length + 1}`,
        ...memory,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      mockMemories[newMemory.id] = newMemory;
      vault.memories.push(newMemory);
      vault.updatedAt = new Date().toISOString();
      
      return newMemory;
    },
    
    update: async (vaultId: string, memoryId: string, updates: Partial<Omit<Memory, 'id'>>): Promise<Memory> => {
      await delay(1000);
      
      const vault = mockVaults[vaultId];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      const memoryIndex = vault.memories.findIndex(m => m.id === memoryId);
      if (memoryIndex === -1) {
        throw new Error('Memory not found');
      }
      
      const memory = vault.memories[memoryIndex];
      const updatedMemory = { 
        ...memory, 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      mockMemories[memoryId] = updatedMemory;
      vault.memories[memoryIndex] = updatedMemory;
      vault.updatedAt = new Date().toISOString();
      
      return updatedMemory;
    },
    
    delete: async (vaultId: string, memoryId: string): Promise<void> => {
      await delay(800);
      
      const vault = mockVaults[vaultId];
      if (!vault) {
        throw new Error('Vault not found');
      }
      
      const memoryIndex = vault.memories.findIndex(m => m.id === memoryId);
      if (memoryIndex === -1) {
        throw new Error('Memory not found');
      }
      
      // Reduce storage used
      const memory = vault.memories[memoryIndex];
      let estimatedSize = 0;
      
      if (memory.type === 'photo') {
        estimatedSize = 2; // 2 MB per photo
      } else if (memory.type === 'video') {
        estimatedSize = 20; // 20 MB per video
      } else if (memory.type === 'audio') {
        estimatedSize = 5; // 5 MB per audio
      } else {
        estimatedSize = 0.1; // 0.1 MB for text/quote
      }
      
      mockCurrentSubscription.storageUsed = Math.max(0, mockCurrentSubscription.storageUsed - estimatedSize);
      
      vault.memories.splice(memoryIndex, 1);
      delete mockMemories[memoryId];
      vault.updatedAt = new Date().toISOString();
    },
  },
  
  // Upload service (mock)
  uploads: {
    uploadImage: async (uri: string): Promise<string> => {
      await delay(1500); // Simulate upload time
      
      // Check storage limits based on subscription
      const currentPlan = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS]
        .find(plan => plan.id === mockCurrentSubscription.planId);
      
      if (currentPlan) {
        // Simulate file size (2 MB per image)
        const estimatedSize = 2;
        
        // Check if adding this file would exceed storage limit
        if (mockCurrentSubscription.storageUsed + estimatedSize > currentPlan.storageLimit) {
          throw new Error(`Storage limit reached. Please upgrade your plan or free up space.`);
        }
      }
      
      // Just return the original URI for mock purposes
      // In a real app, this would return a URL to the uploaded file
      return uri;
    },
    
    uploadVideo: async (uri: string): Promise<string> => {
      await delay(2000); // Simulate longer upload time for video
      
      // Check storage limits based on subscription
      const currentPlan = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS]
        .find(plan => plan.id === mockCurrentSubscription.planId);
      
      if (currentPlan) {
        // Simulate file size (20 MB per video)
        const estimatedSize = 20;
        
        // Check if adding this file would exceed storage limit
        if (mockCurrentSubscription.storageUsed + estimatedSize > currentPlan.storageLimit) {
          throw new Error(`Storage limit reached. Please upgrade your plan or free up space.`);
        }
      }
      
      return uri;
    },
    
    uploadAudio: async (uri: string): Promise<string> => {
      await delay(1200);
      
      // Check storage limits based on subscription
      const currentPlan = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS]
        .find(plan => plan.id === mockCurrentSubscription.planId);
      
      if (currentPlan) {
        // Simulate file size (5 MB per audio)
        const estimatedSize = 5;
        
        // Check if adding this file would exceed storage limit
        if (mockCurrentSubscription.storageUsed + estimatedSize > currentPlan.storageLimit) {
          throw new Error(`Storage limit reached. Please upgrade your plan or free up space.`);
        }
      }
      
      return uri;
    },
  },
  
  // Subscription services
  subscription: {
    getPlans: async (): Promise<SubscriptionPlan[]> => {
      await delay(800);
      return [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS];
    },
    
    getCurrentSubscription: async (): Promise<UserSubscription> => {
      await delay(800);
      return mockCurrentSubscription;
    },
    
    subscribeToPlan: async (planId: string, interval: 'month' | 'year', paymentMethodId?: string): Promise<UserSubscription> => {
      await delay(1500);
      
      // Find the plan
      const allPlans = [...SUBSCRIPTION_PLANS, ...ANNUAL_SUBSCRIPTION_PLANS];
      const plan = allPlans.find(p => p.id === planId && p.interval === interval);
      
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }
      
      // Check if payment method is required
      if (plan.price > 0 && !paymentMethodId) {
        throw new Error('Payment method is required for paid plans');
      }
      
      // Verify payment method exists
      if (paymentMethodId && !mockPaymentMethods.find(pm => pm.id === paymentMethodId)) {
        throw new Error('Invalid payment method');
      }
      
      // Create an invoice for the subscription
      if (plan.price > 0) {
        const newInvoice: Invoice = {
          id: `inv_${mockInvoices.length + 1}`,
          date: new Date().toISOString(),
          amount: plan.price,
          description: `${plan.name} Plan - ${interval === 'month' ? 'Monthly' : 'Annual'}`,
          status: 'paid',
          planId: plan.id,
          paymentMethodId: paymentMethodId || ''
        };
        
        mockInvoices.unshift(newInvoice);
      }
      
      // Update the subscription
      mockCurrentSubscription = {
        planId: plan.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (interval === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        storageUsed: mockCurrentSubscription.storageUsed, // Keep current storage usage
        paymentMethodId: paymentMethodId
      };
      
      return mockCurrentSubscription;
    },
    
    cancelSubscription: async (): Promise<void> => {
      await delay(1000);
      
      // Update subscription status
      mockCurrentSubscription.status = 'canceled';
      mockCurrentSubscription.autoRenew = false;
    },
    
    updateAutoRenew: async (autoRenew: boolean): Promise<void> => {
      await delay(800);
      
      // Update auto-renew setting
      mockCurrentSubscription.autoRenew = autoRenew;
    },
    
    getReferralInfo: async (): Promise<ReferralInfo> => {
      await delay(800);
      return mockReferralInfo;
    },
    
    generateReferralCode: async (): Promise<string> => {
      await delay(1000);
      
      // Generate a random code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Update referral info
      mockReferralInfo.code = code;
      mockReferralInfo.referralLink = `https://memora.app/refer/${code}`;
      
      return code;
    },
    
    inviteFriend: async (email: string): Promise<void> => {
      await delay(1200);
      
      // In a real app, this would send an email invitation
      console.log(`Invitation sent to ${email} with code ${mockReferralInfo.code}`);
    },
    
    redeemReferralCode: async (code: string): Promise<void> => {
      await delay(1500);
      
      // Check if code is valid (in a real app, this would check against database)
      if (code !== 'FRIEND25' && code !== mockReferralInfo.code) {
        throw new Error('Invalid referral code');
      }
      
      // Check if user has already claimed a free month
      if (mockReferralInfo.hasClaimedFreeMonth) {
        throw new Error('You have already claimed a free month from a referral');
      }
      
      // Update subscription end date to add one month
      const currentEndDate = new Date(mockCurrentSubscription.endDate);
      currentEndDate.setMonth(currentEndDate.getMonth() + 1);
      mockCurrentSubscription.endDate = currentEndDate.toISOString();
      
      // Update referral info
      mockReferralInfo.hasClaimedFreeMonth = true;
    },
  },
  
  // Billing services
  billing: {
    getPaymentMethods: async (): Promise<PaymentMethod[]> => {
      await delay(800);
      return mockPaymentMethods;
    },
    
    addPaymentMethod: async (paymentMethod: PaymentMethodInput): Promise<PaymentMethod> => {
      await delay(1200);
      
      // Simulate card validation
      if (paymentMethod.cardNumber.length < 16) {
        throw new Error('Invalid card number');
      }
      
      if (paymentMethod.expiryMonth.length !== 2 || parseInt(paymentMethod.expiryMonth) > 12) {
        throw new Error('Invalid expiry month');
      }
      
      if (paymentMethod.expiryYear.length !== 2) {
        throw new Error('Invalid expiry year');
      }
      
      // Determine card brand based on first digit
      let cardBrand = 'Unknown';
      const firstDigit = paymentMethod.cardNumber.charAt(0);
      
      if (firstDigit === '4') {
        cardBrand = 'Visa';
      } else if (firstDigit === '5') {
        cardBrand = 'Mastercard';
      } else if (firstDigit === '3') {
        cardBrand = 'American Express';
      } else if (firstDigit === '6') {
        cardBrand = 'Discover';
      }
      
      // Create new payment method
      const newPaymentMethod: PaymentMethod = {
        id: `pm_${mockPaymentMethods.length + 1}`,
        cardBrand,
        last4: paymentMethod.cardNumber.slice(-4),
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        cardholderName: paymentMethod.cardholderName,
        isDefault: paymentMethod.isDefault
      };
      
      // If this is set as default, update other payment methods
      if (paymentMethod.isDefault) {
        mockPaymentMethods = mockPaymentMethods.map(method => ({
          ...method,
          isDefault: false
        }));
      }
      
      // Add to payment methods
      mockPaymentMethods.push(newPaymentMethod);
      
      return newPaymentMethod;
    },
    
    removePaymentMethod: async (id: string): Promise<void> => {
      await delay(800);
      
      // Check if payment method exists
      const paymentMethod = mockPaymentMethods.find(pm => pm.id === id);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      // Check if this is the only payment method for an active subscription
      if (mockPaymentMethods.length === 1 && 
          mockCurrentSubscription.status === 'active' && 
          mockCurrentSubscription.planId !== 'free') {
        throw new Error('Cannot remove the only payment method for an active subscription');
      }
      
      // Remove payment method
      mockPaymentMethods = mockPaymentMethods.filter(pm => pm.id !== id);
      
      // If this was the default payment method, set a new default
      if (paymentMethod.isDefault && mockPaymentMethods.length > 0) {
        mockPaymentMethods[0].isDefault = true;
      }
    },
    
    setDefaultPaymentMethod: async (id: string): Promise<void> => {
      await delay(800);
      
      // Check if payment method exists
      const paymentMethod = mockPaymentMethods.find(pm => pm.id === id);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      // Update default payment method
      mockPaymentMethods = mockPaymentMethods.map(pm => ({
        ...pm,
        isDefault: pm.id === id
      }));
    },
    
    getInvoices: async (): Promise<Invoice[]> => {
      await delay(800);
      return mockInvoices;
    },
    
    getInvoiceById: async (id: string): Promise<Invoice> => {
      await delay(600);
      
      const invoice = mockInvoices.find(inv => inv.id === id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      return invoice;
    },
    
    updateBillingAddress: async (address: BillingAddress): Promise<void> => {
      await delay(1000);
      mockBillingAddress = address;
    },
    
    getBillingAddress: async (): Promise<BillingAddress | null> => {
      await delay(800);
      return mockBillingAddress;
    }
  }
};

// Enable mock mode for services
export const enableMockServices = () => {
  mockApiService.init();
  console.log('Mock services enabled');
};