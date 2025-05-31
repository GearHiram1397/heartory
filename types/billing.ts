export interface PaymentMethod {
    id: string;
    cardBrand: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    cardholderName: string;
    isDefault: boolean;
  }
  
  export interface PaymentMethodInput {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    isDefault: boolean;
  }
  
  export interface Invoice {
    id: string;
    date: string;
    amount: number;
    description: string;
    status: 'paid' | 'pending' | 'failed';
    planId: string;
    paymentMethodId: string;
  }
  
  export interface BillingAddress {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }
  
  export interface BillingState {
    paymentMethods: PaymentMethod[];
    defaultPaymentMethodId: string | null;
    invoices: Invoice[];
    billingAddress: BillingAddress | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    fetchPaymentMethods: () => Promise<void>;
    fetchInvoices: () => Promise<void>;
    addPaymentMethod: (paymentMethod: PaymentMethodInput) => Promise<void>;
    removePaymentMethod: (id: string) => Promise<void>;
    setDefaultPaymentMethod: (id: string) => Promise<void>;
    updateBillingAddress: (address: BillingAddress) => Promise<void>;
    clearError: () => void;
  }