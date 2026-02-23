import { describe, it, expect } from 'vitest';
import { Wallet } from 'ethers';
import { createVerificationMessage, verifyWalletSignature } from '../verify';

// Use fixed private keys to avoid Wallet.createRandom() + jsdom Buffer incompatibility
const TEST_KEY_1 = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_KEY_2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

describe('createVerificationMessage', () => {
  it('includes the wallet address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const message = createVerificationMessage(address);
    expect(message).toContain(address);
  });

  it('includes a timestamp', () => {
    const message = createVerificationMessage('0x1234567890abcdef1234567890abcdef12345678');
    expect(message).toMatch(/Timestamp:\s*\d+/);
  });

  it('includes a nonce', () => {
    const message = createVerificationMessage('0x1234567890abcdef1234567890abcdef12345678');
    expect(message).toMatch(/Nonce:\s*.+/);
  });

  it('generates unique nonce for each call', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const message1 = createVerificationMessage(address);
    const message2 = createVerificationMessage(address);
    const nonce1 = message1.match(/Nonce:\s*(.+)/)?.[1];
    const nonce2 = message2.match(/Nonce:\s*(.+)/)?.[1];
    expect(nonce1).not.toBe(nonce2);
  });
});

describe('verifyWalletSignature', () => {
  it('returns true for valid signature', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const message = createVerificationMessage(wallet.address);
    const signature = await wallet.signMessage(message);

    expect(verifyWalletSignature(message, signature, wallet.address)).toBe(true);
  });

  it('returns false for wrong address', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const otherWallet = new Wallet(TEST_KEY_2);
    const message = createVerificationMessage(wallet.address);
    const signature = await wallet.signMessage(message);

    expect(verifyWalletSignature(message, signature, otherWallet.address)).toBe(false);
  });

  it('returns false for tampered message', async () => {
    const wallet = new Wallet(TEST_KEY_1);
    const message = createVerificationMessage(wallet.address);
    const signature = await wallet.signMessage(message);

    expect(verifyWalletSignature(message + 'tampered', signature, wallet.address)).toBe(false);
  });

  it('returns false for invalid signature', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const message = createVerificationMessage(address);

    expect(verifyWalletSignature(message, '0xinvalid', address)).toBe(false);
  });
});
