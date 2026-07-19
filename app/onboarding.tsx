import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, FolderHeart, ShieldCheck, Infinity as InfinityIcon } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';

interface Slide {
  key: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: <Heart size={56} color="#fff" />,
    title: 'Keep them close',
    body: 'Heartory is a private, caring place to hold the memories of the people you love — their photos, their voice, their words.',
  },
  {
    key: 'vaults',
    icon: <FolderHeart size={56} color="#fff" />,
    title: 'A vault for each person',
    body: 'Gather photos, videos, audio, quotes, and notes into beautiful memory vaults — one for everyone who matters.',
  },
  {
    key: 'secure',
    icon: <ShieldCheck size={56} color="#fff" />,
    title: 'Private and secure',
    body: 'Your memories are encrypted and yours alone. Share a vault only with the family you choose — and no one else.',
  },
  {
    key: 'forever',
    icon: <InfinityIcon size={56} color="#fff" />,
    title: 'Kept forever',
    body: 'Name who inherits each vault, so these memories outlive us and are passed gently to those who come after.',
  },
];

export default function OnboardingScreen() {
  const theme = useActiveTheme();
  const router = useRouter();
  const complete = useOnboardingStore((s) => s.complete);
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    complete();
    router.replace('/auth/register');
  };

  const next = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={[theme.gradients.secondary.start, theme.gradients.secondary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        {item.icon}
      </LinearGradient>
      <ThemedText preset="title" style={styles.title}>{item.title}</ThemedText>
      <ThemedText variant="secondary" style={styles.body}>{item.body}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={finish}>
          <ThemedText variant="secondary">Skip</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width))
        }
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? theme.colors.primary : theme.colors.border ?? '#0002',
                width: i === index ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <ThemedButton title={isLast ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 56 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  title: { textAlign: 'center', marginBottom: 14 },
  body: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 48 },
});
