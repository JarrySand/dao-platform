// Web3ウォレット接続ユーティリティ

export interface WalletInfo {
  name: string;
  icon: string;
  installed: boolean;
  connect: () => Promise<string[]>;
}

// 利用可能なウォレットを検出
export const getAvailableWallets = (): WalletInfo[] => {
  if (typeof window === 'undefined') return [];

  const wallets: WalletInfo[] = [];

  // MetaMask
  if (window.ethereum?.isMetaMask) {
    wallets.push({
      name: 'MetaMask',
      icon: '🦊',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Coinbase Wallet
  if (window.ethereum?.isCoinbaseWallet) {
    wallets.push({
      name: 'Coinbase Wallet',
      icon: '💙',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Trust Wallet
  if (window.ethereum?.isTrust) {
    wallets.push({
      name: 'Trust Wallet',
      icon: '🛡️',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Brave Wallet
  if (window.ethereum?.isBraveWallet) {
    wallets.push({
      name: 'Brave Wallet',
      icon: '🦁',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Rainbow Wallet
  if (window.ethereum?.isRainbow) {
    wallets.push({
      name: 'Rainbow',
      icon: '🌈',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Rabby Wallet
  if (window.ethereum?.isRabby) {
    wallets.push({
      name: 'Rabby',
      icon: '🐰',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Frame
  if (window.ethereum?.isFrame) {
    wallets.push({
      name: 'Frame',
      icon: '🖼️',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  // Generic Ethereum provider (fallback)
  if (window.ethereum && wallets.length === 0) {
    wallets.push({
      name: 'Web3 Wallet',
      icon: '🔗',
      installed: true,
      connect: async () => {
        return await window.ethereum.request({ method: 'eth_requestAccounts' });
      }
    });
  }

  return wallets;
};

// 主要なウォレットを接続
export const connectWallet = async (): Promise<string> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Web3ウォレットが見つかりません。MetaMask、Coinbase Wallet、Trust Wallet等のウォレットをインストールしてください。');
  }

  try {
    // アカウント接続要求
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('ウォレットアカウントが見つかりません');
    }

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('ウォレット接続がユーザーによって拒否されました');
    } else if (error.code === -32002) {
      throw new Error('既にウォレットで接続処理が進行中です');
    }
    throw error;
  }
};

// ウォレットの接続状態を確認
export const checkWalletConnection = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Failed to check wallet connection:', error);
    return null;
  }
};

// ウォレットの変更を監視
export const watchWalletChanges = (
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return () => {}; // cleanup function
  }

  const handleAccountsChanged = (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    onAccountsChanged(accounts);
  };

  const handleChainChanged = (chainId: string) => {
    console.log('Chain changed:', chainId);
    onChainChanged(chainId);
  };

  window.ethereum.on('accountsChanged', handleAccountsChanged);
  window.ethereum.on('chainChanged', handleChainChanged);

  // cleanup function
  return () => {
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };
}; 