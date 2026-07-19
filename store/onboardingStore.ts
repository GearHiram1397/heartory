import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  completed: boolean;
  hydrated: boolean;
  complete: () => void;
}

// Tracks whether the first-run onboarding has been seen. Persisted so it only
// shows once per install.
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      hydrated: false,
      complete: () => set({ completed: true }),
    }),
    {
      name: 'heartory-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ completed: s.completed }),
      onRehydrateStorage: () => (state) => {
        // Mark hydrated so routing doesn't flash onboarding before the flag loads.
        useOnboardingStore.setState({ hydrated: true });
      },
    }
  )
);
