import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWalletStore } from '../walletStore';

const mockAccounts = ['0x' + 'ab'.repeat(20)];
const SEPOLIA_CHAIN_ID = '0xaa36a7';

const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

describe('walletStore', () => {
  beforeEach(() => {
    useWalletStore.setState({
      address: null,
      chainId: null,
      isConnecting: false,
      isCorrectNetwork: false,
      error: null,
    });
    vi.clearAllMocks();
    // Setup window.ethereum mock
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  it('has correct initial state', () => {
    const state = useWalletStore.getState();
    expect(state.address).toBeNull();
    expect(state.chainId).toBeNull();
    expect(state.isConnecting).toBe(false);
    expect(state.isCorrectNetwork).toBe(false);
    expect(state.error).toBeNull();
  });

  it('connect sets address and chainId on success', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(mockAccounts) // eth_requestAccounts
      .mockResolvedValueOnce(SEPOLIA_CHAIN_ID); // eth_chainId

    await useWalletStore.getState().connect();

    const state = useWalletStore.getState();
    expect(state.address).toBe(mockAccounts[0]);
    expect(state.chainId).toBe(SEPOLIA_CHAIN_ID);
    expect(state.isCorrectNetwork).toBe(true);
    expect(state.isConnecting).toBe(false);
  });

  it('connect detects wrong network', async () => {
    mockEthereum.request
      .mockResolvedValueOnce(mockAccounts)
      .mockResolvedValueOnce('0x1'); // mainnet, not Sepolia

    await useWalletStore.getState().connect();

    const state = useWalletStore.getState();
    expect(state.isCorrectNetwork).toBe(false);
    expect(state.chainId).toBe('0x1');
  });

  it('connect sets error when no ethereum provider', async () => {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    await useWalletStore.getState().connect();

    const state = useWalletStore.getState();
    expect(state.error).toContain('ウォレットが見つかりません');
  });

  it('connect handles user rejection (code 4001)', async () => {
    mockEthereum.request.mockRejectedValueOnce({ code: 4001, message: 'User rejected' });

    await useWalletStore.getState().connect();

    const state = useWalletStore.getState();
    expect(state.error).toContain('拒否');
    expect(state.isConnecting).toBe(false);
  });

  it('disconnect clears state', () => {
    useWalletStore.setState({
      address: mockAccounts[0],
      chainId: SEPOLIA_CHAIN_ID,
      isCorrectNetwork: true,
    });

    useWalletStore.getState().disconnect();

    const state = useWalletStore.getState();
    expect(state.address).toBeNull();
    expect(state.chainId).toBeNull();
    expect(state.isCorrectNetwork).toBe(false);
  });

  it('setupListeners registers event listeners', () => {
    const cleanup = useWalletStore.getState().setupListeners();

    expect(mockEthereum.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
    expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));

    cleanup();
    expect(mockEthereum.removeListener).toHaveBeenCalledTimes(2);
  });
});
