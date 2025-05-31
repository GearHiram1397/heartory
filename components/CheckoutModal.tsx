import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Platform
} from 'react-native';
import { X, CreditCard, Plus, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useBillingStore } from '@/store/billingStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { PaymentMethod } from '@/types/billing';
import { formatPrice } from '@/constants/subscriptions';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (paymentMethodId: string) => Promise<void>;
  planId: string | null;
  interval: 'month' | 'year';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  onComplete,
  planId,
  interval
}) => {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    paymentMethods, 
    defaultPaymentMethodId,
    fetchPaymentMethods,
    isLoading: billingLoading
  } = useBillingStore();
  
  const { 
    plans,
    currentSubscription,
    isLoading: subscriptionLoading
  } = useSubscriptionStore();
  
  const router = useRouter();
  const theme = useActiveTheme();
  
  // Set default payment method when modal opens
  useEffect(() => {
    if (visible && paymentMethods.length > 0) {
      setSelectedPaymentMethodId(defaultPaymentMethodId || paymentMethods[0].id);
    }
  }, [visible, paymentMethods, defaultPaymentMethodId]);
  
  // Refresh payment methods when modal opens
  useEffect(() => {
    if (visible) {
      fetchPaymentMethods();
    }
  }, [visible]);
  
  const handleAddPaymentMethod = () => {
    // Close this modal and navigate to billing
    onClose();
    router.push('/billing');
  };
  
  const handleSelectPaymentMethod = (id: string) => {
    setSelectedPaymentMethodId(id);
  };
  
  const handleSubmit = async () => {
    if (!selectedPaymentMethodId || !planId) return;
    
    setIsProcessing(true);
    
    try {
      await onComplete(selectedPaymentMethodId);
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Find the selected plan
  const selectedPlan = plans.find(p => p.id === planId && p.interval === interval);
  
  // Calculate price difference if upgrading/downgrading
  const calculatePriceDifference = () => {
    if (!selectedPlan || !currentSubscription) return null;
    
    const currentPlan = plans.find(p => p.id === currentSubscription.planId);
    if (!currentPlan) return null;
    
    // If same plan, no difference
    if (currentPlan.id === selectedPlan.id && currentPlan.interval === selectedPlan.interval) {
      return null;
    }
    
    const priceDiff = selectedPlan.price - currentPlan.price;
    return priceDiff;
  };
  
  const priceDifference = calculatePriceDifference();
  
  const isLoading = billingLoading || subscriptionLoading;
  
  if (!selectedPlan) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText preset="subtitle">Checkout</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.orderSummary}>
              <ThemedText style={styles.sectionTitle}>Order Summary</ThemedText>
              
              <View style={styles.planDetails}>
                <ThemedText style={styles.planName}>{selectedPlan.name} Plan</ThemedText>
                <ThemedText style={styles.planInterval}>
                  {interval === 'month' ? 'Monthly' : 'Annual'} subscription
                </ThemedText>
                <ThemedText style={styles.planPrice}>
                  {formatPrice(selectedPlan.price, interval)}
                </ThemedText>
              </View>
              
              {priceDifference !== null && (
                <View style={styles.priceDifference}>
                  <ThemedText style={styles.priceDifferenceLabel}>
                    {priceDifference > 0 ? 'Price increase:' : 'Price decrease:'}
                  </ThemedText>
                  <ThemedText style={[
                    styles.priceDifferenceAmount,
                    { color: priceDifference > 0 ? theme.colors.warning : theme.colors.success }
                  ]}>
                    {priceDifference > 0 ? '+' : ''}{formatPrice(Math.abs(priceDifference), interval)}
                  </ThemedText>
                </View>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total</ThemedText>
                <ThemedText style={styles.totalAmount}>
                  {formatPrice(selectedPlan.price, interval)}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.paymentSection}>
              <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
              
              {paymentMethods.length === 0 ? (
                <View style={styles.noPaymentMethods}>
                  <ThemedText variant="secondary" style={styles.noPaymentMethodsText}>
                    You don't have any payment methods yet.
                  </ThemedText>
                  <ThemedButton
                    title="Add Payment Method"
                    variant="outline"
                    onPress={handleAddPaymentMethod}
                    leftIcon={<Plus size={18} color={theme.colors.text} />}
                    buttonStyle={styles.addButton}
                  />
                </View>
              ) : (
                <View style={styles.paymentMethodsList}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity 
                      key={method.id}
                      style={[
                        styles.paymentMethodItem,
                        selectedPaymentMethodId === method.id && { 
                          borderColor: theme.colors.primary,
                          backgroundColor: `${theme.colors.primary}10`
                        }
                      ]}
                      onPress={() => handleSelectPaymentMethod(method.id)}
                    >
                      <View style={styles.paymentMethodInfo}>
                        <CreditCard size={20} color={theme.colors.text} style={styles.cardIcon} />
                        <View>
                          <ThemedText style={styles.cardBrand}>{method.cardBrand}</ThemedText>
                          <ThemedText variant="secondary" style={styles.cardDetails}>
                            •••• {method.last4} | Expires {method.expiryMonth}/{method.expiryYear}
                          </ThemedText>
                        </View>
                      </View>
                      
                      {selectedPaymentMethodId === method.id && (
                        <View style={[styles.selectedCheckmark, { backgroundColor: theme.colors.primary }]}>
                          <Check size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity 
                    style={styles.addPaymentMethodButton}
                    onPress={handleAddPaymentMethod}
                  >
                    <Plus size={18} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <ThemedText style={{ color: theme.colors.primary }}>
                      Add New Payment Method
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.termsSection}>
              <ThemedText variant="secondary" style={styles.termsText}>
                By completing this purchase, you agree to our Terms of Service and authorize us to charge your selected payment method for the price listed above. Subscriptions automatically renew until canceled.
              </ThemedText>
            </View>
            
            <ThemedButton
              title="Complete Purchase"
              onPress={handleSubmit}
              isLoading={isProcessing}
              disabled={!selectedPaymentMethodId || isLoading}
              buttonStyle={styles.submitButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  orderSummary: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  planDetails: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
  },
  planInterval: {
    marginTop: 4,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceDifference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceDifferenceLabel: {
    fontWeight: '500',
  },
  priceDifferenceAmount: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  paymentSection: {
    marginBottom: 24,
  },
  noPaymentMethods: {
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    marginTop: 8,
  },
  noPaymentMethodsText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  paymentMethodsList: {
    marginTop: 8,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardBrand: {
    fontWeight: '600',
  },
  cardDetails: {
    fontSize: 14,
  },
  selectedCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPaymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  termsSection: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
});