import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search as SearchIcon, FolderHeart, Image as ImageIcon, FileText, Quote, Mic, Video } from 'lucide-react-native';
import { useMemoryStore } from '@/store/memoryStore';
import { useActiveTheme } from '@/store/themeStore';
import { Memory } from '@/types';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

type VaultResult = { kind: 'vault'; id: string; name: string };
type MemoryResult = {
  kind: 'memory';
  vaultId: string;
  vaultName: string;
  memory: Memory;
};
type Result = VaultResult | MemoryResult;

const typeIcon = (type: Memory['type'], color: string) => {
  const size = 18;
  switch (type) {
    case 'photo':
      return <ImageIcon size={size} color={color} />;
    case 'video':
      return <Video size={size} color={color} />;
    case 'audio':
      return <Mic size={size} color={color} />;
    case 'quote':
      return <Quote size={size} color={color} />;
    default:
      return <FileText size={size} color={color} />;
  }
};

export default function SearchScreen() {
  const theme = useActiveTheme();
  const router = useRouter();
  const vaults = useMemoryStore((s) => s.vaults);
  const [query, setQuery] = useState('');

  const results: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];

    for (const v of vaults) {
      if (v.name.toLowerCase().includes(q) || (v.description ?? '').toLowerCase().includes(q)) {
        out.push({ kind: 'vault', id: v.id, name: v.name });
      }
      for (const m of v.memories) {
        const haystack = [
          m.caption ?? '',
          m.tags?.join(' ') ?? '',
          m.type === 'text' || m.type === 'quote' ? m.content : '',
        ]
          .join(' ')
          .toLowerCase();
        if (haystack.includes(q)) {
          out.push({ kind: 'memory', vaultId: v.id, vaultName: v.name, memory: m });
        }
      }
    }
    return out;
  }, [query, vaults]);

  const renderItem = ({ item }: { item: Result }) => {
    if (item.kind === 'vault') {
      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.colors.border ?? '#0001' }]}
          onPress={() => router.push(`/vault/${item.id}`)}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}18` }]}>
            <FolderHeart size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.rowText}>
            <ThemedText style={styles.title}>{item.name}</ThemedText>
            <ThemedText variant="secondary" style={styles.sub}>Vault</ThemedText>
          </View>
        </TouchableOpacity>
      );
    }
    const m = item.memory;
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: theme.colors.border ?? '#0001' }]}
        onPress={() => router.push(`/memory/${item.vaultId}/${m.id}`)}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.backgroundSecondary }]}>
          {typeIcon(m.type, theme.colors.textSecondary)}
        </View>
        <View style={styles.rowText}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {m.caption || (m.type === 'text' || m.type === 'quote' ? m.content : m.type)}
          </ThemedText>
          <ThemedText variant="secondary" style={styles.sub} numberOfLines={1}>
            in {item.vaultName}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Search' }} />
        <View style={styles.searchBarWrap}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <SearchIcon size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Search memories, tags, vaults…"
              placeholderTextColor={theme.colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCorrect={false}
            />
          </View>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, i) => (item.kind === 'vault' ? `v-${item.id}` : `m-${item.memory.id}`) + i}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <ThemedText variant="secondary" style={styles.empty}>
              {query.trim()
                ? 'No memories match your search.'
                : 'Search across all your vaults — by caption, tag, quote, or vault name.'}
            </ThemedText>
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBarWrap: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: { flex: 1, fontSize: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  title: { fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 32, lineHeight: 22 },
});
