import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const theme = useActiveTheme();
  
  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    clearError();
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in the store
    }
  };
  
  const navigateToRegister = () => {
    router.push('/auth/register');
  };
  
  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <LinearGradient
              colors={[theme.gradients.secondary.start, theme.gradients.secondary.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Heart size={32} color="#fff" />
            </LinearGradient>
            <ThemedText preset="title" style={styles.appName}>Heartory</ThemedText>
            <ThemedText variant="secondary" style={styles.tagline}>Preserve what matters most</ThemedText>
          </View>
          
          <View style={styles.formContainer}>
            <ThemedText preset="title">Welcome Back</ThemedText>
            <ThemedText variant="secondary" style={styles.subtitle}>Sign in to access your memories</ThemedText>
            
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20` }]}>
                <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <ThemedText preset="label">Email</ThemedText>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: emailError ? theme.colors.error : 'transparent',
                },
                emailError ? styles.inputError : null
              ]}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text }
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError ? (
                <ThemedText style={{ color: theme.colors.error, fontSize: 14, marginTop: 4 }}>
                  {emailError}
                </ThemedText>
              ) : null}
            </View>
            
            <View style={styles.inputGroup}>
              <ThemedText preset="label">Password</ThemedText>
              <View style={[
                styles.inputContainer,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: passwordError ? theme.colors.error : 'transparent',
                },
                passwordError ? styles.inputError : null
              ]}>
                <View style={styles.iconContainer}>
                  <Lock size={20} color={theme.colors.textSecondary} />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text }
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              {passwordError ? (
                <ThemedText style={{ color: theme.colors.error, fontSize: 14, marginTop: 4 }}>
                  {passwordError}
                </ThemedText>
              ) : null}
            </View>
            
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={navigateToForgotPassword}
            >
              <ThemedText style={{ color: theme.colors.primary, fontWeight: '500' }}>
                Forgot password?
              </ThemedText>
            </TouchableOpacity>
            
            <ThemedButton
              title="Sign In"
              onPress={handleLogin}
              isLoading={isLoading}
            />
            
            <View style={styles.registerContainer}>
              <ThemedText variant="secondary">Don't have an account?</ThemedText>
              <TouchableOpacity onPress={navigateToRegister}>
                <ThemedText style={{ color: theme.colors.primary, fontWeight: '500', marginLeft: 4 }}>
                  Create Account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
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
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  subtitle: {
    marginBottom: 24,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 50,
    paddingRight: 16,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});