import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { BrowserProvider, type Signer } from 'ethers';
import { CHAIN_CONFIG } from '@/config/chains';

export const EAS_CONTRACT_ADDRESS = CHAIN_CONFIG.sepolia.eas.contractAddress;

export function getEASInstance(signer: Signer): EAS {
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(signer);
  return eas;
}

export async function getSignerFromBrowser(): Promise<Signer> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Ethereum provider found');
  }
  const provider = new BrowserProvider(window.ethereum);
  return provider.getSigner();
}
