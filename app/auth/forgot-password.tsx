import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Heart, ArrowLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { AuthInput } from '@/components/AuthInput';
import { AuthButton } from '@/components/AuthButton';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  
  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    clearError();
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled in the store
    }
  };
  
  const navigateBack = () => {
    router.back();
  };
  
  const navigateToLogin = () => {
    router.push('/auth/login');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={navigateBack}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <LinearGradient
              colors={[colors.sereneTwilight.start, colors.sereneTwilight.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Heart size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>Memora</Text>
          </View>
          
          <View style={styles.formContainer}>
            {!isSubmitted ? (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you instructions to reset your password
                </Text>
                
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorMessage}>{error}</Text>
                  </View>
                )}
                
                <AuthInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={emailError}
                  icon={<Mail size={20} color={colors.textLight} />}
                />
                
                <AuthButton
                  title="Send Reset Instructions"
                  onPress={handleResetPassword}
                  isLoading={isLoading}
                />
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successMessage}>
                  We've sent password reset instructions to {email}
                </Text>
                <AuthButton
                  title="Back to Login"
                  onPress={navigateToLogin}
                  variant="secondary"
                />
              </View>
            )}
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password?</Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  backButton: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorMessage: {
    color: colors.error,
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: colors.textLight,
    marginRight: 4,
  },
  loginLink: {
    color: colors.rosewood,
    fontWeight: '500',
  },
});