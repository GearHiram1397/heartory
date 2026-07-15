import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/store/authStore';

// Redirect users based on auth state: signed-out users are pushed to the auth
// screens; signed-in users are kept out of them.
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, initialized, segments, router]);
}

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const initialized = useAuthStore((s) => s.initialized);

  // Reconcile with the real Supabase session on startup. Theme 'system' mode
  // resolves automatically via useColorScheme() in useActiveTheme().
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useProtectedRoute();

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="vault/[id]" options={{ headerTitle: 'Memory Vault' }} />
      <Stack.Screen name="memory/[vaultId]/[id]" options={{ headerTitle: 'Memory' }} />
      <Stack.Screen name="profile" options={{ headerTitle: 'Profile' }} />
      <Stack.Screen name="settings" options={{ headerTitle: 'Settings' }} />
      <Stack.Screen name="subscription" options={{ headerTitle: 'Subscription' }} />
      <Stack.Screen name="billing" options={{ headerTitle: 'Billing & Payment' }} />
      <Stack.Screen name="invite" options={{ headerTitle: 'Invite Friends' }} />
    </Stack>
  );
}
