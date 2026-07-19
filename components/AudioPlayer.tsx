import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedText } from './ThemedText';

interface AudioPlayerProps {
  uri: string;
}

const fmt = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Minimal audio memory player: play/pause, progress, elapsed/total time.
export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri }) => {
  const theme = useActiveTheme();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const onStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 0);
    setPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setPlaying(false);
      soundRef.current?.setPositionAsync(0);
    }
  };

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        setLoading(true);
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onStatus
        );
        soundRef.current = sound;
        setLoading(false);
        return;
      }
      if (playing) await soundRef.current.pauseAsync();
      else await soundRef.current.playAsync();
    } catch {
      setLoading(false);
    }
  };

  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={toggle}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : playing ? (
          <Pause size={22} color="#fff" />
        ) : (
          <Play size={22} color="#fff" />
        )}
      </TouchableOpacity>
      <View style={styles.right}>
        <View style={[styles.track, { backgroundColor: theme.colors.border ?? '#0002' }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
        </View>
        <View style={styles.times}>
          <ThemedText variant="secondary" style={styles.time}>{fmt(position)}</ThemedText>
          <ThemedText variant="secondary" style={styles.time}>{fmt(duration)}</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  right: { flex: 1 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
