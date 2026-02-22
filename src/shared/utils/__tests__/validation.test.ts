import { describe, it, expect } from 'vitest';
import { isValidUID, isValidAddress, isValidEmail } from '../validation';

describe('isValidUID', () => {
  it('accepts a valid 64-char hex UID prefixed with 0x', () => {
    const uid = '0x' + 'a'.repeat(64);
    expect(isValidUID(uid)).toBe(true);
  });

  it('accepts mixed-case hex', () => {
    const uid = '0x' + 'aAbBcCdDeEfF'.repeat(5) + 'aAbB';
    expect(isValidUID(uid)).toBe(true);
  });

  it('rejects UID without 0x prefix', () => {
    expect(isValidUID('a'.repeat(64))).toBe(false);
  });

  it('rejects UID that is too short', () => {
    expect(isValidUID('0x' + 'a'.repeat(63))).toBe(false);
  });

  it('rejects UID that is too long', () => {
    expect(isValidUID('0x' + 'a'.repeat(65))).toBe(false);
  });

  it('rejects UID with non-hex characters', () => {
    expect(isValidUID('0x' + 'g'.repeat(64))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidUID('')).toBe(false);
  });
});

describe('isValidAddress', () => {
  it('accepts a valid 40-char hex address prefixed with 0x', () => {
    const address = '0x' + 'a'.repeat(40);
    expect(isValidAddress(address)).toBe(true);
  });

  it('accepts mixed-case hex', () => {
    const address = '0x' + 'aAbBcCdDeE'.repeat(4);
    expect(isValidAddress(address)).toBe(true);
  });

  it('rejects address without 0x prefix', () => {
    expect(isValidAddress('a'.repeat(40))).toBe(false);
  });

  it('rejects address that is too short', () => {
    expect(isValidAddress('0x' + 'a'.repeat(39))).toBe(false);
  });

  it('rejects address that is too long', () => {
    expect(isValidAddress('0x' + 'a'.repeat(41))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidAddress('')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.jp')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});
