import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, RotateCcw, Check } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { uploadService } from '@/services/uploadService';
import { ThemedText } from './ThemedText';

interface AudioRecorderProps {
  vaultId: string;
  // Called with the uploaded storage path + byte size once a recording is saved.
  onUploaded: (path: string, bytes: number) => void;
  onBusyChange?: (busy: boolean) => void;
}

const fmt = (ms: number) => {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
};

// Record an audio memory, then upload it to the vault. Web can't record here,
// so it shows a graceful notice.
export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  vaultId,
  onUploaded,
  onBusyChange,
}) => {
  const theme = useActiveTheme();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [state, setState] = useState<'idle' | 'recording' | 'uploading' | 'done' | 'error'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    onBusyChange?.(state === 'recording' || state === 'uploading');
  }, [state, onBusyChange]);

  const start = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setState('error');
        setMessage('Microphone permission is needed to record.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recording.setOnRecordingStatusUpdate((s) => {
        if (s.isRecording) setElapsed(s.durationMillis ?? 0);
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setState('recording');
    } catch {
      setState('error');
      setMessage('Could not start recording.');
    }
  };

  const stopAndUpload = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    setState('uploading');
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error('No recording');
      const { path, bytes } = await uploadService.uploadAudio(vaultId, uri);
      onUploaded(path, bytes);
      setState('done');
    } catch {
      setState('error');
      setMessage('Could not save the recording. Please try again.');
    }
  };

  const reset = () => {
    setElapsed(0);
    setState('idle');
    setMessage('');
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.box, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <ThemedText variant="secondary">Audio recording is available in the mobile app.</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: theme.colors.backgroundSecondary }]}>
      {state === 'idle' && (
        <TouchableOpacity style={[styles.recordBtn, { backgroundColor: theme.colors.primary }]} onPress={start}>
          <Mic size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {state === 'recording' && (
        <>
          <ThemedText style={styles.timer}>{fmt(elapsed)}</ThemedText>
          <TouchableOpacity style={[styles.recordBtn, { backgroundColor: theme.colors.error }]} onPress={stopAndUpload}>
            <Square size={22} color="#fff" fill="#fff" />
          </TouchableOpacity>
          <ThemedText variant="secondary" style={styles.hint}>Recording… tap to stop</ThemedText>
        </>
      )}

      {state === 'uploading' && (
        <>
          <ActivityIndicator color={theme.colors.primary} />
          <ThemedText variant="secondary" style={styles.hint}>Saving your recording…</ThemedText>
        </>
      )}

      {state === 'done' && (
        <>
          <View style={[styles.recordBtn, { backgroundColor: theme.colors.success }]}>
            <Check size={26} color="#fff" />
          </View>
          <TouchableOpacity style={styles.reRecord} onPress={reset}>
            <RotateCcw size={16} color={theme.colors.primary} />
            <ThemedText style={{ color: theme.colors.primary }}>Record again</ThemedText>
          </TouchableOpacity>
        </>
      )}

      {state === 'error' && (
        <>
          <ThemedText style={{ color: theme.colors.error, textAlign: 'center' }}>{message}</ThemedText>
          <TouchableOpacity style={styles.reRecord} onPress={reset}>
            <RotateCcw size={16} color={theme.colors.primary} />
            <ThemedText style={{ color: theme.colors.primary }}>Try again</ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  recordBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  hint: { fontSize: 13 },
  reRecord: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
