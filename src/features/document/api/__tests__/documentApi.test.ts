import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDocuments, fetchDocument, revokeDocument } from '../documentApi';
import { mockDocument, mockDocument2 } from '@/test/handlers';
import { useWalletStore } from '@/features/wallet/stores/walletStore';

vi.mock('@/shared/lib/api-client', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    createWalletAuthHeader: vi.fn().mockResolvedValue('Wallet mock-auth-header'),
  };
});

describe('documentApi', () => {
  beforeEach(() => {
    useWalletStore.setState({ address: '0x' + 'aa'.repeat(20) });
  });

  describe('fetchDocuments', () => {
    it('fetches a list of documents', async () => {
      const result = await fetchDocuments({ daoId: mockDocument.daoId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.data[0].title).toBe(mockDocument.title);
        expect(result.data.data[1].title).toBe(mockDocument2.title);
      }
    });
  });

  describe('fetchDocument', () => {
    it('fetches a single document by id', async () => {
      const result = await fetchDocument(mockDocument.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document.id).toBe(mockDocument.id);
        expect(result.data.document.title).toBe(mockDocument.title);
        expect(result.data.document.documentType).toBe('articles');
      }
    });

    it('throws for non-existent document', async () => {
      await expect(fetchDocument('0x' + '00'.repeat(32))).rejects.toThrow(/failed \(404\)/);
    });
  });

  describe('revokeDocument', () => {
    it('revokes a document and returns txHash', async () => {
      const result = await revokeDocument(mockDocument.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.txHash).toBeDefined();
        expect(result.data.txHash).toMatch(/^0x/);
      }
    });
  });
});
