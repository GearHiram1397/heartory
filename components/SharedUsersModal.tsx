import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, UserMinus } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { memoryService } from '@/services/memoryService';
import { SharedUser } from '@/types';
import { ThemedText } from './ThemedText';

interface SharedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  vaultId: string;
}

// Lists the people a vault is shared with and lets the owner revoke access.
export const SharedUsersModal: React.FC<SharedUsersModalProps> = ({
  visible,
  onClose,
  vaultId,
}) => {
  const [users, setUsers] = useState<SharedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { unshareVault } = useMemoryStore();
  const theme = useActiveTheme();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await memoryService.getSharedUsers(vaultId));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const handleRemove = async (userId: string) => {
    await unshareVault(vaultId, userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <ThemedText preset="title">Shared with</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
          ) : users.length === 0 ? (
            <ThemedText variant="secondary" style={styles.empty}>
              This vault hasn't been shared with anyone yet.
            </ThemedText>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.userInfo}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarPlaceholder,
                          { backgroundColor: theme.colors.backgroundSecondary },
                        ]}
                      >
                        <ThemedText>{item.name?.charAt(0)?.toUpperCase() || '?'}</ThemedText>
                      </View>
                    )}
                    <View style={styles.userText}>
                      <ThemedText style={styles.userName}>{item.name}</ThemedText>
                      <ThemedText variant="secondary" style={styles.userEmail}>
                        {item.email}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.id)}
                    style={styles.removeButton}
                  >
                    <UserMinus size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    textAlign: 'center',
    marginVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userText: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
  },
  removeButton: {
    padding: 8,
  },
});
