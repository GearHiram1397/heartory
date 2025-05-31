import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Modal,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Moon, Sun, Palette, Bell, Shield, HelpCircle, ChevronRight } from 'lucide-react-native';
import { useThemeStore, useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { ThemeSelector } from '@/components/ThemeSelector';

export default function SettingsScreen() {
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const router = useRouter();
  const theme = useActiveTheme();
  const { themeMode, setThemeMode } = useThemeStore();
  
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
                  value={true}
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
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingIconContainer}>
                  <Shield size={22} color={theme.colors.text} />
                </View>
                <ThemedText style={styles.settingText}>Privacy Settings</ThemedText>
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