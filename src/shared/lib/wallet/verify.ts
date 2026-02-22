import { verifyMessage } from 'ethers';

export function createVerificationMessage(address: string): string {
  const timestamp = Date.now();
  return `Sign this message to verify ownership of ${address}\nTimestamp: ${timestamp}`;
}

export function verifyWalletOwnership(
  address: string,
  signature: string,
  message: string,
): boolean {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}
