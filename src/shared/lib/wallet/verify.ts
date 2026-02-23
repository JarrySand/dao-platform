import { verifyMessage } from 'ethers';

export function createVerificationMessage(address: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  return `Sign this message to verify ownership of ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
}

export function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): boolean {
  try {
    const recoveredAddress = verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
