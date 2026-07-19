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
import { X, Image as ImageIcon, FileText, Mic, Quote, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useMemoryStore } from '@/store/memoryStore';
import { Memory } from '@/types';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';
import { uploadService } from '@/services/uploadService';
import { AudioRecorder } from './AudioRecorder';

interface CreateMemoryModalProps {
  visible: boolean;
  onClose: () => void;
  vaultId: string;
}

type MemoryType = Memory['type'];

export const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({ 
  visible, 
  onClose,
  vaultId
}) => {
  const [type, setType] = useState<MemoryType>('photo');
  const [content, setContent] = useState('');
  const [mediaBytes, setMediaBytes] = useState(0);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState('');
  const [contentError, setContentError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { addMemory, isLoading, error, clearError } = useMemoryStore();
  const theme = useActiveTheme();
  
  const handlePickMedia = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    
    let result;
    
    if (type === 'photo') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else if (type === 'video') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
    }
    
    if (!result?.canceled && result?.assets && result.assets.length > 0) {
      try {
        setIsUploading(true);
        setContentError('');
        
        // Upload the media to the private vault bucket. The returned storage
        // path becomes the memory content; the byte size feeds quota checks.
        let uploaded;

        if (type === 'photo') {
          uploaded = await uploadService.uploadImage(
            vaultId,
            result.assets[0].uri,
            (progress) => {
              setUploadProgress(progress.progress);
            }
          );
        } else if (type === 'video') {
          uploaded = await uploadService.uploadVideo(
            vaultId,
            result.assets[0].uri,
            (progress) => {
              setUploadProgress(progress.progress);
            }
          );
        }

        setContent(uploaded?.path || '');
        setMediaBytes(uploaded?.bytes || 0);
      } catch (error) {
        console.error('Media upload error:', error);
        setContentError('Failed to upload media. Please try again.');
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
    
    if (!content && (type === 'photo' || type === 'video')) {
      setContentError("Please select a file");
      return;
    }

    if (!content && type === 'audio') {
      setContentError("Please record an audio clip");
      return;
    }
    
    if (!content && (type === 'text' || type === 'quote')) {
      setContentError("Please enter some content");
      return;
    }
    
    clearError();
    
    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    try {
      await addMemory(
        vaultId,
        {
          type,
          content,
          caption,
          date,
          tags: tagsArray,
        },
        mediaBytes
      );

      // Reset form and close modal
      handleCancel();
    } catch (err) {
      // Error is handled in the store
    }
  };
  
  const handleCancel = () => {
    // Reset form and close modal
    setType('photo');
    setContent('');
    setMediaBytes(0);
    setCaption('');
    setDate(new Date().toISOString().split('T')[0]);
    setTags('');
    setContentError('');
    clearError();
    onClose();
  };
  
  const renderContentInput = () => {
    switch (type) {
      case 'photo':
      case 'video':
        return (
          <View>
            <Pressable 
              style={[
                styles.mediaPickerButton, 
                { backgroundColor: theme.colors.backgroundSecondary },
                contentError ? { borderColor: theme.colors.error, borderWidth: 1 } : null
              ]} 
              onPress={handlePickMedia}
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
                  {content ? "Change Media" : `Select ${type === 'photo' ? 'Photo' : 'Video'}`}
                </ThemedText>
              )}
            </Pressable>
            {contentError ? (
              <ThemedText style={{ color: theme.colors.error, marginTop: -12, marginBottom: 16 }}>
                {contentError}
              </ThemedText>
            ) : null}
          </View>
        );
      case 'text':
      case 'quote':
        return (
          <View>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                  borderColor: contentError ? theme.colors.error : 'transparent',
                },
                contentError ? styles.inputError : null
              ]}
              value={content}
              onChangeText={(text) => {
                setContent(text);
                if (text.trim()) setContentError('');
              }}
              placeholder={
                type === 'text' 
                  ? "Write your memory here..." 
                  : "Enter a memorable quote..."
              }
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {contentError ? (
              <ThemedText style={{ color: theme.colors.error, marginTop: -12, marginBottom: 16 }}>
                {contentError}
              </ThemedText>
            ) : null}
          </View>
        );
      case 'audio':
        return (
          <View>
            <AudioRecorder
              vaultId={vaultId}
              onUploaded={(path, bytes) => {
                setContent(path);
                setMediaBytes(bytes);
                setContentError('');
              }}
              onBusyChange={setIsUploading}
            />
            {contentError ? (
              <ThemedText style={{ color: theme.colors.error, marginTop: -8, marginBottom: 16 }}>
                {contentError}
              </ThemedText>
            ) : null}
          </View>
        );
      default:
        return null;
    }
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
            <ThemedText preset="title">Add a Memory</ThemedText>
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
            
            <ThemedText preset="label">Memory Type</ThemedText>
            <View style={styles.typeSelector}>
              <Pressable 
                style={[
                  styles.typeOption, 
                  { backgroundColor: theme.colors.backgroundSecondary },
                  type === 'photo' && { backgroundColor: theme.colors.primary }
                ]} 
                onPress={() => setType('photo')}
              >
                <ImageIcon 
                  size={24} 
                  color={type === 'photo' ? '#fff' : theme.colors.text} 
                />
                <ThemedText 
                  style={[
                    styles.typeText, 
                    { color: type === 'photo' ? '#fff' : theme.colors.text }
                  ]}
                >
                  Photo
                </ThemedText>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.typeOption, 
                  { backgroundColor: theme.colors.backgroundSecondary },
                  type === 'video' && { backgroundColor: theme.colors.primary }
                ]} 
                onPress={() => setType('video')}
              >
                <Video 
                  size={24} 
                  color={type === 'video' ? '#fff' : theme.colors.text} 
                />
                <ThemedText 
                  style={[
                    styles.typeText, 
                    { color: type === 'video' ? '#fff' : theme.colors.text }
                  ]}
                >
                  Video
                </ThemedText>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.typeOption, 
                  { backgroundColor: theme.colors.backgroundSecondary },
                  type === 'text' && { backgroundColor: theme.colors.primary }
                ]} 
                onPress={() => setType('text')}
              >
                <FileText 
                  size={24} 
                  color={type === 'text' ? '#fff' : theme.colors.text} 
                />
                <ThemedText 
                  style={[
                    styles.typeText, 
                    { color: type === 'text' ? '#fff' : theme.colors.text }
                  ]}
                >
                  Text
                </ThemedText>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.typeOption, 
                  { backgroundColor: theme.colors.backgroundSecondary },
                  type === 'quote' && { backgroundColor: theme.colors.primary }
                ]} 
                onPress={() => setType('quote')}
              >
                <Quote 
                  size={24} 
                  color={type === 'quote' ? '#fff' : theme.colors.text} 
                />
                <ThemedText 
                  style={[
                    styles.typeText, 
                    { color: type === 'quote' ? '#fff' : theme.colors.text }
                  ]}
                >
                  Quote
                </ThemedText>
              </Pressable>
            </View>
            
            <ThemedText preset="label">Content</ThemedText>
            {renderContentInput()}
            
            <ThemedText preset="label">Caption (optional)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                }
              ]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption to this memory"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <ThemedText preset="label">Date</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                }
              ]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <ThemedText preset="label">Tags (optional, comma separated)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.backgroundSecondary,
                  color: theme.colors.text,
                }
              ]}
              value={tags}
              onChangeText={setTags}
              placeholder="birthday, family, vacation"
              placeholderTextColor={theme.colors.textSecondary}
            />
            
            <View style={styles.buttonContainer}>
              <ThemedButton
                title="Cancel"
                variant="secondary"
                onPress={handleCancel}
                buttonStyle={styles.cancelButton}
                disabled={isLoading || isUploading}
              />
              <ThemedButton
                title="Save Memory"
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
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeText: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
  },
  mediaPickerButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    height: 120,
    justifyContent: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlaceholder: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    height: 120,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
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