import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

export type Beneficiary = Tables<'vault_beneficiaries'>;
export type AccessLevel = 'view' | 'owner';
export type ReleaseTrigger = 'manual' | 'inactivity';

// Inheritance for a vault: owner names who inherits it, chooses view-only vs
// full ownership, and how release is triggered (manually or after inactivity).
export const beneficiaryService = {
  listForVault: async (vaultId: string): Promise<Beneficiary[]> => {
    const { data, error } = await supabase
      .from('vault_beneficiaries')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  add: async (
    vaultId: string,
    email: string,
    accessLevel: AccessLevel,
    trigger: ReleaseTrigger,
    releaseAfterDays?: number
  ): Promise<void> => {
    const { error } = await supabase.rpc('add_beneficiary', {
      p_vault_id: vaultId,
      p_email: email.trim(),
      p_access_level: accessLevel,
      p_release_trigger: trigger,
      p_release_after_days: releaseAfterDays ?? undefined,
    });
    if (error) throw new Error(error.message);
  },

  // Owner-triggered "release now" — grants view access or transfers ownership.
  release: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('release_beneficiary', { p_id: id });
    if (error) throw new Error(error.message);
  },

  revoke: async (id: string): Promise<void> => {
    const { error } = await supabase.from('vault_beneficiaries').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Refresh the owner's activity timestamp (feeds the inactivity release path).
  heartbeat: async (): Promise<void> => {
    try {
      await supabase.rpc('heartbeat');
    } catch {
      /* non-fatal */
    }
  },
};
