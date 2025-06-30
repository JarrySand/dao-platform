// Global type definitions

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isBraveWallet?: boolean;
  isRainbow?: boolean;
  isRabby?: boolean;
  isFrame?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {}; 