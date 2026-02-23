import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DAO } from '@/features/dao/types';
import type { Document } from '@/features/document/types';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function AllProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// ---------- Mock data factories ----------

let counter = 0;
function nextId(): string {
  counter++;
  return counter.toString(16).padStart(64, '0');
}

export function createMockDAO(overrides: Partial<DAO> = {}): DAO {
  const id = '0x' + nextId();
  return {
    id,
    name: 'Test DAO',
    description: 'Test DAO description',
    location: 'Tokyo',
    memberCount: 10,
    size: 'small',
    status: 'active',
    logoUrl: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    adminAddress: '0x' + 'aa'.repeat(20),
    attestationUID: id,
    trustScore: 75,
    foundingDate: 1700000000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function createMockDocument(overrides: Partial<Document> = {}): Document {
  const id = '0x' + nextId();
  return {
    id,
    daoId: '0x' + 'bb'.repeat(32),
    title: 'Test Document',
    documentType: 'articles',
    hash: '0x' + 'cc'.repeat(32),
    ipfsCid: 'QmTestCid',
    version: 1,
    previousVersionId: null,
    status: 'active',
    attester: '0x' + 'dd'.repeat(20),
    votingTxHash: null,
    votingChainId: null,
    relatedDocumentIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export { server } from './setup';
