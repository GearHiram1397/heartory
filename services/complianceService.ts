import { supabase } from '@/lib/supabase';

// GDPR/CCPA data-subject actions + two-factor auth, backed by Edge Functions
// and Supabase MFA.
export const complianceService = {
  // Returns the full JSON export bundle for the signed-in user.
  exportMyData: async (): Promise<unknown> => {
    const { data, error } = await supabase.functions.invoke('account-export', { body: {} });
    if (error) throw new Error(error.message);
    return data;
  },

  // Permanently deletes the account and all associated data.
  deleteMyAccount: async (): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('account-delete', { body: {} });
    if (error) throw new Error(error.message);
    if (data && (data as { error?: string }).error) {
      throw new Error((data as { error: string }).error);
    }
  },

  // ----- Two-factor authentication (TOTP) -----
  listTotpFactors: async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw new Error(error.message);
    return data.totp ?? [];
  },

  hasVerifiedTotp: async (): Promise<boolean> => {
    const { data } = await supabase.auth.mfa.listFactors();
    return !!data?.totp?.some((f) => f.status === 'verified');
  },

  // Begins enrollment; returns the QR code + secret to display to the user.
  enrollTotp: async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw new Error(error.message);
    return data; // { id, type, totp: { qr_code, secret, uri } }
  },

  // Confirms enrollment (or a sign-in step) with a 6-digit code.
  verifyTotp: async (factorId: string, code: string) => {
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
    if (cErr) throw new Error(cErr.message);
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) throw new Error(error.message);
  },

  unenrollTotp: async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
  },
};
