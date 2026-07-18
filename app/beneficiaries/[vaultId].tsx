import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Eye, Crown, Clock, Hand, Trash2, Send, Heart } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { useMemoryStore } from '@/store/memoryStore';
import {
  beneficiaryService,
  Beneficiary,
  AccessLevel,
  ReleaseTrigger,
} from '@/services/beneficiaryService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';

export default function BeneficiariesScreen() {
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const theme = useActiveTheme();
  const vault = useMemoryStore((s) => s.vaults.find((v) => v.id === vaultId));

  const [list, setList] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Add-form state
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<AccessLevel>('view');
  const [trigger, setTrigger] = useState<ReleaseTrigger>('manual');
  const [days, setDays] = useState('90');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!vaultId) return;
    setLoading(true);
    try {
      setList(await beneficiaryService.listForVault(vaultId));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    setError('');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      await beneficiaryService.add(
        vaultId!,
        email,
        access,
        trigger,
        trigger === 'inactivity' ? parseInt(days, 10) || 90 : undefined
      );
      setEmail('');
      setAccess('view');
      setTrigger('manual');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add beneficiary.');
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = (b: Beneficiary) => {
    const isOwner = b.access_level === 'owner';
    Alert.alert(
      isOwner ? 'Transfer ownership now?' : 'Grant access now?',
      isOwner
        ? `${b.beneficiary_email} will become the owner of "${vault?.name ?? 'this vault'}". You will remain an editor. This cannot be undone.`
        : `${b.beneficiary_email} will get view access to "${vault?.name ?? 'this vault'}" right now.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOwner ? 'Transfer Ownership' : 'Grant Access',
          style: isOwner ? 'destructive' : 'default',
          onPress: async () => {
            setBusy(true);
            try {
              await beneficiaryService.release(b.id);
              await load();
            } catch (e) {
              Alert.alert('Release', e instanceof Error ? e.message : 'Could not release.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleRemove = (b: Beneficiary) => {
    Alert.alert('Remove beneficiary', `Remove ${b.beneficiary_email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await beneficiaryService.revoke(b.id);
            setList((prev) => prev.filter((x) => x.id !== b.id));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const Segment = ({
    active,
    onPress,
    icon,
    label,
  }: {
    active: boolean;
    onPress: () => void;
    icon: React.ReactNode;
    label: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.segment,
        { borderColor: active ? theme.colors.primary : theme.colors.border ?? '#0002' },
        active && { backgroundColor: `${theme.colors.primary}15` },
      ]}
    >
      {icon}
      <ThemedText style={[styles.segmentText, active && { color: theme.colors.primary }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Beneficiaries' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { backgroundColor: `${theme.colors.primary}12` }]}>
            <Heart size={22} color={theme.colors.primary} />
            <ThemedText variant="secondary" style={styles.heroText}>
              Decide who inherits {vault ? `“${vault.name}”` : 'this vault'} — so these memories
              outlive the subscription. Access is granted when you release it, or automatically
              after a period of inactivity.
            </ThemedText>
          </View>

          {/* Add form */}
          <ThemedCard style={styles.card} elevation="small">
            <ThemedText preset="label">Add a beneficiary</ThemedText>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${theme.colors.error}20` }]}>
                <ThemedText style={{ color: theme.colors.error }}>{error}</ThemedText>
              </View>
            ) : null}
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text },
              ]}
              placeholder="their@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <ThemedText variant="secondary" style={styles.fieldLabel}>
              They inherit
            </ThemedText>
            <View style={styles.segmentRow}>
              <Segment
                active={access === 'view'}
                onPress={() => setAccess('view')}
                icon={<Eye size={16} color={access === 'view' ? theme.colors.primary : theme.colors.text} />}
                label="View only"
              />
              <Segment
                active={access === 'owner'}
                onPress={() => setAccess('owner')}
                icon={<Crown size={16} color={access === 'owner' ? theme.colors.primary : theme.colors.text} />}
                label="Full ownership"
              />
            </View>

            <ThemedText variant="secondary" style={styles.fieldLabel}>
              Release
            </ThemedText>
            <View style={styles.segmentRow}>
              <Segment
                active={trigger === 'manual'}
                onPress={() => setTrigger('manual')}
                icon={<Hand size={16} color={trigger === 'manual' ? theme.colors.primary : theme.colors.text} />}
                label="Manually"
              />
              <Segment
                active={trigger === 'inactivity'}
                onPress={() => setTrigger('inactivity')}
                icon={<Clock size={16} color={trigger === 'inactivity' ? theme.colors.primary : theme.colors.text} />}
                label="After inactivity"
              />
            </View>

            {trigger === 'inactivity' && (
              <View style={styles.inactiveRow}>
                <ThemedText variant="secondary">Release after</ThemedText>
                <TextInput
                  style={[
                    styles.daysInput,
                    { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text },
                  ]}
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <ThemedText variant="secondary">days of no activity</ThemedText>
              </View>
            )}

            <ThemedButton
              title="Add Beneficiary"
              onPress={handleAdd}
              isLoading={busy}
              buttonStyle={{ marginTop: 16 }}
            />
          </ThemedCard>

          {/* List */}
          <ThemedText preset="label" style={{ marginTop: 8, marginBottom: 8 }}>
            Named beneficiaries
          </ThemedText>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />
          ) : list.length === 0 ? (
            <ThemedText variant="secondary" style={styles.empty}>
              No beneficiaries yet. Add someone above to make sure these memories are never lost.
            </ThemedText>
          ) : (
            list.map((b) => (
              <ThemedCard key={b.id} style={styles.beneRow} elevation="small">
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.beneEmail}>{b.beneficiary_email}</ThemedText>
                  <View style={styles.beneMeta}>
                    <View style={styles.metaPill}>
                      {b.access_level === 'owner' ? (
                        <Crown size={12} color={theme.colors.textSecondary} />
                      ) : (
                        <Eye size={12} color={theme.colors.textSecondary} />
                      )}
                      <ThemedText variant="secondary" style={styles.metaText}>
                        {b.access_level === 'owner' ? 'Ownership' : 'View'}
                      </ThemedText>
                    </View>
                    <View style={styles.metaPill}>
                      {b.release_trigger === 'inactivity' ? (
                        <Clock size={12} color={theme.colors.textSecondary} />
                      ) : (
                        <Hand size={12} color={theme.colors.textSecondary} />
                      )}
                      <ThemedText variant="secondary" style={styles.metaText}>
                        {b.release_trigger === 'inactivity'
                          ? `${b.release_after_days}d inactivity`
                          : 'Manual'}
                      </ThemedText>
                    </View>
                    <ThemedText
                      variant="secondary"
                      style={[
                        styles.metaText,
                        b.status === 'released' && { color: theme.colors.success },
                      ]}
                    >
                      {b.status}
                    </ThemedText>
                  </View>
                </View>
                {b.status === 'pending' && (
                  <TouchableOpacity onPress={() => handleRelease(b)} style={styles.iconBtn}>
                    <Send size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleRemove(b)} style={styles.iconBtn}>
                  <Trash2 size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </ThemedCard>
            ))
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  heroText: { flex: 1, lineHeight: 20, fontSize: 13.5 },
  card: { padding: 16, marginBottom: 20 },
  errorBox: { borderRadius: 8, padding: 10, marginTop: 10 },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginTop: 10,
  },
  fieldLabel: { marginTop: 16, marginBottom: 8, fontSize: 13 },
  segmentRow: { flexDirection: 'row', gap: 10 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: { fontSize: 13, fontWeight: '600' },
  inactiveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  daysInput: {
    width: 60,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  empty: { textAlign: 'center', marginTop: 12, marginBottom: 8 },
  beneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  beneEmail: { fontWeight: '600' },
  beneMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  iconBtn: { padding: 8 },
});
