import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '@/types/auth';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';

let authListenerBound = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      initialized: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const user = await authService.login(email, password);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred during login',
            isLoading: false,
          });
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const user = await authService.register(name, email, password);
          analytics.identify(user.id);
          analytics.track('sign_up');
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'An error occurred during registration',
            isLoading: false,
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          await authService.resetPassword(email);
          set({ isLoading: false });
          return Promise.resolve();
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'An error occurred during password reset',
            isLoading: false,
          });
          return Promise.reject(error);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Reconcile with the real Supabase session on app start, and keep the
      // store in sync with future auth events (sign-in, sign-out, token refresh,
      // email-confirmation deep links).
      initAuth: async () => {
        set({ isLoading: true });

        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false, initialized: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false, initialized: true });
        }

        if (!authListenerBound) {
          authListenerBound = true;
          supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session?.user) {
              set({ user: null, isAuthenticated: false });
              return;
            }
            // Set a minimal user immediately from the session; enrich with the
            // profile row afterwards. Avoid awaiting supabase calls directly
            // inside this callback (can deadlock the auth client).
            const su = session.user;
            const current = get().user;
            set({
              user:
                current && current.id === su.id
                  ? current
                  : {
                      id: su.id,
                      email: su.email ?? '',
                      name: (su.user_metadata?.name as string | undefined) ?? '',
                    },
              isAuthenticated: true,
            });
            setTimeout(() => {
              authService
                .getCurrentUser()
                .then((u) => {
                  if (u) set({ user: u, isAuthenticated: true });
                })
                .catch(() => {});
          }, 0);
          });
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          const updatedUser = await authService.updateProfile(userData);
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'An error occurred updating profile',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'heartory-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only lightweight hints; the Supabase session (in its own
      // storage) is the source of truth, reconciled by initAuth().
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
