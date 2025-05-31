import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, Plus, Trash2, Receipt, ChevronRight, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useBillingStore } from '@/store/billingStore';
import { useActiveTheme } from '@/store/themeStore';
import { PaymentMethod, Invoice } from '@/types/billing';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { AddPaymentMethodModal } from '@/components/AddPaymentMethodModal';
import { formatDate } from '@/utils/dateUtils';

export default function BillingScreen() {
  const [addPaymentModalVisible, setAddPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const { 
    paymentMethods,
    defaultPaymentMethodId,
    invoices,
    isLoading,
    error,
    fetchPaymentMethods,
    fetchInvoices,
    setDefaultPaymentMethod,
    removePaymentMethod,
    clearError
  } = useBillingStore();
  
  const router = useRouter();
  const theme = useActiveTheme();
  
  useEffect(() => {
    fetchPaymentMethods();
    fetchInvoices();
  }, []);
  
  const handleAddPaymentMethod = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setAddPaymentModalVisible(true);
  };
  
  const handleCloseAddPaymentModal = () => {
    setAddPaymentModalVisible(false);
  };
  
  const handleSetDefaultPaymentMethod = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setDefaultPaymentMethod(id);
  };
  
  const handleRemovePaymentMethod = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    Alert.alert(
      "Remove Payment Method",
      "Are you sure you want to remove this payment method?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removePaymentMethod(id)
        }
      ]
    );
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedInvoice(invoice);
    // In a real app, you might navigate to a detailed invoice view
    // or open a PDF viewer
    Alert.alert(
      `Invoice #${invoice.id}`,
      `Amount: $${invoice.amount.toFixed(2)}\nDate: ${formatDate(invoice.date)}\nStatus: ${invoice.status}`,
      [{ text: "Close" }]
    );
  };
  
  if (isLoading && paymentMethods.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading billing information...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Billing & Payment',
            headerRight: () => (
              <View style={styles.headerButtons}>
                <CreditCard size={20} color={theme.colors.text} />
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
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Payment Methods</ThemedText>
            
            {paymentMethods.length === 0 ? (
              <ThemedCard style={styles.emptyStateCard}>
                <ThemedText variant="secondary" style={styles.emptyStateText}>
                  You don't have any payment methods yet.
                </ThemedText>
                <ThemedButton
                  title="Add Payment Method"
                  onPress={handleAddPaymentMethod}
                  leftIcon={<Plus size={18} color="#FFFFFF" />}
                  buttonStyle={styles.addButton}
                />
              </ThemedCard>
            ) : (
              <>
                {paymentMethods.map((method) => (
                  <ThemedCard key={method.id} style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodHeader}>
                      <CreditCard size={24} color={theme.colors.text} />
                      <View style={styles.paymentMethodInfo}>
                        <ThemedText style={styles.cardName}>{method.cardBrand}</ThemedText>
                        <ThemedText variant="secondary">•••• {method.last4}</ThemedText>
                      </View>
                      <ThemedText variant="secondary">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.paymentMethodActions}>
                      {method.id === defaultPaymentMethodId ? (
                        <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary }]}>
                          <ThemedText style={styles.defaultBadgeText}>Default</ThemedText>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => handleSetDefaultPaymentMethod(method.id)}
                          style={styles.setDefaultButton}
                        >
                          <ThemedText style={{ color: theme.colors.primary }}>Set as Default</ThemedText>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity 
                        onPress={() => handleRemovePaymentMethod(method.id)}
                        style={styles.removeButton}
                      >
                        <Trash2 size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </ThemedCard>
                ))}
                
                <ThemedButton
                  title="Add Payment Method"
                  variant="outline"
                  onPress={handleAddPaymentMethod}
                  leftIcon={<Plus size={18} color={theme.colors.text} />}
                  buttonStyle={styles.addButton}
                />
              </>
            )}
          </View>
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Billing History</ThemedText>
            
            {invoices.length === 0 ? (
              <ThemedCard style={styles.emptyStateCard}>
                <ThemedText variant="secondary" style={styles.emptyStateText}>
                  You don't have any invoices yet.
                </ThemedText>
              </ThemedCard>
            ) : (
              <ThemedCard style={styles.invoicesCard}>
                {invoices.map((invoice) => (
                  <TouchableOpacity 
                    key={invoice.id}
                    style={styles.invoiceItem}
                    onPress={() => handleViewInvoice(invoice)}
                  >
                    <View style={styles.invoiceInfo}>
                      <Receipt size={20} color={theme.colors.text} style={styles.invoiceIcon} />
                      <View>
                        <ThemedText>{formatDate(invoice.date)}</ThemedText>
                        <ThemedText variant="secondary">
                          {invoice.description}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.invoiceAmount}>
                      <ThemedText style={styles.amountText}>
                        ${invoice.amount.toFixed(2)}
                      </ThemedText>
                      <View style={[
                        styles.statusBadge,
                        { 
                          backgroundColor: invoice.status === 'paid' 
                            ? `${theme.colors.success}20` 
                            : `${theme.colors.warning}20` 
                        }
                      ]}>
                        <ThemedText style={[
                          styles.statusText,
                          { 
                            color: invoice.status === 'paid' 
                              ? theme.colors.success 
                              : theme.colors.warning 
                          }
                        ]}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </ThemedText>
                      </View>
                      <ChevronRight size={16} color={theme.colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ThemedCard>
            )}
          </View>
        </ScrollView>
        
        <AddPaymentMethodModal 
          visible={addPaymentModalVisible}
          onClose={handleCloseAddPaymentModal}
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
  section: {
    marginBottom: 24,
  },
  emptyStateCard: {
    marginTop: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  paymentMethodCard: {
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontWeight: '600',
  },
  paymentMethodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  defaultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  setDefaultButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  invoicesCard: {
    marginTop: 12,
    padding: 0,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  invoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invoiceIcon: {
    marginRight: 12,
  },
  invoiceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountText: {
    fontWeight: '600',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
  },
});