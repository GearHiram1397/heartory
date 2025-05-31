import { PaymentMethod, PaymentMethodInput, Invoice, BillingAddress } from '@/types/billing';
import { apiRequest } from './api';
import { mockApiService } from './mockService';

// Flag to use mock data instead of real API
const USE_MOCK = true;

export const billingService = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    if (USE_MOCK) {
      return mockApiService.billing.getPaymentMethods();
    }
    
    return apiRequest<PaymentMethod[]>('/billing/payment-methods', 'GET');
  },
  
  addPaymentMethod: async (paymentMethod: PaymentMethodInput): Promise<PaymentMethod> => {
    if (USE_MOCK) {
      return mockApiService.billing.addPaymentMethod(paymentMethod);
    }
    
    return apiRequest<PaymentMethod>('/billing/payment-methods', 'POST', paymentMethod);
  },
  
  removePaymentMethod: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.billing.removePaymentMethod(id);
    }
    
    await apiRequest<void>(`/billing/payment-methods/${id}`, 'DELETE');
  },
  
  setDefaultPaymentMethod: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.billing.setDefaultPaymentMethod(id);
    }
    
    await apiRequest<void>(`/billing/payment-methods/${id}/default`, 'POST');
  },
  
  getInvoices: async (): Promise<Invoice[]> => {
    if (USE_MOCK) {
      return mockApiService.billing.getInvoices();
    }
    
    return apiRequest<Invoice[]>('/billing/invoices', 'GET');
  },
  
  getInvoiceById: async (id: string): Promise<Invoice> => {
    if (USE_MOCK) {
      return mockApiService.billing.getInvoiceById(id);
    }
    
    return apiRequest<Invoice>(`/billing/invoices/${id}`, 'GET');
  },
  
  updateBillingAddress: async (address: BillingAddress): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.billing.updateBillingAddress(address);
    }
    
    await apiRequest<void>('/billing/address', 'PUT', address);
  },
  
  getBillingAddress: async (): Promise<BillingAddress | null> => {
    if (USE_MOCK) {
      return mockApiService.billing.getBillingAddress();
    }
    
    try {
      return await apiRequest<BillingAddress>('/billing/address', 'GET');
    } catch (error) {
      // If no address exists, return null instead of throwing
      if (error instanceof Error && error.message.includes('No billing address found')) {
        return null;
      }
      throw error;
    }
  },
};