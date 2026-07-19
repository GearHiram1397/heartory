import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Heart, Shield, FileText, Mail, ChevronRight, Star } from 'lucide-react-native';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedCard } from '@/components/ThemedCard';

export default function AboutScreen() {
  const theme = useActiveTheme();
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const Row = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <ThemedText style={styles.rowText}>{label}</ThemedText>
      <ChevronRight size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'About Heartory' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={[styles.logo, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Heart size={34} color={theme.colors.primary} />
            </View>
            <ThemedText preset="title" style={styles.name}>Heartory</ThemedText>
            <ThemedText variant="secondary">Preserve what matters most</ThemedText>
            <ThemedText variant="secondary" style={styles.version}>Version {version}</ThemedText>
          </View>

          <ThemedText variant="secondary" style={styles.mission}>
            Heartory is a private, caring space to keep the memories of the people you love —
            photos, videos, their voice, their words — safe, encrypted, and yours. Built so that
            what matters is never lost, and can be passed on to those who come after.
          </ThemedText>

          <ThemedCard style={styles.card}>
            <Row
              icon={<Shield size={20} color={theme.colors.text} />}
              label="Privacy Policy"
              onPress={() => router.push('/legal/privacy')}
            />
            <Row
              icon={<FileText size={20} color={theme.colors.text} />}
              label="Terms of Service"
              onPress={() => router.push('/legal/terms')}
            />
            <Row
              icon={<Mail size={20} color={theme.colors.text} />}
              label="Contact Support"
              onPress={() => Linking.openURL('mailto:support@heartory.app')}
            />
            <Row
              icon={<Star size={20} color={theme.colors.text} />}
              label="Rate Heartory"
              onPress={() => Linking.openURL('https://heartory.app')}
            />
          </ThemedCard>

          <ThemedText variant="secondary" style={styles.copyright}>
            © {new Date().getFullYear()} Heartory. Made with care.
          </ThemedText>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingVertical: 16 },
  logo: {
    width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  name: { marginBottom: 4 },
  version: { marginTop: 8, fontSize: 13 },
  mission: { lineHeight: 22, textAlign: 'center', marginVertical: 20 },
  card: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowIcon: { marginRight: 14 },
  rowText: { flex: 1, fontSize: 16 },
  copyright: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
