import { getChainConfig } from '@/config/chains';

const config = getChainConfig();

export function getAddressExplorerUrl(address: string): string {
  return `${config.explorer}/address/${address}`;
}

export function getTxExplorerUrl(txHash: string): string {
  return `${config.explorer}/tx/${txHash}`;
}

export function getAttestationExplorerUrl(uid: string): string {
  return `${config.eas.explorerUrl}/attestation/view/${uid}`;
}
