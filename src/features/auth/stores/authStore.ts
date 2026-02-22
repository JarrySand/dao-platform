import { create } from 'zustand';
import {
  onAuthChange,
  loginWithEmail,
  signupWithEmail,
  resetPassword,
  logout as firebaseLogout,
  getIdToken,
} from '@/shared/lib/firebase/auth';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  getToken: () => Promise<string | null>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthChange((user) => {
      set({ user, isLoading: false, isInitialized: true });
    });
    return unsubscribe;
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  signup: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await signupWithEmail(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'アカウント作成に失敗しました';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await firebaseLogout();
      set({ user: null, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログアウトに失敗しました';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await resetPassword(email);
      set({ isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'パスワードリセットに失敗しました';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  getToken: async () => {
    return getIdToken();
  },
}));
