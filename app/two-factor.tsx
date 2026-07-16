import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ShieldCheck, Copy } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { complianceService } from '@/services/complianceService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';

// TOTP two-factor enrollment/management. Uses Supabase MFA under the hood.
export default function TwoFactorScreen() {
  const theme = useActiveTheme();
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const factors = await complianceService.listTotpFactors();
      const verified = factors.find((f) => f.status === 'verified');
      setEnrolled(!!verified);
      setFactorId(verified?.id ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    try {
      const data = await complianceService.enrollTotp();
      setFactorId(data.id);
      setSecret(data.totp.secret);
    } catch (e) {
      Alert.alert('Two-Factor', e instanceof Error ? e.message : 'Could not start enrollment.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!factorId || code.length < 6) return;
    setBusy(true);
    try {
      await complianceService.verifyTotp(factorId, code.trim());
      setSecret(null);
      setCode('');
      Alert.alert('Two-Factor Enabled', 'Your account is now protected with 2FA.');
      await refresh();
    } catch (e) {
      Alert.alert('Invalid Code', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!factorId) return;
    Alert.alert('Disable 2FA', 'Are you sure you want to turn off two-factor authentication?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await complianceService.unenrollTotp(factorId);
            await refresh();
          } catch (e) {
            Alert.alert('Two-Factor', e instanceof Error ? e.message : 'Could not disable 2FA.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Two-Factor Authentication' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}20` }]}>
            <ShieldCheck size={26} color={theme.colors.primary} />
          </View>

          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
          ) : enrolled ? (
            <>
              <ThemedText preset="subtitle" style={styles.center}>
                Two-factor authentication is on
              </ThemedText>
              <ThemedText variant="secondary" style={styles.center}>
                Your account requires a code from your authenticator app at sign-in.
              </ThemedText>
              <ThemedButton
                title="Disable Two-Factor"
                variant="secondary"
                onPress={disable}
                isLoading={busy}
                buttonStyle={styles.button}
              />
            </>
          ) : secret ? (
            <>
              <ThemedText preset="subtitle" style={styles.center}>
                Add Heartory to your authenticator
              </ThemedText>
              <ThemedText variant="secondary" style={styles.center}>
                Enter this setup key in Google Authenticator, 1Password, Authy, or similar,
                then type the 6-digit code it shows.
              </ThemedText>
              <ThemedCard style={styles.secretCard} elevation="small">
                <ThemedText style={styles.secret}>{secret}</ThemedText>
                <Copy
                  size={18}
                  color={theme.colors.textSecondary}
                  onPress={() => Clipboard.setStringAsync(secret)}
                />
              </ThemedCard>
              <TextInput
                style={[
                  styles.codeInput,
                  { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text },
                ]}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
              />
              <ThemedButton
                title="Verify & Enable"
                onPress={confirmEnroll}
                isLoading={busy}
                disabled={code.length < 6}
                buttonStyle={styles.button}
              />
            </>
          ) : (
            <>
              <ThemedText preset="subtitle" style={styles.center}>
                Protect your memories
              </ThemedText>
              <ThemedText variant="secondary" style={styles.center}>
                Add a second layer of security. You'll enter a code from your authenticator
                app whenever you sign in.
              </ThemedText>
              <ThemedButton
                title="Enable Two-Factor"
                onPress={startEnroll}
                isLoading={busy}
                buttonStyle={styles.button}
              />
            </>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  center: { textAlign: 'center', marginBottom: 12 },
  button: { alignSelf: 'stretch', marginTop: 16 },
  secretCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  secret: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  codeInput: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
  },
});
