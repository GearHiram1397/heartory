import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';

// Reached from the password-reset email link (recovery session). Lets the user
// choose a new password. Routing here is handled by the root layout when
// authStore.passwordRecovery is true.
export default function ResetPasswordScreen() {
  const theme = useActiveTheme();
  const { completePasswordReset, isLoading, error, clearError } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLocalError('');
    clearError();
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    try {
      await completePasswordReset(password);
      setDone(true);
    } catch {
      /* surfaced via store error */
    }
  };

  const shownError = localError || error;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.gradients.secondary.start, theme.gradients.secondary.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Heart size={32} color="#fff" />
          </LinearGradient>
          <ThemedText preset="title" style={styles.appName}>Heartory</ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText preset="title">
            {done ? 'Password updated' : 'Choose a new password'}
          </ThemedText>
          <ThemedText variant="secondary" style={styles.subtitle}>
            {done
              ? 'Your password has been changed. You can keep using Heartory.'
              : 'Enter a new password for your account.'}
          </ThemedText>

          {!done && (
            <>
              {shownError ? (
                <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}20` }]}>
                  <ThemedText style={{ color: theme.colors.error }}>{shownError}</ThemedText>
                </View>
              ) : null}

              <View style={[styles.inputRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Lock size={20} color={theme.colors.textSecondary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="New password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <Lock size={20} color={theme.colors.textSecondary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
              </View>

              <ThemedButton title="Update Password" onPress={submit} isLoading={isLoading} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  logo: {
    width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  appName: {},
  form: { paddingHorizontal: 24, paddingTop: 8 },
  subtitle: { marginTop: 8, marginBottom: 24 },
  errorBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 50, fontSize: 16 },
});
