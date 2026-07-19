import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Heart, User, Settings, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemoryStore } from '@/store/memoryStore';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useActiveTheme } from '@/store/themeStore';
import { VaultCard } from '@/components/VaultCard';
import { EmptyState } from '@/components/EmptyState';
import { CreateVaultModal } from '@/components/CreateVaultModal';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { StorageUsageBar } from '@/components/StorageUsageBar';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { useFocusEffect } from 'expo-router';

export default function HomeScreen() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const { vaults, fetchVaults, isLoading, error } = useMemoryStore();
  const { user } = useAuthStore();
  const { currentSubscription, fetchCurrentSubscription } = useSubscriptionStore();
  const theme = useActiveTheme();
  const router = useRouter();
  
  // Fetch vaults when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchVaults();
      fetchCurrentSubscription();
    }, [fetchVaults, fetchCurrentSubscription])
  );
  
  const navigateToProfile = () => {
    router.push('/profile');
  };
  
  const navigateToSettings = () => {
    router.push('/settings');
  };
  
  const navigateToSubscription = () => {
    router.push('/subscription');
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[theme.gradients.secondary.start, theme.gradients.secondary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Heart size={24} color="#fff" />
            </View>
            <View style={styles.headerButtons}>
              <Pressable
                style={styles.headerButton}
                onPress={() => router.push('/search')}
              >
                <Search size={20} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.headerButton}
                onPress={navigateToSettings}
              >
                <Settings size={20} color="#fff" />
              </Pressable>
              <Pressable 
                style={styles.headerButton}
                onPress={navigateToProfile}
              >
                <User size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
          <ThemedText style={styles.greeting}>Hello, {user?.name || "Friend"}</ThemedText>
          <View style={styles.appNameContainer}>
            <ThemedText style={styles.appName}>Heartory</ThemedText>
            <SubscriptionBadge size="small" />
          </View>
          <ThemedText style={styles.tagline}>Preserve what matters most</ThemedText>
          
          {currentSubscription && (
            <View style={styles.storageContainer}>
              <StorageUsageBar compact />
              <Pressable 
                style={styles.upgradeButton}
                onPress={navigateToSubscription}
              >
                <ThemedText style={styles.upgradeText}>
                  {currentSubscription.planId === 'free' ? 'Upgrade' : 'Manage'}
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
  
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading your memories...</ThemedText>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchVaults()}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      );
    }
    
    return (
      <EmptyState
        title="Create Your First Memory Vault"
        description="Start preserving your precious memories in a safe, private space. Each vault can hold photos, videos, quotes, and more."
        actionLabel="Create a Vault"
        onAction={() => setCreateModalVisible(true)}
        icon={<Heart size={40} color={theme.colors.primary} />}
      />
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      
      {isLoading && vaults.length === 0 ? (
        <ThemedView style={styles.container}>
          {renderHeader()}
          {renderEmptyState()}
        </ThemedView>
      ) : error && vaults.length === 0 ? (
        <ThemedView style={styles.container}>
          {renderHeader()}
          {renderEmptyState()}
        </ThemedView>
      ) : vaults.length === 0 ? (
        <ThemedView style={styles.container}>
          {renderHeader()}
          {renderEmptyState()}
        </ThemedView>
      ) : (
        <FlatList
          data={vaults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VaultCard vault={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader()}
          refreshing={isLoading}
          onRefresh={fetchVaults}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}
      
      {vaults.length > 0 && (
        <Pressable 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]} 
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={24} color="#fff" />
        </Pressable>
      )}
      
      <CreateVaultModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  storageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  upgradeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});