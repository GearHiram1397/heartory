import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { X, CreditCard, Check } from 'lucide-react-native';
import { useBillingStore } from '@/store/billingStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface AddPaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  visible,
  onClose
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addPaymentMethod } = useBillingStore();
  const theme = useActiveTheme();
  
  const handleSubmit = async () => {
    // Basic validation
    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Parse expiry date (MM/YY)
      const [month, year] = expiryDate.split('/');
      
      await addPaymentMethod({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        expiryMonth: month,
        expiryYear: year,
        cvv,
        isDefault
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      // Error is handled in the store
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setCardNumber('');
    setCardholderName('');
    setExpiryDate('');
    setCvv('');
    setIsDefault(true);
  };
  
  const formatCardNumber = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format with spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };
  
  const formatExpiryDate = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM/YY
    if (cleaned.length > 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    
    return cleaned;
  };
  
  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };
  
  const handleExpiryDateChange = (text: string) => {
    setExpiryDate(formatExpiryDate(text));
  };
  
  const handleCvvChange = (text: string) => {
    // Limit to 3-4 digits
    const cleaned = text.replace(/\D/g, '');
    setCvv(cleaned.slice(0, 4));
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText preset="subtitle">Add Payment Method</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.cardIconContainer}>
                <CreditCard size={40} color={theme.colors.primary} />
              </View>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Card Number</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Cardholder Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: theme.colors.text,
                      backgroundColor: theme.colors.backgroundSecondary,
                      borderColor: theme.colors.border
                    }
                  ]}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={cardholderName}
                  onChangeText={setCardholderName}
                />
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <ThemedText style={styles.inputLabel}>Expiry Date</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: theme.colors.text,
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="MM/YY"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={expiryDate}
                    onChangeText={handleExpiryDateChange}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={styles.inputLabel}>CVV</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { 
                        color: theme.colors.text,
                        backgroundColor: theme.colors.backgroundSecondary,
                        borderColor: theme.colors.border
                      }
                    ]}
                    placeholder="123"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={cvv}
                    onChangeText={handleCvvChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.defaultCheckbox}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[
                  styles.checkbox,
                  { 
                    borderColor: theme.colors.primary,
                    backgroundColor: isDefault ? theme.colors.primary : 'transparent'
                  }
                ]}>
                  {isDefault && <Check size={16} color="#FFFFFF" />}
                </View>
                <ThemedText style={styles.checkboxLabel}>
                  Set as default payment method
                </ThemedText>
              </TouchableOpacity>
              
              <ThemedText variant="secondary" style={styles.securityNote}>
                Your payment information is securely stored and processed. We use industry-standard encryption to protect your data.
              </ThemedText>
              
              <ThemedButton
                title="Add Payment Method"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                buttonStyle={styles.submitButton}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
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
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  defaultCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  securityNote: {
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 8,
  },
});