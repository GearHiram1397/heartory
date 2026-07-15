import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Mail } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface ShareVaultModalProps {
  visible: boolean;
  onClose: () => void;
  vaultId: string;
}

// Invite someone to a vault by email. Backed by the share_vault_by_email RPC,
// which resolves the target user and enforces the plan's sharing limit.
export const ShareVaultModal: React.FC<ShareVaultModalProps> = ({
  visible,
  onClose,
  vaultId,
}) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { shareVault, error, clearError } = useMemoryStore();
  const theme = useActiveTheme();

  const handleClose = () => {
    setEmail('');
    setLocalError('');
    clearError();
    onClose();
  };

  const handleShare = async () => {
    setLocalError('');
    if (!email.trim()) {
      setLocalError('Please enter an email address');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setLocalError('Please enter a valid email');
      return;
    }

    clearError();
    setSubmitting(true);
    try {
      await shareVault(vaultId, email.trim());
      // If the store recorded an error, keep the modal open to show it.
      if (!useMemoryStore.getState().error) {
        handleClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const shownError = localError || error;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <ThemedText preset="title">Share this vault</ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ThemedText variant="secondary" style={styles.subtitle}>
            Invite a family member by their Heartory account email. They'll be able to view
            this vault's memories.
          </ThemedText>

          {shownError ? (
            <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20` }]}>
              <ThemedText style={{ color: theme.colors.error }}>{shownError}</ThemedText>
            </View>
          ) : null}

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: shownError ? theme.colors.error : 'transparent',
              },
            ]}
          >
            <Mail size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="name@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ThemedButton
            title="Send Invitation"
            onPress={handleShare}
            isLoading={submitting}
            buttonStyle={styles.shareButton}
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 20,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  shareButton: {
    marginTop: 4,
  },
});
