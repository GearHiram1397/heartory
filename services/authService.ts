import { User } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database.types';

type ProfileRow = Tables<'profiles'>;

// Map a Supabase auth user + profile row into the app's User model.
const mapUser = (
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, any> },
  profile?: ProfileRow | null,
  fallbackName?: string
): User => ({
  id: authUser.id,
  email: profile?.email ?? authUser.email ?? '',
  name:
    profile?.name ||
    fallbackName ||
    (authUser.user_metadata?.name as string | undefined) ||
    '',
  avatar: profile?.avatar_url ?? undefined,
  createdAt: profile?.created_at,
  updatedAt: profile?.updated_at,
});

const fetchProfile = async (userId: string): Promise<ProfileRow | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      // Normalize Supabase's generic message for a gentler tone.
      if (error.message.toLowerCase().includes('invalid login')) {
        throw new Error('Invalid email or password');
      }
      if (error.message.toLowerCase().includes('not confirmed')) {
        throw new Error('Please confirm your email address before signing in.');
      }
      throw new Error(error.message);
    }
    const profile = await fetchProfile(data.user.id);
    return mapUser(data.user, profile);
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        throw new Error('Email already in use');
      }
      throw new Error(error.message);
    }

    // With email confirmation enabled, signUp returns no session until the
    // user clicks the confirmation link. Surface a clear next step.
    if (!data.session) {
      throw new Error(
        'Account created! Please check your email to confirm your address, then sign in.'
      );
    }

    const profile = data.user ? await fetchProfile(data.user.id) : null;
    return mapUser(data.user!, profile, name.trim());
  },

  resetPassword: async (email: string): Promise<void> => {
    const redirectTo =
      process.env.EXPO_PUBLIC_PASSWORD_RESET_URL || undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    // Do not reveal whether an account exists; only throw on transport errors.
    if (error && !error.message.toLowerCase().includes('user not found')) {
      throw new Error(error.message);
    }
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const profile = await fetchProfile(session.user.id);
    return mapUser(session.user, profile);
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to update your profile.');

    const updates: Partial<ProfileRow> = {};
    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.avatar !== undefined) updates.avatar_url = userData.avatar;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);

    // Keep auth metadata name in sync for convenience.
    if (userData.name !== undefined) {
      await supabase.auth.updateUser({ data: { name: userData.name } });
    }

    return mapUser(user, data);
  },
};
