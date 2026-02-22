import { describe, it, expect } from 'vitest';
import { fetchDocuments, fetchDocument, revokeDocument } from '../documentApi';
import { mockDocument, mockDocument2 } from '@/test/handlers';

describe('documentApi', () => {
  describe('fetchDocuments', () => {
    it('fetches a list of documents', async () => {
      const result = await fetchDocuments({ daoId: mockDocument.daoId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].title).toBe(mockDocument.title);
        expect(result.data[1].title).toBe(mockDocument2.title);
      }
    });
  });

  describe('fetchDocument', () => {
    it('fetches a single document by id', async () => {
      const result = await fetchDocument(mockDocument.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(mockDocument.id);
        expect(result.data.title).toBe(mockDocument.title);
        expect(result.data.documentType).toBe('articles');
      }
    });

    it('returns error for non-existent document', async () => {
      const result = await fetchDocument('0x' + '00'.repeat(32));

      expect(result.success).toBe(false);
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
