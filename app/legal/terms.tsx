import React from 'react';
import { StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { useActiveTheme } from '@/store/themeStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// NOTE: Template copy — have counsel review before launch.
export default function TermsScreen() {
  const theme = useActiveTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Terms of Service' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText preset="title" style={styles.h1}>Terms of Service</ThemedText>
          <ThemedText variant="secondary" style={styles.meta}>Last updated: 2026-07-15</ThemedText>

          <Section title="Acceptance">
            By creating an account you agree to these terms. If you do not agree, do not
            use Heartory.
          </Section>
          <Section title="Your account">
            You are responsible for keeping your credentials secure and for the content you
            upload. You must have the right to store and share the content you add.
          </Section>
          <Section title="Acceptable use">
            Do not upload unlawful content, infringe others' rights, or attempt to disrupt
            or gain unauthorized access to the service.
          </Section>
          <Section title="Subscriptions & billing">
            Paid plans are billed through Stripe on a recurring basis until canceled. You
            can manage or cancel your subscription anytime via the billing portal. Fees are
            non-refundable except where required by law.
          </Section>
          <Section title="Your content">
            You own your content. You grant us only the limited rights needed to store,
            process, and display it to you and those you share it with.
          </Section>
          <Section title="Availability & disclaimer">
            We work hard to keep your memories safe and available, but the service is
            provided "as is" without warranties. Keep your own copies of anything
            irreplaceable.
          </Section>
          <Section title="Termination">
            You may delete your account at any time. We may suspend accounts that violate
            these terms.
          </Section>
          <Section title="Contact">
            Questions: support@heartory.app.
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
