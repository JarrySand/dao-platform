import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../AuthGuard';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

// Mock the WalletConnectButton since it uses next/dynamic
vi.mock('@/features/wallet/components/WalletConnectButton', () => ({
  WalletConnectButton: () => <button type="button">ウォレット接続</button>,
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    // Reset wallet store to disconnected state before each test
    useWalletStore.setState({
      address: null,
      chainId: null,
      isConnecting: false,
      isCorrectNetwork: false,
      error: null,
    });
  });

  it('shows connect prompt when wallet is not connected', () => {
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    expect(screen.getByText('ウォレットを接続してください')).toBeInTheDocument();
    expect(
      screen.getByText('この機能を利用するには MetaMask ウォレットの接続が必要です'),
    ).toBeInTheDocument();
    expect(screen.getByText('ウォレット接続')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows children when wallet is connected', () => {
    useWalletStore.setState({
      address: '0x' + 'aa'.repeat(20),
      chainId: '0xaa36a7',
      isCorrectNetwork: true,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('ウォレットを接続してください')).not.toBeInTheDocument();
  });

  it('does not render children when address is null', () => {
    useWalletStore.setState({ address: null });

    render(
      <AuthGuard>
        <div>Secret Dashboard</div>
      </AuthGuard>,
    );

    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('ウォレットを接続してください')).toBeInTheDocument();
  });

  it('switches from connect prompt to children when wallet connects', () => {
    const { rerender } = render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    // Initially disconnected
    expect(screen.getByText('ウォレットを接続してください')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Simulate wallet connection
    useWalletStore.setState({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: '0xaa36a7',
      isCorrectNetwork: true,
    });

    rerender(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('ウォレットを接続してください')).not.toBeInTheDocument();
  });
});
