import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

// Mock firebase/auth module
vi.mock('@/shared/lib/firebase/auth', () => ({
  onAuthChange: vi.fn((callback: (user: unknown) => void) => {
    callback(null);
    return vi.fn(); // unsubscribe
  }),
  loginWithEmail: vi.fn(),
  signupWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  logout: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store to initial state
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isInitialized: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isInitialized).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clears error', () => {
    useAuthStore.setState({ error: 'some error' });
    expect(useAuthStore.getState().error).toBe('some error');

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('login sets loading state and handles success', async () => {
    const { loginWithEmail } = await import('@/shared/lib/firebase/auth');
    vi.mocked(loginWithEmail).mockResolvedValueOnce(undefined as never);

    const loginPromise = useAuthStore.getState().login('test@example.com', 'password123');

    // isLoading should be true while logging in
    expect(useAuthStore.getState().isLoading).toBe(true);
    expect(useAuthStore.getState().error).toBeNull();

    await loginPromise;
    expect(loginWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('login sets error on failure', async () => {
    const { loginWithEmail } = await import('@/shared/lib/firebase/auth');
    vi.mocked(loginWithEmail).mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(useAuthStore.getState().login('test@example.com', 'wrong')).rejects.toThrow(
      'Invalid credentials',
    );

    const state = useAuthStore.getState();
    expect(state.error).toBe('Invalid credentials');
    expect(state.isLoading).toBe(false);
  });

  it('signup calls signupWithEmail', async () => {
    const { signupWithEmail } = await import('@/shared/lib/firebase/auth');
    vi.mocked(signupWithEmail).mockResolvedValueOnce(undefined as never);

    await useAuthStore.getState().signup('new@example.com', 'password123');
    expect(signupWithEmail).toHaveBeenCalledWith('new@example.com', 'password123');
  });

  it('logout clears user', async () => {
    const { logout } = await import('@/shared/lib/firebase/auth');
    vi.mocked(logout).mockResolvedValueOnce(undefined as never);

    useAuthStore.setState({ user: { email: 'test@example.com' } as never });
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('logout sets error on failure', async () => {
    const { logout } = await import('@/shared/lib/firebase/auth');
    vi.mocked(logout).mockRejectedValueOnce(new Error('Logout failed'));

    await expect(useAuthStore.getState().logout()).rejects.toThrow('Logout failed');
    expect(useAuthStore.getState().error).toBe('Logout failed');
  });

  it('resetPassword calls firebase resetPassword', async () => {
    const { resetPassword } = await import('@/shared/lib/firebase/auth');
    vi.mocked(resetPassword).mockResolvedValueOnce(undefined as never);

    await useAuthStore.getState().resetPassword('test@example.com');
    expect(resetPassword).toHaveBeenCalledWith('test@example.com');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('getToken returns a token', async () => {
    const token = await useAuthStore.getState().getToken();
    expect(token).toBe('mock-token');
  });
});
