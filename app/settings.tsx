import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  KeyRound,
  Download,
  Trash2,
  FileText,
} from 'lucide-react-native';
import { useThemeStore, useActiveTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { complianceService } from '@/services/complianceService';
import { notificationService } from '@/services/notificationService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemeSelector } from '@/components/ThemeSelector';

export default function SettingsScreen() {
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const theme = useActiveTheme();
  const { themeMode, setThemeMode } = useThemeStore();
  const logout = useAuthStore((s) => s.logout);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    notificationService.getPushEnabled().then(setPushEnabled).catch(() => {});
  }, []);

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    try {
      await notificationService.setPushEnabled(value);
    } catch {
      setPushEnabled(!value); // revert on failure
    }
  };

  const handleExportData = async () => {
    setBusy(true);
    try {
      const bundle = await complianceService.exportMyData();
      await Share.share({
        title: 'Heartory data export',
        message: JSON.stringify(bundle, null, 2),
      });
    } catch (e) {
      Alert.alert('Export', e instanceof Error ? e.message : 'Could not export your data.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and every memory, vault, and file in it. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await complianceService.deleteMyAccount();
              await logout();
            } catch (e) {
              Alert.alert(
                'Delete Account',
                e instanceof Error ? e.message : 'Could not delete your account.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };
  
  const isDarkMode = themeMode === 'dark' || 
    (themeMode === 'system' && theme.isDark);
  
  const toggleDarkMode = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };
  
  const openThemeSelector = () => {
    setThemeModalVisible(true);
  };
  
  const closeThemeSelector = () => {
    setThemeModalVisible(false);
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText preset="title">Settings</ThemedText>
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Appearance</ThemedText>
            
            <ThemedCard style={styles.settingsCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingIconContainer}>
                  {isDarkMode ? (
                    <Moon size={22} color={theme.colors.text} />
                  ) : (
                    <Sun size={22} color={theme.colors.text} />
                  )}
                </View>
                <ThemedText style={styles.settingText}>Dark Mode</ThemedText>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ 
                    false: theme.colors.backgroundSecondary, 
                    true: theme.colors.primary 
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={openThemeSelector}
              >
                <View style={styles.settingIconContainer}>
                  <Palette size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Theme</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </ThemedCard>
          </View>
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Notifications</ThemedText>
            
            <ThemedCard style={styles.settingsCard}>
              <View style={styles.settingItem}>
                <View style={styles.settingIconContainer}>
                  <Bell size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Push Notifications</ThemedText>
                <Switch
                  value={pushEnabled}
                  onValueChange={handleTogglePush}
                  trackColor={{
                    false: theme.colors.backgroundSecondary,
                    true: theme.colors.primary
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ThemedCard>
          </View>
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Privacy & Security</ThemedText>

            <ThemedCard style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/two-factor')}
              >
                <View style={styles.settingIconContainer}>
                  <KeyRound size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Two-Factor Authentication</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/legal/privacy')}
              >
                <View style={styles.settingIconContainer}>
                  <Shield size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Privacy Policy</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => router.push('/legal/terms')}
              >
                <View style={styles.settingIconContainer}>
                  <FileText size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Terms of Service</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </ThemedCard>
          </View>

          <View style={styles.section}>
            <ThemedText preset="subtitle">Your Data</ThemedText>

            <ThemedCard style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleExportData}
                disabled={busy}
              >
                <View style={styles.settingIconContainer}>
                  <Download size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Export My Data</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleDeleteAccount}
                disabled={busy}
              >
                <View style={styles.settingIconContainer}>
                  <Trash2 size={22} color={theme.colors.error} />
                </View>
                <ThemedText style={[styles.settingText, { color: theme.colors.error }]}>
                  Delete My Account
                </ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </ThemedCard>
          </View>

          <View style={styles.section}>
            <ThemedText preset="subtitle">Help & Support</ThemedText>
            
            <ThemedCard style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingIconContainer}>
                  <HelpCircle size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Help Center</ThemedText>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </ThemedCard>
          </View>
          
          <ThemedText 
            variant="secondary" 
            style={styles.versionText}
          >
            Version 1.0.0
          </ThemedText>
        </ScrollView>
        
        <Modal
          visible={themeModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeThemeSelector}
        >
          <View style={styles.modalContainer}>
            <View 
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.background }
              ]}
            >
              <ThemeSelector onClose={closeThemeSelector} />
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  settingsCard: {
    marginTop: 12,
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
});