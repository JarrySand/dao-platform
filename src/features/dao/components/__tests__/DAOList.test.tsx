import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { DAOList } from '../DAOList';
import { renderWithProviders, server } from '@/test/utils';
import type { ApiResponse } from '@/shared/types/api';
import type { PaginatedResponse } from '@/shared/types/common';
import type { DAO } from '@/features/dao/types';

// Mock next/link to render a plain anchor tag
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('DAOList', () => {
  it('renders loading skeleton while data is being fetched', () => {
    renderWithProviders(<DAOList />);

    // The skeleton renders 6 placeholder cards; check for skeleton structure
    const skeletonContainer = document.querySelectorAll('.rounded-xl.border');
    expect(skeletonContainer.length).toBeGreaterThanOrEqual(1);
  });

  it('renders DAO cards after data loads', async () => {
    renderWithProviders(<DAOList />);

    // Wait for the MSW handler to return mock data
    await waitFor(() => {
      expect(screen.getByText('Test DAO')).toBeInTheDocument();
    });

    expect(screen.getByText('Another DAO')).toBeInTheDocument();
  });

  it('shows empty state when no DAOs match', async () => {
    // Override the default handler to return an empty list
    server.use(
      http.get('/api/daos', () => {
        const response: ApiResponse<PaginatedResponse<DAO>> = {
          success: true,
          data: {
            data: [],
            nextCursor: null,
            hasMore: false,
            total: 0,
          },
        };
        return HttpResponse.json(response);
      }),
    );

    renderWithProviders(<DAOList />);

    await waitFor(() => {
      expect(screen.getByText('DAOが登録されていません')).toBeInTheDocument();
    });
  });

  it('shows error state when API request fails', async () => {
    server.use(
      http.get('/api/daos', () => {
        return HttpResponse.json(
          { success: false, error: 'Internal Server Error' },
          { status: 500 },
        );
      }),
    );

    renderWithProviders(<DAOList />);

    // The ErrorDisplay component renders with role="alert"
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // A retry button is also shown
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders search input field', () => {
    renderWithProviders(<DAOList />);

    expect(screen.getByPlaceholderText('DAO名で検索...')).toBeInTheDocument();
  });
});
