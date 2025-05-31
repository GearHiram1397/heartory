import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  Pressable, 
  Modal, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';
import { uploadService } from '@/services/uploadService';

interface CreateVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateVaultModal: React.FC<CreateVaultModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [nameError, setNameError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { addVault, isLoading, error, clearError } = useMemoryStore();
  const theme = useActiveTheme();
  
  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setIsUploading(true);
        
        // Upload the image to the server
        const imageUrl = await uploadService.uploadImage(
          result.assets[0].uri,
          (progress) => {
            setUploadProgress(progress.progress);
          }
        );
        
        setCoverImage(imageUrl);
      } catch (error) {
        console.error('Image upload error:', error);
        // Show error to user
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };
  
  const handleCreate = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (!name.trim()) {
      setNameError("Please enter a name for this memory vault");
      return;
    }
    
    clearError();
    
    try {
      await addVault({
        name: name.trim(),
        description: description.trim(),
        coverImage,
      });
      
      // Reset form and close modal
      handleCancel();
    } catch (err) {
      // Error is handled in the store
    }
  };
  
  const handleCancel = () => {
    // Reset form and close modal
    setName('');
    setDescription('');
    setCoverImage(undefined);
    setNameError('');
    clearError();
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <ThemedText preset="title">Create a Memory Vault</ThemedText>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.form}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}20` }]}>
                <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
              </View>
            )}
            
            <ThemedText preset="label">Name</ThemedText>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: nameError ? theme.colors.error : 'transparent',
                },
                nameError ? styles.inputError : null
              ]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (text.trim()) setNameError('');
              }}
              placeholder="Enter a name for this memory collection"
              placeholderTextColor={theme.colors.textSecondary}
            />
            {nameError ? (
              <ThemedText style={{ color: theme.colors.error, marginTop: -12, marginBottom: 16 }}>
                {nameError}
              </ThemedText>
            ) : null}
            
            <ThemedText preset="label">Description (optional)</ThemedText>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description to help you remember what this collection means to you"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <ThemedText preset="label">Cover Image (optional)</ThemedText>
            <Pressable 
              style={[
                styles.imagePickerButton,
                { backgroundColor: theme.colors.backgroundSecondary }
              ]} 
              onPress={handlePickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <ThemedText style={{ marginTop: 8 }}>
                    Uploading... {Math.round(uploadProgress * 100)}%
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={{ color: theme.colors.primary, fontWeight: '500' }}>
                  {coverImage ? "Change Cover Image" : "Select Cover Image"}
                </ThemedText>
              )}
            </Pressable>
            
            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                buttonStyle={styles.cancelButton}
                disabled={isLoading || isUploading}
              />
              <ThemedButton
                title="Create Vault"
                onPress={handleCreate}
                buttonStyle={styles.createButton}
                isLoading={isLoading}
                disabled={isUploading}
              />
            </View>
          </ScrollView>
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
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  inputError: {
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
  },
  imagePickerButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    height: 100,
    justifyContent: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    flex: 1,
    marginLeft: 8,
  },
});