import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { StatsCards } from '../StatsCards';
import { renderWithProviders, server } from '@/test/utils';

describe('StatsCards', () => {
  it('shows loading skeleton while data is being fetched', () => {
    // Use a handler that delays so we can see the loading state
    server.use(
      http.get('/api/stats', async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return HttpResponse.json({
          success: true,
          data: { daoCount: 10, totalDocuments: 50 },
        });
      }),
    );

    renderWithProviders(<StatsCards />);

    // The loading skeleton renders 4 Card components with Skeleton children
    // Check for skeleton elements by their CSS classes
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders stat labels after data loads', async () => {
    renderWithProviders(<StatsCards />);

    await waitFor(() => {
      expect(screen.getByText('管理 DAO 数')).toBeInTheDocument();
    });

    expect(screen.getByText('総ドキュメント数')).toBeInTheDocument();
  });

  it('renders stat values from the API response', async () => {
    // The default MSW handler returns daoCount: 25, totalDocuments: 142
    renderWithProviders(<StatsCards />);

    // The AnimatedCounter component animates to the target value.
    // After animation completes, the final values should be displayed.
    await waitFor(
      () => {
        expect(screen.getByText('25')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(screen.getByText('142')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('shows zero values when API returns zeros', async () => {
    server.use(
      http.get('/api/stats', () => {
        return HttpResponse.json({
          success: true,
          data: { daoCount: 0, totalDocuments: 0 },
        });
      }),
    );

    renderWithProviders(<StatsCards />);

    await waitFor(() => {
      // Both stat cards should show "0"
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues).toHaveLength(2);
    });
  });

  it('renders icons for each stat item', async () => {
    renderWithProviders(<StatsCards />);

    await waitFor(() => {
      expect(screen.getByText('管理 DAO 数')).toBeInTheDocument();
    });

    // Each stat card has an svg icon
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThanOrEqual(2);
  });
});
