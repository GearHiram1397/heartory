export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // True once the initial session check has completed. Used to gate routing
    // so we never redirect based on stale persisted state.
    initialized: boolean;
    // True while the user is in a password-recovery session (arrived via the
    // reset-password email link) and must set a new password.
    passwordRecovery: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    completePasswordReset: (newPassword: string) => Promise<void>;
    clearError: () => void;
    initAuth: () => Promise<void>;
    updateProfile: (userData: Partial<User>) => Promise<void>;
  }