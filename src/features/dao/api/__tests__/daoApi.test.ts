import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDAOs, fetchDAO, createDAO, updateDAO, deactivateDAO } from '../daoApi';
import { mockDAO } from '@/test/handlers';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

vi.mock('@/shared/lib/api-client', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createWalletAuthHeader: vi.fn().mockResolvedValue('Wallet mock-auth-header'),
  };
});

describe('daoApi', () => {
  beforeEach(() => {
    useWalletStore.setState({ address: '0x' + 'aa'.repeat(20) });
  });

  describe('fetchDAOs', () => {
    it('fetches a paginated list of DAOs', async () => {
      const result = await fetchDAOs();

      expect(result).toBeDefined();
      const typed = result as { success: true; data: { data: unknown[]; total: number } };
      expect(typed.success).toBe(true);
      expect(typed.data.data).toHaveLength(2);
    });

    it('passes search params correctly', async () => {
      const result = await fetchDAOs({ search: 'test', limit: 10 });
      expect(result).toBeDefined();
    });
  });

  describe('fetchDAO', () => {
    it('fetches a single DAO by id', async () => {
      const result = await fetchDAO(mockDAO.id);

      const typed = result as { success: true; data: { name: string } };
      expect(typed.success).toBe(true);
      expect(typed.data.name).toBe(mockDAO.name);
    });
  });

  describe('createDAO', () => {
    it('creates a new DAO', async () => {
      const result = await createDAO({
        name: 'New DAO',
        description: 'A new DAO',
        location: 'Tokyo',
        memberCount: 5,
        size: 'small',
      });

      const typed = result as { success: true; data: { name: string } };
      expect(typed.success).toBe(true);
      expect(typed.data.name).toBe('New DAO');
    });
  });

  describe('updateDAO', () => {
    it('updates a DAO', async () => {
      const result = await updateDAO(mockDAO.id, { name: 'Updated DAO' });

      const typed = result as { success: true; data: { name: string } };
      expect(typed.success).toBe(true);
      expect(typed.data.name).toBe('Updated DAO');
    });
  });

  describe('deactivateDAO', () => {
    it('deactivates a DAO by setting status to inactive', async () => {
      const result = await deactivateDAO(mockDAO.id);

      const typed = result as { success: true; data: { status: string } };
      expect(typed.success).toBe(true);
      expect(typed.data.status).toBe('inactive');
    });
  });
});
