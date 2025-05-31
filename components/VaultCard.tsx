import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { MemoryVault } from '@/types';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedCard } from './ThemedCard';
import { ThemedText } from './ThemedText';

interface VaultCardProps {
  vault: MemoryVault;
}

export const VaultCard: React.FC<VaultCardProps> = ({ vault }) => {
  const router = useRouter();
  const theme = useActiveTheme();
  
  const handlePress = () => {
    router.push(`/vault/${vault.id}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <ThemedCard elevation="medium">
      <Pressable onPress={handlePress} style={styles.container}>
        <LinearGradient
          colors={[theme.gradients.primary.start, theme.gradients.primary.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
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
        
        <View style={styles.content}>
          <ThemedText preset="subtitle" style={styles.name}>{vault.name}</ThemedText>
          {vault.description && (
            <ThemedText variant="secondary" style={styles.description} numberOfLines={2}>
              {vault.description}
            </ThemedText>
          )}
          <View style={styles.footer}>
            <ThemedText style={styles.memoryCount}>
              {vault.memories.length} {vault.memories.length === 1 ? 'memory' : 'memories'}
            </ThemedText>
            <ThemedText variant="secondary" style={styles.date}>
              Last updated: {formatDate(vault.updatedAt)}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </ThemedCard>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    height: 140,
    width: '100%',
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
  content: {
    padding: 16,
  },
  name: {
    marginBottom: 4,
  },
  description: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
});