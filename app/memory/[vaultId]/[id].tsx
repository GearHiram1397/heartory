import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Pressable,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ResizeMode, Video } from 'expo-av';
import { Trash2, Edit, Share2 } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { AudioPlayer } from '@/components/AudioPlayer';
import { EditMemoryModal } from '@/components/EditMemoryModal';

export default function MemoryDetailScreen() {
  const { vaultId, id } = useLocalSearchParams<{ vaultId: string; id: string }>();
  const router = useRouter();
  const theme = useActiveTheme();
  const [editVisible, setEditVisible] = useState(false);

  const { vaults, deleteMemory } = useMemoryStore();
  const vault = vaults.find((v) => v.id === vaultId);
  const memory = vault?.memories.find((m) => m.id === id);

  if (!vault || !memory) {
    router.back();
    return null;
  }

  const handleDelete = () => {
    Alert.alert('Delete Memory', 'Delete this memory? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMemory(vaultId, id);
          router.back();
        },
      },
    ]);
  };

  const handleShare = async () => {
    const isText = memory.type === 'text' || memory.type === 'quote';
    try {
      await Share.share({
        message: isText
          ? `${memory.content}${memory.caption ? `\n\n— ${memory.caption}` : ''}`
          : memory.caption || 'A memory from Heartory',
        url: isText ? undefined : memory.content,
      });
    } catch {
      /* user dismissed */
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const renderMemoryContent = () => {
    switch (memory.type) {
      case 'photo':
        return (
          <View style={styles.photoContainer}>
            <Image 
              source={{ uri: memory.content }} 
              style={styles.photo} 
              resizeMode="contain"
            />
          </View>
        );
      case 'video':
        return (
          <Video
            source={{ uri: memory.content }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        );
      case 'audio':
        return <AudioPlayer uri={memory.content} />;
      case 'text':
        return (
          <View style={styles.textContainer}>
            <ThemedText style={styles.textContent}>{memory.content}</ThemedText>
          </View>
        );
      case 'quote':
        return (
          <View style={styles.quoteContainer}>
            <LinearGradient
              colors={[theme.gradients.secondary.start, theme.gradients.secondary.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quoteGradient}
            >
              <ThemedText style={styles.quoteContent}>"{memory.content}"</ThemedText>
            </LinearGradient>
          </View>
        );
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen 
          options={{
            title: memory.caption || 'Memory',
            headerRight: () => (
              <View style={styles.headerButtons}>
                <Pressable style={styles.headerButton} onPress={handleShare}>
                  <Share2 size={20} color={theme.colors.text} />
                </Pressable>
                <Pressable style={styles.headerButton} onPress={() => setEditVisible(true)}>
                  <Edit size={20} color={theme.colors.text} />
                </Pressable>
                <Pressable style={styles.headerButton} onPress={handleDelete}>
                  <Trash2 size={20} color={theme.colors.error} />
                </Pressable>
              </View>
            ),
          }} 
        />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderMemoryContent()}
          
          <View style={styles.detailsContainer}>
            {memory.caption && (
              <ThemedText preset="subtitle" style={styles.caption}>
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
            
            <View style={[styles.vaultInfo, { borderTopColor: theme.colors.border }]}>
              <ThemedText variant="secondary" style={styles.vaultLabel}>
                From vault:
              </ThemedText>
              <ThemedText style={styles.vaultName}>
                {vault.name}
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        <EditMemoryModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          vaultId={vaultId}
          memory={memory}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  textContainer: {
    padding: 16,
  },
  textContent: {
    fontSize: 18,
    lineHeight: 28,
  },
  quoteContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quoteGradient: {
    padding: 24,
  },
  quoteContent: {
    fontSize: 22,
    lineHeight: 32,
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  caption: {
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
  },
  vaultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  vaultLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  vaultName: {
    fontSize: 14,
    fontWeight: '500',
  },
});