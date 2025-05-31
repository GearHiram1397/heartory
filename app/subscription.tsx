import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, Shield, ChevronRight, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useBillingStore } from '@/store/billingStore';
import { useActiveTheme } from '@/store/themeStore';
import { SubscriptionPlan } from '@/types/subscription';
import { SUBSCRIPTION_PLANS, ANNUAL_SUBSCRIPTION_PLANS } from '@/constants/subscriptions';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { SubscriptionCard } from '@/components/SubscriptionCard';
import { StorageUsageBar } from '@/components/StorageUsageBar';
import { CheckoutModal } from '@/components/CheckoutModal';

export default function SubscriptionScreen() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  
  const { 
    plans, 
    currentSubscription, 
    fetchPlans, 
    fetchCurrentSubscription,
    subscribeToPlan,
    cancelSubscription,
    updateAutoRenew,
    isLoading: subscriptionLoading, 
    error: subscriptionError, 
    clearError: clearSubscriptionError 
  } = useSubscriptionStore();
  
  const {
    paymentMethods,
    fetchPaymentMethods,
    isLoading: billingLoading,
    error: billingError,
    clearError: clearBillingError
  } = useBillingStore();
  
  const router = useRouter();
  const theme = useActiveTheme();
  
  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
    fetchPaymentMethods();
  }, []);
  
  useEffect(() => {
    if (currentSubscription) {
      // Find the current plan
      const currentPlan = plans.find(p => p.id === currentSubscription.planId);
      if (currentPlan) {
        setSelectedPlanId(currentPlan.id);
        setIsAnnual(currentPlan.interval === 'year');
      }
    }
  }, [currentSubscription, plans]);
  
  const handleToggleInterval = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsAnnual(!isAnnual);
  };
  
  const handleSelectPlan = (planId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPlanId(planId);
  };
  
  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    
    // If the user is already subscribed to this plan, just confirm
    if (currentSubscription?.planId === selectedPlanId && currentSubscription?.status === 'active') {
      Alert.alert('Subscription Confirmed', 'You are already subscribed to this plan.');
      return;
    }
    
    // If the user has no payment methods, redirect to billing
    if (paymentMethods.length === 0) {
      Alert.alert(
        'Payment Method Required',
        'You need to add a payment method before subscribing.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Payment Method', 
            onPress: () => router.push('/billing')
          }
        ]
      );
      return;
    }
    
    // Open checkout modal
    setCheckoutModalVisible(true);
  };
  
  const handleCheckoutComplete = async (paymentMethodId: string) => {
    if (!selectedPlanId) return;
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsProcessing(true);
    clearSubscriptionError();
    clearBillingError();
    
    try {
      await subscribeToPlan(selectedPlanId, isAnnual ? 'year' : 'month', paymentMethodId);
      setCheckoutModalVisible(false);
      Alert.alert('Success', 'Your subscription has been updated successfully!');
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.',
      [
        {
          text: 'No, Keep It',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            clearSubscriptionError();
            
            try {
              await cancelSubscription();
              Alert.alert('Subscription Canceled', 'Your subscription has been canceled. You will still have access until the end of your billing period.');
            } catch (error) {
              // Error is handled in the store
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };
  
  const handleToggleAutoRenew = async () => {
    if (!currentSubscription) return;
    
    setIsProcessing(true);
    clearSubscriptionError();
    
    try {
      await updateAutoRenew(!currentSubscription.autoRenew);
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsProcessing(false);
    }
  };
  
  const navigateToBilling = () => {
    router.push('/billing');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Filter plans based on interval
  const filteredPlans = isAnnual ? ANNUAL_SUBSCRIPTION_PLANS : SUBSCRIPTION_PLANS;
  
  const isLoading = subscriptionLoading || billingLoading;
  const error = subscriptionError || billingError;
  
  if (isLoading && !currentSubscription) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading subscription information...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Subscription',
            headerRight: () => (
              <View style={styles.headerButtons}>
                <Shield size={20} color={theme.colors.text} />
              </View>
            ),
          }} 
        />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20` }]}>
              <AlertCircle size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
              <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
            </View>
          )}
          
          {currentSubscription && (
            <ThemedView style={styles.currentPlanContainer}>
              <ThemedText preset="subtitle">Current Plan</ThemedText>
              <ThemedText style={styles.currentPlanName}>
                {plans.find(p => p.id === currentSubscription.planId)?.name || 'Free'}
              </ThemedText>
              
              <StorageUsageBar />
              
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <ThemedText variant="secondary">Status</ThemedText>
                  <ThemedText style={[
                    styles.statusText,
                    { color: currentSubscription.status === 'active' ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {currentSubscription.status === 'active' ? 'Active' : 'Canceled'}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <ThemedText variant="secondary">Renewal Date</ThemedText>
                  <ThemedText>{formatDate(currentSubscription.endDate)}</ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <ThemedText variant="secondary">Auto-Renew</ThemedText>
                  <Switch
                    value={currentSubscription.autoRenew}
                    onValueChange={handleToggleAutoRenew}
                    disabled={isProcessing || currentSubscription.status !== 'active'}
                    trackColor={{ 
                      false: theme.colors.backgroundSecondary, 
                      true: theme.colors.primary 
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.billingButton}
                onPress={navigateToBilling}
              >
                <View style={styles.billingButtonContent}>
                  <CreditCard size={20} color={theme.colors.text} style={{ marginRight: 12 }} />
                  <ThemedText>Manage Payment Methods</ThemedText>
                </View>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              
              {currentSubscription.status === 'active' && currentSubscription.planId !== 'free' && (
                <ThemedButton
                  title="Cancel Subscription"
                  variant="secondary"
                  onPress={handleCancel}
                  isLoading={isProcessing}
                />
              )}
            </ThemedView>
          )}
          
          <View style={styles.plansContainer}>
            <ThemedText preset="title">Subscription Plans</ThemedText>
            
            <View style={styles.intervalToggleContainer}>
              <ThemedText style={isAnnual ? styles.inactiveText : styles.activeText}>Monthly</ThemedText>
              <Switch
                value={isAnnual}
                onValueChange={handleToggleInterval}
                trackColor={{ 
                  false: theme.colors.backgroundSecondary, 
                  true: theme.colors.primary 
                }}
                thumbColor="#FFFFFF"
              />
              <ThemedText style={isAnnual ? styles.activeText : styles.inactiveText}>Annual</ThemedText>
              {isAnnual && (
                <ThemedText style={[styles.savingsText, { color: theme.colors.success }]}>
                  Save 20%
                </ThemedText>
              )}
            </View>
            
            {filteredPlans.map((plan) => (
              <SubscriptionCard
                key={`${plan.id}-${plan.interval}`}
                plan={plan}
                isSelected={selectedPlanId === plan.id}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}
            
            <ThemedButton
              title={currentSubscription?.planId === selectedPlanId && currentSubscription?.status === 'active' 
                ? "Confirm Plan" 
                : "Subscribe Now"}
              onPress={handleSubscribe}
              isLoading={isProcessing}
              leftIcon={<CreditCard size={18} color="#FFFFFF" />}
              disabled={!selectedPlanId}
            />
          </View>
        </ScrollView>
        
        <CheckoutModal
          visible={checkoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          onComplete={handleCheckoutComplete}
          planId={selectedPlanId}
          interval={isAnnual ? 'year' : 'month'}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  currentPlanContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  subscriptionDetails: {
    marginTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontWeight: '600',
  },
  billingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 16,
  },
  billingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plansContainer: {
    marginBottom: 16,
  },
  intervalToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  activeText: {
    fontWeight: '600',
    marginHorizontal: 8,
  },
  inactiveText: {
    opacity: 0.6,
    marginHorizontal: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
});