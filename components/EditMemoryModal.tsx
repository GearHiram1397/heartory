import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { Memory } from '@/types';
import { ThemedText } from './ThemedText';
import { ThemedButton } from './ThemedButton';

interface EditMemoryModalProps {
  visible: boolean;
  onClose: () => void;
  vaultId: string;
  memory: Memory;
}

// Edit an existing memory's caption, date, tags — and the text itself for
// text/quote memories. Media content isn't editable (re-add to replace a file).
export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  visible,
  onClose,
  vaultId,
  memory,
}) => {
  const { updateMemory, isLoading, error, clearError } = useMemoryStore();
  const theme = useActiveTheme();
  const isText = memory.type === 'text' || memory.type === 'quote';

  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (visible) {
      setContent(isText ? memory.content : '');
      setCaption(memory.caption ?? '');
      setDate(memory.date ?? '');
      setTags((memory.tags ?? []).join(', '));
      clearError();
    }
  }, [visible, memory, isText, clearError]);

  const handleSave = async () => {
    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await updateMemory(vaultId, memory.id, {
      ...(isText ? { content } : {}),
      caption,
      date,
      tags: tagsArray,
    });
    if (!useMemoryStore.getState().error) onClose();
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <ThemedText preset="title">Edit Memory</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.close}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}20` }]}>
                <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
              </View>
            ) : null}

            {isText && (
              <>
                <ThemedText preset="label">
                  {memory.type === 'quote' ? 'Quote' : 'Text'}
                </ThemedText>
                <TextInput
                  style={[...inputStyle, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </>
            )}

            <ThemedText preset="label">Caption</ThemedText>
            <TextInput
              style={inputStyle}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <ThemedText preset="label">Date</ThemedText>
            <TextInput
              style={inputStyle}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <ThemedText preset="label">Tags (comma separated)</ThemedText>
            <TextInput
              style={inputStyle}
              value={tags}
              onChangeText={setTags}
              placeholder="birthday, family"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <ThemedButton
              title="Save Changes"
              onPress={handleSave}
              isLoading={isLoading}
              buttonStyle={{ marginTop: 16 }}
            />
          </ScrollView>
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
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  close: { padding: 4 },
  errorBox: { borderRadius: 8, padding: 10, marginBottom: 12 },
  input: { borderRadius: 10, padding: 12, fontSize: 16, marginTop: 6, marginBottom: 14 },
  textArea: { minHeight: 110 },
});
