import { z } from 'zod';

const UID_REGEX = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUID(uid: string): boolean {
  return UID_REGEX.test(uid);
}

export function isValidAddress(address: string): boolean {
  return ADDRESS_REGEX.test(address);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export const uidSchema = z
  .string()
  .regex(UID_REGEX, 'Invalid UID format (expected 0x + 64 hex chars)');

export const addressSchema = z
  .string()
  .regex(ADDRESS_REGEX, 'Invalid address format (expected 0x + 40 hex chars)');

export const emailSchema = z.string().email('Invalid email format');
