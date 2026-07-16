import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { CreditCard, Receipt, ShieldCheck } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useActiveTheme } from '@/store/themeStore';
import { supabase } from '@/lib/supabase';
import { subscriptionService } from '@/services/subscriptionService';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';

interface InvoiceRow {
  id: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  status: string;
  created_at: string;
}

// Billing is fully delegated to Stripe's hosted billing portal — the app never
// collects or stores card data (PCI-safe). This screen shows past invoices
// (recorded by the Stripe webhook) and links to the portal.
export default function BillingScreen() {
  const theme = useActiveTheme();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('invoices')
        .select('id, amount_cents, currency, description, status, created_at')
        .order('created_at', { ascending: false });
      setInvoices((data as InvoiceRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const openPortal = async () => {
    setOpening(true);
    try {
      const url = await subscriptionService.openBillingPortalUrl();
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert(
        'Billing',
        error instanceof Error ? error.message : 'Could not open the billing portal.'
      );
    } finally {
      setOpening(false);
    }
  };

  const formatMoney = (cents: number, currency: string) =>
    (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Billing & Payment' }} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedCard style={styles.hero} elevation="small">
            <View style={[styles.iconCircle, { backgroundColor: `${theme.colors.primary}20` }]}>
              <ShieldCheck size={22} color={theme.colors.primary} />
            </View>
            <ThemedText preset="subtitle" style={styles.heroTitle}>
              Payments secured by Stripe
            </ThemedText>
            <ThemedText variant="secondary" style={styles.heroText}>
              Your card details are handled entirely by Stripe and never stored by Heartory.
              Manage your plan, payment method, and receipts in the secure billing portal.
            </ThemedText>
            <ThemedButton
              title="Open Billing Portal"
              onPress={openPortal}
              isLoading={opening}
              leftIcon={<CreditCard size={18} color="#fff" />}
              buttonStyle={styles.portalButton}
            />
          </ThemedCard>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Receipt size={18} color={theme.colors.text} style={{ marginRight: 8 }} />
              <ThemedText preset="label">Billing History</ThemedText>
            </View>

            {loading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />
            ) : invoices.length === 0 ? (
              <ThemedText variant="secondary" style={styles.empty}>
                No invoices yet. Your receipts will appear here after your first payment.
              </ThemedText>
            ) : (
              invoices.map((inv) => (
                <ThemedCard key={inv.id} style={styles.invoiceRow} elevation="small">
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.invoiceDesc}>
                      {inv.description || 'Subscription'}
                    </ThemedText>
                    <ThemedText variant="secondary" style={styles.invoiceDate}>
                      {formatDate(inv.created_at)} · {inv.status}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.invoiceAmount}>
                    {formatMoney(inv.amount_cents, inv.currency)}
                  </ThemedText>
                </ThemedCard>
              ))
            )}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  hero: { padding: 20, alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { marginBottom: 8, textAlign: 'center' },
  heroText: { textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  portalButton: { alignSelf: 'stretch' },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 16 },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  invoiceDesc: { fontWeight: '600' },
  invoiceDate: { fontSize: 13, marginTop: 2 },
  invoiceAmount: { fontWeight: '700' },
});
