import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const SEPOLIA_CHAIN_ID = '0xaa36a7';

interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
  setupListeners: () => () => void;
}

export type WalletStore = WalletState & WalletActions;

function getEthereum() {
  if (typeof window === 'undefined') return null;
  return window.ethereum ?? null;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      address: null,
      chainId: null,
      isConnecting: false,
      isCorrectNetwork: false,
      error: null,

      connect: async () => {
        const ethereum = getEthereum();
        if (!ethereum) {
          set({ error: 'ウォレットが見つかりません。MetaMask をインストールしてください。' });
          return;
        }

        set({ isConnecting: true, error: null });
        try {
          const accounts: string[] = await ethereum.request({
            method: 'eth_requestAccounts',
          });
          const chainId: string = await ethereum.request({
            method: 'eth_chainId',
          });

          if (!accounts || accounts.length === 0) {
            set({ isConnecting: false, error: 'アカウントが見つかりません' });
            return;
          }

          set({
            address: accounts[0],
            chainId,
            isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
            isConnecting: false,
          });
        } catch (err: unknown) {
          const error = err as { code?: number; message?: string };
          let message = 'ウォレット接続に失敗しました';
          if (error.code === 4001) {
            message = 'ウォレット接続がユーザーによって拒否されました';
          } else if (error.code === -32002) {
            message = '既にウォレットで接続処理が進行中です';
          }
          set({ isConnecting: false, error: message });
        }
      },

      disconnect: () => {
        set({
          address: null,
          chainId: null,
          isCorrectNetwork: false,
          error: null,
        });
      },

      switchToSepolia: async () => {
        const ethereum = getEthereum();
        if (!ethereum) return;

        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (err: unknown) {
          const error = err as { code?: number };
          if (error.code === 4902) {
            try {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: SEPOLIA_CHAIN_ID,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
            } catch {
              set({ error: 'Sepolia ネットワークの追加に失敗しました' });
            }
          } else {
            set({ error: 'ネットワーク切替に失敗しました' });
          }
        }
      },

      setupListeners: () => {
        const ethereum = getEthereum();
        if (!ethereum) return () => {};

        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length === 0) {
            get().disconnect();
          } else {
            set({ address: accounts[0] });
          }
        };

        const handleChainChanged = (chainId: string) => {
          set({
            chainId,
            isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
          });
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        return () => {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        };
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        address: state.address,
        chainId: state.chainId,
      }),
    },
  ),
);
