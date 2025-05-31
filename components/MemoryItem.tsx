import React from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ImageIcon, FileText, Mic, Quote } from 'lucide-react-native';
import { Memory } from '@/types';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedCard } from './ThemedCard';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface MemoryItemProps {
  memory: Memory;
  vaultId: string;
}

export const MemoryItem: React.FC<MemoryItemProps> = ({ memory, vaultId }) => {
  const router = useRouter();
  const theme = useActiveTheme();
  
  const handlePress = () => {
    router.push(`/memory/${vaultId}/${memory.id}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const renderMemoryContent = () => {
    switch (memory.type) {
      case 'photo':
        return (
          <Image 
            source={{ uri: memory.content }} 
            style={styles.mediaContent} 
            resizeMode="cover"
          />
        );
      case 'video':
        return (
          <ThemedView variant="secondary" style={styles.mediaPlaceholder}>
            <ImageIcon size={24} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" style={styles.placeholderText}>Video</ThemedText>
          </ThemedView>
        );
      case 'audio':
        return (
          <ThemedView variant="secondary" style={styles.mediaPlaceholder}>
            <Mic size={24} color={theme.colors.textSecondary} />
            <ThemedText variant="secondary" style={styles.placeholderText}>Audio Recording</ThemedText>
          </ThemedView>
        );
      case 'text':
        return (
          <View style={styles.textContent}>
            <FileText size={16} color={theme.colors.textSecondary} style={styles.textIcon} />
            <ThemedText style={styles.textPreview} numberOfLines={3}>
              {memory.content}
            </ThemedText>
          </View>
        );
      case 'quote':
        return (
          <ThemedView variant="secondary" style={styles.quoteContent}>
            <Quote size={16} color={theme.colors.primary} style={styles.quoteIcon} />
            <ThemedText style={styles.quoteText} numberOfLines={3}>
              "{memory.content}"
            </ThemedText>
          </ThemedView>
        );
      default:
        return null;
    }
  };
  
  return (
    <ThemedCard elevation="small">
      <Pressable onPress={handlePress}>
        {renderMemoryContent()}
        
        <View style={styles.footer}>
          {memory.caption && (
            <ThemedText style={styles.caption} numberOfLines={1}>
              {memory.caption}
            </ThemedText>
          )}
          <ThemedText variant="secondary" style={styles.date}>
            {formatDate(memory.date)}
          </ThemedText>
          
          {memory.tags && memory.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {memory.tags.map((tag) => (
                <ThemedView 
                  key={tag} 
                  variant="secondary" 
                  style={styles.tag}
                >
                  <ThemedText variant="secondary" style={styles.tagText}>
                    {tag}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  mediaContent: {
    height: 200,
    width: '100%',
  },
  mediaPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
  },
  textContent: {
    padding: 16,
    flexDirection: 'row',
  },
  textIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  textPreview: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  quoteContent: {
    padding: 16,
  },
  quoteIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    paddingLeft: 24,
    lineHeight: 24,
  },
  footer: {
    padding: 12,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
  },
});