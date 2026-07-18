import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User, Settings, Shield, Heart, CreditCard, Receipt } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { StorageUsageBar } from '@/components/StorageUsageBar';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { ReferralCard } from '@/components/ReferralCard';
import { EditProfileModal } from '@/components/EditProfileModal';

export default function ProfileScreen() {
  const router = useRouter();
  const [editVisible, setEditVisible] = useState(false);
  const { user, logout } = useAuthStore();
  const { currentSubscription, plans, fetchCurrentSubscription, fetchReferralInfo } = useSubscriptionStore();
  const theme = useActiveTheme();
  
  // Fetch subscription data when the screen is focused
  React.useEffect(() => {
    fetchCurrentSubscription();
    fetchReferralInfo();
  }, []);
  
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Log Out", 
          onPress: () => {
            logout();
            router.replace('/auth/login');
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const navigateToSettings = () => {
    router.push('/settings');
  };
  
  const navigateToSubscription = () => {
    router.push('/subscription');
  };
  
  const navigateToBilling = () => {
    router.push('/billing');
  };
  
  const navigateToInvite = () => {
    router.push('/invite');
  };
  
  // Get current plan name
  const currentPlanName = currentSubscription 
    ? plans.find(p => p.id === currentSubscription.planId)?.name || 'Free'
    : 'Free';
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
              {user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color={theme.colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <ThemedText preset="title" style={styles.userName}>{user?.name || "User"}</ThemedText>
              <ThemedText variant="secondary" style={styles.userEmail}>{user?.email || ""}</ThemedText>
              
              <View style={styles.badgeContainer}>
                <SubscriptionBadge />
              </View>
            </View>
            
            <ThemedButton
              title="Edit Profile"
              variant="outline"
              size="small"
              buttonStyle={styles.editButton}
              onPress={() => setEditVisible(true)}
            />
          </View>
          
          {currentSubscription && (
            <ThemedCard style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View>
                  <ThemedText preset="subtitle">Your Plan</ThemedText>
                  <ThemedText style={styles.planName}>{currentPlanName}</ThemedText>
                </View>
                <TouchableOpacity 
                  style={[styles.upgradeButton, { backgroundColor: theme.colors.primary }]}
                  onPress={navigateToSubscription}
                >
                  <ThemedText style={styles.upgradeButtonText}>
                    {currentSubscription.planId === 'free' ? 'Upgrade' : 'Manage'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              <StorageUsageBar />
            </ThemedCard>
          )}
          
          <ReferralCard onInvite={navigateToInvite} />
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">Account</ThemedText>
            
            <ThemedCard style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setEditVisible(true)}>
                <User size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>Personal Information</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToSubscription}
              >
                <CreditCard size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>Subscription</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToBilling}
              >
                <Receipt size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>Billing & Payment</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToSettings}
              >
                <Settings size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>Settings</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
                <Shield size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>Privacy & Security</ThemedText>
              </TouchableOpacity>
            </ThemedCard>
          </View>
          
          <View style={styles.section}>
            <ThemedText preset="subtitle">About</ThemedText>
            
            <ThemedCard style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem}>
                <Heart size={20} color={theme.colors.text} style={styles.menuIcon} />
                <ThemedText style={styles.menuText}>About Heartory</ThemedText>
              </TouchableOpacity>
            </ThemedCard>
          </View>
          
          <View style={styles.logoutSection}>
            <ThemedButton
              title="Log Out"
              variant="secondary"
              onPress={handleLogout}
              leftIcon={<LogOut size={18} color={theme.colors.text} />}
            />
          </View>
        </ScrollView>

        <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  avatarContainer: {
    marginBottom: 16,
    padding: 4,
    borderRadius: 54,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 8,
  },
  badgeContainer: {
    marginTop: 4,
  },
  editButton: {
    marginTop: 16,
  },
  subscriptionCard: {
    margin: 16,
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuCard: {
    marginTop: 12,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
  },
  logoutSection: {
    padding: 24,
  },
});