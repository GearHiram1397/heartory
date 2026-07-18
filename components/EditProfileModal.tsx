import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { X, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useActiveTheme } from '@/store/themeStore';
import { uploadService } from '@/services/uploadService';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

// Edit the signed-in user's name and avatar. Avatar is uploaded to the public
// avatars bucket; the profile row is updated via the auth store.
export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const theme = useActiveTheme();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? '');
      setAvatar(user.avatar);
      setError('');
    }
  }, [visible, user]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    setUploading(true);
    try {
      setAvatar(await uploadService.uploadCoverImage(result.assets[0].uri));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    await updateProfile({ name: name.trim(), avatar });
    if (!useAuthStore.getState().error) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <ThemedText preset="title">Edit Profile</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.close}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploading}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.backgroundSecondary }]}>
              {uploading ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <User size={36} color={theme.colors.textSecondary} />
              )}
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary }]}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}20` }]}>
              <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
            </View>
          ) : null}

          <ThemedText preset="label" style={{ marginBottom: 6 }}>Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textSecondary}
          />

          <ThemedText variant="secondary" style={styles.emailNote}>
            {user?.email}
          </ThemedText>

          <ThemedButton
            title="Save"
            onPress={save}
            isLoading={isLoading}
            disabled={uploading}
            buttonStyle={{ marginTop: 8 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  close: { padding: 4 },
  avatarWrap: { alignSelf: 'center', marginBottom: 20 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  cameraBadge: {
    position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  errorBox: { borderRadius: 8, padding: 10, marginBottom: 14 },
  input: { borderRadius: 10, padding: 12, fontSize: 16 },
  emailNote: { marginTop: 10, marginBottom: 8, fontSize: 13 },
});
