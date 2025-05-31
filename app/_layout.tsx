import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { enableMockServices } from '@/services/mockService';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { themeMode, setSystemTheme } = useThemeStore();
  
  // Initialize mock services
  useEffect(() => {
    enableMockServices();
  }, []);
  
  // Update system theme when colorScheme changes
  useEffect(() => {
    setSystemTheme(colorScheme === 'dark');
  }, [colorScheme, setSystemTheme]);
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="vault/[id]" options={{ headerTitle: "Memory Vault" }} />
      <Stack.Screen name="memory/[vaultId]/[id]" options={{ headerTitle: "Memory" }} />
      <Stack.Screen name="profile" options={{ headerTitle: "Profile" }} />
      <Stack.Screen name="settings" options={{ headerTitle: "Settings" }} />
      <Stack.Screen name="subscription" options={{ headerTitle: "Subscription" }} />
      <Stack.Screen name="billing" options={{ headerTitle: "Billing & Payment" }} />
      <Stack.Screen name="invite" options={{ headerTitle: "Invite Friends" }} />
    </Stack>
  );
}