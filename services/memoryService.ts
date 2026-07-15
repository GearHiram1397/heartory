import { MemoryVault, Memory, SharedUser } from '@/types';
import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database.types';

type VaultRow = Tables<'vaults'> & {
  memories?: Tables<'memories'>[];
  vault_shares?: { user_id: string }[];
};
type MemoryRow = Tables<'memories'>;

const MEDIA_TYPES = ['photo', 'video', 'audio'];
const SIGNED_URL_TTL = 60 * 60; // 1 hour

const isMedia = (type: string) => MEDIA_TYPES.includes(type);

// Media content is stored as a private storage path; resolve to signed URLs so
// the UI (which treats `content` as a URL) can render without app changes.
const signMemories = async (rows: MemoryRow[]): Promise<Memory[]> => {
  const mediaPaths = rows.filter((r) => isMedia(r.type)).map((r) => r.content);
  const signedByPath = new Map<string, string>();

  if (mediaPaths.length > 0) {
    const { data } = await supabase.storage
      .from('memories')
      .createSignedUrls(mediaPaths, SIGNED_URL_TTL);
    for (const entry of data ?? []) {
      if (entry.signedUrl && entry.path) signedByPath.set(entry.path, entry.signedUrl);
    }
  }

  return rows
    .map((r) => mapMemory(r, isMedia(r.type) ? signedByPath.get(r.content) : undefined))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

const mapMemory = (row: MemoryRow, signedUrl?: string): Memory => ({
  id: row.id,
  type: row.type as Memory['type'],
  content: signedUrl ?? row.content,
  caption: row.caption ?? undefined,
  date: row.memory_date ?? row.created_at.slice(0, 10),
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapVault = async (row: VaultRow): Promise<MemoryVault> => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  coverImage: row.cover_image ?? undefined,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  memories: await signMemories(row.memories ?? []),
  sharedWith: (row.vault_shares ?? []).map((s) => s.user_id),
});

const utf8Bytes = (s: string): number => {
  // Lightweight UTF-8 byte count without Buffer (unavailable in RN).
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
};

const VAULT_SELECT = '*, memories(*), vault_shares(user_id)';

export const memoryService = {
  // ----- Vaults -----
  getVaults: async (): Promise<MemoryVault[]> => {
    const { data, error } = await supabase
      .from('vaults')
      .select(VAULT_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return Promise.all((data as VaultRow[]).map(mapVault));
  },

  getVault: async (id: string): Promise<MemoryVault> => {
    const { data, error } = await supabase
      .from('vaults')
      .select(VAULT_SELECT)
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message === 'JSON object requested, multiple (or no) rows returned' ? 'Vault not found' : error.message);
    return mapVault(data as VaultRow);
  },

  createVault: async (
    vault: Omit<
      MemoryVault,
      'id' | 'memories' | 'sharedWith' | 'createdAt' | 'updatedAt' | 'ownerId'
    >
  ): Promise<MemoryVault> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to create a vault.');

    const { data, error } = await supabase
      .from('vaults')
      .insert({
        owner_id: user.id,
        name: vault.name,
        description: vault.description ?? null,
        cover_image: vault.coverImage ?? null,
      })
      .select(VAULT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return mapVault(data as VaultRow);
  },

  updateVault: async (
    id: string,
    updates: Partial<Omit<MemoryVault, 'id' | 'memories'>>
  ): Promise<MemoryVault> => {
    const patch: TablesUpdate<'vaults'> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.coverImage !== undefined) patch.cover_image = updates.coverImage;

    const { data, error } = await supabase
      .from('vaults')
      .update(patch)
      .eq('id', id)
      .select(VAULT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return mapVault(data as VaultRow);
  },

  deleteVault: async (id: string): Promise<void> => {
    // Best-effort: remove stored media objects for this vault first.
    const { data: files } = await supabase.storage.from('memories').list(id);
    if (files && files.length > 0) {
      await supabase.storage.from('memories').remove(files.map((f) => `${id}/${f.name}`));
    }
    const { error } = await supabase.from('vaults').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ----- Memories -----
  getMemories: async (vaultId: string): Promise<Memory[]> => {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('vault_id', vaultId);
    if (error) throw new Error(error.message);
    return signMemories(data as MemoryRow[]);
  },

  getMemory: async (vaultId: string, memoryId: string): Promise<Memory> => {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', memoryId)
      .single();
    if (error) throw new Error('Memory not found');
    const [mapped] = await signMemories([data as MemoryRow]);
    return mapped;
  },

  createMemory: async (
    vaultId: string,
    memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>,
    storageBytes?: number
  ): Promise<Memory> => {
    const bytes =
      memory.type === 'text' || memory.type === 'quote'
        ? utf8Bytes(memory.content)
        : storageBytes ?? 0;

    const { data, error } = await supabase
      .from('memories')
      .insert({
        vault_id: vaultId,
        type: memory.type,
        content: memory.content,
        caption: memory.caption ?? null,
        memory_date: memory.date || null,
        tags: memory.tags ?? [],
        storage_bytes: bytes,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    const [mapped] = await signMemories([data as MemoryRow]);
    return mapped;
  },

  updateMemory: async (
    vaultId: string,
    memoryId: string,
    updates: Partial<Omit<Memory, 'id'>>
  ): Promise<Memory> => {
    const patch: TablesUpdate<'memories'> = {};
    if (updates.caption !== undefined) patch.caption = updates.caption;
    if (updates.date !== undefined) patch.memory_date = updates.date || null;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.content !== undefined) patch.content = updates.content;

    const { data, error } = await supabase
      .from('memories')
      .update(patch)
      .eq('id', memoryId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    const [mapped] = await signMemories([data as MemoryRow]);
    return mapped;
  },

  deleteMemory: async (vaultId: string, memoryId: string): Promise<void> => {
    const { data: mem } = await supabase
      .from('memories')
      .select('type, content')
      .eq('id', memoryId)
      .single();

    const { error } = await supabase.from('memories').delete().eq('id', memoryId);
    if (error) throw new Error(error.message);

    if (mem && isMedia(mem.type)) {
      await supabase.storage.from('memories').remove([mem.content]);
    }
  },

  // ----- Sharing -----
  shareVault: async (vaultId: string, email: string): Promise<void> => {
    const { error } = await supabase.rpc('share_vault_by_email', {
      p_vault_id: vaultId,
      p_email: email,
    });
    if (error) throw new Error(error.message);
  },

  unshareVault: async (vaultId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('vault_shares')
      .delete()
      .eq('vault_id', vaultId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  },

  getSharedUsers: async (vaultId: string): Promise<SharedUser[]> => {
    const { data: shares, error } = await supabase
      .from('vault_shares')
      .select('user_id')
      .eq('vault_id', vaultId);
    if (error) throw new Error(error.message);

    const ids = (shares ?? []).map((s) => s.user_id);
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', ids);

    return (profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar: p.avatar_url ?? undefined,
    }));
  },
};
