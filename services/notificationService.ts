import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Foreground handler: show a banner while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const projectId =
  (Constants?.expoConfig as any)?.extra?.eas?.projectId ??
  (Constants as any)?.easConfig?.projectId;

export const notificationService = {
  // Requests permission, gets the Expo push token, and stores it. No-op on web
  // or simulators. Safe to call on every app start / sign-in.
  registerForPush: async (): Promise<string | null> => {
    if (Platform.OS === 'web' || !Device.isDevice) return null;

    try {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (existing !== 'granted') {
        status = (await Notifications.requestPermissionsAsync()).status;
      }
      if (status !== 'granted') return null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      const token = tokenResponse.data;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && token) {
        await supabase
          .from('push_tokens')
          .upsert(
            { user_id: user.id, token, platform: Platform.OS },
            { onConflict: 'user_id,token' }
          );
      }
      return token;
    } catch (e) {
      console.warn('Push registration failed', e);
      return null;
    }
  },

  // Remove this device's token (e.g., on sign-out or when disabling push).
  unregister: async (token?: string): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const q = supabase.from('push_tokens').delete().eq('user_id', user.id);
    if (token) await q.eq('token', token);
    else await q;
  },

  getPushEnabled: async (): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from('profiles')
      .select('push_enabled')
      .eq('id', user.id)
      .maybeSingle();
    return data?.push_enabled ?? true;
  },

  setPushEnabled: async (enabled: boolean): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ push_enabled: enabled }).eq('id', user.id);
    if (enabled) await notificationService.registerForPush();
    else await notificationService.unregister();
  },

  // Fire a push to the other members of a shared vault (best-effort).
  notifyVaultActivity: async (vaultId: string, title: string, body: string): Promise<void> => {
    try {
      await supabase.functions.invoke('notify-vault-activity', {
        body: { vaultId, title, body },
      });
    } catch {
      /* non-fatal */
    }
  },
};
