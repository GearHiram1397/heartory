import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Pressable, 
  Image,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Share2, Heart, Users, Crown, Pencil } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useAuthStore } from '@/store/authStore';
import { useActiveTheme } from '@/store/themeStore';
import { MemoryItem } from '@/components/MemoryItem';
import { EmptyState } from '@/components/EmptyState';
import { CreateMemoryModal } from '@/components/CreateMemoryModal';
import { CreateVaultModal } from '@/components/CreateVaultModal';
import { ShareVaultModal } from '@/components/ShareVaultModal';
import { SharedUsersModal } from '@/components/SharedUsersModal';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';
import { memoryService } from '@/services/memoryService';
import { SharedUser } from '@/types';

export default function VaultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [sharedUsersModalVisible, setSharedUsersModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [loadingSharedUsers, setLoadingSharedUsers] = useState(false);
  const router = useRouter();
  const theme = useActiveTheme();
  
  const { vaults, fetchVault, isLoading, error } = useMemoryStore();
  const vault = vaults.find((v) => v.id === id);
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!vault && !!currentUser && vault.ownerId === currentUser.id;
  
  useEffect(() => {
    if (id) {
      fetchVault(id);
      fetchSharedUsers();
    }
  }, [id, fetchVault]);
  
  useEffect(() => {
    if (!vault && !isLoading) {
      router.replace('/');
    }
  }, [vault, router, isLoading]);
  
  const fetchSharedUsers = async () => {
    if (!id) return;
    
    try {
      setLoadingSharedUsers(true);
      const users = await memoryService.getSharedUsers(id);
      setSharedUsers(users);
    } catch (error) {
      console.error('Failed to fetch shared users:', error);
    } finally {
      setLoadingSharedUsers(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVault(id);
    await fetchSharedUsers();
    setRefreshing(false);
  };
  
  const handleShare = () => {
    setShareModalVisible(true);
  };
  
  const handleViewSharedUsers = () => {
    setSharedUsersModalVisible(true);
  };
  
  if (isLoading && !vault) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>Loading vault...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error && !vault) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchVault(id)}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!vault) {
    return null;
  }
  
  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[theme.gradients.primary.start, theme.gradients.primary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {vault.coverImage ? (
          <Image 
            source={{ uri: vault.coverImage }} 
            style={styles.coverImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderCover}>
            <Heart size={40} color="#fff" />
          </View>
        )}
      </LinearGradient>
      
      <ThemedCard style={styles.vaultInfo} elevation="small">
        <ThemedText preset="title" style={styles.vaultName}>{vault.name}</ThemedText>
        {vault.description && (
          <ThemedText variant="secondary" style={styles.vaultDescription}>
            {vault.description}
          </ThemedText>
        )}
        <View style={styles.vaultStats}>
          <ThemedText style={styles.memoryCount}>
            {vault.memories.length} {vault.memories.length === 1 ? 'memory' : 'memories'}
          </ThemedText>
          
          {sharedUsers.length > 0 && (
            <Pressable onPress={handleViewSharedUsers} style={styles.sharedWithButton}>
              <Users size={16} color={theme.colors.textSecondary} style={styles.sharedIcon} />
              <ThemedText variant="secondary">
                Shared with {sharedUsers.length}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </ThemedCard>
    </View>
  );
  
  const renderEmptyState = () => (
    <EmptyState
      title="Add Your First Memory"
      description="Start preserving special moments, photos, quotes, or stories in this vault."
      actionLabel="Add a Memory"
      onAction={() => setCreateModalVisible(true)}
    />
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: vault.name,
            headerRight: () => (
              <View style={styles.headerButtons}>
                {isOwner && (
                  <Pressable
                    style={styles.headerButton}
                    onPress={() => setEditModalVisible(true)}
                  >
                    <Pencil size={20} color={theme.colors.text} />
                  </Pressable>
                )}
                {isOwner && (
                  <Pressable
                    style={styles.headerButton}
                    onPress={() => router.push(`/beneficiaries/${vault.id}`)}
                  >
                    <Crown size={20} color={theme.colors.text} />
                  </Pressable>
                )}
                <Pressable
                  style={styles.headerButton}
                  onPress={handleShare}
                >
                  <Share2 size={20} color={theme.colors.text} />
                </Pressable>
              </View>
            ),
          }} 
        />
        
        {vault.memories.length === 0 ? (
          <>
            {renderHeader()}
            {renderEmptyState()}
          </>
        ) : (
          <FlatList
            data={vault.memories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MemoryItem memory={item} vaultId={vault.id} />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
        )}
        
        <Pressable 
          style={[styles.fab, { backgroundColor: theme.colors.primary }]} 
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={24} color="#fff" />
        </Pressable>
        
        <CreateMemoryModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          vaultId={vault.id}
        />
        
        <ShareVaultModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            fetchSharedUsers(); // Refresh shared users after modal closes
          }}
          vaultId={vault.id}
        />

        <CreateVaultModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          vault={vault}
        />

        <SharedUsersModal
          visible={sharedUsersModalVisible}
          onClose={() => {
            setSharedUsersModalVisible(false);
            fetchSharedUsers();
          }}
          vaultId={vault.id}
        />
      </ThemedView>
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
    height: 200,
  },
  coverImage: {
    height: '100%',
    width: '100%',
    opacity: 0.85,
  },
  placeholderCover: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultInfo: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  vaultName: {
    marginBottom: 8,
  },
  vaultDescription: {
    marginBottom: 12,
    lineHeight: 22,
  },
  vaultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  sharedWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedIcon: {
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
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