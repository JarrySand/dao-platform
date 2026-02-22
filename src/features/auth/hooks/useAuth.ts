'use client';

import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const logout = useAuthStore((s) => s.logout);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const clearError = useAuthStore((s) => s.clearError);
  const getToken = useAuthStore((s) => s.getToken);
  const initialize = useAuthStore((s) => s.initialize);

  return {
    user,
    isLoading,
    isInitialized,
    error,
    login,
    signup,
    logout,
    resetPassword,
    clearError,
    getToken,
    initialize,
  };
}

export function useAuthUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  return user !== null && isInitialized;
}
