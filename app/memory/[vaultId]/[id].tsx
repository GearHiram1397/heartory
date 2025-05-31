import React from 'react';
import { 
  StyleSheet, 
  View, 
  Image, 
  ScrollView, 
  Pressable,
  Platform,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, Edit, Share2 } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function MemoryDetailScreen() {
  const { vaultId, id } = useLocalSearchParams<{ vaultId: string; id: string }>();
  const router = useRouter();
  const theme = useActiveTheme();
  
  const { vaults, deleteMemory } = useMemoryStore();
  const vault = vaults.find((v) => v.id === vaultId);
  const memory = vault?.memories.find((m) => m.id === id);
  
  if (!vault || !memory) {
    router.back();
    return null;
  }
  
  const handleDelete = () => {
    deleteMemory(vaultId, id);
    router.back();
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
        // In a real app, we would render a video player here
        return (
          <View style={[styles.videoPlaceholder, { backgroundColor: theme.isDark ? '#000' : '#222' }]}>
            <ThemedText style={styles.placeholderText}>Video Player</ThemedText>
          </View>
        );
      case 'audio':
        // In a real app, we would render an audio player here
        return (
          <ThemedView variant="secondary" style={styles.audioPlaceholder}>
            <ThemedText style={styles.placeholderText}>Audio Player</ThemedText>
          </ThemedView>
        );
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
                <Pressable style={styles.headerButton}>
                  <Share2 size={20} color={theme.colors.text} />
                </Pressable>
                <Pressable style={styles.headerButton}>
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
  videoPlaceholder: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#fff',
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