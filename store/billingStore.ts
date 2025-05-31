import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillingState, PaymentMethodInput } from '@/types/billing';
import { billingService } from '@/services/billingService';

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],
      defaultPaymentMethodId: null,
      invoices: [],
      billingAddress: null,
      isLoading: false,
      error: null,
      
      fetchPaymentMethods: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const paymentMethods = await billingService.getPaymentMethods();
          const defaultMethod = paymentMethods.find(method => method.isDefault);
          
          set({ 
            paymentMethods, 
            defaultPaymentMethodId: defaultMethod?.id || null,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch payment methods",
            isLoading: false 
          });
        }
      },
      
      fetchInvoices: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const invoices = await billingService.getInvoices();
          set({ invoices, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch invoices",
            isLoading: false 
          });
        }
      },
      
      addPaymentMethod: async (paymentMethod: PaymentMethodInput) => {
        set({ isLoading: true, error: null });
        
        try {
          const newMethod = await billingService.addPaymentMethod(paymentMethod);
          
          // If this is the first payment method or set as default
          if (paymentMethod.isDefault || get().paymentMethods.length === 0) {
            set({ 
              paymentMethods: [
                ...get().paymentMethods.map(method => ({
                  ...method,
                  isDefault: false
                })),
                newMethod
              ],
              defaultPaymentMethodId: newMethod.id,
              isLoading: false 
            });
          } else {
            set({ 
              paymentMethods: [...get().paymentMethods, newMethod],
              isLoading: false 
            });
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to add payment method",
            isLoading: false 
          });
        }
      },
      
      removePaymentMethod: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await billingService.removePaymentMethod(id);
          
          const updatedMethods = get().paymentMethods.filter(method => method.id !== id);
          
          // If we removed the default method, set a new default if available
          let newDefaultId = get().defaultPaymentMethodId;
          if (id === get().defaultPaymentMethodId && updatedMethods.length > 0) {
            newDefaultId = updatedMethods[0].id;
            await billingService.setDefaultPaymentMethod(newDefaultId);
            
            // Update the isDefault flag
            updatedMethods[0] = {
              ...updatedMethods[0],
              isDefault: true
            };
          }
          
          set({ 
            paymentMethods: updatedMethods,
            defaultPaymentMethodId: newDefaultId,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to remove payment method",
            isLoading: false 
          });
        }
      },
      
      setDefaultPaymentMethod: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await billingService.setDefaultPaymentMethod(id);
          
          // Update all payment methods to reflect the new default
          const updatedMethods = get().paymentMethods.map(method => ({
            ...method,
            isDefault: method.id === id
          }));
          
          set({ 
            paymentMethods: updatedMethods,
            defaultPaymentMethodId: id,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to set default payment method",
            isLoading: false 
          });
        }
      },
      
      updateBillingAddress: async (address) => {
        set({ isLoading: true, error: null });
        
        try {
          await billingService.updateBillingAddress(address);
          set({ billingAddress: address, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update billing address",
            isLoading: false 
          });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'memora-billing-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        paymentMethods: state.paymentMethods,
        defaultPaymentMethodId: state.defaultPaymentMethodId,
        billingAddress: state.billingAddress,
      }),
    }
  )
);