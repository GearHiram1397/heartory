import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '@/types/auth';
import { authService } from '@/services/authService';

// Updated auth store to use the auth service
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await authService.login(email, password);
          
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "An error occurred during login",
            isLoading: false,
          });
        }
      },
      
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await authService.register(name, email, password);
          
          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "An error occurred during registration",
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
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
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
            error: error instanceof Error ? error.message : "An error occurred during password reset",
            isLoading: false,
          });
          return Promise.reject(error);
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      // Initialize auth state from token
      initAuth: async () => {
        set({ isLoading: true });
        
        try {
          const user = await authService.getCurrentUser();
          
          set({ 
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      
      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedUser = await authService.updateProfile(userData);
          
          set({ 
            user: updatedUser,
            isLoading: false,
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "An error occurred updating profile",
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'memora-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);