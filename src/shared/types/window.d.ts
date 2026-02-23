interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isBraveWallet?: boolean;
  isRainbow?: boolean;
  isRabby?: boolean;
  isFrame?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, handler: (...args: any[]) => void) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
