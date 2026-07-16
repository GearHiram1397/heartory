import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// NOTE: Template copy — have counsel review before launch. Reflects the app's
// actual data practices (Supabase-hosted, encrypted in transit/at rest,
// self-serve export & deletion).
export default function PrivacyPolicyScreen() {
  const theme = useActiveTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Privacy Policy' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText preset="title" style={styles.h1}>Privacy Policy</ThemedText>
          <ThemedText variant="secondary" style={styles.meta}>Last updated: 2026-07-15</ThemedText>

          <Section title="Who we are">
            Heartory is a private memory-preservation service. This policy explains what
            we collect, why, and the choices you have.
          </Section>
          <Section title="What we collect">
            Account details (name, email); the content you add to your vaults (photos,
            videos, audio, text, captions, dates, tags); subscription and payment status
            (via Stripe — we never see or store your card number); and limited technical
            logs needed to operate and secure the service.
          </Section>
          <Section title="How we use it">
            To provide the service, store and display your memories, process subscriptions,
            enforce plan limits, keep the service secure, and comply with law. We do not
            sell your personal data, and we do not use your memories to train AI models.
          </Section>
          <Section title="Storage & security">
            Data is hosted on Supabase (PostgreSQL + object storage). Media lives in a
            private bucket accessible only to you and people you explicitly share a vault
            with. Data is encrypted in transit (TLS) and at rest. Access is enforced by
            row-level security. Optional two-factor authentication is available.
          </Section>
          <Section title="Sharing">
            Vaults are private by default. Memories are shared only with people you invite.
            Stripe (payments) and Supabase (hosting) act as our processors.
          </Section>
          <Section title="Your rights">
            You can export all of your data or permanently delete your account at any time
            from Settings → Your Data. Depending on where you live, you may have additional
            rights under the GDPR or CCPA, including access, correction, and erasure.
          </Section>
          <Section title="Data retention">
            We keep your data while your account is active. When you delete your account,
            your profile, vaults, memories, and files are permanently removed.
          </Section>
          <Section title="Contact">
            Questions or requests: privacy@heartory.app.
          </Section>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <ThemedText preset="subtitle" style={styles.h2}>{title}</ThemedText>
      <ThemedText variant="secondary" style={styles.body}>{children}</ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  h1: { marginBottom: 4 },
  meta: { marginBottom: 20 },
  h2: { marginTop: 20, marginBottom: 6 },
  body: { lineHeight: 21 },
});
