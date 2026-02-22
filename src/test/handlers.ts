import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/types/api';
import type { PaginatedResponse } from '@/shared/types/common';
import type { DAO } from '@/features/dao/types';
import type { Document } from '@/features/document/types';

// ---------- Mock data ----------

export const mockDAO: DAO = {
  id: '0x' + 'a1'.repeat(32),
  name: 'Test DAO',
  description: 'A test DAO for unit testing',
  location: 'Tokyo, Japan',
  memberCount: 42,
  size: 'medium',
  status: 'active',
  logoUrl: 'https://example.com/logo.png',
  website: 'https://example.com',
  contactPerson: 'Taro Yamada',
  contactEmail: 'taro@example.com',
  adminAddress: '0x' + 'b2'.repeat(20),
  attestationUID: '0x' + 'a1'.repeat(32),
  trustScore: 85,
  foundingDate: 1700000000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  documentCount: 5,
};

export const mockDAO2: DAO = {
  id: '0x' + 'c3'.repeat(32),
  name: 'Another DAO',
  description: 'Second test DAO',
  location: 'Osaka, Japan',
  memberCount: 10,
  size: 'small',
  status: 'active',
  logoUrl: '',
  website: '',
  contactPerson: '',
  contactEmail: '',
  adminAddress: '0x' + 'd4'.repeat(20),
  attestationUID: '0x' + 'c3'.repeat(32),
  trustScore: 60,
  foundingDate: 1710000000,
  createdAt: '2024-03-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z',
  documentCount: 2,
};

export const mockDocument: Document = {
  id: '0x' + 'e5'.repeat(32),
  daoId: mockDAO.id,
  title: 'Test Document',
  documentType: 'articles',
  hash: '0x' + 'f6'.repeat(32),
  ipfsCid: 'QmTestCid123456789',
  version: '1.0.0',
  previousVersionId: null,
  status: 'active',
  attester: '0x' + 'b2'.repeat(20),
  votingTxHash: null,
  votingChainId: null,
  schemaVersion: 'v2',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
};

export const mockDocument2: Document = {
  id: '0x' + 'a7'.repeat(32),
  daoId: mockDAO.id,
  title: 'Meeting Minutes Q1',
  documentType: 'meeting',
  hash: '0x' + 'b8'.repeat(32),
  ipfsCid: 'QmTestCid987654321',
  version: '1.0',
  previousVersionId: null,
  status: 'active',
  attester: '0x' + 'b2'.repeat(20),
  votingTxHash: '0x' + 'c9'.repeat(32),
  votingChainId: 11155111,
  schemaVersion: 'v2',
  createdAt: '2024-03-15T00:00:00Z',
  updatedAt: '2024-03-15T00:00:00Z',
};

// ---------- Handlers ----------

export const handlers = [
  // GET /api/daos - list DAOs
  http.get('/api/daos', () => {
    const response: ApiResponse<PaginatedResponse<DAO>> = {
      success: true,
      data: {
        data: [mockDAO, mockDAO2],
        nextCursor: null,
        hasMore: false,
        total: 2,
      },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/daos - create DAO
  http.post('/api/daos', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newDAO: DAO = {
      ...mockDAO,
      id: '0x' + 'ff'.repeat(32),
      attestationUID: '0x' + 'ff'.repeat(32),
      name: (body.name as string) ?? 'New DAO',
      description: (body.description as string) ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const response: ApiResponse<DAO> = { success: true, data: newDAO };
    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/daos/:id - get DAO by id
  http.get('/api/daos/:id', ({ params }) => {
    const { id } = params;
    const dao = [mockDAO, mockDAO2].find((d) => d.id === id);
    if (!dao) {
      return HttpResponse.json({ success: false, error: 'DAO not found' }, { status: 404 });
    }
    const response: ApiResponse<DAO> = { success: true, data: dao };
    return HttpResponse.json(response);
  }),

  // PUT /api/daos/:id - update DAO
  http.put('/api/daos/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    const dao = [mockDAO, mockDAO2].find((d) => d.id === id);
    if (!dao) {
      return HttpResponse.json({ success: false, error: 'DAO not found' }, { status: 404 });
    }
    const updated = { ...dao, ...body, updatedAt: new Date().toISOString() };
    const response: ApiResponse<DAO> = { success: true, data: updated as DAO };
    return HttpResponse.json(response);
  }),

  // GET /api/documents - list documents
  http.get('/api/documents', () => {
    const response: ApiResponse<Document[]> = {
      success: true,
      data: [mockDocument, mockDocument2],
    };
    return HttpResponse.json(response);
  }),

  // POST /api/documents - register document
  http.post('/api/documents', () => {
    const response: ApiResponse<Document> = { success: true, data: mockDocument };
    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /api/documents/:id - get document by id
  http.get('/api/documents/:id', ({ params }) => {
    const { id } = params;
    const doc = [mockDocument, mockDocument2].find((d) => d.id === id);
    if (!doc) {
      return HttpResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    const response: ApiResponse<Document> = { success: true, data: doc };
    return HttpResponse.json(response);
  }),

  // PUT /api/documents/:id - revoke document
  http.put('/api/documents/:id', ({ params }) => {
    const { id } = params;
    const doc = [mockDocument, mockDocument2].find((d) => d.id === id);
    if (!doc) {
      return HttpResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    const response: ApiResponse<{ txHash: string }> = {
      success: true,
      data: { txHash: '0x' + 'ab'.repeat(32) },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/upload - file upload
  http.post('/api/upload', () => {
    return HttpResponse.json({
      success: true,
      data: {
        cid: 'QmUploadedCid12345',
        url: 'https://gateway.pinata.cloud/ipfs/QmUploadedCid12345',
      },
    });
  }),

  // POST /api/eas-proxy - EAS proxy
  http.post('/api/eas-proxy', () => {
    return HttpResponse.json({
      success: true,
      data: {
        attestationUID: '0x' + 'ee'.repeat(32),
        txHash: '0x' + 'dd'.repeat(32),
      },
    });
  }),

  // GET /api/stats - statistics
  http.get('/api/stats', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalDAOs: 25,
        totalDocuments: 142,
        activeDAOs: 20,
        recentAttestations: 15,
      },
    });
  }),

  // GET /api/activity - recent activity
  http.get('/api/activity', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          type: 'dao_created',
          description: 'New DAO "Test DAO" was created',
          timestamp: '2024-06-01T10:00:00Z',
          actorAddress: '0x' + 'b2'.repeat(20),
        },
        {
          id: '2',
          type: 'document_registered',
          description: 'Document "Test Document" was registered',
          timestamp: '2024-06-01T11:00:00Z',
          actorAddress: '0x' + 'b2'.repeat(20),
        },
      ],
    });
  }),
];
